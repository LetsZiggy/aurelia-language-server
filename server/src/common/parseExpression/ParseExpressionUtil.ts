import {
  AccessKeyedExpression,
  AccessMemberExpression,
  AccessScopeExpression,
  BinaryExpression,
  BindingBehaviorExpression,
  CallMemberExpression,
  CallScopeExpression,
  ExpressionKind,
  ExpressionType,
  ForOfStatement,
  Interpolation,
  IsAssign,
  IsBindingBehavior,
  IsExpression,
  parseExpression,
  PrimitiveLiteralExpression,
  ValueConverterExpression,
} from '@aurelia/runtime';
import '@aurelia/metadata';

type Writeable<T> = { -readonly [P in keyof T]: T[P] };

/* prettier-ignore */
export type KindToActualExpression<TargetKind extends ExpressionKind> =
  TargetKind extends ExpressionKind.AccessKeyed ? AccessKeyedExpression :
    TargetKind extends ExpressionKind.AccessScope ? AccessScopeExpression :
      TargetKind extends ExpressionKind.AccessMember ? AccessMemberExpression :
        TargetKind extends ExpressionKind.CallScope ? CallScopeExpression :
          TargetKind extends ExpressionKind.CallMember ? CallMemberExpression :
            TargetKind extends ExpressionKind.PrimitiveLiteral ? PrimitiveLiteralExpression :
              never;

export enum ExpressionKind_Dev {
  CallsFunction = 0b0000000000100_00000, // Calls a function (CallFunction, CallScope, CallMember, TaggedTemplate) -> needs a valid function object returning from its lefthandside's evaluate()
  HasAncestor = 0b0000000001000_00000, // Has an "ancestor" property, meaning the expression could climb up the context (only AccessThis, AccessScope and CallScope)
  IsPrimary = 0b0000000010000_00000, // Is a primary expression according to ES parsing rules
  IsLeftHandSide = 0b0000000100000_00000, // Is a left-hand side expression according to ES parsing rules, includes IsPrimary
  HasBind = 0b0000001000000_00000, // Has a bind() method (currently only BindingBehavior)
  HasUnbind = 0b0000010000000_00000, // Has an unbind() method (currentl only BindingBehavior and ValueConverter)
  IsAssignable = 0b0000100000000_00000, // Is an assignable expression according to ES parsing rules (only AccessScope, AccessMember, AccessKeyed ans Assign)
  IsLiteral = 0b0001000000000_00000, // Is literal expression (Primitive, Array, Object or Template)
  IsResource = 0b0010000000000_00000, // Is an Aurelia resource (ValueConverter or BindingBehavior)
  IsForDeclaration = 0b0100000000000_00000, // Is a For declaration (for..of, for..in -> currently only ForOfStatement)
  Type = 0b0000000000000_11111, // Type mask to uniquely identify each AST class (concrete types start below)
  // ---------------------------------------------------------------------------------------------------------------------------
  AccessThis = 0b0000000111000_00001, //               HasAncestor
  AccessScope = 0b0000100111011_00010, // IsAssignable  HasAncestor
  ArrayLiteral = 0b0001000110001_00011, //
  ObjectLiteral = 0b0001000110001_00100, //
  PrimitiveLiteral = 0b0001000110000_00101, //
  Template = 0b0001000110001_00110, //
  Unary = 0b0000000000001_00111, //
  CallScope = 0b0000000101101_01000, //               HasAncestor  CallsFunction
  CallMember = 0b0000000100100_01001, //                            CallsFunction
  CallFunction = 0b0000000100100_01010, //                            CallsFunction
  AccessMember = 0b0000100100011_01011, // IsAssignable
  AccessKeyed = 0b0000100100011_01100, // IsAssignable
  TaggedTemplate = 0b0000000100101_01101, //                            CallsFunction
  Binary = 0b0000000000001_01110, //
  Conditional = 0b0000000000001_11111, //
  Assign = 0b0000100000000_10000, // IsAssignable
  ValueConverter = 0b0010010000001_10001, //
  BindingBehavior = 0b0010011000001_10010, //
  HtmlLiteral = 0b0000000000001_10011, //
  ArrayBindingPattern = 0b0100000000000_10100, //
  ObjectBindingPattern = 0b0100000000000_10101, //
  BindingIdentifier = 0b0100000000000_10110, //
  ForOfStatement = 0b0000011000001_10111, //
  Interpolation = 0b0000000000000_11000, //
  ArrayDestructuring = 0b0101100000000_11001, // IsAssignable
  ObjectDestructuring = 0b0110100000000_11001, // IsAssignable
  DestructuringAssignmentLeaf = 0b1000100000000_11001, // IsAssignable
}

interface ExpressionsOfKindOptions {
  /**
   * Flatten eg. AccessScope inside CallScope.
   * Instead of
   *      CallScopeExpression {
   *        name: 'hello',
   *        args: [ AccessScopeExpression { name: 'what', ancestor: 0 } ],
   *        ancestor: 0
   *      }
   *  We get
   *      AccessScopeExpression { name: 'what', ancestor: 0 },
   *      CallScopeExpression {
   *        name: 'hello',
   *        args: [ AccessScopeExpression { name: 'what', ancestor: 0 } ],
   *        ancestor: 0
   *      }
   *
   * @example
   *   Try with: `${repos | sort:direction.value:hello(what) | take:10}`
   */
  flatten?: boolean;
}

export class ParseExpressionUtil {
  static getAllExpressionsOfKind<
    TargetKind extends ExpressionKind,
    ReturnType extends KindToActualExpression<TargetKind>
  >(
    parsed: Interpolation,
    targetKinds: TargetKind[],
    options?: ExpressionsOfKindOptions
  ): ReturnType[] {
    let finalExpressions: ReturnType[] = [];
    // Interpolation
    if (parsed instanceof Interpolation) {
      parsed.expressions.forEach((expression) => {
        // ExpressionKind_Dev[expression.$kind]; /*?*/
        expression; /*?*/
        // console.log('vvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvv');

        findAllExpressionRecursive(
          expression,
          targetKinds,
          finalExpressions,
          options
        );
      });

      /*
       * CONSIDER: Does this make sense for AccessMember?
       * Eg. for `foo.bar.qux` we return [..."bar", ..."qux"]
       */
      if (finalExpressions[0] instanceof AccessMemberExpression) {
        finalExpressions = finalExpressions.reverse();
      }
    }
    // None
    else {
      findAllExpressionRecursive(
        parsed,
        targetKinds,
        finalExpressions,
        options
      );
    }

    return finalExpressions;
  }

  static getFirstExpressionByKind<
    TargetKind extends ExpressionKind,
    ReturnType extends KindToActualExpression<TargetKind>
  >(parsed: IsExpression, targetKinds: TargetKind[]): ReturnType {
    const finalExpressions = ParseExpressionUtil.getAllExpressionsOfKind<
      TargetKind,
      ReturnType
    >(<Interpolation>parsed, targetKinds);
    const target = finalExpressions[0];
    return target;
  }
}

function findAllExpressionRecursive(
  expressionOrList: IsExpression | IsExpression[],
  targetKinds: ExpressionKind[],
  collector: unknown[],
  options?: ExpressionsOfKindOptions
) {
  if (expressionOrList === undefined) {
    return;
  }

  // .args
  if (Array.isArray(expressionOrList)) {
    const targetExpressions = expressionOrList.filter((expression) => {
      const targetExpression = isKindIncluded(targetKinds, expression.$kind);
      // Array can have children eg. AccessScopes
      if (!targetExpression) {
        findAllExpressionRecursive(expression, targetKinds, collector, options);
      }
      // Special case, if we want CallScope AND AccessScope
      else if (expression instanceof CallScopeExpression && options?.flatten) {
        findAllExpressionRecursive(
          expression.args as Writeable<IsAssign[]>,
          targetKinds,
          collector,
          options
        );
      }

      return targetExpression;
    });

    collector.push(...targetExpressions);
    return;
  }

  // default rec return
  const singleExpression = expressionOrList;
  if (isKindIncluded(targetKinds, singleExpression.$kind)) {
    collector.push(singleExpression);
  }

  // .ancestor
  if (singleExpression instanceof AccessScopeExpression) {
    return;
  }

  // .object .name
  else if (singleExpression instanceof AccessMemberExpression) {
    findAllExpressionRecursive(
      singleExpression.object,
      targetKinds,
      collector,
      options
    );
    return;
  }

  // .object
  else if (singleExpression instanceof CallMemberExpression) {
    findAllExpressionRecursive(
      singleExpression.object,
      targetKinds,
      collector,
      options
    );
    return;
  }

  // .object .key
  else if (singleExpression instanceof AccessKeyedExpression) {
    findAllExpressionRecursive(
      singleExpression.object,
      targetKinds,
      collector,
      options
    );
    findAllExpressionRecursive(
      singleExpression.key,
      targetKinds,
      collector,
      options
    );
    return;
  }

  // .args
  else if (singleExpression instanceof CallScopeExpression) {
    findAllExpressionRecursive(
      singleExpression.args as Writeable<IsAssign[]>,
      targetKinds,
      collector,
      options
    );
    return;
  }

  // .value
  else if (singleExpression instanceof PrimitiveLiteralExpression) {
    return;
  }

  // .expression, .args
  else if (singleExpression instanceof ValueConverterExpression) {
    findAllExpressionRecursive(
      singleExpression.expression,
      targetKinds,
      collector,
      options
    );
    findAllExpressionRecursive(
      singleExpression.args as Writeable<IsAssign[]>,
      targetKinds,
      collector,
      options
    );
    return;
  }

  // .left, .right
  else if (singleExpression instanceof BinaryExpression) {
    findAllExpressionRecursive(
      singleExpression.left,
      targetKinds,
      collector,
      options
    );
    findAllExpressionRecursive(
      singleExpression.right,
      targetKinds,
      collector,
      options
    );
    return;
  }

  singleExpression; /*?*/
  /* prettier-ignore */ throw new Error(`Unconsumed. Was: '${ExpressionKind_Dev[expressionOrList.$kind]}'`);
}

function isKindIncluded(
  queriedKinds: ExpressionKind[],
  targetKind: ExpressionKind
) {
  const isKind = queriedKinds.find((queriedKind) => {
    return ExpressionKind_Dev[queriedKind] === ExpressionKind_Dev[targetKind];
  });
  return isKind;
}

const parsed = parseExpression(
  '${repos | sort:direction.value:hello(what) | take:10}' /*?*/,
  ExpressionType.Interpolation
);
const accessScopes = ParseExpressionUtil.getAllExpressionsOfKind(parsed, [
  ExpressionKind.AccessScope,
  ExpressionKind.CallScope,
]);
accessScopes; /*?*/

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.findAllExpressionRecursive = exports.ParseExpressionUtil = exports.ExpressionKind_Dev = void 0;
const src_1 = require("../@aurelia-runtime-patch/src");
require("@aurelia/metadata");
const ast_1 = require("../@aurelia-runtime-patch/src/binding/ast");
var ExpressionKind_Dev;
(function (ExpressionKind_Dev) {
    ExpressionKind_Dev[ExpressionKind_Dev["CallsFunction"] = 128] = "CallsFunction";
    ExpressionKind_Dev[ExpressionKind_Dev["HasAncestor"] = 256] = "HasAncestor";
    ExpressionKind_Dev[ExpressionKind_Dev["IsPrimary"] = 512] = "IsPrimary";
    ExpressionKind_Dev[ExpressionKind_Dev["IsLeftHandSide"] = 1024] = "IsLeftHandSide";
    ExpressionKind_Dev[ExpressionKind_Dev["HasBind"] = 2048] = "HasBind";
    ExpressionKind_Dev[ExpressionKind_Dev["HasUnbind"] = 4096] = "HasUnbind";
    ExpressionKind_Dev[ExpressionKind_Dev["IsAssignable"] = 8192] = "IsAssignable";
    ExpressionKind_Dev[ExpressionKind_Dev["IsLiteral"] = 16384] = "IsLiteral";
    ExpressionKind_Dev[ExpressionKind_Dev["IsResource"] = 32768] = "IsResource";
    ExpressionKind_Dev[ExpressionKind_Dev["IsForDeclaration"] = 65536] = "IsForDeclaration";
    ExpressionKind_Dev[ExpressionKind_Dev["Type"] = 31] = "Type";
    // ---------------------------------------------------------------------------------------------------------------------------
    ExpressionKind_Dev[ExpressionKind_Dev["AccessThis"] = 1793] = "AccessThis";
    ExpressionKind_Dev[ExpressionKind_Dev["AccessScope"] = 10082] = "AccessScope";
    ExpressionKind_Dev[ExpressionKind_Dev["ArrayLiteral"] = 17955] = "ArrayLiteral";
    ExpressionKind_Dev[ExpressionKind_Dev["ObjectLiteral"] = 17956] = "ObjectLiteral";
    ExpressionKind_Dev[ExpressionKind_Dev["PrimitiveLiteral"] = 17925] = "PrimitiveLiteral";
    ExpressionKind_Dev[ExpressionKind_Dev["Template"] = 17958] = "Template";
    ExpressionKind_Dev[ExpressionKind_Dev["Unary"] = 39] = "Unary";
    ExpressionKind_Dev[ExpressionKind_Dev["CallScope"] = 1448] = "CallScope";
    ExpressionKind_Dev[ExpressionKind_Dev["CallMember"] = 1161] = "CallMember";
    ExpressionKind_Dev[ExpressionKind_Dev["CallFunction"] = 1162] = "CallFunction";
    ExpressionKind_Dev[ExpressionKind_Dev["AccessMember"] = 9323] = "AccessMember";
    ExpressionKind_Dev[ExpressionKind_Dev["AccessKeyed"] = 9324] = "AccessKeyed";
    ExpressionKind_Dev[ExpressionKind_Dev["TaggedTemplate"] = 1197] = "TaggedTemplate";
    ExpressionKind_Dev[ExpressionKind_Dev["Binary"] = 46] = "Binary";
    ExpressionKind_Dev[ExpressionKind_Dev["Conditional"] = 63] = "Conditional";
    ExpressionKind_Dev[ExpressionKind_Dev["Assign"] = 8208] = "Assign";
    ExpressionKind_Dev[ExpressionKind_Dev["ValueConverter"] = 36913] = "ValueConverter";
    ExpressionKind_Dev[ExpressionKind_Dev["BindingBehavior"] = 38962] = "BindingBehavior";
    ExpressionKind_Dev[ExpressionKind_Dev["HtmlLiteral"] = 51] = "HtmlLiteral";
    ExpressionKind_Dev[ExpressionKind_Dev["ArrayBindingPattern"] = 65556] = "ArrayBindingPattern";
    ExpressionKind_Dev[ExpressionKind_Dev["ObjectBindingPattern"] = 65557] = "ObjectBindingPattern";
    ExpressionKind_Dev[ExpressionKind_Dev["BindingIdentifier"] = 65558] = "BindingIdentifier";
    ExpressionKind_Dev[ExpressionKind_Dev["ForOfStatement"] = 6199] = "ForOfStatement";
    ExpressionKind_Dev[ExpressionKind_Dev["Interpolation"] = 24] = "Interpolation";
    ExpressionKind_Dev[ExpressionKind_Dev["ArrayDestructuring"] = 90137] = "ArrayDestructuring";
    ExpressionKind_Dev[ExpressionKind_Dev["ObjectDestructuring"] = 106521] = "ObjectDestructuring";
    ExpressionKind_Dev[ExpressionKind_Dev["DestructuringAssignmentLeaf"] = 139289] = "DestructuringAssignmentLeaf";
})(ExpressionKind_Dev = exports.ExpressionKind_Dev || (exports.ExpressionKind_Dev = {}));
class ParseExpressionUtil {
    /**
     * V2: pass input (parsing internal)
     * V1: pass parsed (parsing external)
     */
    static getAllExpressionsOfKindV2(input, targetKinds, options) {
        var _a, _b;
        // /* prettier-ignore */ console.log('----------------------------------------')
        let finalExpressions = [];
        if (input.trim() === '')
            return { expressions: [] };
        let parsed;
        try {
            parsed = (0, src_1.parseExpression)(input, {
                expressionType: (_a = options === null || options === void 0 ? void 0 : options.expressionType) !== null && _a !== void 0 ? _a : 0 /* None */,
                startOffset: (_b = options === null || options === void 0 ? void 0 : options.startOffset) !== null && _b !== void 0 ? _b : 0,
                isInterpolation: (options === null || options === void 0 ? void 0 : options.expressionType) === 1 /* Interpolation */,
            }
            // options?.expressionType ?? ExpressionType.None,
            );
            // parsed; /* ? */
            if (parsed === null) {
                finalExpressions = [];
            }
            // Interpolation
            else if (parsed instanceof src_1.Interpolation) {
                // if (parsed) {
                //   parsed.parts; /* ? */
                //   // parsed.expressions /* ? */
                //   JSON.stringify(parsed.expressions, null, 4); /* ? */
                // }
                parsed.expressions.forEach((expression) => {
                    // ExpressionKind_Dev[expression.$kind]; /*?*/
                    // expression; /*?*/
                    // console.log('vvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvv');
                    findAllExpressionRecursive(expression, targetKinds, finalExpressions, options);
                });
                /*
                 * CONSIDER: Does this make sense for AccessMember?
                 * Eg. for `foo.bar.qux` we return [..."bar", ..."qux"]
                 */
                if (finalExpressions[0] instanceof src_1.AccessMemberExpression) {
                    finalExpressions = finalExpressions.reverse();
                }
            }
            // None
            else {
                // parsed; /* ? */
                // JSON.stringify(parsed, null, 4); /* ? */
                findAllExpressionRecursive(parsed, targetKinds, finalExpressions, options);
            }
        }
        catch (_error) {
            // const _error = error as Error
            // logger.log(_error.message,{logLevel:'DEBUG'})
            // logger.log(_error.stack,{logLevel:'DEBUG'})
        }
        finalExpressions = sortExpressions(finalExpressions);
        const finalReturn = {
            expressions: finalExpressions,
            parts: parsed instanceof src_1.Interpolation ? parsed.parts : undefined,
        };
        return finalReturn;
    }
    static getAllExpressionsOfKind(parsed, targetKinds, options) {
        let finalExpressions = [];
        // Interpolation
        if (parsed instanceof src_1.Interpolation) {
            parsed.expressions.forEach((expression) => {
                // ExpressionKind_Dev[expression.$kind]; /*?*/
                // expression; /*?*/
                // console.log('vvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvv');
                findAllExpressionRecursive(expression, targetKinds, finalExpressions, options);
            });
            /*
             * CONSIDER: Does this make sense for AccessMember?
             * Eg. for `foo.bar.qux` we return [..."bar", ..."qux"]
             */
            if (finalExpressions[0] instanceof src_1.AccessMemberExpression) {
                finalExpressions = finalExpressions.reverse();
            }
        }
        // None
        else {
            findAllExpressionRecursive(parsed, targetKinds, finalExpressions, options);
        }
        return finalExpressions;
    }
    static parseInterpolation(input, startOffset) {
        if (input.trim() === '')
            return;
        try {
            const parsed = (0, src_1.parseExpression)(input, {
                expressionType: 1 /* Interpolation */,
                startOffset: startOffset !== null && startOffset !== void 0 ? startOffset : 0,
                isInterpolation: true,
            });
            return parsed;
        }
        catch (_error) {
            const error = _error;
            console.log(error.message);
            // console.log(error.stack);
        }
    }
    static getFirstExpressionByKind(parsed, targetKinds) {
        const finalExpressions = ParseExpressionUtil.getAllExpressionsOfKind(parsed, targetKinds);
        const target = finalExpressions[0];
        return target;
    }
    static getAllExpressionsByName(input, targetName, targetKinds) {
        try {
            const parsed = (0, src_1.parseExpression)(input); // Cast because, pretty sure we only get Interpolation as return in our use cases
            const accessScopes = ParseExpressionUtil.getAllExpressionsOfKind(parsed, targetKinds);
            const hasSourceWordInScope = accessScopes.filter((accessScope) => {
                const isAccessOrCallScope = accessScope.$kind === 10082 /* AccessScope */ ||
                    accessScope.$kind === 1448 /* CallScope */;
                if (isAccessOrCallScope) {
                    return accessScope.name === targetName;
                }
                return false;
            });
            return hasSourceWordInScope;
        }
        catch (error) {
            // const _error = error as Error
            // logger.log(_error.message,{logLevel:'DEBUG'})
            // logger.log(_error.stack,{logLevel:'DEBUG'})
            // console.log(error);
            return [];
        }
    }
}
exports.ParseExpressionUtil = ParseExpressionUtil;
function findAllExpressionRecursive(expressionOrList, targetKinds, collector, options) {
    if (expressionOrList === undefined) {
        return;
    }
    // expressionOrList /* ? */
    // JSON.stringify(expressionOrList, null, 4); /* ? */
    // .args
    if (Array.isArray(expressionOrList)) {
        const targetExpressions = expressionOrList.filter((expression) => {
            const targetExpressionKind = isKindIncluded(targetKinds, expression.$kind);
            // Array can have children eg. AccessScopes
            if (!targetExpressionKind) {
                findAllExpressionRecursive(expression, targetKinds, collector, options);
            }
            // Special case, if we want CallScope AND AccessScope
            else if (expression instanceof src_1.CallScopeExpression) {
                findAllExpressionRecursive(expression.args, targetKinds, collector, options);
            }
            return targetExpressionKind;
        });
        collector.push(...targetExpressions);
        return;
    }
    // default rec return
    const singleExpression = expressionOrList;
    // if nothing to filter, return all
    if (targetKinds.length === 0) {
        collector.push(singleExpression);
    }
    // return targets only
    else if (isKindIncluded(targetKinds, singleExpression.$kind)) {
        collector.push(singleExpression);
    }
    // .ancestor
    if (singleExpression instanceof src_1.AccessScopeExpression) {
        return;
    }
    // .object .name
    else if (singleExpression instanceof src_1.AccessMemberExpression) {
        findAllExpressionRecursive(singleExpression.object, targetKinds, collector, options);
        return;
    }
    // .object
    else if (singleExpression instanceof src_1.CallMemberExpression) {
        findAllExpressionRecursive(singleExpression.object, targetKinds, collector, options);
        findAllExpressionRecursive(singleExpression.args, targetKinds, collector, options);
        return;
    }
    // .object .key
    else if (singleExpression instanceof src_1.AccessKeyedExpression) {
        findAllExpressionRecursive(singleExpression.object, targetKinds, collector, options);
        findAllExpressionRecursive(singleExpression.key, targetKinds, collector, options);
        return;
    }
    // .args
    else if (singleExpression instanceof src_1.CallScopeExpression) {
        findAllExpressionRecursive(singleExpression.args, targetKinds, collector, options);
        return;
    }
    // .value
    else if (singleExpression instanceof src_1.PrimitiveLiteralExpression) {
        return;
    }
    // .expression, .args
    else if (singleExpression instanceof src_1.ValueConverterExpression) {
        findAllExpressionRecursive(singleExpression.expression, targetKinds, collector, options);
        findAllExpressionRecursive(singleExpression.args, targetKinds, collector, options);
        return;
    }
    // .left, .right
    else if (singleExpression instanceof src_1.BinaryExpression) {
        findAllExpressionRecursive(singleExpression.left, targetKinds, collector, options);
        findAllExpressionRecursive(singleExpression.right, targetKinds, collector, options);
        return;
    }
    // .condition .yes .no
    else if (singleExpression instanceof src_1.ConditionalExpression) {
        findAllExpressionRecursive(singleExpression.condition, targetKinds, collector, options);
        findAllExpressionRecursive(singleExpression.yes, targetKinds, collector, options);
        findAllExpressionRecursive(singleExpression.no, targetKinds, collector, options);
        return;
    }
    // .expression (.operation)
    else if (singleExpression instanceof src_1.UnaryExpression) {
        findAllExpressionRecursive(singleExpression.expression, targetKinds, collector, options);
        return;
    }
    // .iterable
    else if (singleExpression instanceof src_1.ForOfStatement) {
        findAllExpressionRecursive(singleExpression.iterable, targetKinds, collector, options);
        return;
    }
    // .expression
    else if (singleExpression instanceof src_1.BindingBehaviorExpression) {
        //  singleExpression.expression/*?*/
        findAllExpressionRecursive(singleExpression.expression, targetKinds, collector, options);
        return;
    }
    // .expression
    else if (singleExpression instanceof src_1.TemplateExpression) {
        findAllExpressionRecursive(singleExpression.expressions, targetKinds, collector, options);
        return;
    }
    // .values
    else if (singleExpression instanceof src_1.ObjectLiteralExpression) {
        findAllExpressionRecursive(singleExpression.values, targetKinds, collector, options);
        return;
    }
    else if (singleExpression instanceof ast_1.ArrayLiteralExpression) {
        findAllExpressionRecursive(singleExpression.elements, targetKinds, collector, options);
        return;
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-expressions
    singleExpression; /* ? */
    /* prettier-ignore */ throw new Error(`Unconsumed. Was: '${ExpressionKind_Dev[expressionOrList.$kind]}'`);
}
exports.findAllExpressionRecursive = findAllExpressionRecursive;
function isKindIncluded(queriedKinds, targetKind) {
    const isKind = queriedKinds.find((queriedKind) => {
        return ExpressionKind_Dev[queriedKind] === ExpressionKind_Dev[targetKind];
    });
    return isKind;
}
function sortExpressions(finalExpressions) {
    const sorted = finalExpressions.sort((rawExpressionA, rawExpressionB) => {
        const expressionA = rawExpressionA;
        const expressionB = rawExpressionB;
        const sortedCheck = expressionA.nameLocation.start - expressionB.nameLocation.start;
        return sortedCheck;
    });
    return sorted;
}
// const input = '${repos || hello | sort:direction.value:hello(what) | take:10}';
// const parsed = parseExpression(input /*?*/, ExpressionType.Interpolation);
// const accessScopes = ParseExpressionUtil.getAllExpressionsOfKind(parsed, [
//   ExpressionKind.AccessScope,
//   ExpressionKind.CallScope,
//   ExpressionKind.ValueConverter,
// ]);
// // accessScopes; /*?*/
// const [initiatorText, ...valueConverterRegionsSplit] = input.split(
//   /(?<!\|)\|(?!\|)/g
// );/*?*/
//# sourceMappingURL=ParseExpressionUtil.js.map
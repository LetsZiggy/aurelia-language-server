"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parse = exports.parseExpression = exports.ParserState = exports.ExpressionParser = void 0;
const constants_1 = require("../../../constants");
const utilities_objects_1 = require("../utilities-objects");
const ast_1 = require("./ast");
const $false = ast_1.PrimitiveLiteralExpression.$false;
const $true = ast_1.PrimitiveLiteralExpression.$true;
const $null = ast_1.PrimitiveLiteralExpression.$null;
const $undefined = ast_1.PrimitiveLiteralExpression.$undefined;
const $this = ast_1.AccessThisExpression.$this;
const $parent = ast_1.AccessThisExpression.$parent;
/**
 * Array for mapping tokens to token values. The indices of the values
 * correspond to the token bits 0-38.
 * For this to work properly, the values in the array must be kept in
 * the same order as the token bits.
 * Usage: TokenValues[token & Token.Type]
 */
const TokenValues = [
    $false,
    $true,
    $null,
    $undefined,
    '$this',
    null /* '$host' */,
    '$parent',
    '(',
    '{',
    '.',
    '}',
    ')',
    ',',
    '[',
    ']',
    ':',
    '?',
    "'",
    '"',
    '&',
    '|',
    '||',
    '&&',
    '==',
    '!=',
    '===',
    '!==',
    '<',
    '>',
    '<=',
    '>=',
    'in',
    'instanceof',
    '+',
    '-',
    'typeof',
    'void',
    '*',
    '%',
    '/',
    '=',
    '!',
    540714 /* TemplateTail */,
    540715 /* TemplateContinuation */,
    'of',
];
const KeywordLookup = (0, utilities_objects_1.createLookup)();
KeywordLookup.true = 2049 /* TrueKeyword */;
KeywordLookup.null = 2050 /* NullKeyword */;
KeywordLookup.false = 2048 /* FalseKeyword */;
KeywordLookup.undefined = 2051 /* UndefinedKeyword */;
KeywordLookup.$this = 3076 /* ThisScope */;
KeywordLookup.$parent = 3078 /* ParentScope */;
KeywordLookup.in = 1640799 /* InKeyword */;
KeywordLookup.instanceof = 1640800 /* InstanceOfKeyword */;
KeywordLookup.typeof = 34851 /* TypeofKeyword */;
KeywordLookup.void = 34852 /* VoidKeyword */;
KeywordLookup.of = 1051180 /* OfKeyword */;
/**
 * Ranges of code points in pairs of 2 (eg 0x41-0x5B, 0x61-0x7B, ...) where the second value is not inclusive (5-7 means 5 and 6)
 * Single values are denoted by the second value being a 0
 *
 * Copied from output generated with "node build/generate-unicode.js"
 *
 * See also: https://en.wikibooks.org/wiki/Unicode/Character_reference/0000-0FFF
 */
const codes = {
    /* [$0-9A-Za_a-z] */
    AsciiIdPart: [0x24, 0, 0x30, 0x3a, 0x41, 0x5b, 0x5f, 0, 0x61, 0x7b],
    IdStart: /* IdentifierStart */ [
        0x24, 0, 0x41, 0x5b, 0x5f, 0, 0x61, 0x7b, 0xaa, 0, 0xba, 0, 0xc0, 0xd7,
        0xd8, 0xf7, 0xf8, 0x2b9, 0x2e0, 0x2e5, 0x1d00, 0x1d26, 0x1d2c, 0x1d5d,
        0x1d62, 0x1d66, 0x1d6b, 0x1d78, 0x1d79, 0x1dbf, 0x1e00, 0x1f00, 0x2071, 0,
        0x207f, 0, 0x2090, 0x209d, 0x212a, 0x212c, 0x2132, 0, 0x214e, 0, 0x2160,
        0x2189, 0x2c60, 0x2c80, 0xa722, 0xa788, 0xa78b, 0xa7af, 0xa7b0, 0xa7b8,
        0xa7f7, 0xa800, 0xab30, 0xab5b, 0xab5c, 0xab65, 0xfb00, 0xfb07, 0xff21,
        0xff3b, 0xff41, 0xff5b,
    ],
    Digit: /* DecimalNumber */ [0x30, 0x3a],
    Skip: /* Skippable */ [0, 0x21, 0x7f, 0xa1],
};
/**
 * Decompress the ranges into an array of numbers so that the char code
 * can be used as an index to the lookup
 */
function decompress(lookup, $set, compressed, value) {
    const rangeCount = compressed.length;
    for (let i = 0; i < rangeCount; i += 2) {
        const start = compressed[i];
        let end = compressed[i + 1];
        end = end > 0 ? end : start + 1;
        if (lookup) {
            lookup.fill(value, start, end);
        }
        if ($set) {
            for (let ch = start; ch < end; ch++) {
                $set.add(ch);
            }
        }
    }
}
// CharFuncLookup functions
function returnToken(token) {
    return (s) => {
        nextChar(s);
        return token;
    };
}
const unexpectedCharacter = (s) => {
    // @ts-ignore
    if (true /**/)
        throw new Error(`Unexpected character: '${s.ip}'`);
    else
        throw new Error(`AUR0168:${s.ip}`);
};
unexpectedCharacter.notMapped = true;
// ASCII IdentifierPart lookup
const AsciiIdParts = new Set();
decompress(null, AsciiIdParts, codes.AsciiIdPart, true);
// IdentifierPart lookup
const IdParts = new Uint8Array(0xffff);
// @ts-ignore
// eslint-disable-next-line @typescript-eslint/no-explicit-any
decompress(IdParts, null, codes.IdStart, 1);
// @ts-ignore
// eslint-disable-next-line @typescript-eslint/no-explicit-any
decompress(IdParts, null, codes.Digit, 1);
// Character scanning function lookup
const CharScanners = new Array(0xffff);
CharScanners.fill(unexpectedCharacter, 0, 0xffff);
decompress(CharScanners, null, codes.Skip, (s) => {
    nextChar(s);
    return null;
});
decompress(CharScanners, null, codes.IdStart, scanIdentifier);
decompress(CharScanners, null, codes.Digit, (s) => scanNumber(s, false));
CharScanners[34 /* DoubleQuote */] = CharScanners[39 /* SingleQuote */] = (s) => {
    return scanString(s);
};
CharScanners[96 /* Backtick */] = (s) => {
    return scanTemplate(s);
};
// !, !=, !==
CharScanners[33 /* Exclamation */] = (s) => {
    if (nextChar(s) !== 61 /* Equals */) {
        return 32809 /* Exclamation */;
    }
    if (nextChar(s) !== 61 /* Equals */) {
        return 1638680 /* ExclamationEquals */;
    }
    nextChar(s);
    return 1638682 /* ExclamationEqualsEquals */;
};
// =, ==, ===
CharScanners[61 /* Equals */] = (s) => {
    if (nextChar(s) !== 61 /* Equals */) {
        return 1048616 /* Equals */;
    }
    if (nextChar(s) !== 61 /* Equals */) {
        return 1638679 /* EqualsEquals */;
    }
    nextChar(s);
    return 1638681 /* EqualsEqualsEquals */;
};
// &, &&
CharScanners[38 /* Ampersand */] = (s) => {
    if (nextChar(s) !== 38 /* Ampersand */) {
        return 1572883 /* Ampersand */;
    }
    nextChar(s);
    return 1638614 /* AmpersandAmpersand */;
};
// |, ||
CharScanners[124 /* Bar */] = (s) => {
    if (nextChar(s) !== 124 /* Bar */) {
        return 1572884 /* Bar */;
    }
    nextChar(s);
    return 1638549 /* BarBar */;
};
// .
CharScanners[46 /* Dot */] = (s) => {
    if (nextChar(s) <= 57 /* Nine */ && s._currentChar >= 48 /* Zero */) {
        return scanNumber(s, true);
    }
    return 16393 /* Dot */;
};
// <, <=
CharScanners[60 /* LessThan */] = (s) => {
    if (nextChar(s) !== 61 /* Equals */) {
        return 1638747 /* LessThan */;
    }
    nextChar(s);
    return 1638749 /* LessThanEquals */;
};
// >, >=
CharScanners[62 /* GreaterThan */] = (s) => {
    if (nextChar(s) !== 61 /* Equals */) {
        return 1638748 /* GreaterThan */;
    }
    nextChar(s);
    return 1638750 /* GreaterThanEquals */;
};
CharScanners[37 /* Percent */] = returnToken(1638886 /* Percent */);
CharScanners[40 /* OpenParen */] = returnToken(671751 /* OpenParen */);
CharScanners[41 /* CloseParen */] = returnToken(1835019 /* CloseParen */);
CharScanners[42 /* Asterisk */] = returnToken(1638885 /* Asterisk */);
CharScanners[43 /* Plus */] = returnToken(623009 /* Plus */);
CharScanners[44 /* Comma */] = returnToken(1572876 /* Comma */);
CharScanners[45 /* Minus */] = returnToken(623010 /* Minus */);
CharScanners[47 /* Slash */] = returnToken(1638887 /* Slash */);
CharScanners[58 /* Colon */] = returnToken(1572879 /* Colon */);
CharScanners[63 /* Question */] = returnToken(1572880 /* Question */);
CharScanners[91 /* OpenBracket */] = returnToken(671757 /* OpenBracket */);
CharScanners[93 /* CloseBracket */] = returnToken(1835022 /* CloseBracket */);
CharScanners[123 /* OpenBrace */] = returnToken(131080 /* OpenBrace */);
CharScanners[125 /* CloseBrace */] = returnToken(1835018 /* CloseBrace */);
class ExpressionParser {
    constructor() {
        /** @internal */ this._expressionLookup = (0, utilities_objects_1.createLookup)();
        /** @internal */ this._forOfLookup = (0, utilities_objects_1.createLookup)();
        /** @internal */ this._interpolationLookup = (0, utilities_objects_1.createLookup)();
    }
    parse(expression, expressionType) {
        let found;
        switch (expressionType) {
            case 16 /* IsCustom */:
                // @ts-ignore
                return new ast_1.CustomExpression(expression);
            case 1 /* Interpolation */:
                found = this._interpolationLookup[expression];
                if (found === void 0) {
                    found = this._interpolationLookup[expression] = this.$parse(expression, expressionType);
                }
                return found;
            case 2 /* IsIterator */:
                found = this._forOfLookup[expression];
                if (found === void 0) {
                    found = this._forOfLookup[expression] = this.$parse(expression, expressionType);
                }
                return found;
            default: {
                if (expression.length === 0) {
                    // only allow function to be empty
                    if ((expressionType &
                        (4 /* IsFunction */ | 8 /* IsProperty */)) >
                        0) {
                        return ast_1.PrimitiveLiteralExpression.$empty;
                    }
                    if (true /**/)
                        throw new Error('Invalid expression. Empty expression is only valid in event bindings (trigger, delegate, capture etc...)');
                    else
                        throw new Error('AUR0169');
                }
                found = this._expressionLookup[expression];
                if (found === void 0) {
                    found = this._expressionLookup[expression] = this.$parse(expression, expressionType);
                }
                return found;
            }
        }
    }
    $parse(expression, expressionType) {
        $state.ip = expression;
        $state.length = expression.length;
        $state.index = 0;
        $state._currentChar = expression.charCodeAt(0);
        return parse($state, 0 /* Reset */, 61 /* Variadic */, {
            expressionType: expressionType === void 0 ? 8 /* IsProperty */ : expressionType,
            startOffset: 0,
        });
    }
}
exports.ExpressionParser = ExpressionParser;
function unescapeCode(code) {
    switch (code) {
        case 98 /* LowerB */:
            return 8 /* Backspace */;
        case 116 /* LowerT */:
            return 9 /* Tab */;
        case 110 /* LowerN */:
            return 10 /* LineFeed */;
        case 118 /* LowerV */:
            return 11 /* VerticalTab */;
        case 102 /* LowerF */:
            return 12 /* FormFeed */;
        case 114 /* LowerR */:
            return 13 /* CarriageReturn */;
        case 34 /* DoubleQuote */:
            return 34 /* DoubleQuote */;
        case 39 /* SingleQuote */:
            return 39 /* SingleQuote */;
        case 92 /* Backslash */:
            return 92 /* Backslash */;
        default:
            return code;
    }
}
/* eslint-enable @typescript-eslint/indent */
// endregion
class ParserState {
    constructor(ip) {
        this.ip = ip;
        this.index = 0;
        /** @internal */ this._startIndex = 0;
        /** @internal */ this._lastIndex = 0;
        /** @internal */ this._currentToken = 1572864 /* EOF */;
        /** @internal */ this._tokenValue = '';
        /** @internal */ this._assignable = true;
        this.length = ip.length;
        this._currentChar = ip.charCodeAt(0);
    }
    /** @internal */ get _tokenRaw() {
        return this.ip.slice(this._startIndex, this.index);
    }
}
exports.ParserState = ParserState;
const $state = new ParserState('');
function parseExpression(input, parseOptions = {
    // @ts-ignore
    expressionType: 0 /* None */,
    isInterpolation: false,
    startOffset: 0,
}) {
    var _a;
    $state.ip = input;
    $state.length = input.length;
    $state.index = 0;
    $state._currentChar = input.charCodeAt(0);
    let { expressionType } = parseOptions;
    if (((_a = input.match(constants_1.interpolationRegex)) === null || _a === void 0 ? void 0 : _a.length) != null) {
        // @ts-ignore subtype of constraint 'ExpressionType'
        expressionType = 1 /* Interpolation */;
    }
    return parse($state, 0 /* Reset */, 61 /* Variadic */, Object.assign(Object.assign({}, parseOptions), { expressionType: expressionType === void 0 ? 8 /* IsProperty */ : expressionType }));
}
exports.parseExpression = parseExpression;
function parse(state, access, minPrecedence, parseOptions = {
    // @ts-ignore
    expressionType: 0 /* None */,
    startOffset: 0,
    isInterpolation: false,
}) {
    const { expressionType, isInterpolation, startOffset } = parseOptions;
    // state.index/*?*/
    if (expressionType === 16 /* IsCustom */) {
        return new ast_1.CustomExpression(state.ip);
    }
    // console.log(
    //   '------------------------------------------------------------------------------------------'
    // );
    // const beforeTokenValue = state._tokenValue;
    const beforeIndex = state.index;
    // const beforeStartIndex = state._startIndex;
    if (state.index === 0) {
        if (expressionType & 1 /* Interpolation */) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            return parseInterpolation(state, startOffset);
        }
        nextToken(state);
        if (state._currentToken & 1048576 /* ExpressionTerminal */) {
            if (true /**/)
                throw new Error(`Invalid start of expression: '${state.ip}'`);
            else
                throw new Error(`AUR0151:${state.ip}`);
        }
    }
    state._assignable = 448 /* Binary */ > minPrecedence;
    let result = void 0;
    if (state._currentToken & 32768 /* UnaryOp */) {
        /**
         * parseUnaryExpression
         * https://tc39.github.io/ecma262/#sec-unary-operators
         *
         * UnaryExpression :
         * 1. LeftHandSideExpression
         * 2. void UnaryExpression
         * 3. typeof UnaryExpression
         * 4. + UnaryExpression
         * 5. - UnaryExpression
         * 6. ! UnaryExpression
         *
         * IsValidAssignmentTarget
         * 2,3,4,5,6 = false
         * 1 = see parseLeftHandSideExpression
         *
         * Note: technically we should throw on ++ / -- / +++ / ---, but there's nothing to gain from that
         */
        const op = TokenValues[state._currentToken & 63 /* Type */];
        nextToken(state);
        result = new ast_1.UnaryExpression(op, parse(state, access, 449 /* LeftHandSide */, parseOptions));
        state._assignable = false;
    }
    else {
        /**
         * parsePrimaryExpression
         * https://tc39.github.io/ecma262/#sec-primary-expression
         *
         * PrimaryExpression :
         * 1. this
         * 2. IdentifierName
         * 3. Literal
         * 4. ArrayLiteralExpression
         * 5. ObjectLiteralExpression
         * 6. TemplateLiteral
         * 7. ParenthesizedExpression
         *
         * Literal :
         * NullLiteral
         * BooleanLiteral
         * NumericLiteral
         * StringLiteral
         *
         * ParenthesizedExpression :
         * ( AssignmentExpression )
         *
         * IsValidAssignmentTarget
         * 1,3,4,5,6,7 = false
         * 2 = true
         */
        primary: switch (state._currentToken) {
            case 3078 /* ParentScope */: // $parent
                state._assignable = false;
                do {
                    nextToken(state);
                    access++; // ancestor
                    if (consumeOpt(state, 16393 /* Dot */)) {
                        if (state._currentToken === 16393 /* Dot */) {
                            if (true /**/)
                                throw new Error(`Double dot and spread operators are not supported: '${state.ip}'`);
                            else
                                throw new Error(`AUR0152:${state.ip}`);
                        }
                        else if (state._currentToken === 1572864 /* EOF */) {
                            if (true /**/) {
                                // TODO: For diagnostic throw?
                                // throw new Error(`Expected identifier: '${state.ip}'`);
                            }
                            else
                                throw new Error(`AUR0153:${state.ip}`);
                        }
                    }
                    else if (state._currentToken & 524288 /* AccessScopeTerminal */) {
                        const ancestor = access & 511 /* Ancestor */;
                        result =
                            ancestor === 0
                                ? $this
                                : ancestor === 1
                                    ? $parent
                                    : new ast_1.AccessThisExpression(ancestor);
                        access = 512 /* This */;
                        break primary;
                    }
                    else {
                        if (true /**/)
                            throw new Error(`Invalid member expression: '${state.ip}'`);
                        else
                            throw new Error(`AUR0154:${state.ip}`);
                    }
                } while (state._currentToken === 3078 /* ParentScope */);
            // falls through
            case 1024 /* Identifier */: // identifier
                if (expressionType & 2 /* IsIterator */) {
                    result = new ast_1.BindingIdentifier(state._tokenValue);
                }
                else {
                    // state._tokenValue; /*?*/
                    // state; /*?*/
                    // beforeTokenValue; /*?*/
                    // beforeIndex; /*?*/
                    // beforeStartIndex; /*?*/
                    const beforeValueIndex = state._startIndex - state._tokenValue.toString().length;
                    // state.ip[state._startIndex]; /*?*/
                    // state.ip[beforeValueIndex]; /*?*/
                    const targetTokenBackIndex = findCharBackUntil(state, [
                        '{',
                        ':',
                        ',',
                    ]);
                    // console.log('vvv---vvv');
                    // for (let index = beforeValueIndex; index > 0; index -= 1) {
                    // console.log('^^^');
                    // @ts-ignore
                    const token = state.ip[targetTokenBackIndex];
                    if (isInterpolation) {
                        // ('isInterpolation'); /* ? */
                        // state; /* ?*/
                        // const accessScopeStart = state._startIndex;
                        const accessScopeStart = startOffset + state.index - state._tokenValue.toString().length;
                        const accessScopeEnd = startOffset + state.index;
                        result = new ast_1.AccessScopeExpression(state._tokenValue, access & 511 /* Ancestor */, {
                            start: accessScopeStart,
                            end: accessScopeEnd,
                        });
                    }
                    else if (token === '{') {
                        ('token === {'); /* ? */
                        // state; /* ?*/
                        startOffset; /* ? */
                        beforeValueIndex; /* ? */
                        const accessScopeStart = startOffset + beforeValueIndex;
                        const accessScopeEnd = startOffset + state._startIndex;
                        // // const accessScopeStart = beforeValueIndex;
                        // const accessScopeStart = state._startIndex;
                        // const accessScopeEnd = state.index;
                        new Error().stack; /*? */
                        result = new ast_1.AccessScopeExpression(state._tokenValue, access & 511 /* Ancestor */, {
                            start: accessScopeStart,
                            end: accessScopeEnd,
                        });
                    }
                    else if (token === ',') {
                        // state; /*?*/
                        // beforeIndex; /*?*/
                        result = new ast_1.AccessScopeExpression(state._tokenValue, access & 511 /* Ancestor */, {
                            start: startOffset +
                                beforeIndex -
                                state._tokenValue.toString().length,
                            end: startOffset + beforeIndex,
                        });
                    }
                    else {
                        result = new ast_1.AccessScopeExpression(state._tokenValue, access & 511 /* Ancestor */, {
                            start: startOffset + state._startIndex,
                            end: startOffset +
                                state._startIndex +
                                state._tokenValue.toString().length,
                        });
                    }
                    access = 1024 /* Scope */;
                }
                state._assignable = true;
                nextToken(state);
                break;
            case 3076 /* ThisScope */: // $this
                state._assignable = false;
                nextToken(state);
                result = $this;
                access = 512 /* This */;
                break;
            case 671751 /* OpenParen */: // parenthesized expression
                nextToken(state);
                result = parse(state, 0 /* Reset */, 62 /* Assign */, parseOptions);
                consume(state, 1835019 /* CloseParen */);
                access = 0 /* Reset */;
                break;
            case 671757 /* OpenBracket */:
                result =
                    state.ip.search(/\s+of\s+/) > state.index
                        ? parseArrayDestructuring(state, parseOptions.startOffset)
                        : parseArrayLiteralExpression(state, access, parseOptions);
                access = 0 /* Reset */;
                break;
            case 131080 /* OpenBrace */:
                result = parseObjectLiteralExpression(state, parseOptions);
                access = 0 /* Reset */;
                break;
            case 540714 /* TemplateTail */:
                result = new ast_1.TemplateExpression([state._tokenValue]);
                state._assignable = false;
                nextToken(state);
                access = 0 /* Reset */;
                break;
            case 540715 /* TemplateContinuation */:
                result = parseTemplate(state, access, 
                // @ts-ignore
                result, false, parseOptions);
                access = 0 /* Reset */;
                break;
            case 4096 /* StringLiteral */:
            case 8192 /* NumericLiteral */:
                // state._tokenValue; /*?*/
                result = new ast_1.PrimitiveLiteralExpression(state._tokenValue, {
                    start: parseOptions.startOffset + state._startIndex,
                    end: parseOptions.startOffset + state.index,
                });
                state._assignable = false;
                nextToken(state);
                access = 0 /* Reset */;
                break;
            case 2050 /* NullKeyword */:
            case 2051 /* UndefinedKeyword */:
            case 2049 /* TrueKeyword */:
            case 2048 /* FalseKeyword */:
                result = TokenValues[state._currentToken & 63 /* Type */];
                state._assignable = false;
                nextToken(state);
                access = 0 /* Reset */;
                break;
            default:
                if (state.index >= state.length) {
                    if (true /**/) {
                        // TODO: For diagnostic throw?
                        // throw new Error(`Unexpected end of expression: '${state.ip}'`);
                    }
                    else
                        throw new Error(`AUR0155:${state.ip}`);
                }
                else {
                    if (true /**/) {
                        // TODO: For diagnostic throw?
                        // throw new Error(`Unconsumed token: '${state.ip}'`);
                    }
                    else
                        throw new Error(`AUR0156:${state.ip}`);
                }
        }
        if (expressionType & 2 /* IsIterator */) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            // @ts-ignore
            return parseForOfStatement(state, result);
        }
        if (449 /* LeftHandSide */ < minPrecedence) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            return result;
        }
        /**
         * parseMemberExpression (Token.Dot, Token.OpenBracket, Token.TemplateContinuation)
         * MemberExpression :
         * 1. PrimaryExpression
         * 2. MemberExpression [ AssignmentExpression ]
         * 3. MemberExpression . IdentifierName
         * 4. MemberExpression TemplateLiteral
         *
         * IsValidAssignmentTarget
         * 1,4 = false
         * 2,3 = true
         *
         *
         * parseCallExpression (Token.OpenParen)
         * CallExpression :
         * 1. MemberExpression Arguments
         * 2. CallExpression Arguments
         * 3. CallExpression [ AssignmentExpression ]
         * 4. CallExpression . IdentifierName
         * 5. CallExpression TemplateLiteral
         *
         * IsValidAssignmentTarget
         * 1,2,5 = false
         * 3,4 = true
         */
        let name = state._tokenValue;
        while ((state._currentToken & 16384 /* LeftHandSide */) > 0) {
            const args = [];
            let strings;
            switch (state._currentToken) {
                case 16393 /* Dot */:
                    state._assignable = true;
                    nextToken(state);
                    if ((state._currentToken & 3072 /* IdentifierName */) === 0) {
                        if (true /**/) {
                            // TODO: For diagnostic throw?
                            // throw new Error(`Expected identifier: '${state.ip}'`);
                        }
                        else
                            throw new Error(`AUR0153:${state.ip}`);
                    }
                    name = state._tokenValue;
                    nextToken(state);
                    // Change $This to $Scope, change $Scope to $Member, keep $Member as-is, change $Keyed to $Member, disregard other flags
                    access =
                        ((access & (512 /* This */ | 1024 /* Scope */)) << 1) |
                            (access & 2048 /* Member */) |
                            ((access & 4096 /* Keyed */) >> 1);
                    if (state._currentToken === 671751 /* OpenParen */) {
                        if (access === 0 /* Reset */) {
                            // if the left hand side is a literal, make sure we parse a CallMemberExpression
                            access = 2048 /* Member */;
                        }
                        continue;
                    }
                    if (access & 1024 /* Scope */) {
                        result = new ast_1.AccessScopeExpression(name, result.ancestor, {
                            start: startOffset + state._startIndex,
                            end: startOffset + -10,
                        });
                    }
                    else {
                        // if it's not $Scope, it's $Member
                        // state._tokenValue; /*?*/
                        // state._startIndex; /*?*/
                        // state; /*?*/
                        const token = state.ip[state.index - 1];
                        state.ip[state._startIndex - 2];
                        if (token === '[' || token === ')') {
                            // @ts-ignore
                            result = new ast_1.AccessMemberExpression(result, name, {
                                start: startOffset +
                                    state._startIndex -
                                    state._tokenValue.toString().length,
                                end: startOffset + state._startIndex,
                            });
                        }
                        else if (token === '|') {
                            const beforeIndex = findCharBackUntilNot(state, [' ']);
                            // beforeIndex; /*?*/
                            // @ts-ignore
                            result = new ast_1.AccessMemberExpression(result, name, {
                                start: startOffset +
                                    beforeIndex -
                                    state._tokenValue.toString().length,
                                end: startOffset + beforeIndex,
                            });
                        }
                        else {
                            // @ts-ignore
                            result = new ast_1.AccessMemberExpression(result, name, {
                                start: startOffset + state._startIndex,
                                end: startOffset +
                                    state._startIndex +
                                    state._tokenValue.toString().length,
                            });
                        }
                    }
                    continue;
                case 671757 /* OpenBracket */:
                    state._assignable = true;
                    nextToken(state);
                    access = 4096 /* Keyed */;
                    // state._tokenValue; /*?*/
                    result = new ast_1.AccessKeyedExpression(
                    // @ts-ignore
                    result, parse(state, 0 /* Reset */, 62 /* Assign */, parseOptions), 
                    /** try to get start of index, +1 "]" */
                    {
                        start: startOffset + state._startIndex - state.index + 1,
                        end: startOffset + state._startIndex + 1,
                    });
                    consume(state, 1835022 /* CloseBracket */);
                    break;
                case 671751 /* OpenParen */:
                    state._assignable = false;
                    // '>>>> 1'; /* ? */
                    // state._tokenValue; /*?*/
                    // state; /*?*/
                    const openParentStateStartIndex = state._startIndex;
                    nextToken(state);
                    while (state._currentToken !== 1835019 /* CloseParen */) {
                        // ('>>>> 1.1'); /* ? */
                        // state._tokenValue; /*?*/
                        // state; /*?*/
                        // foo(bar())
                        let argsOffset = startOffset;
                        if (state._currentToken === 1835019 /* CloseParen */) {
                            argsOffset = startOffset + state._startIndex;
                        }
                        args.push(parse(state, 0 /* Reset */, 62 /* Assign */, {
                            expressionType,
                            startOffset: argsOffset,
                            isInterpolation,
                        }));
                        if (!consumeOpt(state, 1572876 /* Comma */)) {
                            break;
                        }
                    }
                    // '>>>> 2'; /* ? */
                    // state; /* ? */
                    consume(state, 1835019 /* CloseParen */);
                    if (access & 1024 /* Scope */) {
                        // state._tokenValue; /*?*/
                        // state.index/*?*/
                        // state._startIndex/*?*/
                        // ('>>>> 3'); /* ? */
                        // state; /*?*/
                        // state._tokenValue; /* ? */
                        const startCallScopeIndex = state.index - state._startIndex - 1;
                        // foo(bar)
                        let nameLocationStart = startOffset + startCallScopeIndex;
                        let nameLocationEnd = startOffset + startCallScopeIndex + name.toString().length;
                        let scopeLocationStart = startOffset + startCallScopeIndex;
                        let scopeLocationEnd = startOffset + state._startIndex;
                        // foo(bar())
                        if (state._currentToken === 1835019 /* CloseParen */) {
                            const openParenIndex = findCharBackUntil(state, ['(']);
                            if (openParenIndex != null) {
                                nameLocationStart =
                                    startOffset +
                                        openParenIndex -
                                        state._tokenValue.toString().length;
                                nameLocationEnd = startOffset + openParenIndex;
                                // TODO scopeLocation
                            }
                        }
                        // ('CallScopeExpression'); /* ? */
                        if (isInterpolation) {
                            // state; /* ? */
                            // isInterpolation; /*?*/
                            // startCallScopeIndex; /*?*/
                            const targetNameLocation = 
                            // @ts-ignore
                            result.nameLocation;
                            if (targetNameLocation) {
                                nameLocationStart = targetNameLocation.start;
                                nameLocationEnd = targetNameLocation.end;
                            }
                            else {
                                console.log('[WARNING] Unconsumed: ');
                                console.log(result);
                            }
                        }
                        result = new ast_1.CallScopeExpression(name, args, result.ancestor, {
                            start: nameLocationStart,
                            end: nameLocationEnd,
                        }, {
                            start: scopeLocationStart,
                            end: scopeLocationEnd,
                            // end: startOffset + state.index,
                        });
                    }
                    else if (access & 2048 /* Member */) {
                        const callMemberStart = startOffset + openParentStateStartIndex - name.length;
                        const callMemberEnd = startOffset + openParentStateStartIndex;
                        // name; /*?*/
                        // @ts-ignore
                        result = new ast_1.CallMemberExpression(result, name, args, {
                            start: callMemberStart,
                            end: callMemberEnd,
                        });
                    }
                    else {
                        // @ts-ignore
                        result = new ast_1.CallFunctionExpression(result, args);
                    }
                    access = 0;
                    break;
                case 540714 /* TemplateTail */:
                    state._assignable = false;
                    strings = [state._tokenValue];
                    // @ts-ignore
                    result = new ast_1.TaggedTemplateExpression(strings, strings, result);
                    nextToken(state);
                    break;
                case 540715 /* TemplateContinuation */:
                    result = parseTemplate(state, access, 
                    // @ts-ignore
                    result, true, parseOptions);
                default:
            }
        }
    }
    if (448 /* Binary */ < minPrecedence) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return result;
    }
    /**
     * parseBinaryExpression
     * https://tc39.github.io/ecma262/#sec-multiplicative-operators
     *
     * MultiplicativeExpression : (local precedence 6)
     * UnaryExpression
     * MultiplicativeExpression * / % UnaryExpression
     *
     * AdditiveExpression : (local precedence 5)
     * MultiplicativeExpression
     * AdditiveExpression + - MultiplicativeExpression
     *
     * RelationalExpression : (local precedence 4)
     * AdditiveExpression
     * RelationalExpression < > <= >= instanceof in AdditiveExpression
     *
     * EqualityExpression : (local precedence 3)
     * RelationalExpression
     * EqualityExpression == != === !== RelationalExpression
     *
     * LogicalANDExpression : (local precedence 2)
     * EqualityExpression
     * LogicalANDExpression && EqualityExpression
     *
     * LogicalORExpression : (local precedence 1)
     * LogicalANDExpression
     * LogicalORExpression || LogicalANDExpression
     */
    while ((state._currentToken & 65536 /* BinaryOp */) > 0) {
        const opToken = state._currentToken;
        if ((opToken & 448 /* Precedence */) <= minPrecedence) {
            break;
        }
        nextToken(state);
        result = new ast_1.BinaryExpression(TokenValues[opToken & 63 /* Type */], 
        // @ts-ignore
        result, parse(state, access, opToken & 448 /* Precedence */, parseOptions));
        state._assignable = false;
    }
    if (63 /* Conditional */ < minPrecedence) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return result;
    }
    /**
     * parseConditionalExpression
     * https://tc39.github.io/ecma262/#prod-ConditionalExpression
     *
     * ConditionalExpression :
     * 1. BinaryExpression
     * 2. BinaryExpression ? AssignmentExpression : AssignmentExpression
     *
     * IsValidAssignmentTarget
     * 1,2 = false
     */
    if (consumeOpt(state, 1572880 /* Question */)) {
        const yes = parse(state, access, 62 /* Assign */, parseOptions);
        consume(state, 1572879 /* Colon */);
        result = new ast_1.ConditionalExpression(
        // @ts-ignore
        result, yes, parse(state, access, 62 /* Assign */, parseOptions));
        state._assignable = false;
    }
    if (62 /* Assign */ < minPrecedence) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return result;
    }
    /**
     * parseAssignmentExpression
     * https://tc39.github.io/ecma262/#prod-AssignmentExpression
     * Note: AssignmentExpression here is equivalent to ES Expression because we don't parse the comma operator
     *
     * AssignmentExpression :
     * 1. ConditionalExpression
     * 2. LeftHandSideExpression = AssignmentExpression
     *
     * IsValidAssignmentTarget
     * 1,2 = false
     */
    if (consumeOpt(state, 1048616 /* Equals */)) {
        if (!state._assignable) {
            if (true /**/)
                throw new Error(`Left hand side of expression is not assignable: '${state.ip}'`);
            else
                throw new Error(`AUR0158:${state.ip}`);
        }
        result = new ast_1.AssignExpression(
        // @ts-ignore
        result, parse(state, access, 62 /* Assign */, parseOptions));
    }
    if (61 /* Variadic */ < minPrecedence) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return result;
    }
    /**
      parseValueConverter
     */
    while (consumeOpt(state, 1572884 /* Bar */)) {
        if (state._currentToken === 1572864 /* EOF */) {
            if (true /**/) {
                // TODO: For diagnostic throw?
                // throw new Error(
                //   `Expected identifier to come after ValueConverter operator: '${state.ip}'`
                // );
            }
            else
                throw new Error(`AUR0159:${state.ip}`);
        }
        const name = state._tokenValue;
        nextToken(state);
        const args = new Array();
        while (consumeOpt(state, 1572879 /* Colon */)) {
            args.push(parse(state, access, 62 /* Assign */, parseOptions));
        }
        // state._tokenValue; /*?*/
        // state; /*?*/
        // @ts-ignore
        result = new ast_1.ValueConverterExpression(result, name, args, {
            start: startOffset + state._startIndex,
            end: startOffset + state.index,
        });
    }
    /**
      parseBindingBehavior
     */
    while (consumeOpt(state, 1572883 /* Ampersand */)) {
        if (state._currentToken === 1572864 /* EOF */) {
            if (true /**/)
                throw new Error(`Expected identifier to come after BindingBehavior operator: '${state.ip}'`);
            else
                throw new Error(`AUR0160:${state.ip}`);
        }
        const name = state._tokenValue;
        nextToken(state);
        const args = new Array();
        while (consumeOpt(state, 1572879 /* Colon */)) {
            args.push(parse(state, access, 62 /* Assign */, parseOptions));
        }
        // @ts-ignore
        result = new ast_1.BindingBehaviorExpression(result, name, args);
    }
    if (state._currentToken !== 1572864 /* EOF */) {
        if (expressionType & 1 /* Interpolation */) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            return result;
        }
        if (state._tokenRaw === 'of') {
            if (true /**/)
                throw new Error(`Unexpected keyword "of": '${state.ip}'`);
            else
                throw new Error(`AUR0161:${state.ip}`);
        }
        if (true /**/)
            throw new Error(`Unconsumed token: '${state.ip}'`);
        else
            throw new Error(`AUR0162:${state.ip}`);
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return result;
}
exports.parse = parse;
/**
 * [key,]
 * [key]
 * [,value]
 * [key,value]
 */
function parseArrayDestructuring(state, startOffset = 0) {
    const items = [];
    const dae = new ast_1.DestructuringAssignmentExpression(90137 /* ArrayDestructuring */, items, void 0, void 0);
    let target = '';
    let $continue = true;
    let index = 0;
    while ($continue) {
        nextToken(state);
        switch (state._currentToken) {
            case 1835022 /* CloseBracket */:
                $continue = false;
                addItem(startOffset);
                break;
            case 1572876 /* Comma */:
                addItem(startOffset);
                break;
            case 1024 /* Identifier */:
                target = state._tokenRaw;
                break;
            default:
                if (true /**/) {
                    throw new Error(`Unexpected '${state._tokenRaw}' at position ${state.index - 1} for destructuring assignment in ${state.ip}`);
                }
                else {
                    throw new Error(`AUR0170:${state.ip}`);
                }
        }
    }
    consume(state, 1835022 /* CloseBracket */);
    return dae;
    function addItem(startOffset = 0) {
        if (target !== '') {
            items.push(new ast_1.DestructuringAssignmentSingleExpression(new ast_1.AccessMemberExpression($this, target, {
                start: startOffset + state._startIndex,
                end: startOffset + -10,
            }), new ast_1.AccessKeyedExpression($this, new ast_1.PrimitiveLiteralExpression(index++), { start: startOffset + state._startIndex, end: startOffset + -10 }), void 0));
            target = '';
        }
        else {
            index++;
        }
    }
}
/**
 * parseArrayLiteralExpression
 * https://tc39.github.io/ecma262/#prod-ArrayLiteralExpression
 *
 * ArrayLiteralExpression :
 * [ Elision(opt) ]
 * [ ElementList ]
 * [ ElementList, Elision(opt) ]
 *
 * ElementList :
 * Elision(opt) AssignmentExpression
 * ElementList, Elision(opt) AssignmentExpression
 *
 * Elision :
 * ,
 * Elision ,
 */
function parseArrayLiteralExpression(state, access, parseOptions) {
    const { expressionType } = parseOptions;
    nextToken(state);
    const elements = new Array();
    while (state._currentToken !== 1835022 /* CloseBracket */) {
        if (consumeOpt(state, 1572876 /* Comma */)) {
            elements.push($undefined);
            if (state._currentToken === 1835022 /* CloseBracket */) {
                break;
            }
        }
        else {
            elements.push(parse(state, access, 62 /* Assign */, Object.assign(Object.assign({}, parseOptions), { expressionType: expressionType & ~2 /* IsIterator */ })));
            if (consumeOpt(state, 1572876 /* Comma */)) {
                if (state._currentToken === 1835022 /* CloseBracket */) {
                    break;
                }
            }
            else {
                break;
            }
        }
    }
    consume(state, 1835022 /* CloseBracket */);
    if (expressionType & 2 /* IsIterator */) {
        return new ast_1.ArrayBindingPattern(elements);
    }
    else {
        state._assignable = false;
        return new ast_1.ArrayLiteralExpression(elements);
    }
}
function parseForOfStatement(state, result) {
    if ((result.$kind & 65536 /* IsForDeclaration */) === 0) {
        if (true /**/)
            throw new Error(`Invalid BindingIdentifier at left hand side of "of": '${state.ip}'`);
        else
            throw new Error(`AUR0163:${state.ip}`);
    }
    if (state._currentToken !== 1051180 /* OfKeyword */) {
        if (true /**/)
            throw new Error(`Invalid BindingIdentifier at left hand side of "of": '${state.ip}'`);
        else
            throw new Error(`AUR0163:${state.ip}`);
    }
    nextToken(state);
    const declaration = result;
    const statement = parse(state, 0 /* Reset */, 61 /* Variadic */, {
        expressionType: 0 /* None */,
        startOffset: 0,
    });
    return new ast_1.ForOfStatement(declaration, statement);
}
/**
 * parseObjectLiteralExpression
 * https://tc39.github.io/ecma262/#prod-Literal
 *
 * ObjectLiteralExpression :
 * { }
 * { PropertyDefinitionList }
 *
 * PropertyDefinitionList :
 * PropertyDefinition
 * PropertyDefinitionList, PropertyDefinition
 *
 * PropertyDefinition :
 * IdentifierName
 * PropertyName : AssignmentExpression
 *
 * PropertyName :
 * IdentifierName
 * StringLiteral
 * NumericLiteral
 */
function parseObjectLiteralExpression(state, parseOptions) {
    const { expressionType, startOffset } = parseOptions;
    // state.ip; /*?*/
    // state.index; /*?*/
    const openBraceIndex = state.index - 1;
    // state.ip[openBraceIndex]; /*?*/
    const keys = new Array();
    const values = new Array();
    nextToken(state);
    while (state._currentToken !== 1835018 /* CloseBrace */) {
        keys.push(state._tokenValue);
        // Literal = mandatory colon
        if (state._currentToken & 12288 /* StringOrNumericLiteral */) {
            nextToken(state);
            consume(state, 1572879 /* Colon */);
            values.push(parse(state, 0 /* Reset */, 62 /* Assign */, Object.assign(Object.assign({}, parseOptions), { expressionType: expressionType & ~2 /* IsIterator */ })));
        }
        else if (state._currentToken & 3072 /* IdentifierName */) {
            // IdentifierName = optional colon
            const { _currentChar: currentChar, _currentToken: currentToken, index: index, } = state;
            // String.fromCharCode(currentChar); /*?*/
            nextToken(state);
            if (consumeOpt(state, 1572879 /* Colon */)) {
                values.push(parse(state, 0 /* Reset */, 62 /* Assign */, Object.assign(Object.assign({}, parseOptions), { expressionType: expressionType & ~2 /* IsIterator */ })));
            }
            else {
                // Shorthand
                state._currentChar = currentChar;
                // currentChar; /*?*/
                // String.fromCharCode(currentChar); /*?*/
                state._currentToken = currentToken;
                state.index = index;
                // state.ip[state._startIndex]; /*?*/
                values.push(parse(state, 0 /* Reset */, 450 /* Primary */, Object.assign(Object.assign({}, parseOptions), { expressionType: expressionType & ~2 /* IsIterator */ })));
            }
        }
        else {
            if (true /**/)
                throw new Error(`Invalid or unsupported property definition in object literal: '${state.ip}'`);
            else
                throw new Error(`AUR0164:${state.ip}`);
        }
        if (state._currentToken !== 1835018 /* CloseBrace */) {
            consume(state, 1572876 /* Comma */);
        }
    }
    // state.index/*?*/
    consume(state, 1835018 /* CloseBrace */);
    // state.index/*?*/
    if (expressionType & 2 /* IsIterator */) {
        return new ast_1.ObjectBindingPattern(keys, values);
    }
    else {
        state._assignable = false;
        return new ast_1.ObjectLiteralExpression(keys, values, {
            start: startOffset + openBraceIndex,
            end: startOffset + state._startIndex,
        });
    }
}
function parseInterpolation(state, startOffset = 0) {
    const parts = [];
    const expressions = [];
    const interpolationStarts = [];
    const interpolationEnds = [];
    const length = state.length;
    let result = '';
    let interpolationStart = NaN;
    while (state.index < length) {
        switch (state._currentChar) {
            case 36 /* Dollar */:
                if (state.ip.charCodeAt(state.index + 1) === 123 /* OpenBrace */) {
                    // /* prettier-ignore */ console.log('----------------------------------------')
                    interpolationStart = Math.max(state.index, 0);
                    // const interpolationStart = Math.max(startOffset + state.index, 0);
                    interpolationStarts.push(startOffset + interpolationStart);
                    // interpolationStarts; /*?*/
                    parts.push(result);
                    // state; /* ? */
                    // parts; /*?*/
                    interpolationEnds.push(startOffset + interpolationStart - result.length);
                    // interpolationEnds; /*?*/
                    result = '';
                    state.index += 2;
                    state._currentChar = state.ip.charCodeAt(state.index);
                    // state; /* ? */
                    nextToken(state);
                    // startOffset; /* ? */
                    // currentPartLength; /*?*/
                    // const adjustedOffset = startOffset + currentPartLength;
                    // adjustedOffset; /*?*/
                    const expression = parse(state, 0 /* Reset */, 61 /* Variadic */, {
                        expressionType: 1 /* Interpolation */,
                        startOffset,
                        isInterpolation: true,
                    });
                    expressions.push(expression);
                    continue;
                }
                else {
                    result += '$';
                }
                break;
            case 92 /* Backslash */:
                result += String.fromCharCode(unescapeCode(nextChar(state)));
                break;
            default:
                result += String.fromCharCode(state._currentChar);
        }
        nextChar(state);
    }
    if (expressions.length) {
        // interpolationEnds; /* ? */
        parts.push(result);
        // parts; /* ? */
        const [, ...finalEnds] = interpolationEnds;
        return new ast_1.Interpolation(parts, expressions, interpolationStarts, finalEnds);
    }
    return null;
}
/**
 * parseTemplateLiteralExpression
 * https://tc39.github.io/ecma262/#prod-Literal
 *
 * TemplateExpression :
 * NoSubstitutionTemplate
 * TemplateHead
 *
 * NoSubstitutionTemplate :
 * ` TemplateCharacters(opt) `
 *
 * TemplateHead :
 * ` TemplateCharacters(opt) ${
 *
 * TemplateSubstitutionTail :
 * TemplateMiddle
 * TemplateTail
 *
 * TemplateMiddle :
 * } TemplateCharacters(opt) ${
 *
 * TemplateTail :
 * } TemplateCharacters(opt) `
 *
 * TemplateCharacters :
 * TemplateCharacter TemplateCharacters(opt)
 *
 * TemplateCharacter :
 * $ [lookahead ≠ {]
 * \ EscapeSequence
 * SourceCharacter (but not one of ` or \ or $)
 */
function parseTemplate(state, access, result, tagged, parseOptions) {
    const cooked = [state._tokenValue];
    // TODO: properly implement raw parts / decide whether we want this
    consume(state, 540715 /* TemplateContinuation */);
    const expressions = [parse(state, access, 62 /* Assign */, parseOptions)];
    while ((state._currentToken = scanTemplateTail(state)) !== 540714 /* TemplateTail */) {
        cooked.push(state._tokenValue);
        consume(state, 540715 /* TemplateContinuation */);
        expressions.push(parse(state, access, 62 /* Assign */, parseOptions));
    }
    cooked.push(state._tokenValue);
    state._assignable = false;
    if (tagged) {
        nextToken(state);
        return new ast_1.TaggedTemplateExpression(cooked, cooked, result, expressions);
    }
    else {
        nextToken(state);
        return new ast_1.TemplateExpression(cooked, expressions);
    }
}
function nextToken(state) {
    while (state.index < state.length) {
        // state.index/*?*/
        state._startIndex = state.index;
        if ((state._currentToken = CharScanners[state._currentChar](state)) != null) {
            // state.index/*?*/
            // a null token means the character must be skipped
            return;
        }
    }
    state._currentToken = 1572864 /* EOF */;
}
function nextChar(state) {
    return (state._currentChar = state.ip.charCodeAt(++state.index));
}
function scanIdentifier(state) {
    // run to the next non-idPart
    while (IdParts[nextChar(state)])
        ;
    const token = KeywordLookup[(state._tokenValue = state._tokenRaw)];
    return token === undefined ? 1024 /* Identifier */ : token;
}
function scanNumber(state, isFloat) {
    let char = state._currentChar;
    if (isFloat === false) {
        do {
            char = nextChar(state);
        } while (char <= 57 /* Nine */ && char >= 48 /* Zero */);
        if (char !== 46 /* Dot */) {
            state._tokenValue = parseInt(state._tokenRaw, 10);
            return 8192 /* NumericLiteral */;
        }
        // past this point it's always a float
        char = nextChar(state);
        if (state.index >= state.length) {
            // unless the number ends with a dot - that behaves a little different in native ES expressions
            // but in our AST that behavior has no effect because numbers are always stored in variables
            state._tokenValue = parseInt(state._tokenRaw.slice(0, -1), 10);
            return 8192 /* NumericLiteral */;
        }
    }
    if (char <= 57 /* Nine */ && char >= 48 /* Zero */) {
        do {
            char = nextChar(state);
        } while (char <= 57 /* Nine */ && char >= 48 /* Zero */);
    }
    else {
        state._currentChar = state.ip.charCodeAt(--state.index);
    }
    state._tokenValue = parseFloat(state._tokenRaw);
    return 8192 /* NumericLiteral */;
}
function scanString(state) {
    const quote = state._currentChar;
    nextChar(state); // Skip initial quote.
    let unescaped = 0;
    const buffer = new Array();
    let marker = state.index;
    while (state._currentChar !== quote) {
        if (state._currentChar === 92 /* Backslash */) {
            buffer.push(state.ip.slice(marker, state.index));
            nextChar(state);
            unescaped = unescapeCode(state._currentChar);
            nextChar(state);
            buffer.push(String.fromCharCode(unescaped));
            marker = state.index;
        }
        else if (state.index >= state.length) {
            if (true /**/)
                throw new Error(`Unterminated quote in string literal: '${state.ip}'`);
            else
                throw new Error(`AUR0165:${state.ip}`);
        }
        else {
            nextChar(state);
        }
    }
    const last = state.ip.slice(marker, state.index);
    nextChar(state); // Skip terminating quote.
    // Compute the unescaped string value.
    buffer.push(last);
    const unescapedStr = buffer.join('');
    state._tokenValue = unescapedStr;
    return 4096 /* StringLiteral */;
}
function scanTemplate(state) {
    let tail = true;
    let result = '';
    while (nextChar(state) !== 96 /* Backtick */) {
        if (state._currentChar === 36 /* Dollar */) {
            if (state.index + 1 < state.length &&
                state.ip.charCodeAt(state.index + 1) === 123 /* OpenBrace */) {
                state.index++;
                tail = false;
                break;
            }
            else {
                result += '$';
            }
        }
        else if (state._currentChar === 92 /* Backslash */) {
            result += String.fromCharCode(unescapeCode(nextChar(state)));
        }
        else {
            if (state.index >= state.length) {
                if (true /**/)
                    throw new Error(`Unterminated template string: '${state.ip}'`);
                else
                    throw new Error(`AUR0166:${state.ip}`);
            }
            result += String.fromCharCode(state._currentChar);
        }
    }
    nextChar(state);
    state._tokenValue = result;
    if (tail) {
        return 540714 /* TemplateTail */;
    }
    return 540715 /* TemplateContinuation */;
}
function scanTemplateTail(state) {
    if (state.index >= state.length) {
        if (true /**/)
            throw new Error(`Unterminated template string: '${state.ip}'`);
        else
            throw new Error(`AUR0166:${state.ip}`);
    }
    state.index--;
    return scanTemplate(state);
}
function consumeOpt(state, token) {
    if (state._currentToken === token) {
        nextToken(state);
        return true;
    }
    return false;
}
function consume(state, token) {
    if (state._currentToken === token) {
        nextToken(state);
    }
    else {
        if (true /**/)
            throw new Error(`Missing expected token: '${state.ip}'`);
        else
            throw new Error(`AUR0167:${state.ip}<${token}`);
    }
}
function findCharBackUntil(state, targetChars) {
    let openBracketIndex;
    for (let index = state._startIndex; index > 0; index -= 1) {
        // state.ip[index]; /*?*/
        if (targetChars.includes(state.ip[index])) {
            // if (state.ip[index] === '{') {
            openBracketIndex = index;
            break;
        }
    }
    return openBracketIndex;
}
function findCharBackUntilNot(state, targetChars) {
    let openBracketIndex = NaN;
    for (let index = state._startIndex; index > 0; index -= 1) {
        // state.ip[index]; /*?*/
        // regex.exec(state.ip[index])/*?*/
        if (!targetChars.includes(state.ip[index])) {
            // if (regex.exec(state.ip[index])) {
            // if (state.ip[index] === '{') {
            openBracketIndex = index;
            break;
        }
    }
    return openBracketIndex - 1;
}
// st inpat = '01234567890123456789'/*?*/
// const input = '${foo.} ${foo}<p></p>'
// const input = 'foo({  start:  minDate,   end  })'
// const input = 'foo({ bar})';
// const input = 'foo({  bar, ok})';
// const input = 'foo({ba, quxx})';
// const input = 'foo({bar})';
// const input = 'foo({bar: 0})[0]'
// const input = 'foo({bar: 0})[0]'
// const input = 'foo({bar: 0})[0].qux'
// const input = 'getPosts({  start:  minDate,   end  })[0].timestamp';
// const input = "getPosts({ start: minDate, end: maxDate })[0].timestamp | timeAgo & signal:'tick'"
// const input = "getPosts({ start: minDate, end })[0].timestamp | timeAgo & signal:'tick'"
// const input = 'getPosts({ start: minDate, end })[0].timestamp | timeAgo';
// const input = "getPosts({ start: minDate, end })[0].timestamp | timeAgo & signal:'tick'"
// const input = 'foo.ba(quxx)'
// const input = '_abc("fgh", lmn.pqrs)'
// const input = '_abc[0].efg["jkl"]'
// const input = '_abc[0].efg[0]'
// const input = '_abc.efg[0]'
// const input = 'efg[0]'
// const input = '_abc.efg'
// const asht = `
// 012345678901234567
// ${input}
// `; /*?*/
//               0123 567  012
// const result = parseExpression(input, ExpressionType.Interpolation);
//  result/*?*/
// JSON.stringify(result, null, 4); /*?*/
// JSON.stringify(result, null, 4); /*?*/
//# sourceMappingURL=expression-parser.js.map
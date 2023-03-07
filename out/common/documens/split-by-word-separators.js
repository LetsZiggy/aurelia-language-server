"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.splitByWordSeparators = void 0;
const constants_1 = require("../constants");
function splitByWordSeparators(input) {
    const whiteSpaceRegex = '\\s\\r\\n\\t';
    const myRegex = new RegExp(`[${constants_1.WORD_SEPARATORS_REGEX_STRING}${whiteSpaceRegex}]`, 'i');
    const split = input.split(myRegex).filter((_string) => _string !== '');
    return split;
}
exports.splitByWordSeparators = splitByWordSeparators;
//# sourceMappingURL=split-by-word-separators.js.map
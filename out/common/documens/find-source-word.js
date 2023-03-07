"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getWordInfoAtOffset = exports.getWordAtOffset = exports.findSourceWord = void 0;
const constants_1 = require("../constants");
function findSourceWord(region, offset) {
    if (region.sourceCodeLocation.startOffset === undefined)
        return '';
    // ?? ?? custom element
    const input = 
    // eslint-disable-next-line
    region.regionValue ||
        // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
        region.attributeValue ||
        region.tagName ||
        region.textValue;
    if (input === undefined)
        return '';
    const normalizedOffset = Math.abs(region.sourceCodeLocation.startOffset - offset);
    const word = getWordAtOffset(input, normalizedOffset);
    return word;
}
exports.findSourceWord = findSourceWord;
/**
 * At a given offset get the underlying word
 *
 * @example
 * const str = 'hi |: on';
 * getWordAtOffset(str, 0); // hi
 * getWordAtOffset(str, 1); // hi
 * getWordAtOffset(str, 2); // hi
 * getWordAtOffset(str, 3); // ''
 * getWordAtOffset(str, 4); // ''
 * getWordAtOffset(str, 5); // ''
 * getWordAtOffset(str, 6); // on
 * getWordAtOffset(str, 7); // on
 * getWordAtOffset(str, 8); // on
 */
function getWordAtOffset(input, offset) {
    return getWordInfoAtOffset(input, offset).word;
}
exports.getWordAtOffset = getWordAtOffset;
// const input =
//   '' +
//   `@customElement({ name: 'custom-element', template })
// export class CustomElementCustomElement {
//   @bindable foo;
//   @bindable bar;
//   qux;
//   useFoo() {
//     this.foo;
//   }
// }`;
// getWordAtOffset(input, 106); /*?*/
function getWordInfoAtOffset(input, offset) {
    if (isNonWordCharacter(input[offset])) {
        const offsetPrevious = offset - 1;
        if (!isNonWordCharacter(input[offsetPrevious])) {
            offset = offsetPrevious;
        }
        else {
            return { startOffset: NaN, endOffset: NaN, word: '' };
        }
    }
    const wordStartIndex = getBackwardNonWordIndex(input, offset);
    const wordEndIndex = getForwardNonWordIndex(input, offset);
    const word = input.substring(wordStartIndex, wordEndIndex + 1);
    return {
        startOffset: wordStartIndex,
        endOffset: wordEndIndex,
        word,
    };
}
exports.getWordInfoAtOffset = getWordInfoAtOffset;
function isNonWordCharacter(char) {
    const isWordSeparator = constants_1.WORD_SEPARATORS.includes(char);
    const isWhiteSpace = constants_1.whiteSpaceRegex.exec(char);
    const isNonWord = isWhiteSpace !== null || isWordSeparator;
    return isNonWord;
}
function getForwardNonWordIndex(input, offset) {
    let wordEndIndex = input.length - 1;
    for (let fIndex = offset; fIndex <= input.length; fIndex += 1) {
        if (isNonWordCharacter(input[fIndex])) {
            wordEndIndex = fIndex - 1;
            break;
        }
    }
    return wordEndIndex;
}
function getBackwardNonWordIndex(input, offset) {
    let wordStartIndex = 0;
    for (let bIndex = offset; bIndex >= 0; bIndex -= 1) {
        if (isNonWordCharacter(input[bIndex])) {
            wordStartIndex = bIndex + 1;
            break;
        }
    }
    return wordStartIndex;
}
//# sourceMappingURL=find-source-word.js.map
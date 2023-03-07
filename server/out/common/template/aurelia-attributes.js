"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getBindableNameFromAttritute = exports.getAureliaAttributeKeywordIndex = void 0;
const constants_1 = require("../constants");
/**
 * @example
 *   const input = 'inter-bindable.bind'
 *                                ^
 *   getAureliaAttributeKeywordIndex(input) // 14
 */
function getAureliaAttributeKeywordIndex(input) {
    let index = NaN;
    constants_1.AURELIA_TEMPLATE_ATTRIBUTE_KEYWORD_LIST.find((keyword) => {
        const withDot = `.${keyword}`;
        const match = input.indexOf(withDot);
        if (match >= 0) {
            index = match;
            return true;
        }
        return false;
    });
    return index;
}
exports.getAureliaAttributeKeywordIndex = getAureliaAttributeKeywordIndex;
/**
 * @example
 *   const input = 'inter-bindable.bind'
 *
 *   getBindableNameFromAttritute(input) // inter-bindable
 */
function getBindableNameFromAttritute(input) {
    // Sth like: .(bind|call)$
    const asRegex = new RegExp(`.(${constants_1.AURELIA_TEMPLATE_ATTRIBUTE_KEYWORD_LIST.join('|')})$`);
    const result = input.replace(asRegex, '');
    return result;
}
exports.getBindableNameFromAttritute = getBindableNameFromAttritute;
// getBindableNameFromAttritute('inter-bindable.bind');
//# sourceMappingURL=aurelia-attributes.js.map
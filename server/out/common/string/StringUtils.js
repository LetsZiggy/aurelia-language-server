"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StringUtils = void 0;
class StringUtils {
    static replaceAll(input, searchValue, replaceValue) {
        const searchRegex = new RegExp(`\\b${searchValue}\\b`, 'g');
        const result = input.replace(searchRegex, () => {
            return replaceValue;
        });
        return result;
    }
    static insert(str, index, value) {
        if (str == null)
            return '';
        if (value == null)
            return '';
        const ind = index < 0 ? this.length + index : index;
        return str.substr(0, ind) + value + str.substr(ind);
    }
    static removeQuotes(rawPackageRoot) {
        const withOutQuotes = rawPackageRoot.replace(/['"]/g, '');
        return withOutQuotes;
    }
}
exports.StringUtils = StringUtils;
//# sourceMappingURL=StringUtils.js.map
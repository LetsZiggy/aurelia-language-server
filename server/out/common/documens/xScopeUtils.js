"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.XScopeUtils = void 0;
class XScopeUtils {
    static getScopeByOffset(scopes, offset) {
        if (scopes == null)
            return;
        if (offset == null)
            return;
        const result = scopes.find((scope) => {
            const { start, end } = scope.nameLocation;
            const afterStart = start <= offset;
            const beforeEnd = offset <= end;
            const inBetween = afterStart && beforeEnd;
            return inBetween;
        });
        return result;
    }
}
exports.XScopeUtils = XScopeUtils;
//# sourceMappingURL=xScopeUtils.js.map
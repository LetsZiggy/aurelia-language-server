"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AureliaUtils = void 0;
const kernel_1 = require("@aurelia/kernel");
const constants_1 = require("./constants");
class AureliaUtils {
    static normalizeVariable(varName) {
        return (0, kernel_1.camelCase)(varName);
    }
    static isSameVariableName(name1, name2) {
        if (name1 === undefined)
            return false;
        if (name2 === undefined)
            return false;
        const normalized1 = this.normalizeVariable(name1);
        const normalized2 = this.normalizeVariable(name2);
        const isSame = normalized1 === normalized2;
        return isSame;
    }
    static isAuV1(auVersion) {
        const is = auVersion === constants_1.AureliaVersion.V1;
        return is;
    }
    static isAuV2(auVersion) {
        const is = auVersion === constants_1.AureliaVersion.V1;
        return is;
    }
}
exports.AureliaUtils = AureliaUtils;
//# sourceMappingURL=AureliaUtils.js.map
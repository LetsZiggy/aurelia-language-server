"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OffsetUtils = void 0;
class OffsetUtils {
    static isIncluded(startOffset, endOffset, targetOffset) {
        if (startOffset == null)
            return false;
        if (endOffset == null)
            return false;
        if (targetOffset == null)
            return false;
        const isStart = startOffset <= targetOffset;
        const isEnd = targetOffset <= endOffset;
        const result = isStart && isEnd;
        return result;
    }
}
exports.OffsetUtils = OffsetUtils;
//# sourceMappingURL=OffsetUtils.js.map
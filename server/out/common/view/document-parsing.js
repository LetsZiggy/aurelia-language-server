"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkInsideTag = exports.ParseHtml = void 0;
const parse5_sax_parser_1 = __importDefault(require("parse5-sax-parser"));
const constants_1 = require("../constants");
const OffsetUtils_1 = require("../documens/OffsetUtils");
class ParseHtml {
    static findTagAtOffset(content, offset) {
        const saxStream = new parse5_sax_parser_1.default({ sourceCodeLocationInfo: true });
        let targetStartTag;
        saxStream.on('startTag', (startTag) => {
            var _a;
            const { startOffset, endOffset } = (_a = startTag.sourceCodeLocation) !== null && _a !== void 0 ? _a : {};
            const isAt = OffsetUtils_1.OffsetUtils.isIncluded(startOffset, endOffset, offset);
            if (isAt) {
                targetStartTag = startTag;
            }
            return isAt;
        });
        saxStream.write(content);
        return targetStartTag;
    }
    static findAttributeAtOffset(content, offset, attributeName) {
        var _a;
        const targetTag = this.findTagAtOffset(content, offset);
        const targetAttribute = (_a = targetTag === null || targetTag === void 0 ? void 0 : targetTag.sourceCodeLocation) === null || _a === void 0 ? void 0 : _a.attrs[attributeName];
        if (targetAttribute === undefined)
            return;
        const isStart = targetAttribute.startOffset <= offset;
        const isEnd = offset <= targetAttribute.endOffset;
        const verifiedLocation = isStart && isEnd;
        if (verifiedLocation === false)
            return;
        return targetAttribute;
    }
    static findAttributeValueAtOffset(content, offset) {
        var _a, _b;
        const targetTag = this.findTagAtOffset(content, offset);
        const targetAttributeLocation = Object.entries((_b = (_a = targetTag === null || targetTag === void 0 ? void 0 : targetTag.sourceCodeLocation) === null || _a === void 0 ? void 0 : _a.attrs) !== null && _b !== void 0 ? _b : {}).find(([attributeName, location]) => {
            const attrStart = location.startOffset +
                attributeName.length + // >attr<=""
                2; // ="
            const attrEnd = location.endOffset - 1; // - 1: '"'
            const verifiedLocation = OffsetUtils_1.OffsetUtils.isIncluded(attrStart, attrEnd, offset);
            return verifiedLocation;
        });
        return targetAttributeLocation;
    }
    static findCommentAtOffset(content, offset) {
        const saxStream = new parse5_sax_parser_1.default({ sourceCodeLocationInfo: true });
        let targetComment;
        saxStream.on('comment', (comment) => {
            var _a;
            const { startOffset, endOffset } = (_a = comment.sourceCodeLocation) !== null && _a !== void 0 ? _a : {};
            const isOffsetIncluded = OffsetUtils_1.OffsetUtils.isIncluded(startOffset, endOffset, offset);
            if (isOffsetIncluded) {
                targetComment = comment;
                saxStream.stop();
            }
        });
        saxStream.write(content);
        return targetComment;
    }
    /**
     * Au1: https://aurelia.io/docs/templating/html-behaviors#html-only-custom-elements
     * Au2: https://docs.aurelia.io/getting-to-know-aurelia/introduction/local-templates
     */
    static isHtmlWithRootTemplate(content) {
        const saxStream = new parse5_sax_parser_1.default({ sourceCodeLocationInfo: true });
        let _isHtmlWithRootTemplate = false;
        saxStream.on('startTag', (startTag) => {
            if (startTag.tagName === constants_1.AureliaView.TEMPLATE_TAG_NAME) {
                _isHtmlWithRootTemplate = true;
                saxStream.stop();
            }
        });
        saxStream.write(content);
        return _isHtmlWithRootTemplate;
    }
    static parseHtmlStartTags(content) {
        const saxStream = new parse5_sax_parser_1.default({ sourceCodeLocationInfo: true });
        const allStartTag = [];
        saxStream.on('startTag', (startTag) => {
            allStartTag.push(startTag);
        });
        saxStream.write(content);
        return allStartTag;
    }
}
exports.ParseHtml = ParseHtml;
/**
 *
 */
function checkInsideTag(document, offset) {
    return new Promise((resolve) => {
        const saxStream = new parse5_sax_parser_1.default({ sourceCodeLocationInfo: true });
        saxStream.on('startTag', (startTag) => {
            var _a, _b;
            const startOffset = (_a = startTag.sourceCodeLocation) === null || _a === void 0 ? void 0 : _a.startOffset;
            const endOffset = (_b = startTag.sourceCodeLocation) === null || _b === void 0 ? void 0 : _b.endOffset;
            if (startOffset === undefined)
                return;
            if (endOffset === undefined)
                return;
            const isInsideTag = startOffset <= offset && offset <= endOffset;
            if (isInsideTag) {
                saxStream.stop();
                resolve(true);
            }
            const isTagAfterOffset = offset <= startOffset;
            if (isTagAfterOffset) {
                saxStream.stop();
                resolve(false);
            }
        });
        saxStream.write(document.getText());
        resolve(false);
    });
}
exports.checkInsideTag = checkInsideTag;
//# sourceMappingURL=document-parsing.js.map
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getClassMember = exports.getClass = void 0;
const ts_morph_1 = require("ts-morph");
function getClass(sourceFile, className) {
    if (!sourceFile)
        throw new Error('No Source file');
    const classNode = sourceFile.getClass(className);
    return classNode;
}
exports.getClass = getClass;
/**
 * @example
 *   getClassMember(sourceFile, 'foo')
 */
function getClassMember(classNode, name) {
    var _a;
    (_a = classNode.getFirstDescendantByKind(ts_morph_1.SyntaxKind.Identifier)) === null || _a === void 0 ? void 0 : _a.getText();
    const target = classNode
        .getDescendantsOfKind(ts_morph_1.SyntaxKind.Identifier)
        .find((descendant) => {
        return descendant.getText() === name;
    });
    return target;
}
exports.getClassMember = getClassMember;
//# sourceMappingURL=tsMorphClass.js.map
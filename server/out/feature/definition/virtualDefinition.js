"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getVirtualDefinition = void 0;
const uri_utils_1 = require("../../common/view/uri-utils");
const virtualSourceFile_1 = require("../virtual/virtualSourceFile");
/**
 * 1. Create virtual file
 * 2. with goToSourceWord
 * 3. return definition
 */
function getVirtualDefinition(filePath, aureliaProgram, goToSourceWord) {
    var _a, _b;
    const virtualFileWithContent = (0, virtualSourceFile_1.createVirtualFileWithContent)(aureliaProgram, filePath, goToSourceWord);
    if (virtualFileWithContent === undefined)
        return;
    const { virtualSourcefile, virtualCursorIndex, viewModelFilePath } = virtualFileWithContent;
    const program = aureliaProgram.getProgram();
    if (program === undefined)
        return;
    const virtualCls = (0, virtualSourceFile_1.getVirtualLangagueService)(virtualSourcefile, program);
    const result = virtualCls.getDefinitionAtPosition(uri_utils_1.UriUtils.toSysPath(virtualSourcefile.fileName), virtualCursorIndex);
    if ((result === null || result === void 0 ? void 0 : result.length) === 0)
        return;
    return {
        lineAndCharacter: virtualSourcefile.getLineAndCharacterOfPosition((_b = (_a = result[0].contextSpan) === null || _a === void 0 ? void 0 : _a.start) !== null && _b !== void 0 ? _b : 0),
        viewModelFilePath,
    };
}
exports.getVirtualDefinition = getVirtualDefinition;
//# sourceMappingURL=virtualDefinition.js.map
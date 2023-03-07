"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.extractSelectedTexts = void 0;
const vscode_languageserver_1 = require("vscode-languageserver");
function extractSelectedTexts(getEditorSelectionResponse, allDocuments) {
    const { documentUri, selections } = getEditorSelectionResponse;
    const document = allDocuments.get(documentUri);
    let rawTexts = selections.map((selection) => {
        const range = vscode_languageserver_1.Range.create(selection.start, selection.end);
        const text = document === null || document === void 0 ? void 0 : document.getText(range);
        return text;
    });
    const selectedTexts = rawTexts.filter((text) => text !== undefined);
    return selectedTexts;
}
exports.extractSelectedTexts = extractSelectedTexts;
//# sourceMappingURL=selections.js.map
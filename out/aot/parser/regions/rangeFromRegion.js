"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getStartTagNameRange = exports.getRangeFromLocation = exports.getRangeFromRegion = exports.getRangeFromDocumentOffsets = exports.getRangesForAccessScopeFromRegionByName = void 0;
const vscode_languageserver_1 = require("vscode-languageserver");
const TextDocumentUtils_1 = require("../../../common/documens/TextDocumentUtils");
const ViewRegions_1 = require("./ViewRegions");
function getRangesForAccessScopeFromRegionByName(document, region, targetName) {
    var _a;
    const targetAccessScopes = (_a = region.accessScopes) === null || _a === void 0 ? void 0 : _a.filter((scope) => scope.name === targetName);
    const viewDocument = TextDocumentUtils_1.TextDocumentUtils.createHtmlFromUri(document);
    const resultRanges = targetAccessScopes === null || targetAccessScopes === void 0 ? void 0 : targetAccessScopes.map((scope) => {
        const { start, end } = scope.nameLocation;
        const startPosition = viewDocument.positionAt(start);
        const endPosition = viewDocument.positionAt(end);
        const range = vscode_languageserver_1.Range.create(startPosition, endPosition);
        return range;
    });
    return resultRanges;
}
exports.getRangesForAccessScopeFromRegionByName = getRangesForAccessScopeFromRegionByName;
function getRangeFromDocumentOffsets(document, startOffset, endOffset) {
    if (startOffset === undefined)
        return;
    if (endOffset === undefined)
        return;
    const startPosition = document.positionAt(startOffset);
    const endPosition = document.positionAt(endOffset - 1);
    const range = vscode_languageserver_1.Range.create(startPosition, endPosition);
    return range;
}
exports.getRangeFromDocumentOffsets = getRangeFromDocumentOffsets;
function getRangeFromRegion(region, document) {
    let range;
    if (document) {
        range = getRangeFromRegionViaDocument(region, document);
    }
    else {
        range = getRangeFromStandardRegion(region);
    }
    return range;
}
exports.getRangeFromRegion = getRangeFromRegion;
function getRangeFromRegionViaDocument(region, document) {
    if (region.sourceCodeLocation === undefined)
        return;
    const { sourceCodeLocation } = region;
    const { startOffset } = sourceCodeLocation;
    const { endOffset } = sourceCodeLocation;
    let range;
    if (ViewRegions_1.RepeatForRegion.is(region)) {
        range = getRangeFromRepeatForRegion(region, document);
    }
    else {
        range = getRangeFromDocumentOffsets(document, startOffset, endOffset);
    }
    return range;
}
function getRangeFromStandardRegion(region) {
    if (region.sourceCodeLocation === undefined)
        return;
    const { sourceCodeLocation } = region;
    const { startCol } = sourceCodeLocation;
    const { startLine } = sourceCodeLocation;
    const { endCol } = sourceCodeLocation;
    const { endLine } = sourceCodeLocation;
    const startPosition = vscode_languageserver_1.Position.create(startLine, startCol);
    const endPosition = vscode_languageserver_1.Position.create(endLine, endCol);
    const range = vscode_languageserver_1.Range.create(startPosition, endPosition);
    return range;
}
function getRangeFromRepeatForRegion(repeatForRegion, document) {
    if (repeatForRegion.data === undefined)
        return;
    const range = getRangeFromDocumentOffsets(document, repeatForRegion.data.iterableStartOffset, repeatForRegion.data.iterableEndOffset - 1);
    return range;
}
function getRangeFromLocation(location) {
    const textSpan = location.getTextSpan();
    const locationSourceFile = location.getSourceFile();
    const startLocation = locationSourceFile.getLineAndColumnAtPos(textSpan.getStart());
    const startPosition = vscode_languageserver_1.Position.create(startLocation.line - 1, startLocation.column - 1);
    const endLocation = locationSourceFile.getLineAndColumnAtPos(textSpan.getEnd());
    const endPosition = vscode_languageserver_1.Position.create(endLocation.line - 1, endLocation.column - 1);
    const range = vscode_languageserver_1.Range.create(startPosition, endPosition);
    return range;
}
exports.getRangeFromLocation = getRangeFromLocation;
function getStartTagNameRange(region, document) {
    if (region.sourceCodeLocation === undefined)
        return;
    const { sourceCodeLocation } = region;
    const { startOffset } = sourceCodeLocation;
    const { tagName } = region;
    const endOffset = startOffset + tagName.length + 1; // + 1, magic, because of all the offsetting we have to fix;
    const range = getRangeFromDocumentOffsets(document, startOffset, endOffset);
    return range;
}
exports.getStartTagNameRange = getStartTagNameRange;
// function getRangeFromScopeLocaton(
//   start: SourceCodeLocation,
//   end: SourceCodeLocation
// ) {
//   const startPosition = Position.create(startLine, startCol);
//   const endPosition = Position.create(endLine, endCol);
//   const range = Range.create(startPosition, endPosition);
// }
//# sourceMappingURL=rangeFromRegion.js.map
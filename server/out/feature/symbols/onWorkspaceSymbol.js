"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.onWorkspaceSymbol = void 0;
const vscode_languageserver_protocol_1 = require("vscode-languageserver-protocol");
const vscode_languageserver_types_1 = require("vscode-languageserver-types");
const uri_utils_1 = require("../../common/view/uri-utils");
const AureliaProjects_1 = require("../../core/AureliaProjects");
const onDocumentSymbol_1 = require("./onDocumentSymbol");
// export function onWorkspaceSymbol(container: Container, query: string) {
function onWorkspaceSymbol(container) {
    const finalWorkspaceSymbols = [];
    const aureliaProjects = container.get(AureliaProjects_1.AureliaProjects);
    aureliaProjects.getAll().forEach((aureliaProject) => {
        var _a;
        (_a = aureliaProject.aureliaProgram) === null || _a === void 0 ? void 0 : _a.aureliaComponents.getAll().forEach((component) => {
            var _a;
            (_a = component.viewRegions) === null || _a === void 0 ? void 0 : _a.forEach((region) => {
                if (component.viewFilePath === undefined)
                    return;
                const viewUri = uri_utils_1.UriUtils.toVscodeUri(component.viewFilePath);
                const symbol = createWorkspaceSymbol(viewUri, region);
                if (!symbol)
                    return;
                finalWorkspaceSymbols.push(symbol);
            });
        });
    });
    return finalWorkspaceSymbols;
}
exports.onWorkspaceSymbol = onWorkspaceSymbol;
function createWorkspaceSymbol(uri, region) {
    const converted = (0, onDocumentSymbol_1.convertToSymbolName)(region);
    if (!converted)
        return;
    const symbolName = `Au: ${converted.value}`;
    const start = {
        line: region.sourceCodeLocation.startLine,
        character: region.sourceCodeLocation.startCol,
    };
    const end = {
        line: region.sourceCodeLocation.endLine,
        character: region.sourceCodeLocation.endCol,
    };
    const range = vscode_languageserver_protocol_1.Range.create(start, end);
    const symbolInformation = vscode_languageserver_types_1.SymbolInformation.create(symbolName, converted.icon, range, uri);
    return symbolInformation;
}
//# sourceMappingURL=onWorkspaceSymbol.js.map
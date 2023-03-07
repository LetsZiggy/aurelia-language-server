"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.onDefintion = void 0;
const url_1 = require("url");
const vscode_html_languageservice_1 = require("vscode-html-languageservice");
const vscode_languageserver_1 = require("vscode-languageserver");
const RegionParser_1 = require("../../aot/parser/regions/RegionParser");
const TextDocumentUtils_1 = require("../../common/documens/TextDocumentUtils");
const RegionService_1 = require("../../common/services/RegionService");
const document_parsing_1 = require("../../common/view/document-parsing");
const DocumentSettings_1 = require("../../configuration/DocumentSettings");
const AureliaProjects_1 = require("../../core/AureliaProjects");
const aureliaDefintion_1 = require("./aureliaDefintion");
function onDefintion(document, position, container) {
    var _a, _b;
    return __awaiter(this, void 0, void 0, function* () {
        const aureliaProjects = container.get(AureliaProjects_1.AureliaProjects);
        const targetProject = aureliaProjects.getFromUri(document.uri);
        if (!targetProject)
            return;
        const aureliaProgram = targetProject === null || targetProject === void 0 ? void 0 : targetProject.aureliaProgram;
        if (!aureliaProgram)
            return;
        const targetComponent = aureliaProgram.aureliaComponents.getOneByFromDocument(document);
        const documentSettings = container.get(DocumentSettings_1.DocumentSettings);
        const isViewModel = (0, TextDocumentUtils_1.isViewModelDocument)(document, documentSettings);
        if (isViewModel) {
            const defintion = yield (0, aureliaDefintion_1.aureliaDefinitionFromViewModel)(container, document, position);
            return defintion;
        }
        let regions = [];
        if (targetComponent) {
            regions = targetComponent === null || targetComponent === void 0 ? void 0 : targetComponent.viewRegions;
        }
        else {
            // Quickfix for Html-only Custom Elements
            if (!document_parsing_1.ParseHtml.isHtmlWithRootTemplate(document.getText()))
                return;
            regions = RegionParser_1.RegionParser.parse(document, aureliaProgram.aureliaComponents.getAll());
        }
        if (regions.length === 0)
            return;
        const offset = document.offsetAt(position);
        const region = RegionService_1.RegionService.findRegionAtOffset(regions, offset);
        if (region === undefined)
            return;
        const doDefinition = region.languageService.doDefinition;
        if (doDefinition) {
            const definition = yield doDefinition(aureliaProgram, document, position, region);
            if (!definition)
                return;
            const { line, character } = definition.lineAndCharacter;
            const targetPath = (_b = (_a = definition.viewFilePath) !== null && _a !== void 0 ? _a : definition.viewModelFilePath) !== null && _b !== void 0 ? _b : '';
            const range = vscode_languageserver_1.Range.create(vscode_html_languageservice_1.Position.create(line - 1, character), vscode_html_languageservice_1.Position.create(line, character));
            return [
                vscode_languageserver_1.LocationLink.create((0, url_1.pathToFileURL)(targetPath).toString(), range, range),
            ];
        }
    });
}
exports.onDefintion = onDefintion;
//# sourceMappingURL=onDefinitions.js.map
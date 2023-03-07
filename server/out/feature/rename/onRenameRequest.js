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
exports.onRenameRequest = void 0;
const vscode_languageserver_1 = require("vscode-languageserver");
const ViewRegions_1 = require("../../aot/parser/regions/ViewRegions");
const find_source_word_1 = require("../../common/documens/find-source-word");
const TextDocumentUtils_1 = require("../../common/documens/TextDocumentUtils");
const RegionService_1 = require("../../common/services/RegionService");
const DocumentSettings_1 = require("../../configuration/DocumentSettings");
const AureliaProjects_1 = require("../../core/AureliaProjects");
const aureliaRename_1 = require("./aureliaRename");
function onRenameRequest(document, position, newName, container) {
    return __awaiter(this, void 0, void 0, function* () {
        const documentSettings = container.get(DocumentSettings_1.DocumentSettings);
        const isViewModel = (0, TextDocumentUtils_1.isViewModelDocument)(document, documentSettings);
        if (isViewModel) {
            const renamed = (0, aureliaRename_1.aureliaRenameFromViewModel)(container, documentSettings, document, position, newName);
            return renamed;
        }
        const aureliaProjects = container.get(AureliaProjects_1.AureliaProjects);
        const targetProject = aureliaProjects.getFromUri(document.uri);
        if (!targetProject)
            return;
        const aureliaProgram = targetProject === null || targetProject === void 0 ? void 0 : targetProject.aureliaProgram;
        if (!aureliaProgram)
            return;
        const targetComponent = aureliaProgram.aureliaComponents.getOneByFromDocument(document);
        const regions = targetComponent === null || targetComponent === void 0 ? void 0 : targetComponent.viewRegions;
        if (!regions)
            return;
        const offset = document.offsetAt(position);
        const region = RegionService_1.RegionService.findRegionAtOffset(regions, offset);
        if (ViewRegions_1.CustomElementRegion.is(region)) {
            const isInCustomElementStartTag = RegionService_1.RegionService.isInCustomElementStartTag(region, offset);
            if (isInCustomElementStartTag === false) {
                return normalRename(position, document, newName);
            }
        }
        if (region == null) {
            return;
        }
        // @ts-ignore TODO: implement rename for CustomElement
        const doRename = region.languageService.doRename;
        if (doRename) {
            const renamed = yield doRename(container, aureliaProgram, document, position, newName, region);
            // renamed; /* ? */
            return renamed;
        }
    });
}
exports.onRenameRequest = onRenameRequest;
function normalRename(position, document, newName) {
    const offset = document.offsetAt(position);
    const { startOffset, endOffset } = (0, find_source_word_1.getWordInfoAtOffset)(document.getText(), offset);
    const startPosition = document.positionAt(startOffset);
    const endPosition = document.positionAt(endOffset + 1); // TODO: remove +1 (has to do with index 0 vs 1)
    const range = vscode_languageserver_1.Range.create(startPosition, endPosition);
    return {
        changes: {
            [document.uri]: [vscode_languageserver_1.TextEdit.replace(range, newName)],
        },
        // documentChanges: [
        //   TextDocumentEdit.create(
        //     { version: document.version + 1, uri: document.uri },
        //     [TextEdit.replace(range, newName)]
        //   ),
        // ],
    };
}
//# sourceMappingURL=onRenameRequest.js.map
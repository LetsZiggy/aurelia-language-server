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
exports.onCodeAction = void 0;
const AureliaHtmlLanguageService_1 = require("../../aot/parser/regions/languageServer/AureliaHtmlLanguageService");
const TextDocumentUtils_1 = require("../../common/documens/TextDocumentUtils");
const RegionService_1 = require("../../common/services/RegionService");
const uri_utils_1 = require("../../common/view/uri-utils");
const AureliaProjects_1 = require("../../core/AureliaProjects");
function onCodeAction(container, { textDocument, range }, allDocuments) {
    return __awaiter(this, void 0, void 0, function* () {
        // We need some kind of code action map
        // Since, eg. the aHref tag should only trigger "rename to import tag" code action
        const aureliaProjects = container.get(AureliaProjects_1.AureliaProjects);
        const targetProject = aureliaProjects.getFromUri(textDocument.uri);
        if (!targetProject)
            return [];
        const aureliaProgram = targetProject === null || targetProject === void 0 ? void 0 : targetProject.aureliaProgram;
        if (!aureliaProgram)
            return [];
        const targetComponent = aureliaProgram.aureliaComponents.getOneBy('viewFilePath', uri_utils_1.UriUtils.toSysPath(textDocument.uri));
        const regions = targetComponent === null || targetComponent === void 0 ? void 0 : targetComponent.viewRegions;
        if (!regions)
            return [];
        const region = RegionService_1.RegionService.findRegionAtPosition(regions, range.start);
        let languageService;
        if (region === undefined) {
            languageService = new AureliaHtmlLanguageService_1.AureliaHtmlLanguageService();
        }
        else {
            languageService = region.languageService;
        }
        const doCodeAction = languageService.doCodeAction;
        if (doCodeAction) {
            const document = TextDocumentUtils_1.TextDocumentUtils.createHtmlFromUri(textDocument, allDocuments);
            const codeAction = yield doCodeAction(aureliaProgram, document, range.start, region);
            return codeAction;
        }
    });
}
exports.onCodeAction = onCodeAction;
//# sourceMappingURL=onCodeAction.js.map
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
exports.onCompletion = void 0;
const vscode_html_languageservice_1 = require("vscode-html-languageservice");
const vscode_languageserver_1 = require("vscode-languageserver");
const AureliaHtmlLanguageService_1 = require("../../aot/parser/regions/languageServer/AureliaHtmlLanguageService");
const RegionParser_1 = require("../../aot/parser/regions/RegionParser");
const ViewRegions_1 = require("../../aot/parser/regions/ViewRegions");
const constants_1 = require("../../common/constants");
const logger_1 = require("../../common/logging/logger");
const RegionService_1 = require("../../common/services/RegionService");
const document_parsing_1 = require("../../common/view/document-parsing");
const AureliaProjects_1 = require("../../core/AureliaProjects");
const createAureliaTemplateAttributeCompletions_1 = require("./createAureliaTemplateAttributeCompletions");
const logger = new logger_1.Logger('onCompletions');
function onCompletion(container, completionParams, document) {
    var _a, _b, _c, _d;
    return __awaiter(this, void 0, void 0, function* () {
        const { position } = completionParams;
        const offset = document.offsetAt(position);
        const text = document.getText();
        // Stop if inside comment
        const isInsideComment = document_parsing_1.ParseHtml.findCommentAtOffset(text, offset);
        if (isInsideComment != null)
            return [];
        const aureliaProjects = container.get(AureliaProjects_1.AureliaProjects);
        const targetProject = aureliaProjects.getFromUri(document.uri);
        if (!targetProject)
            return [];
        const aureliaProgram = targetProject === null || targetProject === void 0 ? void 0 : targetProject.aureliaProgram;
        if (!aureliaProgram)
            return [];
        const triggerCharacter = (_b = (_a = completionParams.context) === null || _a === void 0 ? void 0 : _a.triggerCharacter) !== null && _b !== void 0 ? _b : text.substring(offset - 1, offset);
        // Check if we are inside a region
        // Because, then we have to ignore the triggerCharacter.
        // We ignore, to allow the parser to have a valid state.
        // At least we want to maximize the chance, that given state is valid (for the parser).
        const targetComponent = aureliaProgram.aureliaComponents.getOneByFromDocument(document);
        const existingRegions = (_c = targetComponent === null || targetComponent === void 0 ? void 0 : targetComponent.viewRegions) !== null && _c !== void 0 ? _c : [];
        const existingRegion = RegionService_1.RegionService.findRegionAtOffset(existingRegions, offset);
        let regions = [];
        let isInsertTriggerCharacter = false;
        const wasInvoked = ((_d = completionParams.context) === null || _d === void 0 ? void 0 : _d.triggerKind) === vscode_languageserver_1.CompletionTriggerKind.Invoked;
        const shouldInsertTriggerCharacter = existingRegion != null && !wasInvoked;
        // shouldInsertTriggerCharacter; /*?*/
        if (shouldInsertTriggerCharacter) {
            // replace trigger character
            // regions = existingRegions;
            isInsertTriggerCharacter = true;
        }
        else {
        }
        // re parse
        const allComponents = aureliaProgram.aureliaComponents.getAll();
        try {
            regions = RegionParser_1.RegionParser.parse(document, allComponents);
            // regions = existingRegions;
        }
        catch (error) {
            error; /* ? */
            // /* prettier-ignore */ console.log('TCL: error', error);
            // /* prettier-ignore */ console.log('TCL: (error as Error).stack', (error as Error).stack);
        }
        // regions; /* ? */
        // offset; /*?*/
        const region = RegionService_1.RegionService.findRegionAtOffset(regions, offset);
        //  region/*?*/
        let accumulateCompletions = [];
        const isAcceptableRegion = region === undefined || ViewRegions_1.CustomElementRegion.is(region);
        if (triggerCharacter === constants_1.TemplateAttributeTriggers.DOT) {
            const isInsideTag = yield (0, document_parsing_1.checkInsideTag)(document, offset);
            const allowKeywordCompletion = (isAcceptableRegion || ViewRegions_1.BindableAttributeRegion.is(region)) && isInsideTag;
            if (allowKeywordCompletion) {
                const nextChar = text.substring(offset, offset + 1);
                const atakCompletions = (0, createAureliaTemplateAttributeCompletions_1.createAureliaTemplateAttributeKeywordCompletions)(nextChar);
                return atakCompletions;
            }
        }
        const isNotRegion = region === undefined;
        const isInsideTag = yield (0, document_parsing_1.checkInsideTag)(document, offset);
        // Attribute completions
        if (isInsideTag) {
            const ataCompletions = (0, createAureliaTemplateAttributeCompletions_1.createAureliaTemplateAttributeCompletions)();
            const htmlLanguageService = (0, vscode_html_languageservice_1.getLanguageService)();
            const htmlDocument = htmlLanguageService.parseHTMLDocument(document);
            const htmlLSResult = htmlLanguageService.doComplete(document, position, htmlDocument);
            const isInsideAttributeValue = document_parsing_1.ParseHtml.findAttributeValueAtOffset(document.getText(), offset);
            const completionsWithStandardHtml = [...htmlLSResult.items];
            // Inside eg. attr=">here<", then don't push Aurelia completions
            if (!isInsideAttributeValue) {
                completionsWithStandardHtml.push(...ataCompletions);
            }
            // Early return to get some HTML completions + generic Aurelia completions
            if (isNotRegion) {
                return completionsWithStandardHtml;
            }
            // HTML + Generic Aurelia completions for eg. Custom Element and Bindable Attributes
            if (isAcceptableRegion) {
                accumulateCompletions = completionsWithStandardHtml;
            }
        }
        // Completions, that need Language service
        let languageService;
        if (region === undefined) {
            languageService = new AureliaHtmlLanguageService_1.AureliaHtmlLanguageService();
        }
        else {
            languageService = region.languageService;
        }
        // document.getText(); /* ? */
        // triggerCharacter; /* ? */
        // offset; /* ? */
        region; /* ? */
        const doComplete = languageService.doComplete;
        if (doComplete === undefined)
            return [];
        let completions = [vscode_languageserver_1.CompletionItem.create('')];
        try {
            completions = (yield doComplete(aureliaProgram, document, triggerCharacter, region, offset, isInsertTriggerCharacter, completionParams));
            // completions /* ? */
        }
        catch (error) {
            console.log('TCL: error', error);
            /* prettier-ignore */ console.log('TCL: (error as Error).stack', error.stack);
        }
        accumulateCompletions.push(...completions);
        return accumulateCompletions;
    });
}
exports.onCompletion = onCompletion;
//# sourceMappingURL=onCompletions.js.map
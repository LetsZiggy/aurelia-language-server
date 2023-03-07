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
exports.updateTsMorphProjectWithEditingFiles = exports.aureliaDefinitionFromViewModel = void 0;
const url_1 = require("url");
const ts_morph_1 = require("ts-morph");
const vscode_languageserver_1 = require("vscode-languageserver");
const findSpecificRegion_1 = require("../../aot/parser/regions/findSpecificRegion");
const ViewRegions_1 = require("../../aot/parser/regions/ViewRegions");
const AureliaUtils_1 = require("../../common/AureliaUtils");
const find_source_word_1 = require("../../common/documens/find-source-word");
const PositionUtils_1 = require("../../common/documens/PositionUtils");
const related_1 = require("../../common/documens/related");
const TextDocumentUtils_1 = require("../../common/documens/TextDocumentUtils");
const uri_utils_1 = require("../../common/view/uri-utils");
const DocumentSettings_1 = require("../../configuration/DocumentSettings");
const AureliaProjects_1 = require("../../core/AureliaProjects");
/**
 * 1. Only allow for Class or Bindable
 * 2. For Bindable, check if source or reference
 * 3. Find references in own and other Views
 */
function aureliaDefinitionFromViewModel(container, document, position) {
    var _a, _b, _c, _d;
    return __awaiter(this, void 0, void 0, function* () {
        const offset = document.offsetAt(position);
        const viewModelPath = uri_utils_1.UriUtils.toSysPath(document.uri);
        const targetProject = container
            .get(AureliaProjects_1.AureliaProjects)
            .getFromPath(viewModelPath);
        if (!targetProject)
            return;
        const { aureliaProgram } = targetProject;
        if (!aureliaProgram)
            return;
        const tsMorphProject = aureliaProgram.tsMorphProject.get();
        const sourceWord = (0, find_source_word_1.getWordAtOffset)(document.getText(), offset);
        const targetComponent = (_a = aureliaProgram.aureliaComponents.getOneBy('className', sourceWord)) !== null && _a !== void 0 ? _a : aureliaProgram.aureliaComponents.getOneBy('viewModelFilePath', viewModelPath);
        // 1. Only for Class and Bindables
        const isIdentifier = getIsIdentifier(tsMorphProject, viewModelPath, offset);
        if (!isIdentifier)
            return;
        // 1.1 Update TsMorphProject with editingFiles
        updateTsMorphProjectWithEditingFiles(container, tsMorphProject);
        const regularDefintions = (_b = findRegularTypescriptDefinitions(tsMorphProject, viewModelPath, offset)) !== null && _b !== void 0 ? _b : [];
        const sourceDefinition = getSourceDefinition(regularDefintions, viewModelPath, position);
        const finalDefinitions = [];
        /** Not source, so default */
        if (!sourceDefinition)
            return;
        // Note, we need to handle references (instead of just letting it be the job of the TS Server),
        // because as long as we only return one valid defintion, the "default" suggestions are not returned
        // to the client anymore.
        // I made sure to test this out throughly by just returning one definition (any defintion data), then
        // check the client (ie. trigger suggestion inside a .ts file in VSCode).
        /** Source, so push references */
        const regularReferences = (_c = findRegularTypescriptReferences(aureliaProgram, viewModelPath, offset)) !== null && _c !== void 0 ? _c : [];
        // We filter out the definition source, else it would be duplicated
        const withoutTriggerDefinition = filterOutTriggerDefinition(regularReferences, sourceDefinition);
        finalDefinitions.push(...withoutTriggerDefinition);
        const targetMember = (_d = targetComponent === null || targetComponent === void 0 ? void 0 : targetComponent.classMembers) === null || _d === void 0 ? void 0 : _d.find((member) => member.name === sourceWord);
        // Class Member
        if (targetMember) {
            const viewRegionDefinitions_ClassMembers = yield getAureliaClassMemberDefinitions_SameView(container, aureliaProgram, document, sourceWord);
            finalDefinitions.push(...viewRegionDefinitions_ClassMembers);
            // Bindable
            const isBindable = targetMember.isBindable;
            if (isBindable) {
                const viewRegionDefinitions_Bindables = yield getAureliaClassMemberDefinitions_OtherViewBindables(aureliaProgram, sourceWord);
                finalDefinitions.push(...viewRegionDefinitions_Bindables);
            }
        }
        // Class
        else if (targetComponent) {
            const viewRegionDefinitions_Class = yield getAureliaCustomElementDefinitions_OtherViews(aureliaProgram, targetComponent);
            finalDefinitions.push(...viewRegionDefinitions_Class);
        }
        return finalDefinitions;
    });
}
exports.aureliaDefinitionFromViewModel = aureliaDefinitionFromViewModel;
function getAureliaCustomElementDefinitions_OtherViews(aureliaProgram, targetComponent) {
    return __awaiter(this, void 0, void 0, function* () {
        const viewRegionDefinitions_Class = [];
        yield (0, findSpecificRegion_1.forEachRegionOfType)(aureliaProgram, ViewRegions_1.ViewRegionType.CustomElement, (region, document) => {
            if (region.tagName !== (targetComponent === null || targetComponent === void 0 ? void 0 : targetComponent.componentName))
                return;
            if (region.subType === ViewRegions_1.ViewRegionSubType.EndTag)
                return;
            const locationLink = createLocationLinkFromRegion(region, document);
            if (!locationLink)
                return;
            viewRegionDefinitions_Class.push(locationLink);
        });
        return viewRegionDefinitions_Class;
    });
}
function getAureliaClassMemberDefinitions_SameView(container, aureliaProgram, document, sourceWord) {
    var _a;
    return __awaiter(this, void 0, void 0, function* () {
        const documentSettings = container.get(DocumentSettings_1.DocumentSettings);
        const viewExtensions = (_a = documentSettings.getSettings().relatedFiles) === null || _a === void 0 ? void 0 : _a.view;
        if (!viewExtensions)
            return [];
        const viewPath = (0, related_1.getRelatedFilePath)(uri_utils_1.UriUtils.toSysPath(document.uri), viewExtensions);
        const viewDocument = TextDocumentUtils_1.TextDocumentUtils.createHtmlFromPath(viewPath);
        if (!viewDocument)
            return [];
        const viewRegionDefinitions_ClassMembers = [];
        const regions = yield (0, findSpecificRegion_1.findRegionsByWord)(aureliaProgram, viewDocument, sourceWord);
        for (const region of regions) {
            const locationLink = createLocationLinkFromRegion(region, viewDocument);
            if (!locationLink)
                continue;
            viewRegionDefinitions_ClassMembers.push(locationLink);
        }
        return viewRegionDefinitions_ClassMembers;
    });
}
function getAureliaClassMemberDefinitions_OtherViewBindables(aureliaProgram, sourceWord) {
    return __awaiter(this, void 0, void 0, function* () {
        const viewRegionDefinitions_Bindables = [];
        yield (0, findSpecificRegion_1.forEachRegionOfType)(aureliaProgram, ViewRegions_1.ViewRegionType.CustomElement, (region, document) => {
            var _a;
            (_a = region.data) === null || _a === void 0 ? void 0 : _a.forEach((subRegion) => {
                if (subRegion.type !== ViewRegions_1.ViewRegionType.BindableAttribute)
                    return;
                if (!AureliaUtils_1.AureliaUtils.isSameVariableName(subRegion.regionValue, sourceWord))
                    return;
                const locationLink = createLocationLinkFromRegion(subRegion, document);
                if (!locationLink)
                    return;
                viewRegionDefinitions_Bindables.push(locationLink);
            });
        });
        return viewRegionDefinitions_Bindables;
    });
}
function findRegularTypescriptDefinitions(tsMorphProject, viewModelPath, offset) {
    const finalDefinitions = [];
    const sourceFile = tsMorphProject.getSourceFile(viewModelPath);
    if (!sourceFile)
        return;
    const sourceDefinitions = tsMorphProject
        .getLanguageService()
        .getDefinitionsAtPosition(sourceFile, offset);
    sourceDefinitions.forEach((definition) => {
        const locationLink = createLocationLinkFromDocumentSpan(definition);
        finalDefinitions.push(locationLink);
    });
    return finalDefinitions;
}
function findRegularTypescriptReferences(aureliaProgram, viewModelPath, offset) {
    const finalReferences = [];
    const tsMorphProject = aureliaProgram.tsMorphProject.get();
    const sourceFile = tsMorphProject.getSourceFile(viewModelPath);
    if (!sourceFile)
        return;
    const references = tsMorphProject
        .getLanguageService()
        .findReferencesAtPosition(sourceFile, offset);
    references.forEach((reference) => {
        reference.getReferences().forEach((subReference) => {
            const locationLink = createLocationLinkFromDocumentSpan(subReference);
            finalReferences.push(locationLink);
        });
    });
    return finalReferences;
}
function createLocationLinkFromDocumentSpan(documentSpan) {
    const refNode = documentSpan.getNode();
    const startLine = refNode.getStartLineNumber() - 1;
    const startOffset = refNode.getStart() - 1;
    const startPos = refNode.getStartLinePos() - 1;
    const startCol = startOffset - startPos;
    const endLine = refNode.getEndLineNumber() - 1;
    const endOffset = refNode.getEnd() - 1;
    const endPos = refNode.getStartLinePos() - 1;
    const endCol = endOffset - endPos;
    const range = vscode_languageserver_1.Range.create(vscode_languageserver_1.Position.create(startLine, startCol), vscode_languageserver_1.Position.create(endLine, endCol));
    const path = documentSpan.getSourceFile().getFilePath();
    const locationLink = vscode_languageserver_1.LocationLink.create((0, url_1.pathToFileURL)(path).toString(), range, range);
    return locationLink;
}
function createLocationLinkFromRegion(region, document) {
    if (region.sourceCodeLocation === undefined)
        return;
    const { startLine, startCol, endLine, endCol } = region.sourceCodeLocation;
    const range = vscode_languageserver_1.Range.create(vscode_languageserver_1.Position.create(startLine, startCol), vscode_languageserver_1.Position.create(endLine, endCol));
    const locationLink = vscode_languageserver_1.LocationLink.create(document.uri.toString(), range, range);
    return locationLink;
}
/**
 * Given a position, check if the defintion is the source.
 * (If not source, then it would be a reference.)
 */
function getSourceDefinition(definitions, viewModelPath, position) {
    const targetDefinition = definitions.find((definition) => {
        const { start, end } = definition.targetRange;
        const isIncludedPosition = PositionUtils_1.PositionUtils.isIncluded(start, end, position);
        const isSamePath = uri_utils_1.UriUtils.toSysPath(definition.targetUri) ===
            uri_utils_1.UriUtils.toSysPath(viewModelPath);
        const isSourceDefinition = isIncludedPosition && isSamePath;
        return isSourceDefinition;
    });
    return targetDefinition;
}
function getIsIdentifier(tsMorphProject, viewModelPath, offset) {
    const sourceFile = tsMorphProject.getSourceFile(viewModelPath);
    const descandant = sourceFile === null || sourceFile === void 0 ? void 0 : sourceFile.getDescendantAtPos(offset);
    const is = (descandant === null || descandant === void 0 ? void 0 : descandant.getKind()) === ts_morph_1.SyntaxKind.Identifier;
    return is;
}
function filterOutTriggerDefinition(regularReferences, sourceDefinition) {
    const withoutTriggerDefinition = regularReferences.filter((reference) => {
        const referenceIsInSameUri = reference.targetUri === sourceDefinition.targetUri;
        if (!referenceIsInSameUri)
            return true;
        const { targetRange, targetSelectionRange } = reference;
        const sameRange = isSameRange(targetRange, sourceDefinition.targetRange);
        const sameSelectionRange = isSameRange(targetSelectionRange, sourceDefinition.targetSelectionRange);
        const same = sameRange && sameSelectionRange;
        return !same;
    });
    return withoutTriggerDefinition;
}
function isSameRange(rangeA, rangeB) {
    const sameStartChar = rangeA.start.character === rangeB.start.character;
    const sameStartLine = rangeA.start.line === rangeB.start.line;
    const sameEndChar = rangeA.end.character === rangeB.end.character;
    const sameEndLine = rangeA.end.line === rangeB.end.line;
    const same = sameStartChar && sameStartLine && sameEndChar && sameEndLine;
    return same;
}
function updateTsMorphProjectWithEditingFiles(container, tsMorphProject) {
    return;
}
exports.updateTsMorphProjectWithEditingFiles = updateTsMorphProjectWithEditingFiles;
//# sourceMappingURL=aureliaDefintion.js.map
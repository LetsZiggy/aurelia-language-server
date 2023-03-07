"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.renameAllOtherRegionsInSameView = exports.getViewModelPathFromTagName = exports.performViewModelChanges = exports.getAllChangesForOtherViews = void 0;
const fs = __importStar(require("fs"));
const path_1 = __importDefault(require("path"));
const common_1 = require("@ts-morph/common");
const lodash_1 = require("lodash");
const vscode_languageserver_1 = require("vscode-languageserver");
const vscode_languageserver_textdocument_1 = require("vscode-languageserver-textdocument");
const findSpecificRegion_1 = require("../../aot/parser/regions/findSpecificRegion");
const rangeFromRegion_1 = require("../../aot/parser/regions/rangeFromRegion");
const ViewRegions_1 = require("../../aot/parser/regions/ViewRegions");
const tsMorphClass_1 = require("../../aot/tsMorph/tsMorphClass");
const constants_1 = require("../../common/constants");
const logger_1 = require("../../common/logging/logger");
const uri_utils_1 = require("../../common/view/uri-utils");
const aureliaDefintion_1 = require("../definition/aureliaDefintion");
const logger = new logger_1.Logger('workspaceEdits');
function getAllChangesForOtherViews(aureliaProgram, viewModelPath, sourceWord, newName) {
    var _a;
    return __awaiter(this, void 0, void 0, function* () {
        const result = {};
        const targetComponent = aureliaProgram.aureliaComponents.getOneBy('viewModelFilePath', viewModelPath);
        const className = (_a = targetComponent === null || targetComponent === void 0 ? void 0 : targetComponent.className) !== null && _a !== void 0 ? _a : '';
        // 2.1 Find rename locations - Custom element tag
        const isCustomElement = className === sourceWord;
        if (isCustomElement) {
            yield (0, findSpecificRegion_1.forEachRegionOfType)(aureliaProgram, ViewRegions_1.ViewRegionType.CustomElement, (region, document) => {
                if (region.tagName !== (targetComponent === null || targetComponent === void 0 ? void 0 : targetComponent.componentName))
                    return;
                if (result[document.uri] === undefined) {
                    result[document.uri] = [];
                }
                if (region.subType === ViewRegions_1.ViewRegionSubType.StartTag) {
                    // From Start tag sub region, just get location info of tag name
                    // (we account (multi-lined) attributes as well)
                    const range = (0, rangeFromRegion_1.getStartTagNameRange)(region, document);
                    if (!range)
                        return;
                    result[document.uri].push(vscode_languageserver_1.TextEdit.replace(range, newName));
                    return;
                }
                const range = (0, rangeFromRegion_1.getRangeFromRegion)(region);
                if (!range)
                    return;
                result[document.uri].push(vscode_languageserver_1.TextEdit.replace(range, newName));
            });
            return result;
        }
        // 2.2 Find rename locations - Bindable attributes
        const bindableRegions = yield (0, findSpecificRegion_1.findAllBindableAttributeRegions)(aureliaProgram, sourceWord);
        Object.entries(bindableRegions).forEach(([uri, regions]) => {
            regions.forEach((region) => {
                const range = (0, rangeFromRegion_1.getRangeFromRegion)(region);
                if (!range)
                    return;
                if (result[uri] === undefined)
                    result[uri] = [];
                result[uri].push(vscode_languageserver_1.TextEdit.replace(range, (0, lodash_1.kebabCase)(newName)));
            });
        });
        return result;
    });
}
exports.getAllChangesForOtherViews = getAllChangesForOtherViews;
function performViewModelChanges(container, aureliaProgram, viewModelPath, sourceWord, newName) {
    var _a;
    // 1. Prepare
    // 1.1 Naming convention
    let finalNewName = newName;
    const finalComponentName = newName;
    if (sourceWord.endsWith(constants_1.CUSTOM_ELEMENT_SUFFIX)) {
        finalNewName = newName.concat(constants_1.CUSTOM_ELEMENT_SUFFIX);
    }
    else if (newName.endsWith(constants_1.CUSTOM_ELEMENT_SUFFIX)) {
        finalComponentName.replace(constants_1.CUSTOM_ELEMENT_SUFFIX, '');
    }
    // 1.2
    const result = {};
    const targetComponent = aureliaProgram.aureliaComponents.getOneBy('viewModelFilePath', viewModelPath);
    if (!targetComponent)
        return;
    const tsMorphProject = aureliaProgram.tsMorphProject.get();
    // 1.3 Update TsMorphProject with editingFiles
    (0, aureliaDefintion_1.updateTsMorphProjectWithEditingFiles)(container, tsMorphProject);
    const sourceFile = tsMorphProject.getSourceFile(viewModelPath);
    const viewModelUri = uri_utils_1.UriUtils.toVscodeUri(viewModelPath);
    result[viewModelUri] = [];
    const className = (_a = targetComponent === null || targetComponent === void 0 ? void 0 : targetComponent.className) !== null && _a !== void 0 ? _a : '';
    const classNode = (0, tsMorphClass_1.getClass)(sourceFile, className);
    const content = fs.readFileSync(viewModelPath, 'utf-8');
    const viewModelDocument = vscode_languageserver_textdocument_1.TextDocument.create(viewModelUri, 'html', 0, content);
    // 2.1 Find rename locations - Class Declaration
    const isCustomElementClass = className === sourceWord;
    if (isCustomElementClass) {
        // 2.1.1 Custom element decorator
        const range = (0, rangeFromRegion_1.getRangeFromDocumentOffsets)(viewModelDocument, targetComponent.decoratorStartOffset, targetComponent.decoratorEndOffset);
        if (range) {
            result[viewModelUri].push(vscode_languageserver_1.TextEdit.replace(range, (0, lodash_1.kebabCase)(finalComponentName)));
        }
        // 2.1.2 References and original Class
        const classIdentifier = classNode.getFirstChildByKind(common_1.SyntaxKind.Identifier);
        if (!classIdentifier)
            return;
        const renameLocations = tsMorphProject
            .getLanguageService()
            .findRenameLocations(classIdentifier);
        renameLocations.forEach((location) => {
            const range = (0, rangeFromRegion_1.getRangeFromLocation)(location);
            const referencePath = location.getSourceFile().getFilePath();
            const referenceUri = uri_utils_1.UriUtils.toVscodeUri(referencePath);
            if (result[referenceUri] === undefined)
                result[referenceUri] = [];
            if (result === undefined)
                return;
            result[referenceUri].push(vscode_languageserver_1.TextEdit.replace(range, finalNewName));
        });
        // result; /*?*/
        return result;
    }
    // 2.2 Find rename locations - Class Members
    const classMemberNode = (0, tsMorphClass_1.getClassMember)(classNode, sourceWord);
    if (classMemberNode) {
        const renameLocations = tsMorphProject
            .getLanguageService()
            .findRenameLocations(classMemberNode);
        renameLocations.forEach((location) => {
            const textSpan = location.getTextSpan();
            const startPosition = viewModelDocument.positionAt(textSpan.getStart());
            const endPosition = viewModelDocument.positionAt(textSpan.getEnd());
            const range = vscode_languageserver_1.Range.create(startPosition, endPosition);
            result[viewModelUri].push(vscode_languageserver_1.TextEdit.replace(range, finalNewName));
        });
    }
    else {
        logger.log('Error: No class member found');
    }
    return result;
}
exports.performViewModelChanges = performViewModelChanges;
function getViewModelPathFromTagName(aureliaProgram, tagName) {
    const aureliaSourceFiles = aureliaProgram.getAureliaSourceFiles();
    const targetAureliaFile = aureliaSourceFiles === null || aureliaSourceFiles === void 0 ? void 0 : aureliaSourceFiles.find((sourceFile) => {
        return path_1.default.parse(sourceFile.fileName).name === tagName;
    });
    /**
     * 1. Triggered on <|my-component>
     */
    if (typeof (targetAureliaFile === null || targetAureliaFile === void 0 ? void 0 : targetAureliaFile.fileName) === 'string') {
        return uri_utils_1.UriUtils.toSysPath(targetAureliaFile.fileName);
    }
}
exports.getViewModelPathFromTagName = getViewModelPathFromTagName;
function renameAllOtherRegionsInSameView(aureliaProgram, viewDocument, sourceWord, newName) {
    return __awaiter(this, void 0, void 0, function* () {
        const result = {};
        const regions = yield (0, findSpecificRegion_1.findRegionsByWord)(aureliaProgram, viewDocument, sourceWord);
        const { uri } = viewDocument;
        result[uri] = [];
        regions.forEach((region) => {
            const accessScopeRanges = (0, rangeFromRegion_1.getRangesForAccessScopeFromRegionByName)(viewDocument, region, sourceWord);
            accessScopeRanges === null || accessScopeRanges === void 0 ? void 0 : accessScopeRanges.forEach((range) => {
                if (range === undefined)
                    return;
                result[uri].push(vscode_languageserver_1.TextEdit.replace(range, (0, lodash_1.camelCase)(newName)));
            });
        });
        return result;
    });
}
exports.renameAllOtherRegionsInSameView = renameAllOtherRegionsInSameView;
//# sourceMappingURL=workspaceEdits.js.map
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.aureliaRenameFromViewModel = exports.aureliaRenameFromView = void 0;
const fs = __importStar(require("fs"));
const url_1 = require("url");
const lodash_1 = require("lodash");
const vscode_languageserver_textdocument_1 = require("vscode-languageserver-textdocument");
const ViewRegions_1 = require("../../aot/parser/regions/ViewRegions");
const find_source_word_1 = require("../../common/documens/find-source-word");
const related_1 = require("../../common/documens/related");
const TextDocumentUtils_1 = require("../../common/documens/TextDocumentUtils");
const uri_utils_1 = require("../../common/view/uri-utils");
const AureliaProjects_1 = require("../../core/AureliaProjects");
const workspaceEdits_1 = require("./workspaceEdits");
function aureliaRenameFromView(container, aureliaProgram, document, position, newName, region) {
    var _a, _b, _c;
    return __awaiter(this, void 0, void 0, function* () {
        if (region.sourceCodeLocation === undefined)
            return;
        // 1. rename view model
        const offset = document.offsetAt(position);
        // offset; /* ? */
        const sourceWord = (0, find_source_word_1.findSourceWord)(region, offset);
        // sourceWord; /* ? */
        let viewModelPath = '';
        // 1.1 Determine view model path
        if (region.type === ViewRegions_1.ViewRegionType.BindableAttribute) {
            viewModelPath =
                (_b = (0, workspaceEdits_1.getViewModelPathFromTagName)(aureliaProgram, (_a = region.tagName) !== null && _a !== void 0 ? _a : '')) !== null && _b !== void 0 ? _b : '';
        }
        else {
            viewModelPath = (0, related_1.getRelatedFilePath)(uri_utils_1.UriUtils.toSysPath(document.uri), [
                '.js',
                '.ts',
            ]);
        }
        const viewModelChanes = (0, workspaceEdits_1.performViewModelChanges)(container, aureliaProgram, viewModelPath, (0, lodash_1.camelCase)(sourceWord), // vars can be kebab from eg. view rename
        (0, lodash_1.camelCase)(newName));
        // 2. rename all others
        const otherCustomElementChanges = yield (0, workspaceEdits_1.getAllChangesForOtherViews)(aureliaProgram, viewModelPath, sourceWord, (0, lodash_1.kebabCase)(newName));
        // otherCustomElementChanges; /* ? */
        // 3. rename all regions in view of target custom element
        // 3.1 Get document of corresponding view
        const componentList = aureliaProgram.aureliaComponents.getAll();
        const targetComponent = componentList.find((component) => component.viewModelFilePath === viewModelPath);
        if (!targetComponent)
            return;
        const viewFilePath = (_c = targetComponent.viewFilePath) !== null && _c !== void 0 ? _c : '';
        const uri = (0, url_1.pathToFileURL)(viewFilePath).toString();
        const content = fs.readFileSync(viewFilePath, 'utf-8');
        const viewDocument = vscode_languageserver_textdocument_1.TextDocument.create(uri, 'html', 0, content);
        if (viewDocument === undefined)
            return;
        const otherChangesInsideSameView = yield (0, workspaceEdits_1.renameAllOtherRegionsInSameView)(aureliaProgram, viewDocument, sourceWord, newName);
        // otherChangesInsideSameView;/* ? */
        // const { line } = position;
        // const startPosition = Position.create(line - 1, region.startCol - 1);
        // const endPosition = Position.create(line - 1, region.endCol - 1);
        // const range = Range.create(startPosition, endPosition);
        return {
            changes: Object.assign(Object.assign(Object.assign({}, viewModelChanes), otherCustomElementChanges), otherChangesInsideSameView),
            // documentChanges: [
            //   TextDocumentEdit.create(
            //     { version: document.version + 1, uri: document.uri },
            //     [TextEdit.replace(range, newName)]
            //   ),
            // ],
        };
    });
}
exports.aureliaRenameFromView = aureliaRenameFromView;
/**
 * console.log('TODO: Check for bindable decorator [ISSUE-cjMoQgGT]');
 *
 * Rename "from View model" behaves differently, than rename "from View",
 * because in the "from View" version, we check for Regions in the View.
 */
function aureliaRenameFromViewModel(container, documentSettings, document, position, newName) {
    var _a;
    return __awaiter(this, void 0, void 0, function* () {
        const offset = document.offsetAt(position);
        const sourceWord = (0, find_source_word_1.getWordAtOffset)(document.getText(), offset);
        const viewModelPath = uri_utils_1.UriUtils.toSysPath(document.uri);
        const targetProject = container
            .get(AureliaProjects_1.AureliaProjects)
            .getFromPath(viewModelPath);
        if (!targetProject)
            return;
        const { aureliaProgram } = targetProject;
        if (!aureliaProgram)
            return;
        // View Model
        const viewModelChanges = (0, workspaceEdits_1.performViewModelChanges)(container, aureliaProgram, viewModelPath, sourceWord, newName);
        // viewModelChanges; /*?*/
        // Other Views
        const otherComponentViewChanges = yield (0, workspaceEdits_1.getAllChangesForOtherViews)(aureliaProgram, viewModelPath, sourceWord, (0, lodash_1.kebabCase)(newName));
        // Related View
        const viewExtensions = (_a = documentSettings.getSettings().relatedFiles) === null || _a === void 0 ? void 0 : _a.view;
        if (!viewExtensions)
            return;
        const viewPath = (0, related_1.getRelatedFilePath)(uri_utils_1.UriUtils.toSysPath(document.uri), viewExtensions);
        const viewDocument = TextDocumentUtils_1.TextDocumentUtils.createHtmlFromPath(viewPath);
        if (!viewDocument)
            return;
        const otherChangesInsideSameView = yield (0, workspaceEdits_1.renameAllOtherRegionsInSameView)(aureliaProgram, viewDocument, sourceWord, newName);
        // otherChangesInsideSameView; /* ? */
        const finalChanges = {
            changes: Object.assign(Object.assign(Object.assign({}, viewModelChanges), otherComponentViewChanges), otherChangesInsideSameView),
        };
        // finalChanges; /*?*/
        return finalChanges;
    });
}
exports.aureliaRenameFromViewModel = aureliaRenameFromViewModel;
//# sourceMappingURL=aureliaRename.js.map
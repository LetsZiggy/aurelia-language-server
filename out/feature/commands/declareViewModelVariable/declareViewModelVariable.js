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
exports.DeclareViewModelVariable = void 0;
const RegionParser_1 = require("../../../aot/parser/regions/RegionParser");
const tsMorphClass_1 = require("../../../aot/tsMorph/tsMorphClass");
const client_1 = require("../../../common/client/client");
const constants_1 = require("../../../common/constants");
const selections_1 = require("../../../common/documens/selections");
const TextDocumentUtils_1 = require("../../../common/documens/TextDocumentUtils");
const uri_utils_1 = require("../../../common/view/uri-utils");
const AureliaProjects_1 = require("../../../core/AureliaProjects");
const aureliaDefintion_1 = require("../../definition/aureliaDefintion");
class DeclareViewModelVariable {
    constructor(container, connection, allDocuments, aureliaProjects) {
        this.container = container;
        this.connection = connection;
        this.allDocuments = allDocuments;
        this.aureliaProjects = aureliaProjects;
    }
    execute() {
        return __awaiter(this, void 0, void 0, function* () {
            this.workspaceUpdates = new client_1.WorkspaceUpdates();
            const getEditorSelectionResponse = yield (0, client_1.getEditorSelection)(this.connection);
            const selections = yield this.getSelections(getEditorSelectionResponse);
            if (!selections)
                return;
            try {
                yield this.addToViewModel(getEditorSelectionResponse, selections);
            }
            catch (error) {
                console.log('error: ', error);
            }
            yield this.workspaceUpdates.applyChanges();
        });
    }
    addToViewModel(getEditorSelectionResponse, selections) {
        return __awaiter(this, void 0, void 0, function* () {
            // 0. Var setup
            const aureliaProjects = this.container.get(AureliaProjects_1.AureliaProjects);
            const { documentUri } = getEditorSelectionResponse;
            const document = this.allDocuments.get(documentUri);
            if (!document)
                return;
            const targetProject = aureliaProjects.getFromUri(document.uri);
            if (!targetProject)
                return;
            const aureliaProgram = targetProject === null || targetProject === void 0 ? void 0 : targetProject.aureliaProgram;
            if (!aureliaProgram)
                return;
            const viewPath = uri_utils_1.UriUtils.toSysPath(document.uri);
            const targetComponent = aureliaProgram.aureliaComponents.getOneBy('viewFilePath', viewPath);
            if (!targetComponent)
                return;
            // 1. re-parse regions ((experimenting))
            const componentList = aureliaProgram.aureliaComponents.getAll();
            const regions = RegionParser_1.RegionParser.parse(document, componentList);
            regions; /*?*/
            // TODO: improvement: add types and differentiate between property and method
            // 2. Find location where to add
            const firstMemberPosition = this.getLocationToAdd(aureliaProgram, targetComponent);
            if (!firstMemberPosition)
                return;
            // 3. Add to view model class
            const whiteSpace = '  '; // Assumption: 2 spaces
            const endFormatting = `\n\n${whiteSpace}`;
            this.workspaceUpdates.replaceText(targetComponent.viewModelFilePath, selections[0] + endFormatting, firstMemberPosition.line, firstMemberPosition.character, firstMemberPosition.line, firstMemberPosition.character);
        });
    }
    getLocationToAdd(aureliaProgram, targetComponent) {
        var _a;
        const tsMorphProject = aureliaProgram.tsMorphProject.get();
        (0, aureliaDefintion_1.updateTsMorphProjectWithEditingFiles)(this.container, tsMorphProject);
        const sourceFile = tsMorphProject.getSourceFile(targetComponent.viewModelFilePath);
        const className = (_a = targetComponent === null || targetComponent === void 0 ? void 0 : targetComponent.className) !== null && _a !== void 0 ? _a : '';
        const classNode = (0, tsMorphClass_1.getClass)(sourceFile, className);
        if (!classNode)
            return;
        const viewModelDocument = TextDocumentUtils_1.TextDocumentUtils.createViewModelFromPath(targetComponent.viewModelFilePath);
        if (!viewModelDocument)
            return;
        const firstMember = classNode.getMembers()[0];
        if (!firstMember) {
            const message = 'Unsupported: Class has to have at least one member.';
            this.connection.sendRequest(constants_1.WARNING_MESSAGE, message);
            throw new Error(message);
        }
        const firstMemberPosition = viewModelDocument.positionAt(firstMember.getStart());
        classNode; /*?*/
        return firstMemberPosition;
    }
    getSelections(getEditorSelectionResponse) {
        return __awaiter(this, void 0, void 0, function* () {
            const selectedTexts = yield (0, selections_1.extractSelectedTexts)(getEditorSelectionResponse, this.allDocuments);
            if (selectedTexts.length > 1) {
                this.connection.sendRequest(constants_1.WARNING_MESSAGE, 'Only one selection supported');
                return;
            }
            if (selectedTexts[0] === '') {
                this.connection.sendRequest(constants_1.WARNING_MESSAGE, 'Selection is empty');
                return;
            }
            return selectedTexts;
        });
    }
}
exports.DeclareViewModelVariable = DeclareViewModelVariable;
//# sourceMappingURL=declareViewModelVariable.js.map
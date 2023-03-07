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
exports.ExtractComponent = void 0;
const kernel_1 = require("@aurelia/kernel");
const vscode_languageserver_1 = require("vscode-languageserver");
const fs_1 = __importDefault(require("fs"));
const client_1 = require("../../../common/client/client");
const RegionService_1 = require("../../../common/services/RegionService");
const lodash_1 = require("lodash");
const AureliaUtils_1 = require("../../../common/AureliaUtils");
const uri_utils_1 = require("../../../common/view/uri-utils");
const selections_1 = require("../../../common/documens/selections");
const getComponentNameRequest = new vscode_languageserver_1.RequestType('get-component-name');
class ExtractComponent {
    constructor(container, connection, allDocuments, aureliaProjects) {
        this.container = container;
        this.connection = connection;
        this.allDocuments = allDocuments;
        this.aureliaProjects = aureliaProjects;
    }
    executeExtractComponent() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.perfom();
            yield this.workspaceUpdates.applyChanges();
        });
    }
    perfom() {
        return __awaiter(this, void 0, void 0, function* () {
            this.workspaceUpdates = new client_1.WorkspaceUpdates();
            const componentName = yield this.getComponentName();
            if (!componentName)
                return;
            // 2. Get Selection
            const getEditorSelectionResponse = yield (0, client_1.getEditorSelection)(this.connection);
            const selectedTexts = yield (0, selections_1.extractSelectedTexts)(getEditorSelectionResponse, this.allDocuments);
            const targetProject = this.aureliaProjects.getFromUri(getEditorSelectionResponse.documentUri);
            if (!targetProject)
                return;
            const collectedClassMembers = this.getClassMembers(targetProject, getEditorSelectionResponse);
            if (!collectedClassMembers)
                return;
            // 3. create files
            yield this.createComponent(targetProject, getEditorSelectionResponse, componentName, selectedTexts, collectedClassMembers);
            // 4. Replace selection with new component
            yield this.replaceSelection(targetProject, componentName, getEditorSelectionResponse, collectedClassMembers);
            const edits = this.workspaceUpdates.getEdits();
            return edits;
        });
    }
    replaceSelection(targetProject, componentName, getEditorSelectionResponse, collectedClassMembers) {
        return __awaiter(this, void 0, void 0, function* () {
            const { documentUri, selections } = getEditorSelectionResponse;
            const document = this.allDocuments.get(documentUri);
            if (!document)
                return;
            const isAuV1 = AureliaUtils_1.AureliaUtils.isAuV1(targetProject.aureliaVersion);
            const importTagName = isAuV1 ? 'require' : 'import';
            for (const selection of selections) {
                const attributes = collectedClassMembers
                    .map((member) => `${member.name}.bind="${member.name}"`)
                    .join(' ');
                const toTagName = (0, lodash_1.kebabCase)(componentName);
                const withTags = `<${toTagName}\n  ${attributes}>\n</${toTagName}>`;
                const importTag = `<${importTagName} from=''></${importTagName}>`;
                const withImports = `${importTag}\n${withTags}`;
                this.workspaceUpdates.replaceText(documentUri, withImports, selection.start.line, selection.start.character, selection.end.line, selection.end.character);
            }
        });
    }
    createComponent(targetProject, getEditorSelectionResponse, componentName, selectedTexts, collectedClassMembers) {
        return __awaiter(this, void 0, void 0, function* () {
            const creationPath = `${targetProject === null || targetProject === void 0 ? void 0 : targetProject.tsConfigPath}/${componentName}`;
            if (!fs_1.default.existsSync(creationPath)) {
                fs_1.default.mkdirSync(creationPath);
            }
            const userSuppliedCreateViewModelTemplates = yield this.getUserSuppliedCreateViewModelTemplate(targetProject);
            yield this.createViewModelFile(targetProject, creationPath, componentName, collectedClassMembers, userSuppliedCreateViewModelTemplates === null || userSuppliedCreateViewModelTemplates === void 0 ? void 0 : userSuppliedCreateViewModelTemplates.createViewModelTemplate);
            yield this.createViewFile(creationPath, componentName, targetProject, getEditorSelectionResponse, selectedTexts, userSuppliedCreateViewModelTemplates === null || userSuppliedCreateViewModelTemplates === void 0 ? void 0 : userSuppliedCreateViewModelTemplates.createViewTemplate);
        });
    }
    createViewModelFile(targetProject, creationPath, componentName, collectedClassMembers, createViewModelTemplate) {
        return __awaiter(this, void 0, void 0, function* () {
            const viewModelExt = '.ts';
            const viewModelPath = `${creationPath}/${componentName}${viewModelExt}`;
            const className = (0, kernel_1.pascalCase)(componentName);
            const asBindablesCode = collectedClassMembers
                .map((member) => {
                const withTypes = member.memberType ? `: ${member.memberType}` : '';
                return `@bindable ${member.name}${withTypes};`;
            })
                .join('\n  ');
            const isAuV1 = AureliaUtils_1.AureliaUtils.isAuV1(targetProject.aureliaVersion);
            const bindableImportPackage = isAuV1 ? 'aurelia-framework' : 'aurelia';
            const createFunction = createViewModelTemplate !== null && createViewModelTemplate !== void 0 ? createViewModelTemplate : createViewModel;
            const finalContent = createFunction({
                bindableImportPackage,
                className,
                asBindablesCode,
                collectedClassMembers,
            });
            const uri = uri_utils_1.UriUtils.toVscodeUri(viewModelPath);
            this.workspaceUpdates.createFile(uri, finalContent);
        });
    }
    getUserSuppliedCreateViewModelTemplate(targetProject) {
        return __awaiter(this, void 0, void 0, function* () {
            const templateFilePath = `${targetProject.tsConfigPath}/.aurelia/extension/templates.js`;
            if (!fs_1.default.existsSync(templateFilePath)) {
                return;
            }
            const templateFiles = yield Promise.resolve().then(() => __importStar(require(templateFilePath)));
            return templateFiles;
        });
    }
    createViewFile(creationPath, componentName, targetProject, getEditorSelectionResponse, selectedTexts, createViewTemplate) {
        const viewExt = '.html';
        const viewPath = `${creationPath}/${componentName}${viewExt}`;
        const isAuV1 = AureliaUtils_1.AureliaUtils.isAuV1(targetProject.aureliaVersion);
        const createFunction = createViewTemplate !== null && createViewTemplate !== void 0 ? createViewTemplate : createView;
        const surroundWithTemplate = createFunction({ selectedTexts, isAuV1 });
        const uri = uri_utils_1.UriUtils.toVscodeUri(viewPath);
        this.workspaceUpdates.createFile(uri, surroundWithTemplate);
    }
    getComponentName() {
        return __awaiter(this, void 0, void 0, function* () {
            const result = yield this.connection.sendRequest(getComponentNameRequest);
            return result;
        });
    }
    getClassMembers(targetProject, getEditorSelectionResponse) {
        var _a;
        const { documentPath, documentUri, selections } = getEditorSelectionResponse;
        const component = (_a = targetProject === null || targetProject === void 0 ? void 0 : targetProject.aureliaProgram) === null || _a === void 0 ? void 0 : _a.aureliaComponents.getOneBy('viewFilePath', documentPath);
        if (!component)
            return [];
        const document = this.allDocuments.get(documentUri);
        if (!document)
            return [];
        // Get Regions from range
        const regions = component.viewRegions;
        let targetRegions = [];
        selections.forEach((selection) => {
            const range = vscode_languageserver_1.Range.create(selection.start, selection.end);
            const regionsInRange = RegionService_1.RegionService.getManyRegionsInRange(regions, document, range);
            targetRegions.push(...regionsInRange);
        });
        // Get AccessScope names from regions
        const collectedScopeNames = new Set();
        targetRegions.forEach((region) => {
            var _a;
            (_a = region.accessScopes) === null || _a === void 0 ? void 0 : _a.forEach((scope) => {
                collectedScopeNames.add(scope.name);
            });
        });
        const classMembers = [];
        Array.from(collectedScopeNames).forEach((nameInView) => {
            var _a;
            const classMember = (_a = component.classMembers) === null || _a === void 0 ? void 0 : _a.find((member) => member.name === nameInView);
            if (!classMember)
                return;
            classMembers.push(classMember);
        });
        return classMembers;
    }
}
exports.ExtractComponent = ExtractComponent;
function createView({ selectedTexts, isAuV1, }) {
    const content = selectedTexts.join('\n');
    const surroundWithTemplate = isAuV1
        ? `<template>\n  ${content}\n</template>`
        : content;
    return surroundWithTemplate;
}
function createViewModel({ bindableImportPackage, className, asBindablesCode, collectedClassMembers, }) {
    return `import { bindable } from '${bindableImportPackage}';

export class ${className} {
  ${asBindablesCode}
}
`;
}
//# sourceMappingURL=extractComponent.js.map
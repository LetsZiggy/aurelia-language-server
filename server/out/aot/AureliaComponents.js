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
Object.defineProperty(exports, "__esModule", { value: true });
exports.AureliaComponents = void 0;
const Path = __importStar(require("path"));
const TextDocumentUtils_1 = require("../common/documens/TextDocumentUtils");
const logger_1 = require("../common/logging/logger");
const uri_utils_1 = require("../common/view/uri-utils");
const getAureliaComponentList_1 = require("./getAureliaComponentList");
const RegionParser_1 = require("./parser/regions/RegionParser");
const CustomElementAnalyser_1 = require("./staticAnalysis/CustomElementAnalyser");
const logger = new logger_1.Logger('AureliaComponents');
class AureliaComponents {
    constructor(documentSettings) {
        this.documentSettings = documentSettings;
        this.components = [];
        this.bindables = [];
    }
    init(project, filePaths) {
        if (filePaths.length === 0) {
            logger.log('Error: No Aurelia files found.');
            return;
        }
        const enhancedComponents = this.enhanceWithViewRegions(initComponentList(project, filePaths));
        this.set(enhancedComponents);
        this.setBindables(enhancedComponents);
        logComponentList(enhancedComponents);
        this.logInfoAboutComponents(enhancedComponents);
        return;
        function initComponentList(project, filePaths) {
            const checker = project.getTypeChecker().compilerObject;
            const componentListWithoutRegions = [];
            filePaths.forEach((path) => {
                var _a;
                if (path == null)
                    return;
                const isDTs = Path.basename(path).endsWith('.d.ts');
                if (isDTs)
                    return;
                const isNodeModules = path.includes('node_modules');
                if (isNodeModules)
                    return;
                const ext = Path.extname(path);
                switch (ext) {
                    case '.js':
                    case '.ts': {
                        const sourceFile = (_a = project.getSourceFile(path)) === null || _a === void 0 ? void 0 : _a.compilerNode;
                        if (sourceFile === undefined)
                            return;
                        /* export class MyCustomElement */
                        const componentInfo = CustomElementAnalyser_1.CustomElementAnalyser.getAureliaComponentInfoFromClassDeclaration(sourceFile, checker);
                        if (!componentInfo)
                            return;
                        componentListWithoutRegions.push(componentInfo);
                        break;
                    }
                    case '.html': {
                        break;
                    }
                    default: {
                        logger.log(`Unsupported extension: ${ext}`);
                    }
                }
            });
            return componentListWithoutRegions;
        }
    }
    set(components) {
        this.components = components;
    }
    getAll() {
        if (this.components.length === 0) {
            logger.log('Error: No Aurelia components found.');
        }
        return this.components;
    }
    getOneBy(key, targetValue) {
        const target = this.getAll().find((component) => component[key] === targetValue);
        return target;
    }
    getOneByFromDocument(document) {
        const target = this.getAll().find((component) => {
            if (this.isViewDocument(document)) {
                if (component.viewFilePath === undefined)
                    return false;
                if (component.viewFilePath !== uri_utils_1.UriUtils.toSysPath(document.uri))
                    return false;
                return this.getOneBy('viewFilePath', uri_utils_1.UriUtils.toSysPath(component.viewFilePath));
            }
            else if (this.isViewModelDocument(document)) {
                if (component.viewModelFilePath !== uri_utils_1.UriUtils.toSysPath(document.uri))
                    return false;
                return this.getOneBy('viewModelFilePath', uri_utils_1.UriUtils.toSysPath(component.viewModelFilePath));
            }
            return false;
        });
        return target;
    }
    isViewDocument(document) {
        var _a;
        const viewExtensions = (_a = this.documentSettings.getSettings().relatedFiles) === null || _a === void 0 ? void 0 : _a.view;
        if (!viewExtensions)
            return;
        const target = viewExtensions.find((extension) => document.uri.endsWith(extension));
        return target;
    }
    isViewModelDocument(document) {
        var _a;
        const viewModelExtensions = (_a = this.documentSettings.getSettings().relatedFiles) === null || _a === void 0 ? void 0 : _a.script;
        if (!viewModelExtensions)
            return;
        const target = viewModelExtensions.find((extension) => document.uri.endsWith(extension));
        return target;
    }
    /**
     * Note: Difference to #getOneBy.
     *   Could relate to pointer to object.
     */
    getIndexBy(key, targetValue) {
        const target = this.getAll().findIndex((component) => component[key] === targetValue);
        return target;
    }
    /**
     * Parse current state of source file, and assign to components.
     */
    updateOne(project, document) {
        const sourceFilePath = uri_utils_1.UriUtils.toSysPath(document.uri);
        const sourceFile = project.getSourceFile(sourceFilePath);
        if (!sourceFile)
            return;
        const updatedText = document.getText();
        const updatedSourceFile = project.createSourceFile(sourceFilePath, updatedText, { overwrite: true });
        const componentInfo = (0, getAureliaComponentList_1.getAureliaComponentInfoFromClassDeclaration)(updatedSourceFile.compilerNode, project.getTypeChecker().compilerObject);
        if (!componentInfo)
            return;
        const targetIndex = this.getIndexBy('viewModelFilePath', uri_utils_1.UriUtils.toSysPath(document.uri));
        this.components[targetIndex] = Object.assign(Object.assign({}, this.components[targetIndex]), componentInfo);
    }
    updateOneView(document) {
        const targetComponent = this.getOneBy('viewFilePath', uri_utils_1.UriUtils.toSysPath(document.uri));
        if (!targetComponent)
            return;
        const regions = RegionParser_1.RegionParser.parse(document, this.components);
        targetComponent.viewRegions = regions;
    }
    setBindables(components) {
        const bindableList = [];
        components.forEach((component) => {
            var _a;
            (_a = component.classMembers) === null || _a === void 0 ? void 0 : _a.forEach((classMember) => {
                if (classMember.isBindable) {
                    if (component.componentName === undefined)
                        return;
                    const targetBindable = {
                        componentName: component.componentName,
                        classMember,
                    };
                    bindableList.push(targetBindable);
                }
            });
        });
        this.bindables = bindableList;
    }
    getBindables() {
        return this.bindables;
    }
    enhanceWithViewRegions(componentList) {
        const enhanced = [...componentList];
        enhanced.forEach((component) => {
            if (component.viewFilePath === undefined)
                return;
            const viewDocument = TextDocumentUtils_1.TextDocumentUtils.createHtmlFromPath(component.viewFilePath);
            if (!viewDocument)
                return;
            const regions = RegionParser_1.RegionParser.parse(viewDocument, componentList);
            component.viewRegions = regions;
        });
        return enhanced;
    }
    logInfoAboutComponents(components) {
        if (components.length) {
            /* prettier-ignore */ logger.culogger.debug([`>>> The extension found this many components: ${components.length}`,], { logLevel: 'INFO' });
            if (components.length < 10) {
                logger.culogger.debug(['List: '], { logLevel: 'INFO' });
                components.forEach((component, index) => {
                    /* prettier-ignore */ logger.culogger.debug([`${index} - ${component.viewModelFilePath}`], { logLevel: 'INFO', });
                });
            }
        }
    }
}
exports.AureliaComponents = AureliaComponents;
function logComponentList(components) {
    logger.log(`Found ${components.length} Components.`);
}
//# sourceMappingURL=AureliaComponents.js.map
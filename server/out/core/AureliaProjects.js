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
exports.AureliaProjects = void 0;
const fs = __importStar(require("fs"));
const nodePath = __importStar(require("path"));
const fastGlob = __importStar(require("fast-glob"));
const AureliaProgram_1 = require("../aot/AureliaProgram");
const logger_1 = require("../common/logging/logger");
const uri_utils_1 = require("../common/view/uri-utils");
const constants_1 = require("../common/constants");
const logger = new logger_1.Logger('AureliaProject');
const compilerObjectMap = new Map();
class AureliaProjects {
    constructor(documentSettings) {
        this.documentSettings = documentSettings;
        this.aureliaProjects = [];
        this.editingTracker = [];
    }
    getAureliaProjectsOnly(extensionSettings) {
        return __awaiter(this, void 0, void 0, function* () {
            const packageJsonPaths = getPackageJsonPaths(extensionSettings);
            yield this.initAndSet(packageJsonPaths);
            const hasAureliaProject = this.getHasAureliaProject();
            return hasAureliaProject;
        });
    }
    getHasAureliaProject() {
        const projects = this.getAll();
        const hasAureliaProject = projects.length > 0;
        if (!hasAureliaProject) {
            logHasNoAureliaProject();
            return false;
        }
        logFoundAureliaProjects(projects);
        return true;
    }
    getAll() {
        return this.aureliaProjects;
    }
    getBy(tsConfigPath) {
        const target = this.getAll().find((projects) => projects.tsConfigPath === tsConfigPath);
        return target;
    }
    getFromPath(documentPath) {
        const target = this.getAll().find((project) => {
            const included = documentPath.includes(project.tsConfigPath);
            return included;
        });
        return target;
    }
    getFromUri(uri) {
        const path = uri_utils_1.UriUtils.toSysPath(uri);
        return this.getFromPath(path);
    }
    /**
     * [PERF]: 2.5s
     */
    hydrate(documents, forceReinit = false) {
        return __awaiter(this, void 0, void 0, function* () {
            /* prettier-ignore */ logger.log('Parsing Aurelia related data...', { logLevel: 'INFO' });
            const documentsPaths = getDocumentPaths();
            if (!documentsPaths)
                return false;
            const settings = this.documentSettings.getSettings();
            const aureliaProjectSettings = settings === null || settings === void 0 ? void 0 : settings.aureliaProject;
            // 1. To each map assign a separate program
            yield this.addAureliaProgramToEachProject(documentsPaths, aureliaProjectSettings, forceReinit);
            return true;
            function getDocumentPaths() {
                const documentsPaths = documents.map((document) => {
                    const result = uri_utils_1.UriUtils.toSysPath(document.uri);
                    return result;
                });
                if (documentsPaths.length === 0) {
                    warnExtensionNotActivated();
                    return;
                }
                return documentsPaths;
                function warnExtensionNotActivated() {
                    /* prettier-ignore */ logger.log('(!) Extension not activated.', { logLevel: 'INFO' });
                    /* prettier-ignore */ logger.log('(!) Waiting until .html, .js, or .ts file focused.', { logLevel: 'INFO' });
                    /* prettier-ignore */ logger.log('    (For performance reasons)', { logLevel: 'INFO' });
                    /* prettier-ignore */ logger.log('    (Execute command "Aurelia: Reload Extension", if nothing happens.)', { logLevel: 'INFO' });
                }
            }
        });
    }
    /**
     * Prevent when
     * 1. Project already includes document
     * 2. Document was just opened
     */
    preventHydration(document) {
        // 1.
        if (!this.isDocumentIncluded(document)) {
            return false;
        }
        // 2.
        if (hasDocumentChanged(document)) {
            return false;
        }
        // update: then extension should correctly(!) not active
        // logger.culogger.todo(
        //   `What should happen to document, that is not included?: ${document.uri}`
        // );
        logger.log(`Not updating document: ${nodePath.basename(document.uri)}`);
        return true;
    }
    isHydrated() {
        const projects = this.getAll();
        const hydrated = projects.every((project) => project.aureliaProgram !== null);
        return hydrated;
    }
    updateManyViewModel(documents) {
        documents.forEach((document) => {
            const uriSysPath = uri_utils_1.UriUtils.toSysPath(document.uri);
            const targetProject = this.getAll().find((project) => uriSysPath.includes(project.tsConfigPath));
            const aureliaProgram = targetProject === null || targetProject === void 0 ? void 0 : targetProject.aureliaProgram;
            if (!aureliaProgram)
                return;
            aureliaProgram.aureliaComponents.updateOne(aureliaProgram.tsMorphProject.get(), document);
        });
    }
    updateManyView(documents) {
        documents.forEach((document) => {
            const targetProject = this.getAll().find((project) => uri_utils_1.UriUtils.toSysPath(document.uri).includes(project.tsConfigPath));
            const aureliaProgram = targetProject === null || targetProject === void 0 ? void 0 : targetProject.aureliaProgram;
            if (!aureliaProgram)
                return;
            aureliaProgram.aureliaComponents.updateOneView(document);
        });
    }
    /** Tracker */
    getEditingTracker() {
        return this.editingTracker;
    }
    addDocumentToEditingTracker(document) {
        this.editingTracker.push(document);
    }
    clearEditingTracker() {
        this.editingTracker = [];
    }
    initAndSet(packageJsonPaths) {
        return __awaiter(this, void 0, void 0, function* () {
            this.resetAureliaProjects();
            const aureliaProjects = getAureliaProjects(packageJsonPaths);
            aureliaProjects.forEach((aureliaProject) => {
                if (this.alreadyHasProject(aureliaProject.tsConfigPath)) {
                    return;
                }
                this.aureliaProjects.push(aureliaProject);
            });
        });
    }
    alreadyHasProject(aureliaProjectPath) {
        const alreadyHasProject = this.aureliaProjects.find((project) => project.tsConfigPath === aureliaProjectPath);
        return alreadyHasProject;
    }
    addAureliaProgramToEachProject(documentsPaths, aureliaProjectSettings, forceReinit = false) {
        return __awaiter(this, void 0, void 0, function* () {
            const aureliaProjects = this.getAll();
            aureliaProjects.forEach((aureliaProject) => {
                const { tsConfigPath } = aureliaProject;
                if (!shouldActivate(documentsPaths, tsConfigPath))
                    return;
                let aureliaProgram = this.getADefinedAureliaProgram(aureliaProject, forceReinit);
                aureliaProgram = this.initAureliaComponents(aureliaProgram, tsConfigPath, aureliaProjectSettings);
                setAureliaProgramToProject(aureliaProgram, tsConfigPath);
            });
            return;
            function setAureliaProgramToProject(aureliaProgram, tsConfigPath) {
                const targetAureliaProject = aureliaProjects.find((auP) => auP.tsConfigPath === tsConfigPath);
                if (!targetAureliaProject)
                    return;
                targetAureliaProject.aureliaProgram = aureliaProgram;
            }
        });
    }
    getADefinedAureliaProgram(aureliaProject, forceReinit) {
        const { tsConfigPath } = aureliaProject;
        let { aureliaProgram } = aureliaProject;
        if (aureliaProgram === null || forceReinit) {
            aureliaProgram = this.initAureliaProgram(tsConfigPath, forceReinit);
        }
        return aureliaProgram;
    }
    initAureliaComponents(aureliaProgram, tsConfigPath, aureliaProjectSettings) {
        const projectOptions = Object.assign(Object.assign({}, aureliaProjectSettings), { rootDirectory: tsConfigPath });
        // [PERF]: 0.67967675s
        aureliaProgram.initAureliaComponents(projectOptions);
        return aureliaProgram;
    }
    initAureliaProgram(tsConfigPath, forceReinit) {
        const updatedSettings = this.updateDocumentSettings(tsConfigPath);
        const aureliaProgram = new AureliaProgram_1.AureliaProgram(updatedSettings);
        const tsMorphProject = aureliaProgram.tsMorphProject.create();
        const compilerObject = memoizeCompilerObject(tsConfigPath, tsMorphProject);
        if (compilerObject != null) {
            aureliaProgram.setProgram(compilerObject);
        }
        return aureliaProgram;
        function memoizeCompilerObject(tsConfigPath, tsMorphProject) {
            let compilerObject = compilerObjectMap.get(tsConfigPath);
            if (compilerObject == null || forceReinit) {
                const program = tsMorphProject.getProgram();
                // [PERF]: 1.87967675s
                compilerObject = program.compilerObject;
                compilerObjectMap.set(tsConfigPath, compilerObject);
            }
            return compilerObject;
        }
    }
    updateDocumentSettings(tsConfigPath) {
        const extensionSettings = this.documentSettings.getSettings().aureliaProject;
        this.documentSettings.setSettings(Object.assign(Object.assign({}, extensionSettings), { aureliaProject: {
                projectDirectory: tsConfigPath,
            } }));
        return this.documentSettings;
    }
    /**
     * Check whether a textDocument (via its uri), if it is already included
     * in the Aurelia project.
     */
    isDocumentIncluded({ uri }) {
        const isIncluded = this.aureliaProjects.some(({ tsConfigPath }) => {
            return uri.includes(tsConfigPath);
        });
        return isIncluded;
    }
    resetAureliaProjects() {
        this.aureliaProjects = [];
    }
}
exports.AureliaProjects = AureliaProjects;
function shouldActivate(documentsPaths, tsConfigPath) {
    return documentsPaths.some((docPath) => {
        const result = docPath.includes(tsConfigPath);
        return result;
    });
}
function getAureliaVersionBasedOnPackageJson(packageJsonPath) {
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
    let aureliaV1 = undefined;
    let aureliaV2 = undefined;
    const dep = packageJson['dependencies'];
    if (dep != null) {
        const { isAuV1 } = isAu1App(dep);
        const { isAuV2 } = isAu2App(dep);
        if (isAuV1) {
            aureliaV1 = constants_1.AureliaVersion.V1;
        }
        if (isAuV2) {
            aureliaV2 = constants_1.AureliaVersion.V2;
        }
    }
    const devDep = packageJson['devDependencies'];
    if (devDep != null) {
        const { isAuV1 } = isAu1App(devDep);
        const { isAuV2 } = isAu2App(devDep);
        if (isAuV1) {
            aureliaV1 = constants_1.AureliaVersion.V1;
        }
        if (isAuV2) {
            aureliaV2 = constants_1.AureliaVersion.V2;
        }
    }
    const finalVersion = aureliaV2 !== null && aureliaV2 !== void 0 ? aureliaV2 : aureliaV1; // default to v2
    return finalVersion;
}
function isAu2App(dep) {
    const isAuV2App = dep['aurelia'] !== undefined;
    const isAuV2Plugin = dep['@aurelia/runtime'] !== undefined;
    const isAuV2 = isAuV2App || isAuV2Plugin;
    return { isAuV2App, isAuV2Plugin, isAuV2 };
}
function isAu1App(dep) {
    const isAuV1Framework = dep['aurelia-framework'] !== undefined;
    const isAuV1Plugin = dep['aurelia-binding'] !== undefined;
    const isAuV1Cli = dep['aurelia-cli'] !== undefined;
    const isAuV1Bootstrapper = dep['aurelia-bootstrapper'] !== undefined;
    const isAuV1App = isAuV1Framework || isAuV1Cli || isAuV1Bootstrapper;
    const isAuV1 = isAuV1App || isAuV1Plugin;
    return {
        isAuV1Framework,
        isAuV1Cli,
        isAuV1Bootstrapper,
        isAuV1Plugin,
        isAuV1App,
        isAuV1,
    };
}
/**
 * @param packageJsonPaths - All paths, that have a package.json file
 * @returns All projects, that are an Aurelia project
 *
 * 1. Save paths to Aurelia project only.
 * 1.1 Based on package.json
 * 1.2 Detect if is Aurelia project
 * 2. Save Aurelia Version
 */
function getAureliaProjects(packageJsonPaths) {
    const aureliaProjects = [];
    packageJsonPaths.forEach((packageJsonPath) => {
        const dirName = nodePath.dirname(uri_utils_1.UriUtils.toSysPath(packageJsonPath));
        const aureliaVersion = getAureliaVersionBasedOnPackageJson(packageJsonPath);
        if (!aureliaVersion)
            return;
        const aureliaProject = {
            tsConfigPath: uri_utils_1.UriUtils.toSysPath(dirName),
            aureliaProgram: null,
            aureliaVersion,
        };
        aureliaProjects.push(aureliaProject);
    });
    return aureliaProjects;
}
function getPackageJsonPaths(extensionSettings) {
    var _a, _b;
    const aureliaProject = extensionSettings.aureliaProject;
    const workspaceRootUri = (_b = (_a = aureliaProject === null || aureliaProject === void 0 ? void 0 : aureliaProject.rootDirectory) === null || _a === void 0 ? void 0 : _a.trim()) !== null && _b !== void 0 ? _b : '';
    const cwd = uri_utils_1.UriUtils.toSysPath(workspaceRootUri);
    /* prettier-ignore */ logger.log(`Get package.json based on: ${cwd}`, { env: 'test' });
    const ignore = [];
    const exclude = aureliaProject === null || aureliaProject === void 0 ? void 0 : aureliaProject.exclude;
    if (exclude != null) {
        ignore.push(...exclude);
    }
    const packageJsonInclude = aureliaProject === null || aureliaProject === void 0 ? void 0 : aureliaProject.packageJsonInclude;
    let globIncludePattern = [];
    if (packageJsonInclude != null && packageJsonInclude.length > 0) {
        /* prettier-ignore */ logger.log('Using setting `aureliaProject.packageJsonInclude`.', { logLevel: 'INFO' });
        const packageJsonIncludes = packageJsonInclude.map((path) => `**/${path}/**/package.json`);
        globIncludePattern.push(...packageJsonIncludes);
    }
    else {
        globIncludePattern = ['**/package.json'];
    }
    try {
        const packageJsonPaths = fastGlob.sync(globIncludePattern, {
            // const packageJsonPaths = fastGlob.sync('**/package.json', {
            absolute: true,
            ignore,
            cwd,
        });
        logPackageJsonInfo(packageJsonPaths, globIncludePattern, ignore);
        return packageJsonPaths;
    }
    catch (error) {
        /* prettier-ignore */ console.log('TCL: getPackageJsonPaths -> error', error);
        return [];
    }
}
function logFoundAureliaProjects(aureliaProjects) {
    /* prettier-ignore */ logger.log(`Found ${aureliaProjects.length} Aurelia project(s) in: `, { logLevel: 'INFO' });
    aureliaProjects.forEach(({ tsConfigPath, aureliaVersion }) => {
        /* prettier-ignore */ logger.log(`  ${tsConfigPath}`, { logLevel: 'INFO' });
        /* prettier-ignore */ logger.log(`  is version: ${aureliaVersion}`, { logLevel: 'INFO' });
    });
}
function logHasNoAureliaProject() {
    /* prettier-ignore */ logger.log('No active Aurelia project found.', { logLevel: 'INFO' });
    /* prettier-ignore */ logger.log('  Extension will activate, as soon as a file inside an Aurelia project is opened.', { logLevel: 'INFO' });
    /* prettier-ignore */ logger.log('  Or execute command "Aurelia: Reload Extension", if nothing happens.', { logLevel: 'INFO' });
}
function logPackageJsonInfo(packageJsonPaths, globIncludePattern, ignore) {
    if (globIncludePattern.length === 0) {
        /* prettier-ignore */ logger.log(`Did not found a package.json file. Searched in: ${globIncludePattern.join(', ')} `, { logLevel: 'INFO' });
    }
    else {
        /* prettier-ignore */ logger.log(`Found ${packageJsonPaths.length} package.json file(s):`, { logLevel: 'INFO' });
        /* prettier-ignore */ logger.log(`  ${packageJsonPaths.join(', ')}`, { logLevel: 'INFO' });
        /* prettier-ignore */ logger.log(`  Searched in: ${globIncludePattern.join(', ')}`, { logLevel: 'INFO' });
    }
    /* prettier-ignore */ logger.log(`  Excluded: ${ignore.join(', ')}`, { logLevel: 'INFO' });
}
/**
 * Document changes -> version > 1.
 */
function hasDocumentChanged({ version }) {
    return version > 1;
}
//# sourceMappingURL=AureliaProjects.js.map
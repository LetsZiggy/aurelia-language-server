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
exports.createTsMorphProject = exports.TsMorphProject = void 0;
const fastGlob = __importStar(require("fast-glob"));
const ts_morph_1 = require("ts-morph");
const logger_1 = require("../../common/logging/logger");
const uri_utils_1 = require("../../common/view/uri-utils");
const logger = new logger_1.Logger('AureliaTsMorph');
class TsMorphProject {
    constructor(documentSettings) {
        var _a, _b;
        this.documentSettings = documentSettings;
        const settings = this.documentSettings.getSettings();
        const targetSourceDirectory = getTargetSourceDirectory(settings);
        this.targetSourceDirectory = targetSourceDirectory;
        this.pathToAureliaFiles = (_a = settings.aureliaProject) === null || _a === void 0 ? void 0 : _a.pathToAureliaFiles;
        const foundTsConfigFile = ts_morph_1.ts.findConfigFile(
        /* searchPath */ uri_utils_1.UriUtils.toSysPath(targetSourceDirectory), ts_morph_1.ts.sys.fileExists, 'tsconfig.json');
        const foundJsConfigFile = ts_morph_1.ts.findConfigFile(
        /* searchPath */ uri_utils_1.UriUtils.toSysPath(targetSourceDirectory), ts_morph_1.ts.sys.fileExists, 'jsConfig.json');
        let potentialTsConfigPath = 
        // eslint-disable-next-line
        (_b = (settings.pathToTsConfig || foundTsConfigFile || foundJsConfigFile)) !== null && _b !== void 0 ? _b : '';
        // potentialTsConfigPath = UriUtils.normalize(potentialTsConfigPath);
        potentialTsConfigPath = uri_utils_1.UriUtils.toSysPath(potentialTsConfigPath);
        const sourceDirHasTsConfig = potentialTsConfigPath.includes(targetSourceDirectory);
        if (sourceDirHasTsConfig) {
            this.tsconfigPath = potentialTsConfigPath;
        }
    }
    create() {
        const project = createTsMorphProject({
            settings: this.documentSettings.getSettings(),
            targetSourceDirectory: this.targetSourceDirectory,
            tsConfigPath: this.tsconfigPath,
        });
        this.set(project);
        return project;
        // const compilerSettings: ts.CompilerOptions = {
        //   module: ts.ModuleKind.CommonJS,
        //   target: ts.ScriptTarget.ESNext,
        //   // outDir: 'dist',
        //   // emitDecoratorMetadata: true,
        //   // experimentalDecorators: true,
        //   // lib: ['es2017.object', 'es7', 'dom'],
        //   sourceMap: true,
        //   rootDir: '.',
        // };
    }
    get() {
        return this.project;
    }
    set(tsMorphProject) {
        this.project = tsMorphProject;
    }
}
exports.TsMorphProject = TsMorphProject;
function getTargetSourceDirectory(settings) {
    var _a;
    let targetSourceDirectory = '';
    if (((_a = settings === null || settings === void 0 ? void 0 : settings.aureliaProject) === null || _a === void 0 ? void 0 : _a.projectDirectory) !== undefined) {
        targetSourceDirectory = settings.aureliaProject.projectDirectory;
    }
    else {
        targetSourceDirectory = ts_morph_1.ts.sys.getCurrentDirectory();
    }
    return targetSourceDirectory;
}
function createTsMorphProject(customProjectSettings = {
    customCompilerOptions: {},
    tsConfigPath: undefined,
}) {
    var _a;
    const { customCompilerOptions, tsConfigPath, targetSourceDirectory, settings, } = customProjectSettings;
    const pathToAureliaFiles = (_a = settings === null || settings === void 0 ? void 0 : settings.aureliaProject) === null || _a === void 0 ? void 0 : _a.pathToAureliaFiles;
    const allowJs = tsConfigPath == null;
    let finalCompilerOptions = Object.assign(Object.assign({}, customCompilerOptions), { allowJs });
    const configs = ts_morph_1.ts.readConfigFile(tsConfigPath !== null && tsConfigPath !== void 0 ? tsConfigPath : '', ts_morph_1.ts.sys.readFile);
    if ((configs === null || configs === void 0 ? void 0 : configs.config) != null) {
        const config = configs.config;
        const readCompilerOptions = config.compilerOptions;
        finalCompilerOptions = Object.assign(Object.assign(Object.assign({}, finalCompilerOptions), readCompilerOptions), { module: ts_morph_1.ModuleKind.CommonJS, moduleResolution: ts_morph_1.ModuleResolutionKind.NodeJs });
    }
    const project = new ts_morph_1.Project({
        compilerOptions: finalCompilerOptions,
    });
    if (tsConfigPath != null) {
        const normalized = uri_utils_1.UriUtils.toSysPath(tsConfigPath);
        project.addSourceFilesFromTsConfig(normalized);
    }
    if (pathToAureliaFiles != null && pathToAureliaFiles.length > 0) {
        logger.log('Using setting `aureliaProject.pathToAureliaFiles`');
        logger.log(`  Including files based on: ${pathToAureliaFiles.join(', ')}`);
        const finalFiles = [];
        pathToAureliaFiles.forEach((filePath) => {
            const glob = `${filePath}/**/*.js`;
            const matchNodeModules = '**/node_modules/**/*.js';
            const files = fastGlob.sync(glob, {
                cwd: filePath,
                ignore: [matchNodeModules],
            });
            finalFiles.push(...files);
        });
        finalFiles.forEach((file) => {
            // Manually add files, because TSMorph#addSourceFileAtPaths does not provide a exclude for the path globs
            project.addSourceFileAtPath(file);
        });
    }
    // No tsconfigPath means js project?!
    else if (targetSourceDirectory != null) {
        logger.log(`Including files based on: ${targetSourceDirectory}`);
        const glob = `${targetSourceDirectory}/**/*.js`;
        const matchNodeModules = '**/node_modules/**/*.js';
        const files = fastGlob.sync(glob, {
            cwd: targetSourceDirectory,
            ignore: [matchNodeModules],
        });
        files.forEach((file) => {
            // Manually add files, because TSMorph#addSourceFileAtPaths does not provide a exclude for the path globs
            project.addSourceFileAtPath(file);
        });
    }
    return project;
}
exports.createTsMorphProject = createTsMorphProject;
//# sourceMappingURL=AureliaTsMorph.js.map
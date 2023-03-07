"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AureliaProgram = void 0;
require("reflect-metadata");
const ts_morph_1 = require("ts-morph");
const uri_utils_1 = require("../common/view/uri-utils");
const DocumentSettings_1 = require("../configuration/DocumentSettings");
const AureliaComponents_1 = require("./AureliaComponents");
const AureliaTsMorph_1 = require("./tsMorph/AureliaTsMorph");
// const logger = new Logger('AureliaProgram');
/**
 * The AureliaProgram class represents your whole applicaton
 * (aka. program in typescript terminology)
 */
class AureliaProgram {
    constructor(documentSettings) {
        this.documentSettings = documentSettings;
        this.filePaths = [];
        // /* prettier-ignore */ console.log('TCL: AureliaProgram -> constructor -> constructor')
        this.aureliaComponents = new AureliaComponents_1.AureliaComponents(documentSettings);
        this.tsMorphProject = new AureliaTsMorph_1.TsMorphProject(documentSettings);
    }
    initAureliaComponents(projectOptions) {
        this.determineFilePaths(projectOptions);
        this.aureliaComponents.init(this.tsMorphProject.get(), this.getFilePaths());
    }
    /**
     * getProgram gets the current program
     *
     * The program may be undefined if no watcher is present or no program has been initiated yet.
     *
     * This program can change from each call as the program is fetched
     * from the watcher which will listen to IO changes in the tsconfig.
     */
    getProgram() {
        if (this.builderProgram === undefined) {
            throw new Error('No Program');
        }
        return this.builderProgram;
    }
    setProgram(program) {
        this.builderProgram = program;
        this.initAureliaSourceFiles(this.builderProgram);
    }
    /**
     * Get aurelia source files
     */
    getAureliaSourceFiles() {
        if (this.aureliaSourceFiles)
            return this.aureliaSourceFiles;
        this.initAureliaSourceFiles(this.builderProgram);
        return this.aureliaSourceFiles;
    }
    /**
     * Only update aurelia source files with relevant source files
     */
    initAureliaSourceFiles(builderProgram) {
        // [PERF]: ~0.6s
        const sourceFiles = builderProgram.getSourceFiles();
        this.aureliaSourceFiles = sourceFiles === null || sourceFiles === void 0 ? void 0 : sourceFiles.filter((sourceFile) => {
            const isNodeModules = sourceFile.fileName.includes('node_modules');
            return !isNodeModules;
        });
    }
    getFilePaths() {
        return this.filePaths;
    }
    determineFilePaths(projectOptions) {
        if (projectOptions.rootDirectory !== undefined) {
            this.filePaths = getUserConfiguredFilePaths(projectOptions);
            return;
        }
        const sourceFiles = this.getAureliaSourceFiles();
        if (!sourceFiles)
            return;
        const filePaths = sourceFiles.map((file) => uri_utils_1.UriUtils.toSysPath(file.fileName));
        if (filePaths === undefined)
            return;
        this.filePaths = filePaths;
    }
}
exports.AureliaProgram = AureliaProgram;
function getUserConfiguredFilePaths(options = DocumentSettings_1.defaultProjectOptions) {
    const { rootDirectory, exclude, include } = options;
    const targetSourceDirectory = rootDirectory !== null && rootDirectory !== void 0 ? rootDirectory : ts_morph_1.ts.sys.getCurrentDirectory();
    const finalExcludes = getFinalExcludes(exclude);
    const finalIncludes = getFinalIncludes(include);
    const sysPath = uri_utils_1.UriUtils.toSysPath(targetSourceDirectory);
    const paths = ts_morph_1.ts.sys.readDirectory(sysPath, ['ts', 'js'], 
    // ['ts', 'js', 'html'],
    finalExcludes, finalIncludes);
    return paths;
}
function getFinalIncludes(include) {
    let finalIncludes;
    if (include !== undefined) {
        finalIncludes = include;
    }
    else {
        finalIncludes = ['src'];
    }
    return finalIncludes;
}
function getFinalExcludes(exclude) {
    const finalExcludes = [];
    if (exclude === undefined) {
        const defaultExcludes = [
            '**/node_modules',
            'aurelia_project',
            '**/out',
            '**/build',
            '**/dist',
        ];
        finalExcludes.push(...defaultExcludes);
    }
    return finalExcludes;
}
//# sourceMappingURL=AureliaProgram.js.map
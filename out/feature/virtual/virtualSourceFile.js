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
exports.createVirtualFileWithContent = exports.createVirtualViewModelSourceFile = exports.getVirtualLangagueService = exports.createVirtualLanguageService = exports.VIRTUAL_METHOD_NAME = exports.VIRTUAL_SOURCE_FILENAME = void 0;
const ts_morph_1 = require("ts-morph");
const vscode_languageserver_1 = require("vscode-languageserver");
const uri_utils_1 = require("../../common/view/uri-utils");
exports.VIRTUAL_SOURCE_FILENAME = 'virtual.ts';
exports.VIRTUAL_METHOD_NAME = '__vir';
const DEFAULT_VIRTUAL_LANGUAGE_SERVICE_OPTIONS = {};
function createVirtualLanguageService(aureliaProgram, position, document, options = DEFAULT_VIRTUAL_LANGUAGE_SERVICE_OPTIONS) {
    return __awaiter(this, void 0, void 0, function* () {
        const documentUri = document.uri;
        // 1. Get content for virtual file
        let virtualContent = '';
        if (options.region) {
            const region = options.region;
            if (region.sourceCodeLocation === undefined)
                return;
            const { startOffset, endOffset } = region.sourceCodeLocation;
            virtualContent = document.getText().slice(startOffset, endOffset - 1);
        }
        else if (options.virtualContent !== undefined) {
            virtualContent = options.virtualContent;
        }
        if (!virtualContent) {
            throw new Error('No virtual content');
        }
        // 2. Create virtual file
        const virtualFileWithContent = createVirtualFileWithContent(aureliaProgram, documentUri, virtualContent);
        const { virtualSourcefile } = virtualFileWithContent;
        let { virtualCursorIndex } = virtualFileWithContent;
        if (options.startAtBeginningOfMethodInVirtualFile !== undefined) {
            virtualCursorIndex -= virtualContent.length - 1; // -1 to start at beginning of method name;
        }
        const program = aureliaProgram.getProgram();
        if (program === undefined)
            return;
        const languageService = getVirtualLangagueService(virtualSourcefile, program);
        return {
            getCompletionsAtPosition: () => getCompletionsAtPosition(),
            getCompletionEntryDetails: () => getCompletionEntryDetails(),
            getDefinitionAtPosition: () => getDefinitionAtPosition(languageService, virtualSourcefile, virtualCursorIndex),
            getQuickInfoAtPosition: () => getQuickInfoAtPosition(languageService, virtualSourcefile, virtualCursorIndex),
        };
    });
}
exports.createVirtualLanguageService = createVirtualLanguageService;
function getCompletionsAtPosition() {
    // cls.getCompletionsAtPosition(fileName, 132, undefined); /*?*/
}
function getCompletionEntryDetails() {
    // cls.getCompletionEntryDetails( fileName, 190, "toView", undefined, undefined, undefined); /*?*/
}
function getDefinitionAtPosition(languageService, virtualSourcefile, virtualCursorIndex) {
    const defintion = languageService.getDefinitionAtPosition(uri_utils_1.UriUtils.toSysPath(virtualSourcefile.fileName), virtualCursorIndex);
    return defintion;
}
function getQuickInfoAtPosition(languageService, virtualSourcefile, virtualCursorIndex) {
    /**
     * 1.
     * Workaround: The normal ls.getQuickInfoAtPosition returns for objects and arrays just
     * `{}`, that's why we go through `getDefinitionAtPosition`.
     */
    const defintion = languageService.getDefinitionAtPosition(uri_utils_1.UriUtils.toSysPath(virtualSourcefile.fileName), virtualCursorIndex);
    if (!defintion)
        return;
    if (defintion.length > 1) {
        // TODO: Add VSCode warning, to know how to actually handle this case.
        // Currently, I think, only one defintion will be returned.
        throw new Error('Unsupported: Multiple definitions.');
    }
    /**
     * Workaround: Here, we have to substring the desired info from the original **source code**
     * --> hence the naming of this variable.
     *
     * BUG: Method: In using `contextSpan` for methods, the whole method body will be
     * taken into the 'context'
     */
    const span = defintion[0].contextSpan;
    if (!span)
        return;
    const sourceCodeText = virtualSourcefile
        .getText()
        .slice(span === null || span === void 0 ? void 0 : span.start, (span === null || span === void 0 ? void 0 : span.start) + (span === null || span === void 0 ? void 0 : span.length));
    /**
     * 2. Documentation
     */
    const quickInfo = languageService.getQuickInfoAtPosition(uri_utils_1.UriUtils.toSysPath(virtualSourcefile.fileName), virtualCursorIndex);
    let finalDocumentation = '';
    if (quickInfo === undefined)
        return;
    const { documentation } = quickInfo;
    if (Array.isArray(documentation) && documentation.length > 1) {
        finalDocumentation = documentation[0].text;
    }
    /**
     * 3. Result
     * Format taken from VSCode hovering
     */
    const result = '```ts\n' +
        `(${defintion[0].kind}) ${defintion[0].containerName}.${sourceCodeText}` +
        '\n```';
    return {
        contents: {
            kind: vscode_languageserver_1.MarkupKind.Markdown,
            value: result,
        },
        documentation: finalDocumentation,
    };
}
function getVirtualLangagueService(sourceFile, watchProgram) {
    // const compilerSettings = watchProgram?.getCompilerOptions();
    const compilerSettings = {
        // module: 99,
        // skipLibCheck: true,
        // types: ['jasmine'],
        // typeRoots: [
        //   '/home/hdn/dev/work/repo/labfolder-web/labfolder-eln-v2/node_modules/@types',
        // ],
        // removeComments: true,
        // emitDecoratorMetadata: true,
        // experimentalDecorators: true,
        // sourceMap: true,
        // target: 1,
        // lib: ['lib.es2020.d.ts', 'lib.dom.d.ts'],
        // moduleResolution: 2,
        baseUrl: '/home/hdn/dev/work/repo/labfolder-web/labfolder-eln-v2/src',
        // resolveJsonModule: true,
        // allowJs: true,
        // esModuleInterop: true,
        // configFilePath:
        //   '/home/hdn/dev/work/repo/labfolder-web/labfolder-eln-v2/tsconfig.json',
    };
    const watcherProgram = watchProgram;
    const lSHost = {
        getCompilationSettings: () => compilerSettings,
        getScriptFileNames: () => {
            const finalScriptFileName = [uri_utils_1.UriUtils.toSysPath(sourceFile.fileName)];
            return finalScriptFileName;
        },
        getScriptVersion: () => '0',
        getScriptSnapshot: (fileName) => {
            var _a;
            let sourceFileText;
            if (fileName === exports.VIRTUAL_SOURCE_FILENAME) {
                sourceFileText = sourceFile.getText();
            }
            else {
                const sourceFile = watcherProgram === null || watcherProgram === void 0 ? void 0 : watcherProgram.getSourceFile(fileName);
                sourceFileText = (_a = sourceFile === null || sourceFile === void 0 ? void 0 : sourceFile.getText()) !== null && _a !== void 0 ? _a : '';
            }
            return ts_morph_1.ts.ScriptSnapshot.fromString(sourceFileText);
        },
        getCurrentDirectory: () => process.cwd(),
        getDefaultLibFileName: (options) => ts_morph_1.ts.getDefaultLibFilePath(options),
        fileExists: ts_morph_1.ts.sys.fileExists,
        readFile: ts_morph_1.ts.sys.readFile,
        readDirectory: ts_morph_1.ts.sys.readDirectory,
        writeFile: ts_morph_1.ts.sys.writeFile,
    };
    const cls = ts_morph_1.ts.createLanguageService(lSHost, ts_morph_1.ts.createDocumentRegistry());
    return cls;
}
exports.getVirtualLangagueService = getVirtualLangagueService;
/**
 * With a virtual file, get access to file scope juicyness via a virtual progrm.
 *
 * 1. In the virtual view model source file
 * 2. Split up
 *   2.1 Need to visit each node
 *   2.2 (or are we regexing it?)
 *
 * @param originalSourceFile -
 * @param virtualContent -
 * @param targetClassName - Name of the class associated to your view
 */
function createVirtualViewModelSourceFile(originalSourceFile, virtualContent, targetClassName) {
    var _a;
    /** Match [...] export class MyCustomElement { [...] */
    const virtualViewModelContent = originalSourceFile.getText();
    const classDeclaration = 'class ';
    const classNameToOpeningBracketRegex = new RegExp(`${classDeclaration}${targetClassName}(.*?{)`);
    const classNameAndOpeningBracketMatch = classNameToOpeningBracketRegex.exec(virtualViewModelContent);
    if (!classNameAndOpeningBracketMatch) {
        throw new Error(`No match found in File: ${uri_utils_1.UriUtils.toSysPath(originalSourceFile.fileName)} with target class name: ${targetClassName}`);
    }
    /** class Foo >{<-- index */
    const classNameStartIndex = classNameAndOpeningBracketMatch === null || classNameAndOpeningBracketMatch === void 0 ? void 0 : classNameAndOpeningBracketMatch.index;
    const toOpeningBracketLength = (_a = classNameAndOpeningBracketMatch[1]) === null || _a === void 0 ? void 0 : _a.length;
    const classOpeningBracketIndex = classDeclaration.length +
        targetClassName.length +
        classNameStartIndex +
        toOpeningBracketLength;
    /** Split on class MyClass >{< ..otherContent */
    const starter = virtualViewModelContent.slice(0, classOpeningBracketIndex);
    const ender = virtualViewModelContent.slice(classOpeningBracketIndex);
    /**  Create temp content */
    const tempMethodTextStart = `${exports.VIRTUAL_METHOD_NAME}() {this.`;
    const tempMethodTextEnd = '};\n  ';
    const tempMethodText = tempMethodTextStart + virtualContent + tempMethodTextEnd;
    const tempWithContent = starter + tempMethodText + ender;
    const virtualSourcefile = ts_morph_1.ts.createSourceFile(exports.VIRTUAL_SOURCE_FILENAME, tempWithContent, 99);
    const virtualCursorIndex = classOpeningBracketIndex +
        tempMethodTextStart.length +
        virtualContent.length;
    return {
        virtualSourcefile,
        virtualCursorIndex,
    };
}
exports.createVirtualViewModelSourceFile = createVirtualViewModelSourceFile;
function createVirtualFileWithContent(aureliaProgram, documentUri, content) {
    var _a;
    // 1. Get original viewmodel file associated with view
    const componentList = aureliaProgram.aureliaComponents.getAll();
    const targetComponent = componentList.find((component) => {
        if (component.viewFilePath === undefined)
            return false;
        if (component.viewFilePath.length > 0) {
            const targetView = documentUri.includes(component.viewFilePath);
            if (targetView) {
                return targetView;
            }
        }
        if (component.viewModelFilePath.length > 0) {
            const targetViewModel = documentUri.includes(component.viewModelFilePath);
            if (targetViewModel) {
                return targetViewModel;
            }
        }
        return false;
    });
    const targetSourceFile = targetComponent === null || targetComponent === void 0 ? void 0 : targetComponent.sourceFile;
    if (!targetSourceFile) {
        console.log(`No source file found for current view: ${documentUri}`);
        return;
    }
    const customElementClassName = (_a = componentList.find((component) => {
        const result = component.viewModelFilePath ===
            uri_utils_1.UriUtils.toSysPath(targetSourceFile.fileName);
        return result;
    })) === null || _a === void 0 ? void 0 : _a.className;
    if (customElementClassName === undefined)
        return;
    // 2. Create virtual source file
    const virtualViewModelSourceFile = ts_morph_1.ts.createSourceFile(exports.VIRTUAL_SOURCE_FILENAME, targetSourceFile === null || targetSourceFile === void 0 ? void 0 : targetSourceFile.getText(), 99);
    const { virtualCursorIndex, virtualSourcefile } = createVirtualViewModelSourceFile(virtualViewModelSourceFile, content, customElementClassName);
    return {
        virtualCursorIndex,
        virtualSourcefile,
        viewModelFilePath: uri_utils_1.UriUtils.toSysPath(targetSourceFile.fileName),
    };
}
exports.createVirtualFileWithContent = createVirtualFileWithContent;
//# sourceMappingURL=virtualSourceFile.js.map
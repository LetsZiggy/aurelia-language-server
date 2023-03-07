"use strict";
/**
 * File was copied and modified from
 * https://typescript-api-playground.glitch.me/#example=Creating%20a%20ts.Program%20and%20SourceFile%20in%20memory%20for%20testing%20without%20file%20system
 * From the SO question
 * https://stackoverflow.com/questions/50574469/can-i-change-the-sourcefile-of-a-node-using-the-typescript-compiler-api
 */
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
exports.getAureliaVirtualCompletions = exports.getVirtualViewModelCompletionSupplyContent = exports.isAureliaCompletionItem = exports.getVirtualCompletion = void 0;
const ts_morph_1 = require("ts-morph");
const vscode_languageserver_1 = require("vscode-languageserver");
const constants_1 = require("../../common/constants");
const uri_utils_1 = require("../../common/view/uri-utils");
const virtualSourceFile_1 = require("../virtual/virtualSourceFile");
// const logger = new Logger('virtualCompletion');
const PARAMETER_NAME = 'parameterName';
/**
 * Returns the virtual competion. (to be used as real completions)
 */
function getVirtualCompletion(aureliaProgram, virtualSourcefile, positionOfAutocomplete) {
    var _a;
    const program = aureliaProgram.getProgram();
    if (program === undefined) {
        throw new Error('Need program');
    }
    const cls = (0, virtualSourceFile_1.getVirtualLangagueService)(virtualSourcefile, program);
    const virtualSourceFilePath = uri_utils_1.UriUtils.toSysPath(virtualSourcefile.fileName);
    // [PERF]: ~0.25
    const virtualCompletions = (_a = cls
        .getCompletionsAtPosition(virtualSourceFilePath, positionOfAutocomplete, undefined)) === null || _a === void 0 ? void 0 : _a.entries.filter((result) => {
        return !(result === null || result === void 0 ? void 0 : result.name.includes(virtualSourceFile_1.VIRTUAL_METHOD_NAME));
    });
    if (!virtualCompletions) {
        throw new Error('No completions found');
    }
    const virtualCompletionEntryDetails = virtualCompletions
        .map((completion) => {
        return cls.getCompletionEntryDetails(virtualSourceFilePath, positionOfAutocomplete, completion.name, undefined, undefined, undefined, undefined);
    })
        .filter((result) => {
        if (result === undefined)
            return false;
        return !result.name.includes(virtualSourceFile_1.VIRTUAL_METHOD_NAME);
    });
    return { virtualCompletions, virtualCompletionEntryDetails };
}
exports.getVirtualCompletion = getVirtualCompletion;
function isAureliaCompletionItem(completion) {
    if (completion == null)
        return false;
    if (!Array.isArray(completion))
        return false;
    if (completion.length === 0)
        return true;
    if (completion[0].label) {
        return true;
    }
    return false;
}
exports.isAureliaCompletionItem = isAureliaCompletionItem;
function getVirtualViewModelCompletion(aureliaProgram, document, region) {
    return __awaiter(this, void 0, void 0, function* () {
        // 1. From the region get the part, that should be made virtual.
        const documentUri = document.uri;
        if (!region)
            return [];
        if (region.sourceCodeLocation === undefined)
            return [];
        const { startOffset, endOffset } = region.sourceCodeLocation;
        const virtualContent = document.getText().slice(startOffset, endOffset - 1);
        const { virtualSourcefile, virtualCursorIndex } = (0, virtualSourceFile_1.createVirtualFileWithContent)(aureliaProgram, documentUri, virtualContent);
        // 4. Use TLS
        const { virtualCompletions, virtualCompletionEntryDetails } = getVirtualCompletion(aureliaProgram, virtualSourcefile, virtualCursorIndex);
        const entryDetailsMap = {};
        const result = enhanceCompletionItemDocumentation(virtualCompletionEntryDetails, entryDetailsMap, virtualCompletions);
        return result;
    });
}
const DEFAULT_CUSTOMIZE_ENHANCE_DOCUMENTATION = {
    customEnhanceMethodArguments: enhanceMethodArguments,
    omitMethodNameAndBrackets: false,
};
/**
 * Pass in arbitrary content for the virtual file.
 *
 * Cf. getVirtualViewModelCompletion
 * Here, we go by document region
 */
function getVirtualViewModelCompletionSupplyContent(aureliaProgram, virtualContent, targetSourceFile, 
/**
 * Identify the correct class in the view model file
 */
viewModelClassName, customizeEnhanceDocumentation) {
    // 3. Create virtual completion
    const virtualViewModelSourceFile = ts_morph_1.ts.createSourceFile(constants_1.VIRTUAL_SOURCE_FILENAME, targetSourceFile === null || targetSourceFile === void 0 ? void 0 : targetSourceFile.getText(), 99);
    const { virtualSourcefile, virtualCursorIndex } = (0, virtualSourceFile_1.createVirtualViewModelSourceFile)(virtualViewModelSourceFile, virtualContent, viewModelClassName);
    const { virtualCompletions, virtualCompletionEntryDetails } = getVirtualCompletion(aureliaProgram, virtualSourcefile, virtualCursorIndex);
    const entryDetailsMap = {};
    const result = enhanceCompletionItemDocumentation(virtualCompletionEntryDetails, entryDetailsMap, virtualCompletions, customizeEnhanceDocumentation);
    return result;
}
exports.getVirtualViewModelCompletionSupplyContent = getVirtualViewModelCompletionSupplyContent;
function enhanceCompletionItemDocumentation(virtualCompletionEntryDetails, entryDetailsMap, virtualCompletions, customizeEnhanceDocumentation = DEFAULT_CUSTOMIZE_ENHANCE_DOCUMENTATION) {
    const kindMap = {
        [ts_morph_1.ts.ScriptElementKind['memberVariableElement']]: vscode_languageserver_1.CompletionItemKind.Field,
        [ts_morph_1.ts.ScriptElementKind['memberFunctionElement']]: vscode_languageserver_1.CompletionItemKind.Method,
    };
    virtualCompletionEntryDetails.reduce((acc, entryDetail) => {
        var _a, _b;
        if (!entryDetail)
            return acc;
        acc[entryDetail.name] = {
            displayParts: (_a = entryDetail.displayParts) === null || _a === void 0 ? void 0 : _a.map((part) => part.text).join(''),
            documentation: (_b = entryDetail.documentation) === null || _b === void 0 ? void 0 : _b.map((doc) => doc.text).join(''),
            kind: kindMap[entryDetail.kind],
            methodArguments: entryDetail.displayParts
                .filter((part) => part.kind === PARAMETER_NAME)
                .map((part) => part.text),
        };
        return acc;
    }, entryDetailsMap);
    /** ${1: argName1}, ${2: argName2} */
    function createArgCompletion(entryDetail) {
        const result = customizeEnhanceDocumentation.customEnhanceMethodArguments(entryDetail.methodArguments);
        return result;
    }
    const result = virtualCompletions.map((tsCompletion) => {
        var _a, _b, _c;
        const entryDetail = entryDetailsMap[tsCompletion.name];
        const isMethod = entryDetail.kind === vscode_languageserver_1.CompletionItemKind.Method ||
            ((_a = entryDetail.displayParts) === null || _a === void 0 ? void 0 : _a.includes('() => ')); // If variable has function type, treat as method
        /** Default value is just the method name */
        let insertMethodTextWithArguments = tsCompletion.name;
        if (isMethod !== undefined) {
            if ((customizeEnhanceDocumentation === null || customizeEnhanceDocumentation === void 0 ? void 0 : customizeEnhanceDocumentation.omitMethodNameAndBrackets) === true) {
                insertMethodTextWithArguments = createArgCompletion(entryDetail);
            }
            else {
                insertMethodTextWithArguments = `${tsCompletion.name}(${createArgCompletion(entryDetail)})`;
            }
        }
        let insertText;
        if (isMethod !== undefined) {
            insertText = insertMethodTextWithArguments;
        }
        else {
            insertText = tsCompletion.name.replace(/^\$/g, '\\$');
        }
        const completionItem = {
            documentation: {
                kind: vscode_languageserver_1.MarkupKind.Markdown,
                value: (_b = entryDetail.documentation) !== null && _b !== void 0 ? _b : '',
            },
            detail: (_c = entryDetail.displayParts) !== null && _c !== void 0 ? _c : '',
            insertText: insertText,
            insertTextFormat: vscode_languageserver_1.InsertTextFormat.Snippet,
            kind: entryDetail.kind,
            label: tsCompletion.name,
            data: constants_1.AureliaLSP.AureliaCompletionItemDataType,
        };
        /**
          documentation: {
            kind: MarkupKind.Markdown,
            value: documentation,
          },
          detail: `${elementName}`,
          insertText: `${elementName}$2>$1</${elementName}>$0`,
          insertTextFormat: InsertTextFormat.Snippet,
          kind: CompletionItemKind.Class,
          label: `${elementName} (Au Class Declaration)`,
         */
        return completionItem;
    });
    return result;
}
function enhanceMethodArguments(methodArguments) {
    return methodArguments
        .map((argName, index) => {
        return `\${${index + 1}:${argName}}`;
    })
        .join(', ');
}
function getAureliaVirtualCompletions(document, region, aureliaProgram) {
    return __awaiter(this, void 0, void 0, function* () {
        // Virtual file
        let virtualCompletions = [];
        try {
            virtualCompletions = yield getVirtualViewModelCompletion(aureliaProgram, document, region);
        }
        catch (err) {
            console.log('onCompletion 261 TCL: err', err);
        }
        const aureliaVirtualCompletions = virtualCompletions.filter((completion) => {
            const isAureliaRelated = completion.data === constants_1.AureliaLSP.AureliaCompletionItemDataType;
            const isUnrelatedTypescriptCompletion = completion.kind === undefined;
            const wantedResult = isAureliaRelated && !isUnrelatedTypescriptCompletion;
            return wantedResult;
        });
        return aureliaVirtualCompletions;
    });
}
exports.getAureliaVirtualCompletions = getAureliaVirtualCompletions;
//# sourceMappingURL=virtualCompletion.js.map
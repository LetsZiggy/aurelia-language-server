"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.aureliaVirtualComplete_vNext = void 0;
const ts_morph_1 = require("ts-morph");
const vscode_languageserver_1 = require("vscode-languageserver");
const ViewRegions_1 = require("../../aot/parser/regions/ViewRegions");
const constants_1 = require("../../common/constants");
const OffsetUtils_1 = require("../../common/documens/OffsetUtils");
const StringUtils_1 = require("../../common/string/StringUtils");
const DEFAULT_CUSTOMIZE_ENHANCE_DOCUMENTATION = {
    customEnhanceMethodArguments: enhanceMethodArguments,
    omitMethodNameAndBrackets: false,
};
const VIRTUAL_METHOD_NAME = '__vir';
const PARAMETER_NAME = 'parameterName';
function aureliaVirtualComplete_vNext(aureliaProgram, document, region, triggerCharacter, offset, insertTriggerCharacter, completionParams) {
    var _a, _b;
    if (!region)
        return [];
    if (!region.accessScopes)
        return [];
    // Dont allow ` ` (Space) to trigger completions for view model,
    // otherwise it will trigger 800 JS completions too often which takes +1.5secs
    const shouldReturnOnSpace = getShouldReturnOnSpace(completionParams, triggerCharacter);
    if (shouldReturnOnSpace)
        return [];
    const COMPLETIONS_ID = '//AUVSCCOMPL95';
    // 1. Component
    const project = aureliaProgram.tsMorphProject.get();
    const targetComponent = aureliaProgram.aureliaComponents.getOneByFromDocument(document);
    if (!targetComponent)
        return [];
    const sourceFile = project.getSourceFile(targetComponent.viewModelFilePath);
    if (sourceFile == null)
        return [];
    const sourceFilePath = sourceFile.getFilePath();
    const myClass = sourceFile.getClass(targetComponent === null || targetComponent === void 0 ? void 0 : targetComponent.className);
    // 2.1 Transform view content to virtual view model
    // 2.1.1 Add `this.`
    // region; /* ? */
    const virtualContent = getVirtualContentFromRegion(region, offset, triggerCharacter, insertTriggerCharacter);
    // virtualContent; /*?*/
    // 2.2 Perform completions
    // 2.2.1 Differentiate Interpolation
    let interpolationModifier = 0;
    let targetStatementText = `${virtualContent}${COMPLETIONS_ID}`;
    if (((_a = virtualContent.match(constants_1.interpolationRegex)) === null || _a === void 0 ? void 0 : _a.length) != null) {
        targetStatementText = `\`${virtualContent}\`${COMPLETIONS_ID}`;
        interpolationModifier = 2; // - 2 we added "\`" because regionValue is ${}, thus in virtualContent we need to do `${}`
    }
    let targetStatement;
    try {
        const virMethod = myClass === null || myClass === void 0 ? void 0 : myClass.addMethod({
            name: VIRTUAL_METHOD_NAME,
            statements: [targetStatementText],
        });
        targetStatement = virMethod === null || virMethod === void 0 ? void 0 : virMethod.getStatements()[0];
    }
    catch (error) {
        // Dont pass on ts-morph error
        return [];
    }
    if (!targetStatement)
        return [];
    const finalTargetStatementText = `${targetStatement.getFullText()}${COMPLETIONS_ID}`;
    const targetPos = finalTargetStatementText === null || finalTargetStatementText === void 0 ? void 0 : finalTargetStatementText.indexOf(COMPLETIONS_ID);
    const finalPos = targetStatement.getPos() + targetPos - interpolationModifier;
    // sourceFile.getText(); /* ? */
    // sourceFile.getText().length /* ? */
    // sourceFile.getText().substr(finalPos - 1, 30); /* ? */
    // sourceFile.getText().substr(finalPos - 9, 30); /* ? */
    const languageService = project.getLanguageService().compilerObject;
    // Completions
    const virtualCompletions = (_b = languageService
        .getCompletionsAtPosition(sourceFilePath.replace('file:///', 'file:/'), finalPos, {})) === null || _b === void 0 ? void 0 : _b.entries.filter((result) => {
        return !(result === null || result === void 0 ? void 0 : result.name.includes(VIRTUAL_METHOD_NAME));
    });
    if (!virtualCompletions)
        return [];
    // virtualCompletions /* ? */
    const virtualCompletionEntryDetails = virtualCompletions
        .map((completion) => {
        return languageService.getCompletionEntryDetails(sourceFilePath.replace('file:///', 'file:/'), finalPos, completion.name, undefined, undefined, undefined, undefined);
    })
        .filter((result) => {
        if (result === undefined)
            return false;
        return !result.name.includes(VIRTUAL_METHOD_NAME);
    });
    const entryDetailsMap = {};
    const result = enhanceCompletionItemDocumentation(virtualCompletionEntryDetails, entryDetailsMap, virtualCompletions);
    try {
        targetStatement === null || targetStatement === void 0 ? void 0 : targetStatement.remove();
    }
    catch (error) {
        // Dont pass on ts-morph error
        return [];
    }
    return result;
}
exports.aureliaVirtualComplete_vNext = aureliaVirtualComplete_vNext;
function getVirtualContentFromRegion(region, offset, triggerCharacter, insertTriggerCharacter) {
    var _a;
    if (offset == null)
        return '';
    // triggerCharacter; /* ? */
    // offset; /* ? */
    let viewInput = '';
    const isInterpolationRegion = ViewRegions_1.AbstractRegion.isInterpolationRegion(region);
    if (isInterpolationRegion) {
        viewInput = region.regionValue;
    }
    else if (ViewRegions_1.RepeatForRegion.is(region)) {
        const { iterableStartOffset, iterableEndOffset } = region.data;
        const isIterableRegion = OffsetUtils_1.OffsetUtils.isIncluded(iterableStartOffset, iterableEndOffset, offset);
        if (isIterableRegion) {
            viewInput = region.data.iterableName;
        }
    }
    else {
        viewInput = region.attributeValue;
    }
    const normalizedOffset = offset - region.sourceCodeLocation.startOffset;
    // Add triggerCharacter at offset
    if (insertTriggerCharacter) {
        const insertLocation = normalizedOffset - 1; // - 1: insert one before
        viewInput = StringUtils_1.StringUtils.insert(viewInput, insertLocation, triggerCharacter);
    }
    // Cut off content after offset
    const cutOff = viewInput === null || viewInput === void 0 ? void 0 : viewInput.substring(0, normalizedOffset);
    // Readd `}`
    const ending = ViewRegions_1.AbstractRegion.isInterpolationRegion(region) ? '}' : '';
    const removeWhitespaceAtEnd = `${cutOff}${ending}`;
    // viewInput; /* ? */
    let virtualContent = removeWhitespaceAtEnd;
    (_a = region.accessScopes) === null || _a === void 0 ? void 0 : _a.forEach((scope) => {
        const accessScopeName = scope.name;
        if (accessScopeName === '')
            return;
        const replaceRegexp = new RegExp(`\\b${accessScopeName}\\b`, 'g');
        const alreadyHasThis = checkAlreadyHasThis(virtualContent, accessScopeName);
        if (alreadyHasThis)
            return;
        virtualContent = virtualContent === null || virtualContent === void 0 ? void 0 : virtualContent.replace(replaceRegexp, (match) => {
            return `this.${match}`;
        });
    });
    // 2.1.2 Defalut to any class member
    const isEmptyInterpolation = getIsEmptyInterpolation(virtualContent);
    const shouldDefault = virtualContent === undefined ||
        virtualContent.trim() === '' ||
        isEmptyInterpolation;
    if (shouldDefault) {
        virtualContent = 'this.';
    }
    virtualContent; /* ? */
    // 2.1.3 Return if no `this.` included, because we don't want (do we?) support any Javascript completion
    if (!virtualContent.includes('this.'))
        return '';
    return virtualContent;
}
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
                .filter((part) => (part === null || part === void 0 ? void 0 : part.kind) === PARAMETER_NAME)
                .map((part) => part === null || part === void 0 ? void 0 : part.text),
        };
        return acc;
    }, entryDetailsMap);
    /** ${1: argName1}, ${2: argName2} */
    function createArgCompletion(entryDetail) {
        const result = customizeEnhanceDocumentation.customEnhanceMethodArguments(entryDetail.methodArguments);
        return result;
    }
    const result = virtualCompletions.map((tsCompletion) => {
        var _a, _b, _c, _d;
        const entryDetail = (_a = entryDetailsMap[tsCompletion.name]) !== null && _a !== void 0 ? _a : {};
        const isMethod = entryDetail.kind === vscode_languageserver_1.CompletionItemKind.Method ||
            ((_b = entryDetail.displayParts) === null || _b === void 0 ? void 0 : _b.includes('() => ')); // If variable has function type, treat as method
        /** Default value is just the method name */
        let insertMethodTextWithArguments = tsCompletion.name;
        if (isMethod === true) {
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
                value: (_c = entryDetail.documentation) !== null && _c !== void 0 ? _c : '',
            },
            detail: (_d = entryDetail.displayParts) !== null && _d !== void 0 ? _d : '',
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
function checkAlreadyHasThis(virtualContent, accessScopeName) {
    if (virtualContent == null)
        return false;
    const checkHasThisRegex = new RegExp(`\\b(this.${accessScopeName})\\b`);
    const has = checkHasThisRegex.exec(virtualContent !== null && virtualContent !== void 0 ? virtualContent : '');
    return Boolean(has);
}
function getIsEmptyInterpolation(virtualContent) {
    const withoutSpace = virtualContent.replace(/\s/g, '');
    const isSimplestInterpolation = withoutSpace === '${}';
    return isSimplestInterpolation;
}
function getShouldReturnOnSpace(completionParams, triggerCharacter) {
    var _a;
    const isSpace = triggerCharacter === constants_1.TemplateAttributeTriggers.SPACE;
    const shouldReturn = isSpace &&
        ((_a = completionParams === null || completionParams === void 0 ? void 0 : completionParams.context) === null || _a === void 0 ? void 0 : _a.triggerKind) !== vscode_languageserver_1.CompletionTriggerKind.Invoked;
    return shouldReturn;
}
//# sourceMappingURL=virtualCompletion2.js.map
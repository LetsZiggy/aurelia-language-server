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
exports.createValueConverterCompletion = exports.getBindablesCompletion = exports.createComponentCompletionList = exports.createClassCompletionItem = exports.createCompletionItem = void 0;
const lodash_1 = require("lodash");
const typescript_1 = require("typescript");
const vscode_languageserver_1 = require("vscode-languageserver");
const constants_1 = require("../../common/constants");
function createCompletionItem(classMember, componentName) {
    const { name, syntaxKind, isBindable, documentation } = classMember;
    const varAsKebabCase = (0, lodash_1.kebabCase)(name);
    const quote = '"';
    const kind = syntaxKind === typescript_1.SyntaxKind.MethodDeclaration
        ? vscode_languageserver_1.CompletionItemKind.Method
        : vscode_languageserver_1.CompletionItemKind.Field;
    const result = {
        documentation: {
            kind: vscode_languageserver_1.MarkupKind.Markdown,
            value: documentation,
        },
        detail: `${isBindable ? name : varAsKebabCase}`,
        insertText: isBindable
            ? `${varAsKebabCase}.$\{1:bind}=${quote}$\{0:${name}}${quote}`
            : name,
        insertTextFormat: vscode_languageserver_1.InsertTextFormat.Snippet,
        kind,
        label: '' +
            `(Au ${isBindable ? 'Bindable' : 'Class member'}) ` +
            `${isBindable ? varAsKebabCase : name}`,
        data: {
            elementName: componentName,
        },
    };
    return result;
}
exports.createCompletionItem = createCompletionItem;
function createClassCompletionItem(aureliaComponent) {
    const { documentation, componentName, className, viewFilePath } = aureliaComponent;
    const finalName = componentName !== null && componentName !== void 0 ? componentName : className;
    const result = {
        documentation: {
            kind: vscode_languageserver_1.MarkupKind.Markdown,
            value: documentation,
        },
        detail: `${finalName}`,
        insertText: `${finalName}$2>$1</${finalName}>$0`,
        insertTextFormat: vscode_languageserver_1.InsertTextFormat.Snippet,
        kind: vscode_languageserver_1.CompletionItemKind.Class,
        label: `(Au Class) ${finalName}`,
        data: { templateImportPath: viewFilePath },
    };
    return result;
}
exports.createClassCompletionItem = createClassCompletionItem;
function createComponentCompletionList(aureliaComponentList) {
    const result = aureliaComponentList.map((component) => {
        return createClassCompletionItem(component);
    });
    return result;
}
exports.createComponentCompletionList = createComponentCompletionList;
function getBindablesCompletion(aureliaProgram, document, region) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!region)
            return [];
        const bindableList = aureliaProgram.aureliaComponents.getBindables();
        const asCompletionItem = bindableList.map((bindable) => {
            const result = createCompletionItem(bindable.classMember, bindable.componentName);
            return result;
        });
        const targetBindables = asCompletionItem.filter((bindable) => {
            // eslint-disable-next-line
            return (0, lodash_1.kebabCase)(bindable.data.elementName) === region.tagName;
        });
        return targetBindables;
    });
}
exports.getBindablesCompletion = getBindablesCompletion;
function createValueConverterCompletion(aureliaProgram) {
    const valueConverterCompletionList = aureliaProgram.aureliaComponents
        .getAll()
        .filter((component) => component.type === constants_1.AureliaClassTypes.VALUE_CONVERTER)
        .map((valueConverterComponent) => {
        var _a;
        const elementName = (_a = valueConverterComponent.valueConverterName) !== null && _a !== void 0 ? _a : '';
        const result = {
            documentation: {
                kind: vscode_languageserver_1.MarkupKind.Markdown,
                value: 'doc todod',
            },
            detail: `${elementName}`,
            insertText: `${elementName}`,
            insertTextFormat: vscode_languageserver_1.InsertTextFormat.Snippet,
            kind: vscode_languageserver_1.CompletionItemKind.Class,
            label: `(Au VC) ${valueConverterComponent.className}`,
            data: {
                type: constants_1.AureliaClassTypes.VALUE_CONVERTER,
                valueConverterName: valueConverterComponent.valueConverterName,
            },
        };
        return result;
    });
    return valueConverterCompletionList;
}
exports.createValueConverterCompletion = createValueConverterCompletion;
//# sourceMappingURL=completions.js.map
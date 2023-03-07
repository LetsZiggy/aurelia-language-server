"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createAureliaTemplateAttributeCompletions = exports.createAureliaTemplateAttributeKeywordCompletions = void 0;
const vscode_languageserver_1 = require("vscode-languageserver");
const constants_1 = require("../../common/constants");
function createAureliaTemplateAttributeKeywordCompletions(nextChar) {
    const result = constants_1.AURELIA_TEMPLATE_ATTRIBUTE_KEYWORD_LIST.map((keyword) => {
        const completionItem = vscode_languageserver_1.CompletionItem.create(keyword);
        const suffix = nextChar === '=' ? '' : '="$0"';
        const insertText = `${keyword}${suffix}`;
        // const insertText = `\${1|${keyword},bind,two-way,from-view,to-view,one-time|}${suffix}`;
        completionItem.insertText = insertText;
        completionItem.insertTextFormat = vscode_languageserver_1.InsertTextFormat.Snippet;
        return completionItem;
    });
    return result;
}
exports.createAureliaTemplateAttributeKeywordCompletions = createAureliaTemplateAttributeKeywordCompletions;
function createAureliaTemplateAttributeCompletions() {
    const keywords = constants_1.AURELIA_WITH_SPECIAL_KEYWORD.map(([keyword, suffix]) => {
        const completionItem = vscode_languageserver_1.CompletionItem.create(keyword);
        const insertText = `${keyword}${suffix}`;
        completionItem.insertText = insertText;
        completionItem.insertTextFormat = vscode_languageserver_1.InsertTextFormat.Snippet;
        completionItem.label = keyword;
        return completionItem;
    });
    const keywordsV2 = constants_1.AURELIA_WITH_SPECIAL_KEYWORD_V2.map(([keyword, suffix]) => {
        const completionItem = vscode_languageserver_1.CompletionItem.create(keyword);
        const insertText = `${keyword}${suffix}`;
        completionItem.insertText = insertText;
        completionItem.insertTextFormat = vscode_languageserver_1.InsertTextFormat.Snippet;
        completionItem.label = `(Au2) ${keyword}`;
        return completionItem;
    });
    const eventsWithDelegate = constants_1.AURELIA_ATTRIBUTE_WITH_DELEGATE_KEYWORD.map((attribute) => {
        const completionItem = vscode_languageserver_1.CompletionItem.create(attribute);
        const insertText = `${attribute}.delegate="$0"`;
        // const insertText = `${attribute}.\${1|delegate,trigger|}="$0"`;
        completionItem.insertText = insertText;
        completionItem.insertTextFormat = vscode_languageserver_1.InsertTextFormat.Snippet;
        completionItem.label = `${attribute}.delegate`;
        return completionItem;
    });
    const eventsWithTrigger = constants_1.AURELIA_ATTRIBUTE_WITH_TRIGGER_KEYWORD.map((attribute) => {
        const completionItem = vscode_languageserver_1.CompletionItem.create(attribute);
        const insertText = `${attribute}.trigger="$0"`;
        // const insertText = `${attribute}.\${1|delegate,trigger|}="$0"`;
        completionItem.insertText = insertText;
        completionItem.insertTextFormat = vscode_languageserver_1.InsertTextFormat.Snippet;
        completionItem.label = `${attribute}.trigger`;
        return completionItem;
    });
    const attributesWithBind = constants_1.AURELIA_ATTRIBUTE_WITH_BIND_KEYWORD.map((attributeWithBind) => {
        const completionItem = vscode_languageserver_1.CompletionItem.create(attributeWithBind);
        const insertText = `${attributeWithBind}.bind="$0"`;
        // const insertText = `${attributeWithBind}.\${1|bind,two-way,from-view,to-view,one-time|}="$0"`;
        completionItem.insertText = insertText;
        completionItem.insertTextFormat = vscode_languageserver_1.InsertTextFormat.Snippet;
        completionItem.label = `${attributeWithBind}.bind`;
        return completionItem;
    });
    const result = [
        ...constants_1.AURELIA_COMPLETION_ITEMS_V2,
        ...keywords,
        ...keywordsV2,
        ...eventsWithDelegate,
        ...eventsWithTrigger,
        ...attributesWithBind,
    ];
    return result;
}
exports.createAureliaTemplateAttributeCompletions = createAureliaTemplateAttributeCompletions;
//# sourceMappingURL=createAureliaTemplateAttributeCompletions.js.map
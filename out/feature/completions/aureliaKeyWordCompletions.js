"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AURELIA_KEY_WORD_COMPLETIONS = void 0;
/* eslint-disable no-template-curly-in-string */
const vscode_languageserver_1 = require("vscode-languageserver");
const constants_1 = require("../../common/constants");
exports.AURELIA_KEY_WORD_COMPLETIONS = [
    {
        data: constants_1.AureliaVersion.V1,
        detail: 'Require',
        insertText: 'require from="$1"></require>',
        insertTextFormat: vscode_languageserver_1.InsertTextFormat.Snippet,
        kind: vscode_languageserver_1.CompletionItemKind.Property,
        label: '(Au1) require',
        documentation: {
            kind: vscode_languageserver_1.MarkupKind.Markdown,
            value: `Allows importing of references in HTML

      <require from="$1"></require>
      `,
        },
    },
    {
        data: constants_1.AureliaVersion.V2,
        detail: 'Import',
        insertText: 'import from="$1"></import>',
        insertTextFormat: vscode_languageserver_1.InsertTextFormat.Snippet,
        kind: vscode_languageserver_1.CompletionItemKind.Property,
        label: '(Au2) import',
        documentation: {
            kind: vscode_languageserver_1.MarkupKind.Markdown,
            value: `Allows importing of references in HTML

      <import from="$1"></import>
      `,
        },
    },
    {
        data: constants_1.AureliaVersion.V2,
        detail: 'Aurelia Slot - Default',
        label: '(Au2) au-slot (default)',
        kind: vscode_languageserver_1.CompletionItemKind.Property,
        insertText: 'au-slot></au-slot>',
        documentation: {
            kind: vscode_languageserver_1.MarkupKind.Markdown,
            value: `

      <au-slot></au-slot>
      `,
        },
    },
    {
        data: constants_1.AureliaVersion.V2,
        detail: 'Aurelia Slot - Named',
        label: '(Au2) au-slot (named)',
        kind: vscode_languageserver_1.CompletionItemKind.Property,
        insertText: 'au-slot name="${name}"></au-slot>',
        documentation: {
            kind: vscode_languageserver_1.MarkupKind.Markdown,
            value: `

      <au-slot name="\${name}"></au-slot>
      `,
        },
    },
    {
        data: constants_1.AureliaVersion.V2,
        detail: 'Aurelia Viewport',
        label: '(Au2) au-viewport',
        kind: vscode_languageserver_1.CompletionItemKind.Property,
        insertText: 'au-viewport></au-viewport>',
        documentation: {
            kind: vscode_languageserver_1.MarkupKind.Markdown,
            value: `

      <au-viewport></au-viewport>
      `,
        },
    },
    {
        data: constants_1.AureliaVersion.V2,
        detail: 'Aurelia Viewport With Default',
        label: '(Au2) au-viewport (default)',
        kind: vscode_languageserver_1.CompletionItemKind.Property,
        insertText: 'au-viewport default="${name}"></au-viewport>',
        documentation: {
            kind: vscode_languageserver_1.MarkupKind.Markdown,
            value: `

      <au-viewport default="\${name}"></au-viewport>
      `,
        },
    },
    {
        data: constants_1.AureliaVersion.V2,
        detail: 'Aurelia Viewport With Default + Parameter',
        label: '(Au2) au-viewport (default+params)',
        kind: vscode_languageserver_1.CompletionItemKind.Property,
        insertText: 'au-viewport default="${name}(id=${id})"></au-viewport>',
        documentation: {
            kind: vscode_languageserver_1.MarkupKind.Markdown,
            value: `Aurelia Viewport With Default + Parameter

      <au-viewport default="\${name}(id=\${id})"></au-viewport>
      `,
        },
    },
];
//# sourceMappingURL=aureliaKeyWordCompletions.js.map
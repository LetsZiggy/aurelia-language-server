"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CodeActionMap = exports.AURELIA_COMMANDS = exports.EXTENSION_COMMAND_PREFIX = exports.interpolationRegex = exports.whiteSpaceRegex = exports.WORD_SEPARATORS_REGEX_STRING = exports.WORD_SEPARATORS = exports.AureliaLSP = exports.AureliaDecorator = exports.AureliaView = exports.AureliaViewModel = exports.AureliaClassTypes = exports.AURELIA_TEMPLATE_ATTRIBUTE_KEYWORD_LIST = exports.AURELIA_TEMPLATE_ATTRIBUTE_TRIGGER_CHARACTER = exports.AURELIA_COMPLETION_ITEMS_V2 = exports.AURELIA_WITH_SPECIAL_KEYWORD_V2 = exports.AURELIA_WITH_SPECIAL_KEYWORD = exports.AURELIA_ATTRIBUTE_WITH_DELEGATE_KEYWORD = exports.AURELIA_ATTRIBUTE_WITH_TRIGGER_KEYWORD = exports.AURELIA_ATTRIBUTE_WITH_BIND_KEYWORD = exports.AureliaVersion = exports.TemplateAttributeTriggers = exports.AURELIA_TEMPLATE_ATTRIBUTE_CHARACTER = exports.VIRTUAL_SOURCE_FILENAME = exports.TEMPLATE_TAG_NAME = exports.VALUE_CONVERTER_SUFFIX = exports.CUSTOM_ELEMENT_SUFFIX = exports.WARNING_MESSAGE = void 0;
const vscode_languageserver_1 = require("vscode-languageserver");
const vscode_languageserver_types_1 = require("vscode-languageserver-types");
exports.WARNING_MESSAGE = new vscode_languageserver_1.RequestType('warning-message');
exports.CUSTOM_ELEMENT_SUFFIX = 'CustomElement';
exports.VALUE_CONVERTER_SUFFIX = 'ValueConverter';
exports.TEMPLATE_TAG_NAME = 'template';
exports.VIRTUAL_SOURCE_FILENAME = 'virtual.ts';
exports.AURELIA_TEMPLATE_ATTRIBUTE_CHARACTER = ' ';
var TemplateAttributeTriggers;
(function (TemplateAttributeTriggers) {
    TemplateAttributeTriggers["SPACE"] = " ";
    TemplateAttributeTriggers["DOT"] = ".";
})(TemplateAttributeTriggers = exports.TemplateAttributeTriggers || (exports.TemplateAttributeTriggers = {}));
var AureliaVersion;
(function (AureliaVersion) {
    AureliaVersion["V1"] = "V1";
    AureliaVersion["V2"] = "V2";
    AureliaVersion["ALL"] = "ALL";
})(AureliaVersion = exports.AureliaVersion || (exports.AureliaVersion = {}));
exports.AURELIA_ATTRIBUTE_WITH_BIND_KEYWORD = [
    'accesskey',
    'class',
    'contenteditable',
    'contextmenu',
    'data-*',
    'dir',
    'id',
    'lang',
    'slot',
    'style',
    'tabindex',
    'title',
    'translate',
    'innerhtml',
    'textcontent',
];
exports.AURELIA_ATTRIBUTE_WITH_TRIGGER_KEYWORD = [
    'blur',
    'focus',
    'load',
    'unload',
];
exports.AURELIA_ATTRIBUTE_WITH_DELEGATE_KEYWORD = [
    'cached',
    'error',
    'abort',
    'beforeunload',
    'online',
    'offline',
    'animationstart',
    'animationend',
    'animationiteration',
    'reset',
    'compositionstart',
    'compositionupdate',
    'compositionend',
    'cut',
    'copy',
    'paste',
    'keydown',
    'keyup',
    'mouseenter',
    'mouseover',
    'mousemove',
    'mousedown',
    'mouseup',
    'click',
    'dblclick',
    'contextmenu',
    'wheel',
    'mouseleave',
    'mouseout',
    'select',
    'dragstart',
    'drag',
    'dragend',
    'dragenter',
    'dragover',
    'dragleave',
    'drop',
    'touchcancel',
    'touchend',
    'touchmove',
    'touchstart',
    'pointerover',
    'pointerenter',
    'pointerdown',
    'pointermove',
    'pointerup',
    'pointercancel',
    'pointerout',
    'pointerleave',
    'gotpointercapture',
    'lostpointercapture',
];
exports.AURELIA_WITH_SPECIAL_KEYWORD = [
    ['repeat.for', '="$1 of $0"'],
    ['element.ref', '="$0"'],
    ['view-model.ref', '="$0"'],
    ['view.ref', '="$0"'],
    ['controller.ref', '="$0"'],
    ['show.bind', '="$0"'],
    ['if.bind', '="$0"'],
    ['with.bind', '="$0"'],
    ['as-element', '="$0"'],
    ['ref', '="$0"'],
    ['view-spy', '="$0"'],
    ['compile-spy', '="$0"'],
    ['else', ''],
];
exports.AURELIA_WITH_SPECIAL_KEYWORD_V2 = [
    ['switch.bind', '="$0"'],
    ['case', '="$0"'],
    ['default-case', '="$0"'],
    ['promise.bind', '="$0"'],
    ['pending', '="$0"'],
    ['then.from-view', '="$0"'],
    ['catch.from-view', '="$0"'],
    ['portal', '="$0"'],
    ['property', '="$0"'], // local templates
];
exports.AURELIA_COMPLETION_ITEMS_V2 = [
    {
        data: AureliaVersion.V2,
        detail: 'Aurelia As Custom Element',
        label: '(Au2) as-custom-element',
        kind: vscode_languageserver_types_1.CompletionItemKind.Property,
        insertText: 'as-custom-element="${0:elementName}"',
        insertTextFormat: vscode_languageserver_1.InsertTextFormat.Snippet,
        documentation: {
            kind: vscode_languageserver_types_1.MarkupKind.Markdown,
            value: 'Makes a tag inerit the view model of the as custom element.',
        },
    },
];
exports.AURELIA_TEMPLATE_ATTRIBUTE_TRIGGER_CHARACTER = '.';
exports.AURELIA_TEMPLATE_ATTRIBUTE_KEYWORD_LIST = [
    'bind',
    'to-view',
    'from-view',
    'two-way',
    'one-time',
    'call',
    'delegate',
    'trigger',
];
var AureliaClassTypes;
(function (AureliaClassTypes) {
    AureliaClassTypes["CUSTOM_ELEMENT"] = "CustomElement";
    AureliaClassTypes["VALUE_CONVERTER"] = "ValueConverter";
})(AureliaClassTypes = exports.AureliaClassTypes || (exports.AureliaClassTypes = {}));
var AureliaViewModel;
(function (AureliaViewModel) {
    AureliaViewModel["TO_VIEW"] = "toView";
    AureliaViewModel["TEMPLATE"] = "template";
})(AureliaViewModel = exports.AureliaViewModel || (exports.AureliaViewModel = {}));
var AureliaView;
(function (AureliaView) {
    AureliaView["BINDABLE"] = "bindable";
    AureliaView["IF"] = "if";
    AureliaView["IMPORT"] = "import";
    AureliaView["IMPORT_FROM_ATTRIBUTE"] = "from";
    AureliaView["TEMPLATE_TAG_NAME"] = "template";
    AureliaView["REPEAT_FOR"] = "repeat.for";
    AureliaView["REQUIRE"] = "require";
    AureliaView["VALUE_CONVERTER_OPERATOR"] = "|";
    AureliaView["VALUE_CONVERTER_ARGUMENT"] = ":";
})(AureliaView = exports.AureliaView || (exports.AureliaView = {}));
var AureliaDecorator;
(function (AureliaDecorator) {
    AureliaDecorator["CUSTOM_ELEMENT"] = "@customElement";
    AureliaDecorator["VALUE_CONVERTER"] = "@valueConverter";
    AureliaDecorator["USE_VIEW"] = "@useView";
    AureliaDecorator["NO_VIEW"] = "@noView";
})(AureliaDecorator = exports.AureliaDecorator || (exports.AureliaDecorator = {}));
var AureliaLSP;
(function (AureliaLSP) {
    /** [c]ompletion [i]tem [d]ata [t]ype -> cidt */
    AureliaLSP["AureliaCompletionItemDataType"] = "AURELIA_CIDT";
})(AureliaLSP = exports.AureliaLSP || (exports.AureliaLSP = {}));
exports.WORD_SEPARATORS = '`~!@#%^&*()=+[{]}|;:\'",.<>/?'; // removed -,$
exports.WORD_SEPARATORS_REGEX_STRING = '\\`\\~\\!\\@\\#\\%\\^\\&\\*\\(\\)\\-\\=\\+\\[\\{\\]\\}\\|\\;\\:\'\\"\\,\\.\\<\\>\\/\\?';
exports.whiteSpaceRegex = /[\s\r\n\t]/;
exports.interpolationRegex = /\$(?:\s*)\{(?!\s*`)(.*?)\}/g;
exports.EXTENSION_COMMAND_PREFIX = 'extension.au';
exports.AURELIA_COMMANDS = [
    'extension.au.refactor.aTag',
    // 'extension.au.extract.component',
    'extension.au.reloadExtension',
    'extension.extractComponent',
    'extension.declareViewModelVariable'
];
exports.CodeActionMap = {
    'extract.component': {
        command: 'extension.au.extract.component',
        title: 'Au: Extract Component 🟪',
    },
    'refactor.aTag': {
        command: 'extension.au.refactor.aTag',
        title: 'Au: Convert to import tag 🟪',
        newText: 'import',
        newAttribute: 'from',
    },
};
//# sourceMappingURL=constants.js.map
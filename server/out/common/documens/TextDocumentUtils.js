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
exports.isViewModelDocument = exports.TextDocumentUtils = void 0;
const fs = __importStar(require("fs"));
const vscode_languageserver_textdocument_1 = require("vscode-languageserver-textdocument");
const DocumentSettings_1 = require("../../configuration/DocumentSettings");
const uri_utils_1 = require("../view/uri-utils");
class TextDocumentUtils {
    static createFromPath(path, languageId = 'html') {
        const content = fs.readFileSync(path, 'utf-8');
        const document = vscode_languageserver_textdocument_1.TextDocument.create(uri_utils_1.UriUtils.toVscodeUri(path), languageId, 0, content);
        return document;
    }
    static createViewModelFromPath(path) {
        const pathStat = fs.statSync(path);
        if (!pathStat.isFile())
            return;
        const content = fs.readFileSync(path, 'utf-8');
        const document = vscode_languageserver_textdocument_1.TextDocument.create(uri_utils_1.UriUtils.toVscodeUri(path), 'html', 0, content);
        return document;
    }
    static createHtmlFromUri({ uri }, allDocuments) {
        const openDocument = allDocuments === null || allDocuments === void 0 ? void 0 : allDocuments.get(uri);
        if (openDocument) {
            return openDocument;
        }
        const content = fs.readFileSync(uri_utils_1.UriUtils.toSysPath(uri), 'utf-8');
        const document = vscode_languageserver_textdocument_1.TextDocument.create(uri, 'html', 0, content);
        return document;
    }
    static createHtmlFromPath(path) {
        const pathStat = fs.statSync(path);
        if (!pathStat.isFile())
            return;
        const content = fs.readFileSync(path, 'utf-8');
        const document = vscode_languageserver_textdocument_1.TextDocument.create(uri_utils_1.UriUtils.toVscodeUri(path), 'html', 0, content);
        return document;
    }
}
exports.TextDocumentUtils = TextDocumentUtils;
function isViewModelDocument(document, documentSettings) {
    var _a;
    let settings;
    if (documentSettings instanceof DocumentSettings_1.DocumentSettings) {
        settings = documentSettings.getSettings();
    }
    else {
        settings = documentSettings;
    }
    const scriptExtensions = (_a = settings === null || settings === void 0 ? void 0 : settings.relatedFiles) === null || _a === void 0 ? void 0 : _a.script;
    const isScript = scriptExtensions === null || scriptExtensions === void 0 ? void 0 : scriptExtensions.find((extension) => document.uri.endsWith(extension));
    return Boolean(isScript);
}
exports.isViewModelDocument = isViewModelDocument;
//# sourceMappingURL=TextDocumentUtils.js.map
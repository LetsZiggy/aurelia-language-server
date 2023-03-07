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
exports.WorkspaceUpdates = exports.getEditorSelection = void 0;
const vscode_languageserver_1 = require("vscode-languageserver");
const vscode_languageserver_2 = require("vscode-languageserver");
const vscode_languageserver_protocol_1 = require("vscode-languageserver-protocol");
const server_1 = require("../../server");
function getEditorSelection(connection) {
    return __awaiter(this, void 0, void 0, function* () {
        const req = new vscode_languageserver_1.RequestType('get-editer-selections');
        const getEditorResponse = (yield connection.sendRequest(req));
        return getEditorResponse;
    });
}
exports.getEditorSelection = getEditorSelection;
/**
 * from https://stackoverflow.com/questions/57787621/how-to-create-and-edit-a-new-file-in-the-workspace-via-language-server-extension
 */
class WorkspaceUpdates {
    constructor() {
        this._wschanges = new vscode_languageserver_protocol_1.WorkspaceChange();
    }
    getEdits() {
        return this._wschanges.edit;
    }
    hasChanges() {
        return (this._wschanges.edit.changes != undefined ||
            this._wschanges.edit.documentChanges != undefined);
    }
    createFile(uri, contents, overwrite = false) {
        this._wschanges.createFile(uri, { overwrite: overwrite });
        const edit = this._wschanges.edit;
        const change = this._wschanges.getTextEditChange(vscode_languageserver_2.OptionalVersionedTextDocumentIdentifier.create(uri, null));
        this.insertText(uri, contents, 0, 0);
    }
    renameFile(uri, newUri, overwrite) {
        this._wschanges.renameFile(uri, newUri, { overwrite: overwrite });
    }
    deleteFileFolder(uri, recursive, ignoreIfNotExists) {
        this._wschanges.deleteFile(uri, {
            recursive: recursive,
            ignoreIfNotExists: ignoreIfNotExists,
        });
    }
    insertText(uri, contents, line, column) {
        const change = this._wschanges.getTextEditChange(vscode_languageserver_2.OptionalVersionedTextDocumentIdentifier.create(uri, null));
        change.insert(vscode_languageserver_2.Position.create(line, column), contents);
    }
    replaceText(uri, replaceWith, startLine, startColumn, endLine, endColumn) {
        const change = this._wschanges.getTextEditChange(vscode_languageserver_2.OptionalVersionedTextDocumentIdentifier.create(uri, null));
        change.replace(vscode_languageserver_2.Range.create(vscode_languageserver_2.Position.create(startLine, startColumn), vscode_languageserver_2.Position.create(endLine, endColumn)), replaceWith);
    }
    replaceAllText(uri, contents) {
        this.replaceText(uri, contents, 0, 0, Number.MAX_VALUE, Number.MAX_VALUE);
    }
    deleteText(uri, contents, startLine, startColumn, endLine, endColumn) {
        const change = this._wschanges.getTextEditChange(vscode_languageserver_2.OptionalVersionedTextDocumentIdentifier.create(uri, null));
        change.delete(vscode_languageserver_2.Range.create(vscode_languageserver_2.Position.create(startLine, startColumn), vscode_languageserver_2.Position.create(endLine, endColumn)));
    }
    applyChanges() {
        return __awaiter(this, void 0, void 0, function* () {
            return server_1.connection.workspace.applyEdit(this._wschanges.edit);
        });
    }
}
exports.WorkspaceUpdates = WorkspaceUpdates;
//# sourceMappingURL=client.js.map
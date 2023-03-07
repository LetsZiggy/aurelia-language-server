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
exports.AureliaServer = void 0;
const TextDocumentUtils_1 = require("../common/documens/TextDocumentUtils");
const logger_1 = require("../common/logging/logger");
const onCodeAction_1 = require("../feature/codeAction/onCodeAction");
const onCompletions_1 = require("../feature/completions/onCompletions");
const changeContent_1 = require("../feature/content/changeContent");
const onDefinitions_1 = require("../feature/definition/onDefinitions");
const diagnostics_1 = require("../feature/diagnostics/diagnostics");
const extractComponent_1 = require("../feature/commands/extractComponent/extractComponent");
const initialization_1 = require("../feature/initialization/initialization");
const onRenameRequest_1 = require("../feature/rename/onRenameRequest");
const saveContent_1 = require("../feature/save/saveContent");
const onDocumentSymbol_1 = require("../feature/symbols/onDocumentSymbol");
const onWorkspaceSymbol_1 = require("../feature/symbols/onWorkspaceSymbol");
const container_1 = require("./container");
const depdencenyInjection_1 = require("./depdencenyInjection");
const declareViewModelVariable_1 = require("../feature/commands/declareViewModelVariable/declareViewModelVariable");
const logger = new logger_1.Logger('AureliaServer');
class AureliaServer {
    constructor(container, connection, extensionSettings, allDocuments) {
        this.container = container;
        this.connection = connection;
        this.extensionSettings = extensionSettings;
        this.allDocuments = allDocuments;
        (0, depdencenyInjection_1.initDependencyInjection)(container, connection, extensionSettings, allDocuments);
    }
    onConnectionInitialized(extensionSettings, forceReinit = false) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield (0, initialization_1.onConnectionInitialized)(this.container, extensionSettings !== null && extensionSettings !== void 0 ? extensionSettings : this.extensionSettings, this.allDocuments.all(), forceReinit);
            }
            catch (_error) {
                const error = _error;
                logger.log(error.message);
                logger.log((_a = error.stack) !== null && _a !== void 0 ? _a : '');
            }
        });
    }
    onConnectionDidChangeContent(change) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield (0, changeContent_1.onConnectionDidChangeContent)(this.container, change);
            }
            catch (_error) {
                const error = _error;
                logger.log(error.message);
                logger.log((_a = error.stack) !== null && _a !== void 0 ? _a : '');
            }
        });
    }
    // listen() {}
    // onRequest() {}
    // sendRequest() {}
    // onNotification() {}
    // sendNotification() {}
    // // onProgress() {}
    // sendProgress() {}
    // onInitialize() {}
    // onInitialized() {}
    // onShutdown() {}
    // onExit() {}
    // onDidChangeConfiguration() {}
    // onDidChangeWatchedFiles() {}
    // onDidOpenTextDocument() {}
    // onDidChangeTextDocument() {}
    // onDidCloseTextDocument() {}
    // onWillSaveTextDocument() {}
    // onWillSaveTextDocumentWaitUntil() {}
    onDidSave(change) {
        return __awaiter(this, void 0, void 0, function* () {
            yield (0, saveContent_1.onDidSave)(this.container, change);
        });
    }
    sendDiagnostics(document) {
        const diagnostics = (0, diagnostics_1.createDiagnostics)(this.container, document);
        const diagnosticsParams = {
            uri: document.uri,
            diagnostics,
        };
        return diagnosticsParams;
    }
    onHover() {
        return __awaiter(this, void 0, void 0, function* () {
            // filePath: string // position: Position, // documentContent: string,
            // const hovered = onHover(documentContent, position, filePath);
            // return hovered;
        });
    }
    onCompletion(document, completionParams) {
        var _a, _b, _c;
        return __awaiter(this, void 0, void 0, function* () {
            const dontTrigger = this.dontTriggerInViewModel(document);
            if (dontTrigger)
                return;
            if (((_a = this.extensionSettings.capabilities) === null || _a === void 0 ? void 0 : _a.completions) === false)
                return;
            /* prettier-ignore */ logger.log('Completion triggered.', { logMs: true, msStart: true });
            try {
                const completions = yield (0, onCompletions_1.onCompletion)(this.container, completionParams, document);
                if (completions == null) {
                    /* prettier-ignore */ logger.log('No Aurelia completions found.', { logMs: true, msEnd: true });
                    return;
                }
                /* prettier-ignore */ logger.log(`Found ${(_b = completions === null || completions === void 0 ? void 0 : completions.length) !== null && _b !== void 0 ? _b : 0} completion(s).`, { logMs: true, msEnd: true });
                return completions;
            }
            catch (_error) {
                const error = _error;
                logger.log(error.message);
                logger.log((_c = error.stack) !== null && _c !== void 0 ? _c : '');
            }
        });
    }
    // onCompletionResolve() {}
    // onSignatureHelp() {}
    // onDeclaration() {}
    onDefinition(document, position) {
        var _a, _b, _c;
        return __awaiter(this, void 0, void 0, function* () {
            if (((_a = this.extensionSettings.capabilities) === null || _a === void 0 ? void 0 : _a.definitions) === false)
                return;
            /* prettier-ignore */ logger.log('Definition triggered.', { logMs: true, msStart: true });
            try {
                const definitions = yield (0, onDefinitions_1.onDefintion)(document, position, this.container);
                if (definitions == null) {
                    /* prettier-ignore */ logger.log('No Aurelia defintions found.', { logMs: true, msEnd: true });
                    return;
                }
                /* prettier-ignore */ logger.log(`Found ${(_b = definitions === null || definitions === void 0 ? void 0 : definitions.length) !== null && _b !== void 0 ? _b : 0} definition(s).`, { logMs: true, msEnd: true });
                return definitions;
            }
            catch (_error) {
                const error = _error;
                logger.log(error.message);
                logger.log((_c = error.stack) !== null && _c !== void 0 ? _c : '');
            }
        });
    }
    // onTypeDefinition() {}
    // onImplementation() {}
    // onReferences() {}
    // onDocumentHighlight() {}
    onDocumentSymbol(documentUri) {
        var _a, _b;
        return __awaiter(this, void 0, void 0, function* () {
            const dontTrigger = this.dontTriggerInViewModel({
                uri: documentUri,
            });
            if (dontTrigger)
                return;
            if (((_a = this.extensionSettings.capabilities) === null || _a === void 0 ? void 0 : _a.documentSymbols) === false)
                return;
            // Too spammy, since Vscode basically triggers this after every file change.
            // /* prettier-ignore */ logger.log('Document symbol triggered.',{logMs:true,msStart:true});
            try {
                const symbols = yield (0, onDocumentSymbol_1.onDocumentSymbol)(this.container, documentUri);
                return symbols;
            }
            catch (_error) {
                const error = _error;
                logger.log(error.message);
                logger.log((_b = error.stack) !== null && _b !== void 0 ? _b : '');
            }
        });
    }
    onWorkspaceSymbol() {
        var _a, _b;
        if (((_a = this.extensionSettings.capabilities) === null || _a === void 0 ? void 0 : _a.workspaceSymbols) === false)
            return;
        /* prettier-ignore */ logger.log('Workspace symbol triggered.', { logMs: true, msStart: true });
        // const symbols = onWorkspaceSymbol(this.container, query);
        const symbols = (0, onWorkspaceSymbol_1.onWorkspaceSymbol)(this.container);
        /* prettier-ignore */ logger.log(`Found ${(_b = symbols === null || symbols === void 0 ? void 0 : symbols.length) !== null && _b !== void 0 ? _b : 0} symbol(s).`, { logMs: true, msEnd: true });
        return symbols;
    }
    onCodeAction(codeActionParams) {
        var _a, _b;
        return __awaiter(this, void 0, void 0, function* () {
            const dontTrigger = this.dontTriggerInViewModel(codeActionParams.textDocument);
            if (dontTrigger)
                return;
            if (((_a = this.extensionSettings.capabilities) === null || _a === void 0 ? void 0 : _a.codeActions) === false)
                return;
            // Too spammy
            // /* prettier-ignore */ logger.log('Code action triggered.',{logMs:true,msStart:true});
            try {
                const codeAction = yield (0, onCodeAction_1.onCodeAction)(this.container, codeActionParams, this.allDocuments);
                // /* prettier-ignore */ logger.log(`Found ${codeAction?.length ?? 0} code action(s).`,{logMs:true,msEnd:true});
                return codeAction;
            }
            catch (_error) {
                const error = _error;
                logger.log(error.message);
                logger.log((_b = error.stack) !== null && _b !== void 0 ? _b : '');
            }
        });
    }
    // onCodeLens() {}
    // onCodeLensResolve() {}
    // onDocumentFormatting() {}
    // onDocumentRangeFormatting() {}
    // onDocumentOnTypeFormatting() {}
    onRenameRequest(document, position, newName) {
        var _a, _b, _c, _d;
        return __awaiter(this, void 0, void 0, function* () {
            if (((_a = this.extensionSettings.capabilities) === null || _a === void 0 ? void 0 : _a.renames) === false)
                return;
            /* prettier-ignore */ logger.log('Rename triggered.', { logMs: true, msStart: true });
            try {
                const renames = yield (0, onRenameRequest_1.onRenameRequest)(document, position, newName, this.container);
                if (renames == null) {
                    /* prettier-ignore */ logger.log('No Aurelia renames found.', { logMs: true, msEnd: true });
                    return;
                }
                /* prettier-ignore */ logger.log(`Found ${(_c = Object.keys((_b = renames === null || renames === void 0 ? void 0 : renames.changes) !== null && _b !== void 0 ? _b : {}).length) !== null && _c !== void 0 ? _c : '0'} file(s) to rename.`, { logMs: true, msEnd: true });
                return renames;
            }
            catch (_error) {
                const error = _error;
                logger.log(error.message);
                logger.log((_d = error.stack) !== null && _d !== void 0 ? _d : '');
            }
        });
    }
    // onPrepareRename() {}
    // onDocumentLinks() {}
    // onDocumentLinkResolve() {}
    // onDocumentColor() {}
    // onColorPresentation() {}
    // onFoldingRanges() {}
    // onSelectionRanges() {}
    onExecuteCommand(executeCommandParams, connection) {
        return __awaiter(this, void 0, void 0, function* () {
            const command = executeCommandParams.command;
            switch (command) {
                case 'extension.extractComponent': {
                    const extractComponent = container_1.globalContainer.get(extractComponent_1.ExtractComponent);
                    yield extractComponent.executeExtractComponent();
                    break;
                }
                case 'extension.declareViewModelVariable': {
                    const declareViewModelVariable = container_1.globalContainer.get(declareViewModelVariable_1.DeclareViewModelVariable);
                    yield declareViewModelVariable.execute();
                    break;
                }
            }
            // onExecuteCommand(this.container, executeCommandParams);
        });
    }
    // dispose() {}
    // console: RemoteConsole & PConsole;
    // tracer: Tracer & PTracer;
    // telemetry: Telemetry & PTelemetry;
    // client: RemoteClient & PClient;
    // window: RemoteWindow & PWindow;
    // workspace: RemoteWorkspace & PWorkspace;
    // languages: Languages & PLanguages;
    // console;
    // tracer;
    // telemetry;
    // client;
    // window;
    // workspace;
    // languages;
    dontTriggerInViewModel(document) {
        const dontTrigger = (0, TextDocumentUtils_1.isViewModelDocument)(document, this.extensionSettings);
        return dontTrigger;
    }
}
exports.AureliaServer = AureliaServer;
//# sourceMappingURL=aureliaServer.js.map
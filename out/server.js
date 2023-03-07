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
exports.connection = void 0;
const vscode_languageserver_1 = require("vscode-languageserver");
const vscode_languageserver_textdocument_1 = require("vscode-languageserver-textdocument");
// We need to import this to include reflect functionality
require("reflect-metadata");
const constants_1 = require("./common/constants");
const logger_1 = require("./common/logging/logger");
const MyLodash_1 = require("./common/MyLodash");
const uri_utils_1 = require("./common/view/uri-utils");
const DocumentSettings_1 = require("./configuration/DocumentSettings");
const AureliaProjects_1 = require("./core/AureliaProjects");
const aureliaServer_1 = require("./core/aureliaServer");
const container_1 = require("./core/container");
const depdencenyInjection_1 = require("./core/depdencenyInjection");
const logger = new logger_1.Logger('Server');
const isTest = process.env.NODE_ENV;
// Create a connection for the server. The connection uses Node's IPC as a transport.
// Also include all preview / proposed LSP features.
let processStdIn;
let processStdOut;
if (isTest) {
    processStdIn = process.stdin;
    processStdOut = process.stdout;
}
exports.connection = (0, vscode_languageserver_1.createConnection)(vscode_languageserver_1.ProposedFeatures.all, 
// @ts-ignore
processStdIn, processStdOut);
// Create a simple text document manager. The text document manager
// supports full document sync only
const documents = new vscode_languageserver_1.TextDocuments(vscode_languageserver_textdocument_1.TextDocument);
let hasConfigurationCapability = false;
let hasWorkspaceFolderCapability = false;
// let hasDiagnosticRelatedInformationCapability: boolean = false;
let hasServerInitialized = false;
let aureliaServer;
exports.connection.onInitialize((params) => __awaiter(void 0, void 0, void 0, function* () {
    const capabilities = params.capabilities;
    // Does the client support the `workspace/configuration` request?
    // If not, we will fall back using global settings
    hasConfigurationCapability = !!(capabilities.workspace && Boolean(capabilities.workspace.configuration));
    hasWorkspaceFolderCapability = !!(capabilities.workspace && Boolean(capabilities.workspace.workspaceFolders));
    // hasDiagnosticRelatedInformationCapability = Boolean(
    //   capabilities.textDocument?.publishDiagnostics?.relatedInformation
    // );
    const result = {
        capabilities: {
            textDocumentSync: vscode_languageserver_1.TextDocumentSyncKind.Full,
            // Tell the client that the server supports code completion
            completionProvider: {
                resolveProvider: false,
                // eslint-disable-next-line @typescript-eslint/quotes
                triggerCharacters: [' ', '.', '[', '"', "'", '{', '<', ':', '|', '$'],
            },
            definitionProvider: true,
            // hoverProvider: true,
            codeActionProvider: true,
            renameProvider: true,
            documentSymbolProvider: true,
            workspaceSymbolProvider: true,
            executeCommandProvider: {
                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                // @ts-ignore
                commands: constants_1.AURELIA_COMMANDS,
            },
        },
    };
    if (hasWorkspaceFolderCapability) {
        result.capabilities.workspace = {
            workspaceFolders: {
                supported: true,
            },
        };
    }
    return result;
}));
// eslint-disable-next-line @typescript-eslint/no-misused-promises
exports.connection.onInitialized(() => __awaiter(void 0, void 0, void 0, function* () {
    if (hasConfigurationCapability) {
        // Register for all configuration changes.
        void exports.connection.client.register(vscode_languageserver_1.DidChangeConfigurationNotification.type, undefined);
        yield initAurelia();
        const should = yield shouldInit();
        if (!should)
            return;
        hasServerInitialized = true;
    }
    if (hasWorkspaceFolderCapability) {
        exports.connection.workspace.onDidChangeWorkspaceFolders((_event) => {
            exports.connection.console.log('Workspace folder change event received.');
        });
    }
}));
// connection.onDidOpenTextDocument(() => {});
// Only keep settings for open documents
// documents.onDidClose((e) => {
//   documentSettings.settingsMap.delete(e.document.uri);
// });
exports.connection.onCodeAction((codeActionParams) => __awaiter(void 0, void 0, void 0, function* () {
    if (hasServerInitialized === false)
        return;
    const codeAction = yield aureliaServer.onCodeAction(codeActionParams);
    if (codeAction) {
        return codeAction;
    }
}));
exports.connection.onCompletion((completionParams) => __awaiter(void 0, void 0, void 0, function* () {
    const documentUri = completionParams.textDocument.uri;
    const document = documents.get(documentUri);
    if (!document) {
        throw new Error('No document found');
    }
    const completions = yield aureliaServer.onCompletion(document, completionParams);
    if (completions != null) {
        return completions;
    }
}));
// This handler resolves additional information for the item selected in
// the completion list.
// connection.onCompletionResolve(
//   (item: CompletionItem): CompletionItem => {
//     return item;
//   }
// );
exports.connection.onDefinition(({ position, textDocument }) => __awaiter(void 0, void 0, void 0, function* () {
    const documentUri = textDocument.uri.toString();
    const document = documents.get(documentUri); // <
    if (!document)
        return null;
    const definition = yield aureliaServer.onDefinition(document, position);
    if (definition) {
        return definition;
    }
    return null;
}));
// The content of a text document has changed. This event is emitted
// when the text document first opened or when its content has changed.
documents.onDidChangeContent(MyLodash_1.MyLodash.debouncePromise((change) => __awaiter(void 0, void 0, void 0, function* () {
    if (!hasServerInitialized)
        return;
    // const diagnosticsParams = await aureliaServer.sendDiagnostics(
    //   change.document
    // );
    // connection.sendDiagnostics(diagnosticsParams);
    yield aureliaServer.onConnectionDidChangeContent(change);
}), 400));
exports.connection.onDidChangeConfiguration(() => __awaiter(void 0, void 0, void 0, function* () {
    console.log('[server.ts] onDidChangeConfiguration');
    if (!hasConfigurationCapability)
        return;
    yield initAurelia(true);
}));
exports.connection.onDidChangeWatchedFiles((_change) => {
    // Monitored files have change in VSCode
    exports.connection.console.log('We received an file change event');
});
documents.onDidSave((change) => __awaiter(void 0, void 0, void 0, function* () {
    yield aureliaServer.onDidSave(change);
}));
exports.connection.onDocumentSymbol((params) => __awaiter(void 0, void 0, void 0, function* () {
    if (hasServerInitialized === false)
        return;
    const symbols = yield aureliaServer.onDocumentSymbol(params.textDocument.uri);
    return symbols;
}));
// connection.onWorkspaceSymbol(async (params: WorkspaceSymbolParams) => {
exports.connection.onWorkspaceSymbol(() => __awaiter(void 0, void 0, void 0, function* () {
    if (hasServerInitialized === false)
        return;
    // const workspaceSymbols = aureliaServer.onWorkspaceSymbol(params.query);
    try {
        const workspaceSymbols = aureliaServer.onWorkspaceSymbol();
        return workspaceSymbols;
    }
    catch (error) {
        error; /* ? */
    }
}));
// connection.onHover(
//   async ({ position, textDocument }: TextDocumentPositionParams) => {
//     const documentUri = textDocument.uri.toString();
//     const document = documents.get(documentUri); // <
//     if (!document) return null;
//     const hovered = await aureliaServer.onHover(
//       document.getText(),
//       position,
//       documentUri,
//     );
//     return hovered;
//   }
// );
exports.connection.onExecuteCommand((executeCommandParams, ...others) => __awaiter(void 0, void 0, void 0, function* () {
    const command = executeCommandParams.command;
    /**
     * !! Should move everything into aurelia.onExecuteCommand ??
     */
    switch (command) {
        case 'extension.au.reloadExtension': {
            yield initAurelia(true);
            break;
        }
        case constants_1.CodeActionMap['refactor.aTag'].command: {
            logger.log(`Command executed: "${constants_1.CodeActionMap['refactor.aTag'].title}"`);
            break;
        }
        // case CodeActionMap['extract.component'].command: {
        //   logger.log(
        //     `Command executed: "${CodeActionMap['extract.component'].title}"`
        //   );
        //   break;
        // }
        default: {
            aureliaServer.onExecuteCommand(executeCommandParams, exports.connection);
            // console.log('no command');
        }
    }
    // async () => {
    return null;
}));
exports.connection.onRenameRequest(({ position, textDocument, newName }) => __awaiter(void 0, void 0, void 0, function* () {
    const documentUri = textDocument.uri;
    const document = documents.get(documentUri);
    if (!document) {
        throw new Error('No document found');
    }
    const renamed = yield aureliaServer.onRenameRequest(document, position, newName);
    if (renamed) {
        return renamed;
    }
}));
// connection.onPrepareRename(async (prepareRename: PrepareRenameParams) => {
//   /* prettier-ignore */ console.log('TCL: prepareRename', prepareRename);
//   return new ResponseError(0, 'failed');
// });
exports.connection.onRequest('aurelia-get-component-list', () => {
    const aureliaProjects = container_1.globalContainer.get(AureliaProjects_1.AureliaProjects);
    // TODO: use .getBy instead of getAll
    const { aureliaProgram } = aureliaProjects.getAll()[0];
    if (!aureliaProgram)
        return;
    return aureliaProgram.aureliaComponents.getAll().map((cList) => {
        const { componentName, className, viewFilePath, viewModelFilePath, baseViewModelFileName, } = cList;
        return {
            componentName,
            className,
            viewFilePath,
            viewModelFilePath,
            baseViewModelFileName,
        };
    });
});
// Make the text document manager listen on the connection
// for open, change and close text document events
documents.listen(exports.connection);
// Listen on the connection
exports.connection.listen();
function initAurelia(forceReinit) {
    return __awaiter(this, void 0, void 0, function* () {
        const extensionSettings = (yield exports.connection.workspace.getConfiguration({
            section: DocumentSettings_1.settingsName,
        }));
        const rootDirectory = yield getRootDirectory(extensionSettings);
        extensionSettings.aureliaProject = Object.assign(Object.assign({}, extensionSettings.aureliaProject), { rootDirectory });
        (0, depdencenyInjection_1.initDependencyInjection)(container_1.globalContainer, exports.connection, extensionSettings, documents);
        aureliaServer = new aureliaServer_1.AureliaServer(container_1.globalContainer, exports.connection, extensionSettings, documents);
        yield aureliaServer.onConnectionInitialized(extensionSettings, forceReinit);
    });
}
function getRootDirectory(extensionSettings) {
    var _a;
    return __awaiter(this, void 0, void 0, function* () {
        const workspaceFolders = yield exports.connection.workspace.getWorkspaceFolders();
        if (workspaceFolders === null)
            return;
        const workspaceRootUri = workspaceFolders[0].uri;
        let rootDirectory = workspaceRootUri;
        const settingRoot = (_a = extensionSettings.aureliaProject) === null || _a === void 0 ? void 0 : _a.rootDirectory;
        if (settingRoot != null && settingRoot !== '') {
            rootDirectory = settingRoot;
        }
        return rootDirectory;
    });
}
function shouldInit() {
    return __awaiter(this, void 0, void 0, function* () {
        const workspaceFolders = yield exports.connection.workspace.getWorkspaceFolders();
        if (workspaceFolders === null)
            return false;
        const workspaceRootUri = workspaceFolders[0].uri;
        const tsConfigPath = uri_utils_1.UriUtils.toSysPath(workspaceRootUri);
        const aureliaProjects = container_1.globalContainer.get(AureliaProjects_1.AureliaProjects);
        const targetProject = aureliaProjects.getBy(tsConfigPath);
        if (!targetProject)
            return false;
        return true;
    });
}
//# sourceMappingURL=server.js.map
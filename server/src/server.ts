import {
  createConnection,
  TextDocuments,
  ProposedFeatures,
  InitializeParams,
  DidChangeConfigurationNotification,
  TextDocumentPositionParams,
  TextDocumentSyncKind,
  InitializeResult,
  TextDocumentChangeEvent,
  RenameParams,
  DocumentSymbolParams,
  ExecuteCommandParams,
  CompletionParams,
} from 'vscode-languageserver';
import { CodeActionParams } from 'vscode-languageserver-protocol';
import { TextDocument } from 'vscode-languageserver-textdocument';

// We need to import this to include reflect functionality
import 'reflect-metadata';

import {
  AURELIA_COMMANDS,
  AURELIA_COMMANDS_KEYS,
  CodeActionMap,
} from './common/constants';
import { Logger } from './common/logging/logger';
import { MyLodash } from './common/MyLodash';
import { UriUtils } from './common/view/uri-utils';
import { AureliaProjects } from './core/AureliaProjects';
import { AureliaServer } from './core/aureliaServer';
import { globalContainer } from './core/container';
import {
  ExtensionSettings,
  settingsName,
} from './feature/configuration/DocumentSettings';
import { isViewModelDocument } from './common/documens/TextDocumentUtils';

const logger = new Logger('Server');

// Create a connection for the server. The connection uses Node's IPC as a transport.
// Also include all preview / proposed LSP features.
export const connection = createConnection(ProposedFeatures.all);

// Create a simple text document manager. The text document manager
// supports full document sync only
const documents: TextDocuments<TextDocument> = new TextDocuments(TextDocument);

let hasConfigurationCapability: boolean = false;
let hasWorkspaceFolderCapability: boolean = false;
// let hasDiagnosticRelatedInformationCapability: boolean = false;

let hasServerInitialized = false;
let aureliaServer: AureliaServer;

connection.onInitialize(async (params: InitializeParams) => {
  const capabilities = params.capabilities;

  // Does the client support the `workspace/configuration` request?
  // If not, we will fall back using global settings
  hasConfigurationCapability = !!(
    capabilities.workspace && Boolean(capabilities.workspace.configuration)
  );
  hasWorkspaceFolderCapability = !!(
    capabilities.workspace && Boolean(capabilities.workspace.workspaceFolders)
  );
  // hasDiagnosticRelatedInformationCapability = Boolean(
  //   capabilities.textDocument?.publishDiagnostics?.relatedInformation
  // );

  const result: InitializeResult = {
    capabilities: {
      textDocumentSync: TextDocumentSyncKind.Full,
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
        commands: AURELIA_COMMANDS,
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
});

// eslint-disable-next-line @typescript-eslint/no-misused-promises
connection.onInitialized(async () => {
  if (hasConfigurationCapability) {
    // Register for all configuration changes.
    void connection.client.register(
      DidChangeConfigurationNotification.type,
      undefined
    );

    await initAurelia();

    const should = await shouldInit();
    if (!should) return

    hasServerInitialized = true;
  }
  if (hasWorkspaceFolderCapability) {
    connection.workspace.onDidChangeWorkspaceFolders((_event) => {
      connection.console.log('Workspace folder change event received.');
    });
  }
});

// connection.onDidOpenTextDocument(() => {});

// Only keep settings for open documents
// documents.onDidClose((e) => {
//   documentSettings.settingsMap.delete(e.document.uri);
// });

connection.onCodeAction(async (codeActionParams: CodeActionParams) => {
  if (hasServerInitialized === false) return;
  const dontTrigger = await dontTriggerInViewModel(
    codeActionParams.textDocument
  );
  if (dontTrigger) return;

  const codeAction = await aureliaServer.onCodeAction(codeActionParams);

  if (codeAction) {
    return codeAction;
  }
});

// This handler provides the initial list of the completion items.
connection.onCompletion(async (completionParams: CompletionParams) => {
  const documentUri = completionParams.textDocument.uri;
  const document = documents.get(documentUri);
  if (!document) {
    throw new Error('No document found');
  }
  const dontTrigger = await dontTriggerInViewModel(document);
  if (dontTrigger) return;

  const completions = await aureliaServer.onCompletion(
    document,
    completionParams
  );

  if (completions != null) {
    return completions;
  }
});

// This handler resolves additional information for the item selected in
// the completion list.
// connection.onCompletionResolve(
//   (item: CompletionItem): CompletionItem => {
//     return item;
//   }
// );

connection.onDefinition(
  async ({ position, textDocument }: TextDocumentPositionParams) => {
    const documentUri = textDocument.uri.toString();
    const document = documents.get(documentUri); // <
    if (!document) return null;

    const definition = await aureliaServer.onDefinition(document, position);

    if (definition) {
      return definition;
    }

    return null;
  }
);

// The content of a text document has changed. This event is emitted
// when the text document first opened or when its content has changed.
documents.onDidChangeContent(
  MyLodash.debouncePromise(
    async (change: TextDocumentChangeEvent<TextDocument>) => {
      if (!hasServerInitialized) return;
      // const diagnosticsParams = await aureliaServer.sendDiagnostics(
      //   change.document
      // );
      // connection.sendDiagnostics(diagnosticsParams);
      await aureliaServer.onConnectionDidChangeContent(change);
    },
    400
  )
);

connection.onDidChangeConfiguration(async () => {
  console.log('[server.ts] onDidChangeConfiguration');

  if (!hasConfigurationCapability) return;

  await initAurelia(true);
});

connection.onDidChangeWatchedFiles((_change) => {
  // Monitored files have change in VSCode
  connection.console.log('We received an file change event');
});

documents.onDidSave(async (change: TextDocumentChangeEvent<TextDocument>) => {
  await aureliaServer.onDidSave(change);
});

connection.onDocumentSymbol(async (params: DocumentSymbolParams) => {
  if (hasServerInitialized === false) return;
  const dontTrigger = await dontTriggerInViewModel({
    uri: params.textDocument.uri,
  });
  if (dontTrigger) return;

  const symbols = await aureliaServer.onDocumentSymbol(params.textDocument.uri);
  return symbols;
});
// connection.onWorkspaceSymbol(async (params: WorkspaceSymbolParams) => {
connection.onWorkspaceSymbol(async () => {
  if (hasServerInitialized === false) return;
  // const workspaceSymbols = aureliaServer.onWorkspaceSymbol(params.query);
  try {
    const workspaceSymbols = aureliaServer.onWorkspaceSymbol();
    return workspaceSymbols;
  } catch (error) {
    error; /* ? */
  }
});

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

connection.onExecuteCommand(
  async (executeCommandParams: ExecuteCommandParams) => {
    const command = executeCommandParams.command as AURELIA_COMMANDS_KEYS;
    switch (command) {
      case 'extension.au.reloadExtension': {
        await initAurelia(true);

        break;
      }
      case CodeActionMap['refactor.aTag'].command: {
        logger.log(
          `Command executed: "${CodeActionMap['refactor.aTag'].title}"`
        );
        break;
      }
      default: {
        // console.log('no command');
      }
    }
    // async () => {
    return null;
  }
);

connection.onRenameRequest(
  async ({ position, textDocument, newName }: RenameParams) => {
    const documentUri = textDocument.uri;
    const document = documents.get(documentUri);
    if (!document) {
      throw new Error('No document found');
    }
    const renamed = await aureliaServer.onRenameRequest(
      document,
      position,
      newName
    );

    if (renamed) {
      return renamed;
    }
  }
);

// connection.onPrepareRename(async (prepareRename: PrepareRenameParams) => {
//   /* prettier-ignore */ console.log('TCL: prepareRename', prepareRename);
//   return new ResponseError(0, 'failed');
// });

connection.onRequest('aurelia-get-component-list', () => {
  const aureliaProjects = globalContainer.get(AureliaProjects);
  // TODO: use .getBy instead of getAll
  const { aureliaProgram } = aureliaProjects.getAll()[0];

  if (!aureliaProgram) return;

  return aureliaProgram.aureliaComponents.getAll().map((cList) => {
    const {
      componentName,
      className,
      viewFilePath,
      viewModelFilePath,
      baseViewModelFileName,
    } = cList;
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
documents.listen(connection);

// Listen on the connection
connection.listen();

async function dontTriggerInViewModel(document: { uri: string }) {
  const extensionSettings = (await connection.workspace.getConfiguration({
    section: settingsName,
  })) as ExtensionSettings;
  const dontTrigger = isViewModelDocument(document, extensionSettings);
  return dontTrigger;
}

async function initAurelia(forceReinit?: boolean) {
  const workspaceFolders = await connection.workspace.getWorkspaceFolders();
  if (workspaceFolders === null) return;

  const extensionSettings = (await connection.workspace.getConfiguration({
    section: settingsName,
  })) as ExtensionSettings;
  const workspaceRootUri = workspaceFolders[0].uri;
  extensionSettings.aureliaProject = {
    rootDirectory:
      extensionSettings.aureliaProject?.rootDirectory ?? workspaceRootUri,
  };

  aureliaServer = new AureliaServer(
    globalContainer,
    extensionSettings,
    documents
  );
  await aureliaServer.onConnectionInitialized(extensionSettings, forceReinit);
}

async function shouldInit() {
  const workspaceFolders = await connection.workspace.getWorkspaceFolders();
  if (workspaceFolders === null) return false;
  const workspaceRootUri = workspaceFolders[0].uri;
  const tsConfigPath = UriUtils.toSysPath(workspaceRootUri);
  const aureliaProjects = globalContainer.get(AureliaProjects);
  const targetProject = aureliaProjects.getBy(tsConfigPath);
  if (!targetProject) return false;

  return true
}

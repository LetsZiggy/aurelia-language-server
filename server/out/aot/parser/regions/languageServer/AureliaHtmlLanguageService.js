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
exports.AureliaHtmlLanguageService = void 0;
const vscode_html_languageservice_1 = require("vscode-html-languageservice");
const vscode_languageserver_1 = require("vscode-languageserver");
const constants_1 = require("../../../../common/constants");
const PositionUtils_1 = require("../../../../common/documens/PositionUtils");
const document_parsing_1 = require("../../../../common/view/document-parsing");
// import { globalContainer } from '../../../../core/container';
// import { ExtractComponent } from '../../../../feature/commands/extractComponent/extractComponent';
const aureliaKeyWordCompletions_1 = require("../../../../feature/completions/aureliaKeyWordCompletions");
const completions_1 = require("../../../../feature/completions/completions");
class AureliaHtmlLanguageService {
    doComplete(aureliaProgram, document, triggerCharacter) {
        return __awaiter(this, void 0, void 0, function* () {
            if (triggerCharacter === '<') {
                const finalCompletions = [
                    ...aureliaKeyWordCompletions_1.AURELIA_KEY_WORD_COMPLETIONS,
                ];
                const aureliaComponents = aureliaProgram.aureliaComponents
                    .getAll()
                    .filter((component) => component.type === constants_1.AureliaClassTypes.CUSTOM_ELEMENT);
                const componentCompletions = (0, completions_1.createComponentCompletionList)(aureliaComponents);
                finalCompletions.push(...componentCompletions);
                return finalCompletions;
            }
            return [];
        });
    }
    doCodeAction(aureliaProgram, document, startPosition) {
        return __awaiter(this, void 0, void 0, function* () {
            const allCodeActions = [];
            // ---- refactor.aTag ----
            const aTagCodeAction = createCodeAction_RenameATag(document, startPosition);
            if (aTagCodeAction) {
                allCodeActions.push(aTagCodeAction);
            }
            return allCodeActions;
        });
    }
}
exports.AureliaHtmlLanguageService = AureliaHtmlLanguageService;
// async function createCodeAction_ExtractComponent() {
//   const extractComponent = globalContainer.get(ExtractComponent);
//   const edits = await extractComponent.perfom();
//   if (!edits?.documentChanges) return;
//   const finalChanges: Record<string, TextEdit[]> = {};
//   edits.documentChanges.forEach((change) => {
//     if (!TextDocumentEdit.is(change)) return;
//     finalChanges[change.textDocument.uri] = change.edits;
//   });
//   const edit = {
//     // changes: {},
//     changes: finalChanges,
//   };
//   const kind = CodeActionMap['extract.component'].command;
//   const command = Command.create('Au: Command <<', kind, [edit]);
//   const codeAcion = CodeAction.create(
//     CodeActionMap['extract.component'].title,
//     command,
//     kind
//   );
//   codeAcion.edit = edit;
//   return codeAcion;
// }
function createCodeAction_RenameATag(document, position) {
    var _a, _b, _c, _d, _e;
    const htmlLanguageService = (0, vscode_html_languageservice_1.getLanguageService)();
    const htmlDocument = htmlLanguageService.parseHTMLDocument(document);
    const offset = document.offsetAt(position);
    const aTag = document_parsing_1.ParseHtml.findTagAtOffset(document.getText(), offset);
    const HREF = 'href';
    // Early return, if not <a href> tag
    if ((aTag === null || aTag === void 0 ? void 0 : aTag.tagName) !== 'a')
        return;
    const hrefAttribute = (_a = aTag === null || aTag === void 0 ? void 0 : aTag.sourceCodeLocation) === null || _a === void 0 ? void 0 : _a.attrs['href'];
    if (hrefAttribute == null)
        return;
    if (((_b = aTag.sourceCodeLocation) === null || _b === void 0 ? void 0 : _b.startLine) == null)
        return;
    if (((_c = aTag.sourceCodeLocation) === null || _c === void 0 ? void 0 : _c.startCol) == null)
        return;
    // Get tag range
    // Rename <a> tag
    const aTagPosition = PositionUtils_1.PositionUtils.convertToZeroIndexed((_d = aTag.sourceCodeLocation) === null || _d === void 0 ? void 0 : _d.startLine, ((_e = aTag.sourceCodeLocation) === null || _e === void 0 ? void 0 : _e.startCol) + 1 // right of "<"
    );
    const renameTag = htmlLanguageService.doRename(document, aTagPosition, constants_1.CodeActionMap['refactor.aTag'].newText, htmlDocument);
    // Rename href attribute
    const { startLine, startCol, endLine } = hrefAttribute;
    const hrefStartPosition = PositionUtils_1.PositionUtils.convertToZeroIndexed(startLine, startCol);
    const hrefEndPosition = PositionUtils_1.PositionUtils.convertToZeroIndexed(endLine, startCol + HREF.length // just the attribute name (was also the ="..." part)
    );
    const range = vscode_languageserver_1.Range.create(hrefStartPosition, hrefEndPosition);
    const hrefEdit = vscode_languageserver_1.TextEdit.replace(range, constants_1.CodeActionMap['refactor.aTag'].newAttribute);
    // Create code action
    const kind = constants_1.CodeActionMap['refactor.aTag'].command;
    if ((renameTag === null || renameTag === void 0 ? void 0 : renameTag.changes) == null)
        return;
    const edit = {
        changes: {
            [document.uri]: [...renameTag.changes[document.uri], hrefEdit],
        },
    };
    const command = vscode_languageserver_1.Command.create('Au: Command <<', kind, [edit]);
    const codeAcion = vscode_languageserver_1.CodeAction.create(constants_1.CodeActionMap['refactor.aTag'].title, command, kind);
    codeAcion.edit = edit;
    return codeAcion;
}
//# sourceMappingURL=AureliaHtmlLanguageService.js.map
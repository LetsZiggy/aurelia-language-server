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
exports.BindableAttributeLanguageService = void 0;
const kernel_1 = require("@aurelia/kernel");
const TextDocumentUtils_1 = require("../../../../common/documens/TextDocumentUtils");
const uri_utils_1 = require("../../../../common/view/uri-utils");
const aureliaRename_1 = require("../../../../feature/rename/aureliaRename");
// const logger = new Logger('getBindableAttributeMode');
class BindableAttributeLanguageService {
    doDefinition(aureliaProgram, document, position, region) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            const targetComponent = aureliaProgram.aureliaComponents.getOneBy('componentName', region.tagName);
            if (!targetComponent)
                return;
            const targetMember = (_a = targetComponent === null || targetComponent === void 0 ? void 0 : targetComponent.classMembers) === null || _a === void 0 ? void 0 : _a.find((member) => {
                var _a;
                const correctNamingConvetion = (0, kernel_1.kebabCase)(member.name) === (0, kernel_1.kebabCase)((_a = region.regionValue) !== null && _a !== void 0 ? _a : '');
                const is = correctNamingConvetion && member.isBindable;
                return is;
            });
            const viewModelDocument = TextDocumentUtils_1.TextDocumentUtils.createFromPath(targetComponent.viewModelFilePath);
            if (targetMember == null)
                return;
            const { line, character } = viewModelDocument.positionAt(targetMember.start);
            const result = {
                lineAndCharacter: {
                    line: line + 1,
                    character: character + 1, // + 1client is 1-based index
                } /** TODO: Find class declaration position. Currently default to top of file */,
                viewModelFilePath: uri_utils_1.UriUtils.toSysPath(targetComponent.viewModelFilePath),
            };
            return result;
        });
    }
    doRename(container, aureliaProgram, document, position, newName, region) {
        return __awaiter(this, void 0, void 0, function* () {
            const renames = (0, aureliaRename_1.aureliaRenameFromView)(container, aureliaProgram, document, position, newName, region);
            return renames;
        });
    }
}
exports.BindableAttributeLanguageService = BindableAttributeLanguageService;
//# sourceMappingURL=BindableAttributeLanguageService.js.map
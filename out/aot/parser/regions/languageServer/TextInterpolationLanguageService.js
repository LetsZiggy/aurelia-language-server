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
exports.TextInterpolationLanguageService = void 0;
const virtualCompletion2_1 = require("../../../../feature/completions/virtualCompletion2");
const accessScopeDefinition_1 = require("../../../../feature/definition/accessScopeDefinition");
const accessScopeHover_1 = require("../../../../feature/hover/accessScopeHover");
const aureliaRename_1 = require("../../../../feature/rename/aureliaRename");
class TextInterpolationLanguageService {
    doComplete(aureliaProgram, document, triggerCharacter, region, offset, insertTriggerCharacter, completionParams) {
        return __awaiter(this, void 0, void 0, function* () {
            const completions = (0, virtualCompletion2_1.aureliaVirtualComplete_vNext)(aureliaProgram, document, region, triggerCharacter, offset, insertTriggerCharacter, completionParams);
            return completions;
        });
    }
    doDefinition(aureliaProgram, document, position, region) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            const regions = (_a = aureliaProgram.aureliaComponents.getOneByFromDocument(document)) === null || _a === void 0 ? void 0 : _a.viewRegions;
            const definition = (0, accessScopeDefinition_1.getAccessScopeDefinition)(aureliaProgram, document, position, region, regions);
            return definition;
        });
    }
    doHover(aureliaProgram, document, position, goToSourceWord, attributeRegion) {
        return __awaiter(this, void 0, void 0, function* () {
            return (0, accessScopeHover_1.getAccessScopeHover)(aureliaProgram, document, position, goToSourceWord, attributeRegion);
        });
    }
    doRename(container, aureliaProgram, document, position, newName, region) {
        return __awaiter(this, void 0, void 0, function* () {
            const renames = (0, aureliaRename_1.aureliaRenameFromView)(container, aureliaProgram, document, position, newName, region);
            return renames;
        });
    }
}
exports.TextInterpolationLanguageService = TextInterpolationLanguageService;
//# sourceMappingURL=TextInterpolationLanguageService.js.map
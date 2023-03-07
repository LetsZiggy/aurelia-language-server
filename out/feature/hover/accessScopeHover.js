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
exports.getAccessScopeHover = void 0;
const virtualSourceFile_1 = require("../virtual/virtualSourceFile");
function getAccessScopeHover(aureliaProgram, document, position, goToSourceWord, attributeRegion) {
    return __awaiter(this, void 0, void 0, function* () {
        const virtualLanguageService = yield (0, virtualSourceFile_1.createVirtualLanguageService)(aureliaProgram, position, document, {
            region: attributeRegion,
            startAtBeginningOfMethodInVirtualFile: true,
        });
        if (!virtualLanguageService)
            return;
        const quickInfo = virtualLanguageService.getQuickInfoAtPosition();
        if (!quickInfo)
            return;
        return quickInfo;
    });
}
exports.getAccessScopeHover = getAccessScopeHover;
//# sourceMappingURL=accessScopeHover.js.map
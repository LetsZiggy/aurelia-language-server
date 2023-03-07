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
exports.CustomElementLanguageService = void 0;
const find_source_word_1 = require("../../../../common/documens/find-source-word");
const uri_utils_1 = require("../../../../common/view/uri-utils");
const completions_1 = require("../../../../feature/completions/completions");
class CustomElementLanguageService {
    doComplete(aureliaProgram, document, triggerCharacter, region) {
        return __awaiter(this, void 0, void 0, function* () {
            if (triggerCharacter === ' ') {
                const bindablesCompletion = yield (0, completions_1.getBindablesCompletion)(aureliaProgram, document, region);
                if (bindablesCompletion.length > 0)
                    return bindablesCompletion;
            }
            return [];
        });
    }
    doDefinition(aureliaProgram, document, position, customElementRegion) {
        return __awaiter(this, void 0, void 0, function* () {
            const offset = document.offsetAt(position);
            const goToSourceWord = (0, find_source_word_1.findSourceWord)(customElementRegion, offset);
            const targetComponent = aureliaProgram.aureliaComponents.getOneBy('componentName', goToSourceWord);
            if (targetComponent == null)
                return;
            /**
             * 1. Triggered on <|my-component>
             */
            return {
                lineAndCharacter: {
                    line: 1,
                    character: 1,
                } /** TODO: Find class declaration position. Currently default to top of file */,
                viewModelFilePath: uri_utils_1.UriUtils.toSysPath(targetComponent.viewModelFilePath),
            };
        });
    }
}
exports.CustomElementLanguageService = CustomElementLanguageService;
//# sourceMappingURL=CustomElementLanguageService.js.map
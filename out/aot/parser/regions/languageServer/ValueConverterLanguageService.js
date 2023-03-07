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
exports.ValueConverterLanguageService = void 0;
const constants_1 = require("../../../../common/constants");
const completions_1 = require("../../../../feature/completions/completions");
const virtualCompletion_1 = require("../../../../feature/completions/virtualCompletion");
const ViewRegions_1 = require("../ViewRegions");
class ValueConverterLanguageService {
    doComplete(aureliaProgram, document, triggerCharacter, region) {
        return __awaiter(this, void 0, void 0, function* () {
            if (triggerCharacter === ':') {
                const completions = yield onValueConverterCompletion(document, aureliaProgram, region);
                if (completions === undefined)
                    return [];
                return completions;
            }
            const valueConverterCompletion = (0, completions_1.createValueConverterCompletion)(aureliaProgram);
            return valueConverterCompletion;
        });
    }
    doDefinition(aureliaProgram, document, position, valueConverterRegion) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!ViewRegions_1.ValueConverterRegion.is(valueConverterRegion))
                return;
            const targetRegion = valueConverterRegion;
            const targetValueConverterComponent = aureliaProgram.aureliaComponents
                .getAll()
                .filter((component) => component.type === constants_1.AureliaClassTypes.VALUE_CONVERTER)
                .find((valueConverterComponent) => {
                var _a;
                return valueConverterComponent.valueConverterName ===
                    ((_a = targetRegion.data) === null || _a === void 0 ? void 0 : _a.valueConverterName);
            });
            return {
                lineAndCharacter: {
                    line: 1,
                    character: 1,
                } /** TODO: Find toView() method */,
                viewModelFilePath: targetValueConverterComponent === null || targetValueConverterComponent === void 0 ? void 0 : targetValueConverterComponent.viewModelFilePath,
            };
        });
    }
}
exports.ValueConverterLanguageService = ValueConverterLanguageService;
function onValueConverterCompletion(document, aureliaProgram, targetRegion) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!targetRegion)
            return [];
        if (!ViewRegions_1.ValueConverterRegion.is(targetRegion))
            return [];
        // Find value converter sourcefile
        const targetValueConverterComponent = aureliaProgram.aureliaComponents
            .getAll()
            .filter((component) => component.type === constants_1.AureliaClassTypes.VALUE_CONVERTER)
            .find((valueConverterComponent) => {
            var _a;
            return valueConverterComponent.valueConverterName ===
                ((_a = targetRegion.data) === null || _a === void 0 ? void 0 : _a.valueConverterName);
        });
        if (!(targetValueConverterComponent === null || targetValueConverterComponent === void 0 ? void 0 : targetValueConverterComponent.sourceFile))
            return [];
        const valueConverterCompletion = (0, virtualCompletion_1.getVirtualViewModelCompletionSupplyContent)(aureliaProgram, 
        /**
         * Aurelia interface method name, that handles interaction with view
         */
        constants_1.AureliaViewModel.TO_VIEW, targetValueConverterComponent.sourceFile, 'SortValueConverter', {
            customEnhanceMethodArguments: enhanceValueConverterViewArguments,
            omitMethodNameAndBrackets: true,
        }).filter(
        /** ASSUMPTION: Only interested in `toView` */
        (completion) => completion.label === constants_1.AureliaViewModel.TO_VIEW);
        return valueConverterCompletion;
    });
}
/**
 * Convert Value Converter's `toView` to view format.
 *
 * @example
 *
 * ```ts
 * // TakeValueConverter
 *   toView(array, count)
 * ```
 *   -->
 * ```html
 *   array | take:count
 * ```
 */
function enhanceValueConverterViewArguments(methodArguments) {
    // 1. Omit the first argument, because that's piped to the method
    const [, ...viewArguments] = methodArguments;
    // 2. prefix with :
    const result = viewArguments
        .map((argName, index) => {
        return `\${${index + 1}:${argName}}`;
    })
        .join(':');
    return result;
}
//# sourceMappingURL=ValueConverterLanguageService.js.map
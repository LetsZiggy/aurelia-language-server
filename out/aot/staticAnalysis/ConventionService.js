"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConventionService = void 0;
const Path = __importStar(require("path"));
const lodash_1 = require("lodash");
const constants_1 = require("../../common/constants");
class ConventionService {
    static fulfillsAureliaConventions(node) {
        const fulfillsAureliaConventions = classDeclarationHasUseViewOrNoView(node) ||
            hasCustomElementNamingConvention(node) ||
            hasValueConverterNamingConvention(node);
        return fulfillsAureliaConventions;
    }
}
exports.ConventionService = ConventionService;
/**
 * checks whether a classDeclaration has a useView or noView
 *
 * @param classDeclaration - ClassDeclaration to check
 */
function classDeclarationHasUseViewOrNoView(classDeclaration) {
    if (!classDeclaration.decorators)
        return false;
    const hasViewDecorator = classDeclaration.decorators.some((decorator) => {
        const result = decorator.getText().includes('@useView') ||
            decorator.getText().includes('@noView');
        return result;
    });
    return hasViewDecorator;
}
/**
 * MyClassCustomelement
 *
 * \@customElement(...)
 * MyClass
 */
function hasCustomElementNamingConvention(classDeclaration) {
    var _a, _b, _c;
    const hasCustomElementDecorator = (_b = (_a = classDeclaration.decorators) === null || _a === void 0 ? void 0 : _a.some((decorator) => {
        const decoratorName = decorator.getText();
        const result = decoratorName.includes(constants_1.AureliaDecorator.CUSTOM_ELEMENT) ||
            decoratorName.includes('name');
        return result;
    })) !== null && _b !== void 0 ? _b : false;
    const className = (_c = classDeclaration.name) === null || _c === void 0 ? void 0 : _c.getText();
    const hasCustomElementNamingConvention = Boolean(className === null || className === void 0 ? void 0 : className.includes(constants_1.AureliaClassTypes.CUSTOM_ELEMENT));
    const { fileName } = classDeclaration.getSourceFile();
    const baseName = Path.parse(fileName).name;
    const isCorrectFileAndClassConvention = (0, lodash_1.kebabCase)(baseName) === (0, lodash_1.kebabCase)(className);
    return (hasCustomElementDecorator ||
        hasCustomElementNamingConvention ||
        isCorrectFileAndClassConvention);
}
/**
 * MyClassValueConverter
 *
 * \@valueConverter(...)
 * MyClass
 */
function hasValueConverterNamingConvention(classDeclaration) {
    var _a, _b, _c;
    const hasValueConverterDecorator = (_b = (_a = classDeclaration.decorators) === null || _a === void 0 ? void 0 : _a.some((decorator) => {
        const result = decorator
            .getText()
            .includes(constants_1.AureliaDecorator.VALUE_CONVERTER);
        return result;
    })) !== null && _b !== void 0 ? _b : false;
    const hasValueConverterNamingConvention = Boolean((_c = classDeclaration.name) === null || _c === void 0 ? void 0 : _c.getText().includes(constants_1.AureliaClassTypes.VALUE_CONVERTER));
    return hasValueConverterDecorator || hasValueConverterNamingConvention;
}
//# sourceMappingURL=ConventionService.js.map
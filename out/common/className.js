"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getElementNameFromClassDeclaration = void 0;
const lodash_1 = require("lodash");
const getAureliaComponentList_1 = require("../aot/getAureliaComponentList");
const constants_1 = require("./constants");
/**
 * Fetches the equivalent component name based on the given class declaration
 *
 * @param sourceFile - The class declaration to map a component name from
 */
function getElementNameFromClassDeclaration(classDeclaration) {
    var _a, _b, _c;
    const className = (_b = (_a = classDeclaration.name) === null || _a === void 0 ? void 0 : _a.getText()) !== null && _b !== void 0 ? _b : '';
    const classDecoratorInfos = (0, getAureliaComponentList_1.getClassDecoratorInfos)(classDeclaration);
    const customElementDecoratorName = (_c = classDecoratorInfos.find((info) => info.decoratorName === 'customElement')) === null || _c === void 0 ? void 0 : _c.decoratorArgument;
    // Prioritize decorator name over class name convention
    if (customElementDecoratorName) {
        return customElementDecoratorName;
    }
    const withoutCustomElementSuffix = className.replace(constants_1.CUSTOM_ELEMENT_SUFFIX, '');
    return (0, lodash_1.kebabCase)(withoutCustomElementSuffix);
}
exports.getElementNameFromClassDeclaration = getElementNameFromClassDeclaration;
//# sourceMappingURL=className.js.map
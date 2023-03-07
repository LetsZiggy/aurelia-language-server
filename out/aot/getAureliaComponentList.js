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
exports.getClassDecoratorInfos = exports.getAureliaComponentInfoFromClassDeclaration = void 0;
const fs = __importStar(require("fs"));
const Path = __importStar(require("path"));
const lodash_1 = require("lodash");
const ts_morph_1 = require("ts-morph");
const className_1 = require("../common/className");
const constants_1 = require("../common/constants");
const uri_utils_1 = require("../common/view/uri-utils");
function getAureliaComponentInfoFromClassDeclaration(sourceFile, checker) {
    let result;
    let targetClassDeclaration;
    sourceFile.forEachChild((node) => {
        var _a, _b, _c, _d, _e, _f;
        const isClassDeclaration = ts_morph_1.ts.isClassDeclaration(node);
        if (!isClassDeclaration)
            return;
        const fulfillsAureliaConventions = classDeclarationHasUseViewOrNoView(node) ||
            hasCustomElementNamingConvention(node) ||
            hasValueConverterNamingConvention(node);
        const validForAurelia = isNodeExported(node) && fulfillsAureliaConventions;
        if (validForAurelia) {
            targetClassDeclaration = node;
            if (node.name == null)
                return;
            const symbol = checker.getSymbolAtLocation(node.name);
            let documentation = '';
            if (symbol != null) {
                // console.log('No symbol found for: ', node.name.getText());
                documentation = ts_morph_1.ts.displayPartsToString(symbol.getDocumentationComment(checker));
            }
            // Value Converter
            const isValueConverterModel = checkValueConverter(targetClassDeclaration);
            if (isValueConverterModel) {
                const valueConverterName = (_a = targetClassDeclaration.name) === null || _a === void 0 ? void 0 : _a.getText().replace(constants_1.VALUE_CONVERTER_SUFFIX, '').toLocaleLowerCase();
                result = {
                    documentation,
                    className: (_c = (_b = targetClassDeclaration.name) === null || _b === void 0 ? void 0 : _b.getText()) !== null && _c !== void 0 ? _c : '',
                    valueConverterName,
                    baseViewModelFileName: Path.parse(sourceFile.fileName).name,
                    viewModelFilePath: uri_utils_1.UriUtils.toSysPath(sourceFile.fileName),
                    type: constants_1.AureliaClassTypes.VALUE_CONVERTER,
                    sourceFile,
                };
                return;
            }
            // Standard Component
            const { fileName } = targetClassDeclaration.getSourceFile();
            const conventionViewFilePath = fileName.replace(/.[jt]s$/, '.html');
            let viewFilePath = '';
            if (fs.existsSync(conventionViewFilePath)) {
                viewFilePath = uri_utils_1.UriUtils.toSysPath(conventionViewFilePath);
            }
            else {
                viewFilePath =
                    (_d = getTemplateImportPathFromCustomElementDecorator(targetClassDeclaration, sourceFile)) !== null && _d !== void 0 ? _d : '';
            }
            // TODO: better way to filter out non aurelia classes?
            if (viewFilePath === '')
                return;
            const resultClassMembers = getAureliaViewModelClassMembers(targetClassDeclaration, checker);
            const viewModelName = (0, className_1.getElementNameFromClassDeclaration)(targetClassDeclaration);
            // Decorator
            const customElementDecorator = getCustomElementDecorator(targetClassDeclaration);
            let decoratorComponentName;
            let decoratorStartOffset;
            let decoratorEndOffset;
            if (customElementDecorator) {
                // get argument for name property in decorator
                customElementDecorator.expression.forEachChild((decoratorChild) => {
                    // @customElement('empty-view')
                    if (ts_morph_1.ts.isStringLiteral(decoratorChild)) {
                        decoratorComponentName = decoratorChild
                            .getText()
                            .replace(/['"]/g, '');
                        decoratorStartOffset = decoratorChild.getStart() + 1; // start quote
                        decoratorEndOffset = decoratorChild.getEnd(); // include the last character, ie. the end quote
                    }
                    // @customElement({ name: 'my-view', template })
                    else if (ts_morph_1.ts.isObjectLiteralExpression(decoratorChild)) {
                        decoratorChild.forEachChild((decoratorArgument) => {
                            if (!ts_morph_1.ts.isPropertyAssignment(decoratorArgument))
                                return;
                            decoratorArgument.forEachChild((decoratorProp) => {
                                if (!ts_morph_1.ts.isStringLiteral(decoratorProp)) {
                                    // TODO: What if name is not a string? --> Notify users [ISSUE-8Rh31VAG]
                                    return;
                                }
                                decoratorComponentName = decoratorProp
                                    .getText()
                                    .replace(/['"]/g, '');
                                decoratorStartOffset = decoratorProp.getStart() + 1; // start quote
                                decoratorEndOffset = decoratorProp.getEnd(); // include the last character, ie. the end quote
                            });
                        });
                    }
                });
            }
            result = {
                documentation,
                className: (_f = (_e = targetClassDeclaration.name) === null || _e === void 0 ? void 0 : _e.getText()) !== null && _f !== void 0 ? _f : '',
                componentName: viewModelName,
                decoratorComponentName,
                decoratorStartOffset,
                decoratorEndOffset,
                baseViewModelFileName: Path.parse(sourceFile.fileName).name,
                viewModelFilePath: uri_utils_1.UriUtils.toSysPath(sourceFile.fileName),
                viewFilePath,
                type: constants_1.AureliaClassTypes.CUSTOM_ELEMENT,
                classMembers: resultClassMembers,
                sourceFile,
            };
        }
    });
    return result;
}
exports.getAureliaComponentInfoFromClassDeclaration = getAureliaComponentInfoFromClassDeclaration;
function checkValueConverter(targetClassDeclaration) {
    var _a;
    const isValueConverterName = (_a = targetClassDeclaration.name) === null || _a === void 0 ? void 0 : _a.getText().includes(constants_1.VALUE_CONVERTER_SUFFIX);
    return Boolean(isValueConverterName);
}
function isNodeExported(node) {
    return (ts_morph_1.ts.getCombinedModifierFlags(node) & ts_morph_1.ts.ModifierFlags.Export) !== 0;
}
function getClassDecoratorInfos(classDeclaration) {
    var _a;
    const classDecoratorInfos = [];
    const aureliaDecorators = ['customElement', 'useView', 'noView'];
    (_a = classDeclaration.decorators) === null || _a === void 0 ? void 0 : _a.forEach((decorator) => {
        const result = {
            decoratorName: '',
            decoratorArgument: '',
        };
        decorator.expression.forEachChild((decoratorChild) => {
            const childName = decoratorChild.getText();
            const isAureliaDecorator = aureliaDecorators.includes(childName);
            if (isAureliaDecorator) {
                if (ts_morph_1.ts.isIdentifier(decoratorChild)) {
                    result.decoratorName = childName;
                }
            }
            // @customElement({name:>'my-name'<})
            else if (ts_morph_1.ts.isObjectLiteralExpression(decoratorChild)) {
                decoratorChild.forEachChild((decoratorArgChild) => {
                    var _a;
                    // {>name:'my-name'<}
                    if (ts_morph_1.ts.isPropertyAssignment(decoratorArgChild)) {
                        if (decoratorArgChild.name.getText() === 'name') {
                            const value = (_a = decoratorArgChild.getLastToken()) === null || _a === void 0 ? void 0 : _a.getText();
                            if (value == null)
                                return;
                            result.decoratorArgument = value;
                        }
                    }
                });
            }
            else if (ts_morph_1.ts.isToken(decoratorChild)) {
                result.decoratorArgument = childName;
            }
        });
        const withoutQuotes = result.decoratorArgument.replace(/['"]/g, '');
        result.decoratorArgument = withoutQuotes;
        classDecoratorInfos.push(result);
    });
    return classDecoratorInfos.filter((info) => info.decoratorName !== '');
}
exports.getClassDecoratorInfos = getClassDecoratorInfos;
function getAureliaViewModelClassMembers(classDeclaration, checker) {
    const classMembers = [];
    classDeclaration.forEachChild((classMember) => {
        var _a, _b, _c, _d, _e, _f;
        // Constructor members
        if (ts_morph_1.ts.isConstructorDeclaration(classMember)) {
            const constructorMember = classMember;
            constructorMember.forEachChild((constructorArgument) => {
                if (constructorArgument.kind !== ts_morph_1.SyntaxKind.Parameter)
                    return;
                const hasModifier = getConstructorHasModifier(constructorArgument);
                if (hasModifier === false)
                    return;
                constructorArgument.forEachChild((argumentPart) => {
                    var _a, _b;
                    if (argumentPart.kind !== ts_morph_1.SyntaxKind.Identifier)
                        return;
                    const name = argumentPart.getText();
                    const symbol = checker.getSymbolAtLocation(argumentPart);
                    const commentDoc = ts_morph_1.ts.displayPartsToString(symbol === null || symbol === void 0 ? void 0 : symbol.getDocumentationComment(checker));
                    const memberType = ((_a = classMember.type) === null || _a === void 0 ? void 0 : _a.getText()) !== undefined
                        ? (_b = classMember.type) === null || _b === void 0 ? void 0 : _b.getText()
                        : 'unknown';
                    const result = {
                        name,
                        memberType,
                        documentation: commentDoc,
                        isBindable: false,
                        syntaxKind: argumentPart.kind,
                        start: constructorArgument.getStart(),
                        end: constructorArgument.getEnd(),
                    };
                    classMembers.push(result);
                });
            });
        }
        // Class Members
        else if (ts_morph_1.ts.isPropertyDeclaration(classMember) ||
            ts_morph_1.ts.isGetAccessorDeclaration(classMember) ||
            ts_morph_1.ts.isMethodDeclaration(classMember)) {
            const classMemberName = (_a = classMember.name) === null || _a === void 0 ? void 0 : _a.getText();
            const isBindable = (_b = classMember.decorators) === null || _b === void 0 ? void 0 : _b.find((decorator) => {
                return decorator.getText().includes('@bindable');
            });
            // Get bindable type. If bindable type is undefined, we set it to be "unknown".
            const memberType = ((_c = classMember.type) === null || _c === void 0 ? void 0 : _c.getText()) !== undefined
                ? (_d = classMember.type) === null || _d === void 0 ? void 0 : _d.getText()
                : 'unknown';
            const memberTypeText = '' + `${isBindable ? 'Bindable ' : ''}` + `Type: \`${memberType}\``;
            // Add comment documentation if available
            const symbol = checker.getSymbolAtLocation(classMember.name);
            const commentDoc = ts_morph_1.ts.displayPartsToString(symbol === null || symbol === void 0 ? void 0 : symbol.getDocumentationComment(checker));
            let defaultValueText = '';
            if (ts_morph_1.ts.isPropertyDeclaration(classMember)) {
                // Add default values. The value can be undefined, but that is correct in most cases.
                const defaultValue = (_f = (_e = classMember.initializer) === null || _e === void 0 ? void 0 : _e.getText()) !== null && _f !== void 0 ? _f : '';
                defaultValueText = `Default value: \`${defaultValue}\``;
            }
            // Concatenate documentation parts with spacing
            const documentation = `${commentDoc}\n\n${memberTypeText}\n\n${defaultValueText}`;
            const result = {
                name: classMemberName,
                memberType,
                documentation,
                isBindable: Boolean(isBindable),
                syntaxKind: ts_morph_1.ts.isPropertyDeclaration(classMember)
                    ? ts_morph_1.ts.SyntaxKind.VariableDeclaration
                    : ts_morph_1.ts.SyntaxKind.MethodDeclaration,
                start: classMember.getStart(),
                end: classMember.getEnd(),
            };
            classMembers.push(result);
        }
    });
    return classMembers;
}
function getConstructorHasModifier(constructorArgument) {
    let hasModifier = false;
    constructorArgument.forEachChild((argumentPart) => {
        if (hasModifier === true)
            return;
        const isPrivate = argumentPart.kind === ts_morph_1.SyntaxKind.PrivateKeyword;
        const isPublic = argumentPart.kind === ts_morph_1.SyntaxKind.PublicKeyword;
        const isProtected = argumentPart.kind === ts_morph_1.SyntaxKind.ProtectedKeyword;
        const isReadonly = argumentPart.kind === ts_morph_1.SyntaxKind.ReadonlyKeyword;
        hasModifier = isPrivate || isPublic || isProtected || isReadonly;
    });
    return hasModifier;
}
/**
 * classDeclarationHasUseViewOrNoView checks whether a classDeclaration has a useView or noView
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
 * [refactor]: also get other decorators
 */
function getCustomElementDecorator(classDeclaration) {
    var _a;
    const target = (_a = classDeclaration.decorators) === null || _a === void 0 ? void 0 : _a.find((decorator) => {
        const result = decorator
            .getText()
            .includes(constants_1.AureliaDecorator.CUSTOM_ELEMENT);
        return result;
    });
    return target;
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
function getTemplateImportPathFromCustomElementDecorator(classDeclaration, sourceFile) {
    if (!classDeclaration.decorators)
        return;
    const customElementDecorator = classDeclaration.decorators.find((decorator) => {
        const result = decorator
            .getText()
            .includes(constants_1.AureliaDecorator.CUSTOM_ELEMENT);
        return result;
    });
    if (!customElementDecorator)
        return;
    const hasTemplateProp = customElementDecorator
        .getText()
        .includes(constants_1.AureliaViewModel.TEMPLATE);
    if (!hasTemplateProp)
        return;
    let templateImportPath = '';
    const templateImport = sourceFile.statements.find((statement) => {
        const isImport = statement.kind === ts_morph_1.ts.SyntaxKind.ImportDeclaration;
        if (!isImport) {
            return false;
        }
        let foundTemplateImport = false;
        statement.getChildren().forEach((child) => {
            if (child.kind === ts_morph_1.ts.SyntaxKind.ImportClause) {
                if (child.getText().includes(constants_1.AureliaViewModel.TEMPLATE)) {
                    foundTemplateImport = true;
                }
            }
        });
        return foundTemplateImport;
    });
    templateImport === null || templateImport === void 0 ? void 0 : templateImport.getChildren().forEach((child) => {
        if (child.kind === ts_morph_1.ts.SyntaxKind.StringLiteral) {
            templateImportPath = child.getText().replace(/['"]/g, '');
        }
    });
    templateImportPath = Path.resolve(Path.dirname(uri_utils_1.UriUtils.toSysPath(sourceFile.fileName)), templateImportPath);
    return templateImportPath;
}
//# sourceMappingURL=getAureliaComponentList.js.map
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
exports.convertToSymbolName = exports.onDocumentSymbol = void 0;
const vscode_languageserver_1 = require("vscode-languageserver");
const vscode_languageserver_types_1 = require("vscode-languageserver-types");
const ViewRegions_1 = require("../../aot/parser/regions/ViewRegions");
const TextDocumentUtils_1 = require("../../common/documens/TextDocumentUtils");
const uri_utils_1 = require("../../common/view/uri-utils");
const AureliaProjects_1 = require("../../core/AureliaProjects");
function onDocumentSymbol(container, documentUri) {
    var _a;
    return __awaiter(this, void 0, void 0, function* () {
        const document = TextDocumentUtils_1.TextDocumentUtils.createHtmlFromPath(uri_utils_1.UriUtils.toSysPath(documentUri));
        if (!document)
            return [];
        const viewModelPath = uri_utils_1.UriUtils.toSysPath(document.uri);
        const targetProject = container
            .get(AureliaProjects_1.AureliaProjects)
            .getFromPath(viewModelPath);
        if (!targetProject)
            return [];
        const { aureliaProgram } = targetProject;
        if (!aureliaProgram)
            return [];
        const targetComponent = aureliaProgram.aureliaComponents.getOneByFromDocument(document);
        const regions = (_a = targetComponent === null || targetComponent === void 0 ? void 0 : targetComponent.viewRegions) !== null && _a !== void 0 ? _a : [];
        const finalSymbols = [];
        regions.forEach((region) => {
            const symbol = createAureliaDocumentSymbol(region);
            if (!symbol)
                return;
            finalSymbols.push(symbol);
        });
        return finalSymbols;
    });
}
exports.onDocumentSymbol = onDocumentSymbol;
function createAureliaDocumentSymbol(region) {
    var _a;
    const converted = convertToSymbolName(region);
    if (!converted)
        return;
    const symbolName = `Au: ${converted.value}`;
    const start = {
        line: region.sourceCodeLocation.startLine,
        character: region.sourceCodeLocation.startCol,
    };
    const end = {
        line: region.sourceCodeLocation.endLine,
        character: region.sourceCodeLocation.endCol,
    };
    const symbol = vscode_languageserver_1.DocumentSymbol.create(symbolName, region.type, converted.icon, vscode_languageserver_1.Range.create(start, end), vscode_languageserver_1.Range.create(start, end), (_a = converted.children) !== null && _a !== void 0 ? _a : []);
    return symbol;
}
function convertToSymbolName(region) {
    var _a, _b, _c, _d, _e;
    const regionType = region.type;
    if (!regionType)
        return;
    if (region.subType === ViewRegions_1.ViewRegionSubType.EndTag)
        return;
    const attributeValue = `${(_a = region.attributeName) !== null && _a !== void 0 ? _a : ''}="${(_b = region.attributeValue) !== null && _b !== void 0 ? _b : ''}"`;
    const symbolMap = {
        Attribute: { label: 'attr', icon: vscode_languageserver_types_1.SymbolKind.Class, value: attributeValue },
        AttributeInterpolation: {
            label: 'attr-inpol',
            icon: vscode_languageserver_types_1.SymbolKind.Object,
            value: attributeValue,
        },
        BindableAttribute: {
            label: 'bindable',
            icon: vscode_languageserver_types_1.SymbolKind.Interface,
            value: attributeValue,
        },
        CustomElement: {
            label: 'ce',
            icon: vscode_languageserver_types_1.SymbolKind.Boolean,
            value: (_c = `<${region.tagName}>`) !== null && _c !== void 0 ? _c : '',
        },
        html: {
            label: 'html',
            icon: vscode_languageserver_types_1.SymbolKind.Constructor,
            value: attributeValue,
        },
        Import: {
            label: 'import',
            icon: vscode_languageserver_types_1.SymbolKind.Constructor,
            value: (_d = region.regionValue) !== null && _d !== void 0 ? _d : '',
        },
        RepeatFor: {
            label: 'repeat',
            icon: vscode_languageserver_types_1.SymbolKind.Enum,
            value: `${region.attributeName}="${region.regionValue}"`,
        },
        TextInterpolation: {
            label: 't-inpol',
            icon: vscode_languageserver_types_1.SymbolKind.TypeParameter,
            // eslint-disable-next-line no-useless-escape
            value: `\$\{${region.regionValue}\}`,
        },
        ValueConverter: {
            label: 'vc',
            icon: vscode_languageserver_types_1.SymbolKind.Property,
            value: attributeValue,
        }, //
    };
    if (ViewRegions_1.CustomElementRegion.is(region)) {
        if ((_e = region.data) === null || _e === void 0 ? void 0 : _e.length) {
            const finalChildrenSymbol = [];
            region.data.forEach((subRegion) => {
                if (subRegion.type !== ViewRegions_1.ViewRegionType.BindableAttribute)
                    return;
                const symbol = createAureliaDocumentSymbol(subRegion);
                if (!symbol)
                    return;
                finalChildrenSymbol.push(symbol);
            });
            symbolMap[regionType].children = finalChildrenSymbol;
        }
    }
    const converted = symbolMap[regionType];
    return converted;
}
exports.convertToSymbolName = convertToSymbolName;
//# sourceMappingURL=onDocumentSymbol.js.map
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.prettyTable = exports.RegionParser = void 0;
/* eslint-disable @typescript-eslint/no-explicit-any */
const kernel_1 = require("@aurelia/kernel");
const parse5_sax_parser_1 = __importDefault(require("parse5-sax-parser"));
const constants_1 = require("../../../common/constants");
const logger_1 = require("../../../common/logging/logger");
const aurelia_attributes_1 = require("../../../common/template/aurelia-attributes");
const DocumentSettings_1 = require("../../../configuration/DocumentSettings");
const ViewRegions_1 = require("./ViewRegions");
const logger = new logger_1.Logger('RegionParser');
const OBJECT_PLACEHOLDER = '[o]';
class RegionParser {
    static parse(document, componentList) {
        const saxStream = new parse5_sax_parser_1.default({ sourceCodeLocationInfo: true });
        /* prettier-ignore */ logger.culogger.debug(['Start document parsing'], { logLevel: 'INFO' });
        const viewRegions = [];
        const aureliaCustomElementNames = componentList.map((component) => component.componentName);
        const documentHasCrlf = document.getText().includes('\r\n');
        let hasTemplateTag = false;
        /**
         * 1. Template Tag x
         * 2. Attributes x
         * 3. Attribute Interpolation x
         * 4. Custom element x
         * 5. repeat.for="" x
         * 6. Value converter region (value | take:10)
         * 7. BindableAttribute x
         * 8. Import
         */
        saxStream.on('startTag', (startTag) => {
            // 0. Prep
            const tagName = startTag.tagName;
            // 1. Template Tag
            const isTemplateTag = tagName === constants_1.AureliaView.TEMPLATE_TAG_NAME;
            if (isTemplateTag) {
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                hasTemplateTag = true;
            }
            const isImportTag = getIsImportOrRequireTag(startTag);
            if (isImportTag) {
                const importRegion = ViewRegions_1.ImportRegion.parse5(startTag);
                if (importRegion) {
                    viewRegions.push(importRegion);
                }
                return;
            }
            const attributeRegions = [];
            startTag.attrs.forEach((attr) => {
                var _a;
                const isAttributeKeyword = DocumentSettings_1.AURELIA_ATTRIBUTES_KEYWORDS.some((keyword) => {
                    if (keyword === 'ref') {
                        return attr.name === keyword;
                    }
                    else if (keyword === 'bindable') {
                        return attr.name === keyword;
                    }
                    return attr.name.endsWith(`.${keyword}`);
                });
                const isRepeatFor = attr.name === constants_1.AureliaView.REPEAT_FOR;
                // 2. Attributes
                if (isAttributeKeyword) {
                    // TODO: Are "just" attributes interesting? Or are BindableAttributes enough?
                    const attributeRegion = ViewRegions_1.AttributeRegion.parse5(startTag, attr);
                    if (attributeRegion) {
                        attributeRegions.push(attributeRegion);
                    }
                }
                // 5. Repeat for
                else if (isRepeatFor) {
                    const repeatForViewRegion = ViewRegions_1.RepeatForRegion.parse5Start(startTag, attr);
                    if (!repeatForViewRegion)
                        return;
                    viewRegions.push(repeatForViewRegion);
                }
                // 3. Attribute Interpolation
                else {
                    if (((_a = attr.value.match(constants_1.interpolationRegex)) === null || _a === void 0 ? void 0 : _a.length) == null)
                        return;
                    const attributeRegions = ViewRegions_1.AttributeInterpolationRegion.parse5Interpolation(startTag, attr, null, documentHasCrlf);
                    if (!attributeRegions)
                        return;
                    viewRegions.push(...attributeRegions);
                }
                const isValueConverterRegion = attr.value.includes(constants_1.AureliaView.VALUE_CONVERTER_OPERATOR);
                // 6. Value converter region
                if (isValueConverterRegion) {
                    const valueConverterRegion = ViewRegions_1.ValueConverterRegion.parse5Start(startTag, attr);
                    if (valueConverterRegion === undefined)
                        return;
                    viewRegions.push(...valueConverterRegion);
                }
            });
            viewRegions.push(...attributeRegions);
            // 4. Custom elements
            const isCustomElement = aureliaCustomElementNames.includes(tagName);
            if (!isCustomElement) {
                return;
            }
            const customElementViewRegion = ViewRegions_1.CustomElementRegion.parse5Start(startTag);
            if (!customElementViewRegion)
                return;
            // 7. BindableAttribute
            const customElementBindableAttributeRegions = [];
            const targetComponent = componentList.find((component) => component.componentName === tagName);
            startTag.attrs.forEach((attr) => {
                var _a;
                const onlyBindableName = (0, aurelia_attributes_1.getBindableNameFromAttritute)(attr.name);
                const isBindableAttribute = (_a = targetComponent === null || targetComponent === void 0 ? void 0 : targetComponent.classMembers) === null || _a === void 0 ? void 0 : _a.find((member) => {
                    const correctNamingConvetion = (0, kernel_1.kebabCase)(member.name) === (0, kernel_1.kebabCase)(onlyBindableName);
                    const is = correctNamingConvetion && member.isBindable;
                    return is;
                });
                if (isBindableAttribute == null)
                    return;
                const bindableAttributeRegion = ViewRegions_1.BindableAttributeRegion.parse5Start(startTag, attr);
                if (bindableAttributeRegion) {
                    customElementBindableAttributeRegions.push(bindableAttributeRegion);
                }
            });
            customElementViewRegion.data = [...customElementBindableAttributeRegions];
            viewRegions.push(customElementViewRegion);
        });
        saxStream.on('text', (text) => {
            if (text.text.trim() === '')
                return;
            const textRegions = ViewRegions_1.TextInterpolationRegion.createRegionsFromExpressionParser(text, documentHasCrlf);
            if (!textRegions)
                return;
            viewRegions.push(...textRegions);
        });
        saxStream.on('endTag', (endTag) => {
            const tagName = endTag.tagName;
            const isCustomElement = aureliaCustomElementNames.includes(tagName);
            if (!isCustomElement)
                return;
            const customElementViewRegion = ViewRegions_1.CustomElementRegion.parse5End(endTag);
            if (!customElementViewRegion)
                return;
            viewRegions.push(customElementViewRegion);
        });
        saxStream.write(document.getText());
        return viewRegions;
    }
    static pretty(regions, prettyOptions) {
        if (!regions)
            return 'no regions';
        if ((regions === null || regions === void 0 ? void 0 : regions.length) === 0)
            return 'no regions';
        const finalResult = [];
        regions.forEach((region) => {
            const prettified = pickTruthyFields(region, prettyOptions);
            // .data[]
            if (Array.isArray(region.data)) {
                const pretty_data = [];
                region.data.forEach((subRegion) => {
                    const pretty_subRegionData = pickTruthyFields(
                    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
                    subRegion, prettyOptions);
                    pretty_data.push(pretty_subRegionData);
                });
                prettified.data = pretty_data;
            }
            finalResult.push(prettified);
        });
        if ((prettyOptions === null || prettyOptions === void 0 ? void 0 : prettyOptions.asTable) !== undefined) {
            const asTable = objectToTable(finalResult, prettyOptions);
            return asTable;
        }
        return finalResult;
    }
}
exports.RegionParser = RegionParser;
function objectToTable(objectList, prettyOptions) {
    const EMPTY_PLACEHOLDER = '-';
    const allPossibleKeysSet = new Set();
    objectList.forEach((object) => {
        Object.keys(object).forEach((key) => {
            allPossibleKeysSet.add(key);
        });
    });
    const allPossibleKeys = Array.from(allPossibleKeysSet);
    // allPossibleKeys; /*?*/
    const flattenedRows = [];
    objectList.forEach((result) => {
        const withAllKeys = {};
        // enrich with all keys, to allow normalized table
        allPossibleKeys.forEach((possibleKey) => {
            var _a;
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            withAllKeys[possibleKey] = (_a = result[possibleKey]) !== null && _a !== void 0 ? _a : EMPTY_PLACEHOLDER;
        });
        // collect
        if (typeof withAllKeys.data === 'object') {
            flattenedRows.push(Object.values(withAllKeys));
            if (Array.isArray(withAllKeys.data)) {
                // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
                withAllKeys.data.forEach((datum) => {
                    allPossibleKeys.forEach((possibleKey) => {
                        var _a;
                        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
                        withAllKeys[possibleKey] = (_a = datum[possibleKey]) !== null && _a !== void 0 ? _a : EMPTY_PLACEHOLDER;
                    });
                    flattenedRows.push(Object.values(withAllKeys));
                });
            }
            else {
                // repeat for and VC
                // flattenedRows.push(Object.values(withAllKeys.data));
            }
            return;
        }
        flattenedRows.push(Object.values(withAllKeys));
    });
    // flattenedRows; /*?*/
    const final = [allPossibleKeys, ...flattenedRows];
    // find max in each column
    const maxHeader = allPossibleKeys.map((headerColumn) => headerColumn.length);
    const maxTracker = maxHeader;
    flattenedRows.forEach((rowEntry) => {
        rowEntry.forEach((rowValue, index) => {
            var _a;
            maxTracker[index] = Math.max(maxTracker[index], (_a = rowValue.length) !== null && _a !== void 0 ? _a : 0);
        });
    });
    const asTable = final.map((row) => {
        const padded = row.map((entry, index) => {
            var _a;
            let finalEntry = entry;
            if (!entry)
                finalEntry = '-';
            if (typeof entry !== 'string')
                finalEntry = OBJECT_PLACEHOLDER;
            if ((prettyOptions === null || prettyOptions === void 0 ? void 0 : prettyOptions.maxColWidth) !== undefined) {
                finalEntry = finalEntry.substring(0, prettyOptions.maxColWidth);
            }
            const padWith = Math.min((_a = prettyOptions === null || prettyOptions === void 0 ? void 0 : prettyOptions.maxColWidth) !== null && _a !== void 0 ? _a : Infinity, maxTracker[index]);
            finalEntry = finalEntry.replace('\n', '[nl]');
            // maxTracker; /*?*/
            return finalEntry === null || finalEntry === void 0 ? void 0 : finalEntry.padEnd(padWith, ' ');
        });
        return padded.join(' | ');
    });
    return asTable;
}
function prettyTable(allPossibleKeys, flattenedRows, prettyOptions) {
    const final = [allPossibleKeys, ...flattenedRows];
    // find max in each column
    const maxHeader = allPossibleKeys.map((headerColumn) => headerColumn.length);
    const maxTracker = maxHeader;
    flattenedRows.forEach((rowEntry) => {
        rowEntry.forEach((rowValue, index) => {
            var _a;
            maxTracker[index] = Math.max(maxTracker[index], (_a = rowValue.length) !== null && _a !== void 0 ? _a : 0);
        });
    });
    const asTable = final.map((row) => {
        const padded = row.map((entry, index) => {
            var _a;
            let finalEntry = entry;
            if (!entry)
                finalEntry = '-';
            if (typeof entry !== 'string')
                finalEntry = OBJECT_PLACEHOLDER;
            if ((prettyOptions === null || prettyOptions === void 0 ? void 0 : prettyOptions.maxColWidth) !== undefined) {
                finalEntry = finalEntry.substring(0, prettyOptions.maxColWidth);
            }
            const padWith = Math.min((_a = prettyOptions === null || prettyOptions === void 0 ? void 0 : prettyOptions.maxColWidth) !== null && _a !== void 0 ? _a : Infinity, maxTracker[index]);
            return finalEntry === null || finalEntry === void 0 ? void 0 : finalEntry.padEnd(padWith, ' ');
        });
        return padded.join(' | ');
    });
    return asTable;
}
exports.prettyTable = prettyTable;
function pickTruthyFields(anyObject, prettyOptions) {
    const truthyFields = {};
    Object.entries(anyObject !== null && anyObject !== void 0 ? anyObject : {}).forEach(([key, value]) => {
        const regionInfo = value;
        if (regionInfo === undefined)
            return;
        if (prettyOptions === null || prettyOptions === void 0 ? void 0 : prettyOptions.ignoreKeys) {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            const shouldIgnoreKey = prettyOptions.ignoreKeys.find((ignore) => ignore === key);
            if (shouldIgnoreKey !== undefined)
                return;
        }
        truthyFields[key] = regionInfo;
    });
    return truthyFields;
}
function getIsImportOrRequireTag(startTag) {
    const isImport = startTag.tagName === constants_1.AureliaView.IMPORT;
    const isRequire = startTag.tagName === constants_1.AureliaView.REQUIRE;
    const isTargetTag = isImport || isRequire;
    return isTargetTag;
}
// const path =
//   // '/Users/hdn/Desktop/aurelia-vscode-extension/vscode-extension/tests/testFixture/scoped-for-testing/src/index.html';
//   // '/Users/hdn/Desktop/aurelia-vscode-extension/vscode-extension/tests/testFixture/scoped-for-testing/src/view/custom-element/custom-element.html';
//   '/home/hdn/coding/repos/vscode-extension/tests/testFixture/scoped-for-testing/src/view/custom-element/custom-element.html';
// const document = TextDocumentUtils.createHtmlFromPath(path);
// const result = RegionParser.parse(document, [
//   // @ts-ignore
//   { componentName: 'custom-element' },
// ]);
// const visitor: IViewRegionsVisitor = {
//   visitValueConverter(region) {
//     region.regionValue; /*?*/
//   },
//   visitAttributeInterpolation(region) {
//     region.regionValue; /*?*/
//   },
// };
// result.forEach((res) => res.accept(visitor));
// RegionParser.pretty(result, { ignoreKeys: ['sourceCodeLocation'] }); /*?*/
//  result/*?*/
//# sourceMappingURL=RegionParser.js.map
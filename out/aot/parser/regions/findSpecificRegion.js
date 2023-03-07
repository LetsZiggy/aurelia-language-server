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
exports.getRegionsOfType = exports.findRegionsByWord = exports.forEachRegionOfType = exports.findAllBindableAttributeRegions = void 0;
const fs = __importStar(require("fs"));
const url_1 = require("url");
const vscode_languageserver_textdocument_1 = require("vscode-languageserver-textdocument");
const AureliaUtils_1 = require("../../../common/AureliaUtils");
const ParseExpressionUtil_1 = require("../../../common/parseExpression/ParseExpressionUtil");
const RegionService_1 = require("../../../common/services/RegionService");
const RegionParser_1 = require("./RegionParser");
const ViewRegions_1 = require("./ViewRegions");
function findAllBindableAttributeRegions(aureliaProgram, bindableName) {
    return __awaiter(this, void 0, void 0, function* () {
        const regionsLookUp = {};
        // 1. Find Custom Elements with target Bindable
        const componentList = aureliaProgram.aureliaComponents.getAll();
        yield Promise.all(componentList.map((component) => __awaiter(this, void 0, void 0, function* () {
            const path = component.viewFilePath;
            if (path == null)
                return;
            const uri = (0, url_1.pathToFileURL)(path).toString();
            const content = fs.readFileSync(path, 'utf-8');
            const document = vscode_languageserver_textdocument_1.TextDocument.create(uri, 'html', 0, content);
            if (document === undefined)
                return;
            // 1.1 Parse document, and find all Custom Element regions
            const regions = RegionParser_1.RegionParser.parse(document, componentList);
            const customElementRegions = RegionService_1.RegionService.getRegionsOfType(regions, ViewRegions_1.ViewRegionType.CustomElement);
            // 1.2 Find all Custom Element with target bindable
            const customElementRegionsWithTargetBindable = customElementRegions.forEach((region) => {
                var _a;
                const targetBindableAttribute = (_a = region.data) === null || _a === void 0 ? void 0 : _a.find((attribute) => {
                    if (AureliaUtils_1.AureliaUtils.isSameVariableName(attribute.regionValue, bindableName)) {
                        // 1.2.1 Init
                        if (regionsLookUp[uri] === undefined) {
                            regionsLookUp[uri] = [];
                        }
                        // 1.2.2 Gather all BindableAttribute Regions
                        regionsLookUp[uri].push(attribute);
                        return true;
                    }
                    return false;
                });
                return targetBindableAttribute;
            });
            // 1.3 TODO: Multiple CE can have same attribute name
            return customElementRegionsWithTargetBindable;
        })));
        return regionsLookUp;
    });
}
exports.findAllBindableAttributeRegions = findAllBindableAttributeRegions;
function forEachRegionOfType(aureliaProgram, regionType, forEachRegionsCallback) {
    return __awaiter(this, void 0, void 0, function* () {
        const regionsLookUp = {};
        // 1. Find Custom Elements with target Bindable
        const componentList = aureliaProgram.aureliaComponents.getAll();
        yield Promise.all(componentList.map((component) => __awaiter(this, void 0, void 0, function* () {
            const path = component.viewFilePath;
            if (path == null)
                return;
            const uri = (0, url_1.pathToFileURL)(path).toString();
            const content = fs.readFileSync(path, 'utf-8');
            const document = vscode_languageserver_textdocument_1.TextDocument.create(uri, 'html', 0, content);
            if (document === undefined)
                return;
            // 1.1 Parse document, and find all Custom Element regions
            const regions = component.viewRegions;
            const finalRegions = RegionService_1.RegionService.getRegionsOfType(regions, regionType);
            finalRegions.forEach((region) => {
                forEachRegionsCallback(region, document);
            });
        })));
        return regionsLookUp;
    });
}
exports.forEachRegionOfType = forEachRegionOfType;
function findRegionsByWord(aureliaProgram, viewDocument, sourceWord) {
    return __awaiter(this, void 0, void 0, function* () {
        const componentList = aureliaProgram.aureliaComponents.getAll();
        const regions = RegionParser_1.RegionParser.parse(viewDocument, componentList);
        const targetRegions = regions.filter((region) => {
            var _a, _b, _c;
            // 1. default case: .regionValue
            const isDefault = region.regionValue === sourceWord;
            if (isDefault) {
                return true;
            }
            // 2. repeat-for regions
            else if (ViewRegions_1.RepeatForRegion.is(region)) {
                return isRepeatForIncludesWord(region, sourceWord);
            }
            // 3. Expressions
            const parseInput = (_c = (_b = (_a = region.regionValue) !== null && _a !== void 0 ? _a : region.attributeValue) !== null && _b !== void 0 ? _b : region.textValue) !== null && _c !== void 0 ? _c : '';
            if (parseInput === '')
                return false;
            try {
                // TODO: Gives parser error for parsing eg './custom-element'
                if (region.type === ViewRegions_1.ViewRegionType.Import)
                    return false;
                const expressionsWithName = ParseExpressionUtil_1.ParseExpressionUtil.getAllExpressionsByName(parseInput, sourceWord, [10082 /* AccessScope */, 1448 /* CallScope */]);
                const hasSourceWordInScope = expressionsWithName.length > 0;
                return hasSourceWordInScope;
            }
            catch (error) {
                console.log(error);
                return false;
            }
        });
        return targetRegions;
    });
}
exports.findRegionsByWord = findRegionsByWord;
/**
 * TODO: repeat.for for "...of <more-complex>"
 */
function isRepeatForIncludesWord(repeatForRegion, sourceWord) {
    const isTargetIterable = repeatForRegion.data.iterableName === sourceWord;
    return isTargetIterable;
}
function getRegionsOfType(regions, regionType) {
    return regions.filter((region) => region.type === regionType);
}
exports.getRegionsOfType = getRegionsOfType;
//# sourceMappingURL=findSpecificRegion.js.map
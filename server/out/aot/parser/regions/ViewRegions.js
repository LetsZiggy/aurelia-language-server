"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ValueConverterRegion = exports.TextInterpolationRegion = exports.RepeatForRegion = exports.ImportRegion = exports.CustomElementRegion = exports.BindableAttributeRegion = exports.AureliaHtmlRegion = exports.AttributeInterpolationRegion = exports.AttributeRegion = exports.AbstractRegion = exports.ViewRegionSubType = exports.ViewRegionType = void 0;
const src_1 = require("../../../common/@aurelia-runtime-patch/src");
const constants_1 = require("../../../common/constants");
const DiagnosticMessages_1 = require("../../../common/diagnosticMessages/DiagnosticMessages");
const ParseExpressionUtil_1 = require("../../../common/parseExpression/ParseExpressionUtil");
const aurelia_attributes_1 = require("../../../common/template/aurelia-attributes");
const AttributeInterpolationLanguageService_1 = require("./languageServer/AttributeInterpolationLanguageService");
const AttributeLanguageService_1 = require("./languageServer/AttributeLanguageService");
const AureliaHtmlLanguageService_1 = require("./languageServer/AureliaHtmlLanguageService");
const BindableAttributeLanguageService_1 = require("./languageServer/BindableAttributeLanguageService");
const CustomElementLanguageService_1 = require("./languageServer/CustomElementLanguageService");
const ImportLanguageService_1 = require("./languageServer/ImportLanguageService");
const RepeatForLanguageService_1 = require("./languageServer/RepeatForLanguageService");
const TextInterpolationLanguageService_1 = require("./languageServer/TextInterpolationLanguageService");
const ValueConverterLanguageService_1 = require("./languageServer/ValueConverterLanguageService");
var ViewRegionType;
(function (ViewRegionType) {
    ViewRegionType["Attribute"] = "Attribute";
    ViewRegionType["AttributeInterpolation"] = "AttributeInterpolation";
    ViewRegionType["BindableAttribute"] = "BindableAttribute";
    ViewRegionType["CustomElement"] = "CustomElement";
    ViewRegionType["Html"] = "html";
    ViewRegionType["Import"] = "Import";
    ViewRegionType["RepeatFor"] = "RepeatFor";
    ViewRegionType["TextInterpolation"] = "TextInterpolation";
    ViewRegionType["ValueConverter"] = "ValueConverter";
})(ViewRegionType = exports.ViewRegionType || (exports.ViewRegionType = {}));
var ViewRegionSubType;
(function (ViewRegionSubType) {
    ViewRegionSubType["StartTag"] = "StartTag";
    ViewRegionSubType["EndTag"] = "EndTag";
})(ViewRegionSubType = exports.ViewRegionSubType || (exports.ViewRegionSubType = {}));
class AbstractRegion {
    constructor(info) {
        //
        this.type = info.type;
        if (info.subType !== undefined)
            this.subType = info.subType;
        //
        this.sourceCodeLocation = {
            startCol: info.sourceCodeLocation.startCol,
            startLine: info.sourceCodeLocation.startLine,
            startOffset: info.sourceCodeLocation.startOffset,
            endLine: info.sourceCodeLocation.endLine,
            endCol: info.sourceCodeLocation.endCol,
            endOffset: info.sourceCodeLocation.endOffset,
        };
        if (info.startTagLocation !== undefined)
            this.startTagLocation = info.startTagLocation;
        //
        this.tagName = info.tagName;
        this.attributeName = info.attributeName;
        this.attributeValue = info.attributeValue;
        if (info.textValue !== undefined)
            this.textValue = info.textValue;
        if (info.regionValue !== undefined)
            this.regionValue = info.regionValue;
        //
        if (info.accessScopes !== undefined)
            this.accessScopes = info.accessScopes;
        if (info.data !== undefined)
            this.data = info.data;
    }
    // region static
    static create(info) {
        return info;
    }
    static is(region) {
        return region;
    }
    static isInterpolationRegion(region) {
        const isInterpolationRegion = AttributeInterpolationRegion.is(region) === true ||
            TextInterpolationRegion.is(region) === true;
        return isInterpolationRegion;
    }
    // public static parse5Start(
    //   startTag: SaxStream.StartTagToken,
    //   attr: parse5.Attribute
    // ) {}
    // public static parse5Interpolation(
    //   startTag: SaxStream.StartTagToken,
    //   attr: parse5.Attribute,
    //   interpolationMatch: RegExpExecArray | null
    // ) {}
    // public static parse5End(endTag: SaxStream.EndTagToken, attr: parse5.Attribute) {}
    // public static parse5Text(
    //   text: SaxStream.TextToken,
    //   interpolationMatch: RegExpExecArray | null
    // ) {}
    // endregion public
    // region public
    accept(visitor) {
        // eslint-disable-next-line @typescript-eslint/no-unused-expressions
        visitor;
    }
    getStartPosition() {
        return {
            line: this.sourceCodeLocation.startLine,
            character: this.sourceCodeLocation.startCol,
        };
    }
    getEndPosition() {
        return {
            line: this.sourceCodeLocation.endLine,
            character: this.sourceCodeLocation.endCol,
        };
    }
}
exports.AbstractRegion = AbstractRegion;
class AttributeRegion extends AbstractRegion {
    constructor(info) {
        super(info);
        this.languageService = new AttributeLanguageService_1.AttributeLanguageService();
    }
    static create(info) {
        const finalInfo = convertToRegionInfo(Object.assign(Object.assign({}, info), { type: ViewRegionType.Attribute }));
        return new AttributeRegion(finalInfo);
    }
    static is(region) {
        return region.type === ViewRegionType.Attribute;
    }
    static parse5(startTag, attr) {
        var _a;
        const attrLocation = (_a = startTag.sourceCodeLocation) === null || _a === void 0 ? void 0 : _a.attrs[attr.name];
        if (!attrLocation)
            return;
        /** Eg. >click.delegate="<increaseCounter()" */
        const attrNameLength = attr.name.length + // click.delegate
            2; // ="
        /** Eg. click.delegate="increaseCounter()><" */
        const lastCharIndex = attrLocation.endOffset - 1; // - 1 the quote
        const startOffset = attrLocation.startOffset + attrNameLength;
        const updatedLocation = Object.assign(Object.assign({}, attrLocation), { startOffset, endOffset: lastCharIndex });
        const { expressions: accessScopes } = ParseExpressionUtil_1.ParseExpressionUtil.getAllExpressionsOfKindV2(attr.value, [10082 /* AccessScope */, 1448 /* CallScope */], { startOffset });
        const viewRegion = AttributeRegion.create({
            attributeName: attr.name,
            attributeValue: attr.value,
            sourceCodeLocation: updatedLocation,
            tagName: startTag.tagName,
            accessScopes,
            regionValue: attr.value,
        });
        return viewRegion;
    }
    accept(visitor) {
        return visitor.visitAttribute(this);
    }
}
exports.AttributeRegion = AttributeRegion;
class AttributeInterpolationRegion extends AbstractRegion {
    constructor(info) {
        super(info);
        this.languageService = new AttributeInterpolationLanguageService_1.AttributeInterpolationLanguageService();
    }
    static create(info) {
        const finalInfo = convertToRegionInfo(Object.assign(Object.assign({}, info), { type: ViewRegionType.AttributeInterpolation }));
        return new AttributeInterpolationRegion(finalInfo);
    }
    static is(region) {
        return region.type === ViewRegionType.AttributeInterpolation;
    }
    static parse5Interpolation(startTag, attr, interpolationMatch, documentHasCrlf) {
        var _a;
        const attrLocation = (_a = startTag.sourceCodeLocation) === null || _a === void 0 ? void 0 : _a.attrs[attr.name];
        if (!attrLocation)
            return;
        /** Eg. >click.delegate="<increaseCounter()" */
        const attrNameLength = attr.name.length + // click.delegate
            2; // ="
        // attrNameLength /* ? */
        /** Eg. click.delegate="increaseCounter()><" */
        // const lastCharIndex = attrLocation.endOffset - 1; // - 1 the quote
        const startOffset = attrLocation.startOffset + attrNameLength;
        // const updatedLocation: parse5.Location = {
        //   ...attrLocation,
        //   startOffset,
        //   endOffset: lastCharIndex,
        // };
        try {
            // attr.value /* ? */
            const parsed = ParseExpressionUtil_1.ParseExpressionUtil.parseInterpolation(attr.value, startOffset);
            // parsed; /* ? */
            // parsed.parts; /* ? */
            // Used to find interpolation(s) inside string
            const stringTracker = attr.value;
            // For each expression "group", create a region
            const finalRegions = parsed === null || parsed === void 0 ? void 0 : parsed.expressions.map((expression, expressionIndex) => {
                const accessScopes = [];
                (0, ParseExpressionUtil_1.findAllExpressionRecursive)(expression, [10082 /* AccessScope */, 1448 /* CallScope */], accessScopes);
                if (documentHasCrlf) {
                    accessScopes.forEach((scope) => {
                        var _a, _b;
                        const { start } = scope.nameLocation;
                        const textUntilMatch = attr.value.substring(0, start);
                        // crlf = carriage return, line feed (windows specific)
                        let numberOfCrlfs = 0;
                        const crlfRegex = /\n/g;
                        numberOfCrlfs = (_b = (_a = textUntilMatch.match(crlfRegex)) === null || _a === void 0 ? void 0 : _a.length) !== null && _b !== void 0 ? _b : 0;
                        scope.nameLocation.start += numberOfCrlfs;
                        scope.nameLocation.end += numberOfCrlfs;
                    });
                }
                const isLastIndex = expressionIndex === parsed.expressions.length - 1;
                const startInterpol = parsed.interpolationStarts[expressionIndex] - startOffset;
                let endInterpol;
                if (isLastIndex) {
                    const lastPartLength = parsed.parts[expressionIndex + 1].length;
                    endInterpol =
                        attrLocation.endOffset -
                            1 - // " (closing quote)
                            startOffset - //
                            lastPartLength; // - lastPartLength: last part can be a normal string, we don't want to include that
                }
                else {
                    endInterpol =
                        parsed.interpolationEnds[expressionIndex] - startOffset;
                }
                const potentialRegionValue = stringTracker.substring(startInterpol, endInterpol);
                const updatedStartOffset = startInterpol + startOffset;
                const updatedLocation = Object.assign(Object.assign({}, attrLocation), { startOffset: updatedStartOffset, endOffset: updatedStartOffset + potentialRegionValue.length });
                // Create default Access scope
                if (accessScopes.length === 0) {
                    const nameLocation = {
                        start: updatedLocation.startOffset + 2,
                        end: updatedLocation.endOffset - 1, // - 1: }
                    };
                    const emptyAccessScope = new src_1.AccessScopeExpression('', 0, nameLocation);
                    accessScopes.push(emptyAccessScope);
                }
                const viewRegion = AttributeInterpolationRegion.create({
                    attributeName: attr.name,
                    attributeValue: attr.value,
                    sourceCodeLocation: updatedLocation,
                    tagName: startTag.tagName,
                    accessScopes,
                    regionValue: potentialRegionValue,
                });
                return viewRegion;
            });
            // finalRegions; /* ?*/
            return finalRegions;
        }
        catch (error) {
            // const _error = error as Error
            // logger.log(_error.message,{logLevel:'DEBUG'})
            // logger.log(_error.stack,{logLevel:'DEBUG'})
            return [];
        }
    }
    accept(visitor) {
        return visitor.visitAttributeInterpolation(this);
    }
}
exports.AttributeInterpolationRegion = AttributeInterpolationRegion;
class AureliaHtmlRegion extends AbstractRegion {
    constructor(info) {
        super(info);
        this.languageService = new AureliaHtmlLanguageService_1.AureliaHtmlLanguageService();
    }
    static create() {
        const finalInfo = convertToRegionInfo({
            sourceCodeLocation: {
                startLine: 0,
                startCol: 0,
                startOffset: 0,
                endLine: 0,
                endCol: 0,
                endOffset: 0,
            },
            type: ViewRegionType.AttributeInterpolation,
        });
        return new AureliaHtmlRegion(finalInfo);
    }
    accept(visitor) {
        return visitor.visitAureliaHtmlInterpolation(this);
    }
}
exports.AureliaHtmlRegion = AureliaHtmlRegion;
class BindableAttributeRegion extends AbstractRegion {
    constructor(info) {
        super(info);
        this.languageService = new BindableAttributeLanguageService_1.BindableAttributeLanguageService();
    }
    static create(info) {
        const finalInfo = convertToRegionInfo(Object.assign(Object.assign({}, info), { type: ViewRegionType.BindableAttribute }));
        return new BindableAttributeRegion(finalInfo);
    }
    static is(region) {
        return region.type === ViewRegionType.BindableAttribute;
    }
    static parse5Start(startTag, attr) {
        var _a;
        const attrLocation = (_a = startTag.sourceCodeLocation) === null || _a === void 0 ? void 0 : _a.attrs[attr.name];
        if (!attrLocation)
            return;
        const startOffset = attrLocation.startOffset;
        /** Eg. >click.delegate="<increaseCounter()" */
        const onlyBindableName = (0, aurelia_attributes_1.getBindableNameFromAttritute)(attr.name);
        const endOffset = startOffset + onlyBindableName.length;
        const updatedLocation = Object.assign(Object.assign({}, attrLocation), { startOffset,
            endOffset, endCol: attrLocation.startCol + onlyBindableName.length });
        const viewRegion = BindableAttributeRegion.create({
            attributeName: attr.name,
            attributeValue: attr.value,
            sourceCodeLocation: updatedLocation,
            regionValue: onlyBindableName,
            tagName: startTag.tagName,
        });
        return viewRegion;
    }
    accept(visitor) {
        return visitor.visitBindableAttribute(this);
    }
}
exports.BindableAttributeRegion = BindableAttributeRegion;
class CustomElementRegion extends AbstractRegion {
    constructor(info) {
        super(info);
        this.data = [];
        this.languageService = new CustomElementLanguageService_1.CustomElementLanguageService();
    }
    // region public static
    static create(info) {
        const finalInfo = convertToRegionInfo(Object.assign(Object.assign({}, info), { type: ViewRegionType.CustomElement }));
        return new CustomElementRegion(finalInfo);
    }
    static createStart(info) {
        info.subType = ViewRegionSubType.StartTag;
        return CustomElementRegion.create(info);
    }
    static createEnd(info) {
        info.subType = ViewRegionSubType.EndTag;
        return CustomElementRegion.create(info);
    }
    static is(region) {
        return region.type === ViewRegionType.CustomElement;
    }
    static parse5Start(startTag) {
        //  startTag/*?*/
        const tagName = startTag.tagName;
        const { sourceCodeLocation } = startTag;
        if (!sourceCodeLocation)
            return;
        const { startLine, startCol, startOffset } = sourceCodeLocation;
        const finalStartCol = startCol + 1; // + 1 for "<" of closing tag
        const finalStartOffset = startOffset + 1; // + 1 for < of closing tag
        const finalEndCol = finalStartCol + tagName.length;
        const finalEndOffset = finalStartOffset + tagName.length;
        const onlyOpeningTagLocation = {
            startCol: finalStartCol,
            startOffset: finalStartOffset,
            startLine,
            endLine: startLine,
            endCol: finalEndCol,
            endOffset: finalEndOffset,
        };
        const viewRegion = CustomElementRegion.createStart({
            tagName,
            sourceCodeLocation: onlyOpeningTagLocation,
            startTagLocation: {
                startCol: sourceCodeLocation.startCol,
                startLine: sourceCodeLocation.startLine,
                startOffset: sourceCodeLocation.startOffset,
                endCol: sourceCodeLocation.endCol,
                endLine: sourceCodeLocation.endLine,
                endOffset: sourceCodeLocation.endOffset,
            },
        });
        return viewRegion;
    }
    static parse5End(endTag) {
        const { sourceCodeLocation } = endTag;
        if (!sourceCodeLocation)
            return;
        const { startCol, startOffset, endOffset } = sourceCodeLocation;
        const finalStartCol = startCol + 2; // + 2 for "</" of closing tag
        const finalStartOffset = startOffset + 2; // + 2 for </ of closing tag
        const finalEndCol = finalStartCol + endTag.tagName.length;
        const finalEndOffset = endOffset - 1; // - 1 > of closing tag
        const updatedEndLocation = Object.assign(Object.assign({}, sourceCodeLocation), { startCol: finalStartCol, startOffset: finalStartOffset, endCol: finalEndCol, endOffset: finalEndOffset });
        const customElementViewRegion = CustomElementRegion.createEnd({
            tagName: endTag.tagName,
            sourceCodeLocation: updatedEndLocation,
        });
        return customElementViewRegion;
    }
    // endregion public static
    // region public
    static getBindableAttributes(region) {
        var _a;
        const bindableAttributeRegions = (_a = region.data) === null || _a === void 0 ? void 0 : _a.filter((subRegion) => subRegion.type === ViewRegionType.BindableAttribute);
        if (bindableAttributeRegions === undefined)
            return [];
        return bindableAttributeRegions;
    }
    addBindable(info) {
        const finalInfo = Object.assign(Object.assign({}, info), { type: ViewRegionType.BindableAttribute, tagName: this.tagName });
        const bindableAttribute = BindableAttributeRegion.create(finalInfo);
        this.data.push(bindableAttribute);
    }
    accept(visitor) {
        return visitor.visitCustomElement(this);
    }
}
exports.CustomElementRegion = CustomElementRegion;
class ImportRegion extends AbstractRegion {
    constructor(info) {
        super(info);
        this.languageService = new ImportLanguageService_1.ImportLanguageService();
    }
    // region public static
    static create(info) {
        const finalInfo = convertToRegionInfo(Object.assign(Object.assign({}, info), { type: ViewRegionType.Import }));
        return new ImportRegion(finalInfo);
    }
    static is(region) {
        return region.type === ViewRegionType.CustomElement;
    }
    static parse5(startTag) {
        if (!startTag.sourceCodeLocation)
            return;
        let importSource;
        startTag.attrs.forEach((attr) => {
            const isFrom = attr.name === constants_1.AureliaView.IMPORT_FROM_ATTRIBUTE;
            if (isFrom) {
                importSource = attr.value;
            }
        });
        const importRegion = this.create({
            attributeName: constants_1.AureliaView.IMPORT_FROM_ATTRIBUTE,
            attributeValue: importSource,
            tagName: startTag.tagName,
            sourceCodeLocation: startTag.sourceCodeLocation,
            type: ViewRegionType.Import,
            regionValue: importSource,
            // data: getRepeatForData(),
        });
        return importRegion;
    }
    // endregion public static
    // region public
    accept(visitor) {
        return visitor.visitImport(this);
    }
}
exports.ImportRegion = ImportRegion;
class RepeatForRegion extends AbstractRegion {
    constructor(info) {
        super(info);
        this.languageService = new RepeatForLanguageService_1.RepeatForLanguageService();
    }
    static create(info) {
        const finalInfo = convertToRegionInfo(Object.assign(Object.assign({}, info), { type: ViewRegionType.RepeatFor }));
        return new RepeatForRegion(finalInfo);
    }
    static parse5Start(startTag, attr) {
        var _a;
        const attrLocation = (_a = startTag.sourceCodeLocation) === null || _a === void 0 ? void 0 : _a.attrs[attr.name];
        if (!attrLocation)
            return;
        /** Eg. >repeat.for="<rule of grammarRules" */
        const startInterpolationLength = attr.name.length + // click.delegate
            2; // ="
        /** Eg. click.delegate="increaseCounter()><" */
        const endInterpolationLength = attrLocation.endOffset - 1; // - 1 the quote
        // __<label repeat.for="rule of grammarRules">
        const startColAdjust = attrLocation.startCol + // __<label_
            attr.name.length + // repeat.for
            2 - // ="
            1; // index starts from 0
        const startOffset = attrLocation.startOffset + startInterpolationLength;
        const updatedLocation = Object.assign(Object.assign({}, attrLocation), { startOffset: startOffset, startCol: startColAdjust, endOffset: endInterpolationLength });
        function getRepeatForData() {
            const [iterator, ofKeyword, iterable] = attr.value.split(' ');
            const iterableStartOffset = startOffset +
                iterator.length + // iterator
                1 + // space
                ofKeyword.length + // of
                1; // space
            const repeatForData = {
                iterator,
                iterableName: iterable,
                iterableStartOffset,
                iterableEndOffset: iterableStartOffset + iterable.length,
            };
            return repeatForData;
        }
        const { expressions: accessScopes } = ParseExpressionUtil_1.ParseExpressionUtil.getAllExpressionsOfKindV2(attr.value, [10082 /* AccessScope */, 1448 /* CallScope */], { startOffset, expressionType: 2 /* IsIterator */ });
        this.updateWithStartOffset(accessScopes, startOffset);
        const repeatForViewRegion = RepeatForRegion.create({
            accessScopes,
            attributeName: attr.name,
            attributeValue: attr.value,
            sourceCodeLocation: updatedLocation,
            type: ViewRegionType.RepeatFor,
            data: getRepeatForData(),
            regionValue: attr.value,
        });
        return repeatForViewRegion;
    }
    /**
     * Background: RepeatFor parsing only returned the repeat.for="attributeValue"
     *   Thus, we need to add the startOffset of whole file.
     */
    static updateWithStartOffset(accessScopes, startOffset) {
        accessScopes.forEach(scope => {
            scope.nameLocation.start += startOffset;
            scope.nameLocation.end += startOffset;
        });
    }
    static is(region) {
        return region.type === ViewRegionType.RepeatFor;
    }
    accept(visitor) {
        return visitor.visitRepeatFor(this);
    }
}
exports.RepeatForRegion = RepeatForRegion;
class TextInterpolationRegion extends AbstractRegion {
    constructor(info) {
        super(info);
        this.languageService = new TextInterpolationLanguageService_1.TextInterpolationLanguageService();
    }
    static create(info) {
        const finalInfo = convertToRegionInfo(Object.assign(Object.assign({}, info), { type: ViewRegionType.TextInterpolation }));
        return new TextInterpolationRegion(finalInfo);
    }
    static is(region) {
        return region.type === ViewRegionType.TextInterpolation;
    }
    /**
     * Text nodes often begin with `\n`, which makes finding by line/col harder.
     * We thus, only modify offset.
     */
    static parse5Text(text, 
    /** Make up for difference between parse5 (not counting \n) and vscode (counting \n) */
    documentHasCrlf) {
        const textLocation = text.sourceCodeLocation;
        if (!textLocation)
            return;
        const startOffset = textLocation.startOffset;
        const { expressions: accessScopes } = ParseExpressionUtil_1.ParseExpressionUtil.getAllExpressionsOfKindV2(text.text, [10082 /* AccessScope */, 1448 /* CallScope */], { expressionType: 1 /* Interpolation */, startOffset });
        // crlf fix
        if (documentHasCrlf) {
            accessScopes.forEach((scope) => {
                var _a, _b;
                const { start } = scope.nameLocation;
                const textUntilMatch = text.text.substring(0, start);
                // crlf = carriage return, line feed (windows specific)
                let numberOfCrlfs = 0;
                const crlfRegex = /\n/g;
                numberOfCrlfs = (_b = (_a = textUntilMatch.match(crlfRegex)) === null || _a === void 0 ? void 0 : _a.length) !== null && _b !== void 0 ? _b : 0;
                scope.nameLocation.start += numberOfCrlfs;
                scope.nameLocation.end += numberOfCrlfs;
            });
        }
        if (text.sourceCodeLocation == null)
            return;
        const textRegion = TextInterpolationRegion.create({
            regionValue: text.text,
            sourceCodeLocation: text.sourceCodeLocation,
            textValue: text.text,
            accessScopes,
        });
        return textRegion;
    }
    static createRegionsFromExpressionParser(text, documentHasCrlf) {
        const textLocation = text.sourceCodeLocation;
        if (!textLocation)
            return;
        const startOffset = textLocation.startOffset;
        // startOffset; /*?*/
        try {
            // text.text; /* ? */
            const parsed = ParseExpressionUtil_1.ParseExpressionUtil.parseInterpolation(text.text, startOffset);
            // parsed; /* ? */
            // parsed.parts; /* ? */
            // Used to find interpolation(s) inside string
            const stringTracker = text.text;
            // For each expression "group", create a region
            const finalRegions = parsed === null || parsed === void 0 ? void 0 : parsed.expressions.map((expression, expressionIndex) => {
                const accessScopes = [];
                (0, ParseExpressionUtil_1.findAllExpressionRecursive)(expression, [10082 /* AccessScope */, 1448 /* CallScope */], accessScopes);
                if (documentHasCrlf) {
                    accessScopes.forEach((scope) => {
                        var _a, _b;
                        const { start } = scope.nameLocation;
                        const textUntilMatch = text.text.substring(0, start);
                        // crlf = carriage return, line feed (windows specific)
                        let numberOfCrlfs = 0;
                        const crlfRegex = /\n/g;
                        numberOfCrlfs = (_b = (_a = textUntilMatch.match(crlfRegex)) === null || _a === void 0 ? void 0 : _a.length) !== null && _b !== void 0 ? _b : 0;
                        scope.nameLocation.start += numberOfCrlfs;
                        scope.nameLocation.end += numberOfCrlfs;
                    });
                }
                const isLastIndex = expressionIndex === parsed.expressions.length - 1;
                const startInterpol = parsed.interpolationStarts[expressionIndex] - startOffset;
                let endInterpol;
                if (isLastIndex) {
                    const lastPartLength = parsed.parts[expressionIndex + 1].length;
                    endInterpol =
                        textLocation.endOffset -
                            startOffset - //
                            lastPartLength; // - lastPartLength: last part can be a normal string, we don't want to include that
                }
                else {
                    endInterpol =
                        parsed.interpolationEnds[expressionIndex] - startOffset;
                }
                const potentialRegionValue = stringTracker.substring(startInterpol, endInterpol);
                const updatedStartOffset = startInterpol + startOffset;
                const updatedLocation = Object.assign(Object.assign({}, textLocation), { startOffset: updatedStartOffset, endOffset: updatedStartOffset + potentialRegionValue.length });
                // Create default Access scope
                if (accessScopes.length === 0) {
                    const nameLocation = {
                        start: updatedLocation.startOffset + 2,
                        end: updatedLocation.endOffset - 1, // - 1: }
                    };
                    const emptyAccessScope = new src_1.AccessScopeExpression('', 0, nameLocation);
                    accessScopes.push(emptyAccessScope);
                }
                const textRegion = TextInterpolationRegion.create({
                    regionValue: potentialRegionValue,
                    sourceCodeLocation: updatedLocation,
                    textValue: text.text,
                    accessScopes,
                });
                return textRegion;
            });
            // finalRegions; /* ?*/
            return finalRegions;
        }
        catch (error) {
            // const _error = error as Error
            // logger.log(_error.message,{logLevel:'DEBUG'})
            // logger.log(_error.stack,{logLevel:'DEBUG'})
            return [];
        }
    }
    accept(visitor) {
        return visitor.visitTextInterpolation(this);
    }
}
exports.TextInterpolationRegion = TextInterpolationRegion;
class ValueConverterRegion extends AbstractRegion {
    constructor(info) {
        super(info);
        this.languageService = new ValueConverterLanguageService_1.ValueConverterLanguageService();
    }
    static create(info) {
        const finalInfo = convertToRegionInfo(Object.assign(Object.assign({}, info), { type: ViewRegionType.ValueConverter }));
        return new ValueConverterRegion(finalInfo);
    }
    static is(region) {
        return (region === null || region === void 0 ? void 0 : region.type) === ViewRegionType.ValueConverter;
    }
    static parse5Start(startTag, attr) {
        var _a;
        const attrLocation = (_a = startTag.sourceCodeLocation) === null || _a === void 0 ? void 0 : _a.attrs[attr.name];
        if (!attrLocation)
            return [];
        // 6.1. Split up repeat.for='repo of repos | sort:column.value:direction.value | take:10'
        // Don't split || ("or")
        const [initiatorText, ...valueConverterRegionsSplit] = attr.value.split(/(?<!\|)\|(?!\|)/g);
        // 6.2. For each value converter
        const valueConverterRegions = [];
        valueConverterRegionsSplit.forEach((valueConverterViewText, index) => {
            // 6.3. Split into name and arguments
            const [valueConverterName, ...valueConverterArguments] = valueConverterViewText.split(':');
            if (valueConverterRegionsSplit.length >= 2 && index >= 1) {
                const dm = new DiagnosticMessages_1.DiagnosticMessages('Chained value converters not supported yet.');
                dm.log();
                dm.additionalLog('No infos for', valueConverterViewText);
                return;
            }
            const startValueConverterLength = attr.name.length /** repeat.for */ +
                2 /** =' */ +
                initiatorText.length /** repo of repos_ */ +
                1; /** | */
            const startColAdjust = attrLocation.startCol /** indentation and to length attribute */ +
                startValueConverterLength;
            const endValueConverterLength = startValueConverterLength + valueConverterViewText.length;
            const endColAdjust = startColAdjust + valueConverterViewText.length;
            // 6.4. Save the location
            const updatedLocation = Object.assign(Object.assign({}, attrLocation), { startOffset: attrLocation.startOffset + startValueConverterLength - 1, startCol: startColAdjust, endOffset: attrLocation.startOffset + endValueConverterLength, endCol: endColAdjust });
            // 6.5. Create region with useful info
            const valueConverterRegion = ValueConverterRegion.create({
                attributeName: attr.name,
                sourceCodeLocation: updatedLocation,
                type: ViewRegionType.ValueConverter,
                regionValue: attr.value,
                data: {
                    initiatorText,
                    valueConverterName: valueConverterName.trim(),
                    valueConverterText: valueConverterArguments.join(':'),
                },
            });
            valueConverterRegions.push(valueConverterRegion);
        });
        return valueConverterRegions;
    }
    accept(visitor) {
        return visitor.visitValueConverter(this);
    }
}
exports.ValueConverterRegion = ValueConverterRegion;
function convertToRegionInfo(info) {
    // Convert to zero-based (col and line from parse5 is one-based)
    if (info.sourceCodeLocation) {
        const copySourceLocation = Object.assign({}, info.sourceCodeLocation);
        copySourceLocation.startCol -= 1;
        copySourceLocation.startLine -= 1;
        copySourceLocation.endCol -= 1;
        copySourceLocation.endLine -= 1;
        info.sourceCodeLocation = copySourceLocation;
    }
    if (info.startTagLocation) {
        const copyStartTagLocation = Object.assign({}, info.startTagLocation);
        copyStartTagLocation.startCol -= 1;
        copyStartTagLocation.startLine -= 1;
        copyStartTagLocation.endCol -= 1;
        copyStartTagLocation.endLine -= 1;
        info.startTagLocation = copyStartTagLocation;
    }
    return info;
}
//# sourceMappingURL=ViewRegions.js.map
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
exports.ValueConverterAnalyser = void 0;
const Path = __importStar(require("path"));
const constants_1 = require("../../common/constants");
const uri_utils_1 = require("../../common/view/uri-utils");
class ValueConverterAnalyser {
    static getComponentInfo(targetClassDeclaration, sourceFile, documentation) {
        var _a, _b, _c;
        const valueConverterName = (_a = targetClassDeclaration.name) === null || _a === void 0 ? void 0 : _a.getText().replace(constants_1.VALUE_CONVERTER_SUFFIX, '').toLocaleLowerCase();
        const result = {
            documentation,
            className: (_c = (_b = targetClassDeclaration.name) === null || _b === void 0 ? void 0 : _b.getText()) !== null && _c !== void 0 ? _c : '',
            valueConverterName,
            baseViewModelFileName: Path.parse(sourceFile.fileName).name,
            viewModelFilePath: uri_utils_1.UriUtils.toSysPath(sourceFile.fileName),
            type: constants_1.AureliaClassTypes.VALUE_CONVERTER,
            sourceFile,
        };
        return result;
    }
    static checkValueConverter(targetClassDeclaration) {
        var _a;
        const isValueConverterName = (_a = targetClassDeclaration.name) === null || _a === void 0 ? void 0 : _a.getText().includes(constants_1.VALUE_CONVERTER_SUFFIX);
        return Boolean(isValueConverterName);
    }
}
exports.ValueConverterAnalyser = ValueConverterAnalyser;
//# sourceMappingURL=ValueConverterAnalyser.js.map
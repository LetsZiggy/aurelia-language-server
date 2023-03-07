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
exports.ImportLanguageService = void 0;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const uri_utils_1 = require("../../../../common/view/uri-utils");
class ImportLanguageService {
    doDefinition(aureliaProgram, document, position, importRegion) {
        return __awaiter(this, void 0, void 0, function* () {
            const components = aureliaProgram.aureliaComponents.getAll();
            const targetRelativePath = importRegion.regionValue;
            if (targetRelativePath === undefined)
                return;
            const sourceDirName = path.dirname(uri_utils_1.UriUtils.toSysPath(document.uri));
            const resolvedPath = path.resolve(sourceDirName, targetRelativePath);
            // View
            let viewPath;
            if (fs.existsSync(resolvedPath)) {
                viewPath = resolvedPath;
            }
            // View model
            // Note: We could have gone the simple `fs.existsSync` way, but with this approach
            //  we could check for component info.
            //  Probably rather needed for hover, so
            //  TODO: check like View, but only when you implement hover to reuse the below code.
            let viewModelPath;
            components.find((component) => {
                const { dir, name } = path.parse(component.viewModelFilePath);
                const viewModelWithoutExt = `${dir}${path.sep}${name}`;
                const isTargetViewModel = viewModelWithoutExt === resolvedPath;
                if (isTargetViewModel) {
                    viewModelPath = component.viewModelFilePath;
                    return true;
                }
                return false;
            });
            const result = {
                lineAndCharacter: { line: 1, character: 0 },
                viewModelFilePath: viewModelPath,
                viewFilePath: viewPath,
            };
            return result;
        });
    }
}
exports.ImportLanguageService = ImportLanguageService;
//# sourceMappingURL=ImportLanguageService.js.map
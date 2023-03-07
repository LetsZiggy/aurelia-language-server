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
exports.getRelatedFilePath = void 0;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
/**
 * @param fullPath - Full path of the file, which triggered the command
 * @param relatedExts - Possible extensions, for target file
 * @returns targetFile
 */
function getRelatedFilePath(fullPath, relatedExts) {
    let targetFile = '';
    try {
        relatedExts.forEach((ext) => {
            const fileName = `${path.basename(fullPath, path.extname(fullPath))}${ext}`.replace('.spec.spec', '.spec'); // Quick fix because we are appending eg. '.spec.ts' to 'file.spec'
            fullPath = path.join(path.dirname(fullPath), fileName);
            if (!fs.existsSync(fullPath))
                return;
            targetFile = fullPath;
        });
    }
    catch (error) {
        console.log(error);
    }
    return targetFile;
}
exports.getRelatedFilePath = getRelatedFilePath;
//# sourceMappingURL=related.js.map
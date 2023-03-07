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
exports.UriUtils = void 0;
const nodePath = __importStar(require("path"));
class UriUtils {
    /**
     * Convert path to how your system would use it.
     *
     * Re. Naming: Similar to `nodePath#normalize`, but I wanted to stress the vscode-uri vs. window-path fact.
     */
    static toSysPath(path) {
        if (path.includes('file:')) {
            path = this.removeFileProtocol(path);
        }
        if (this.isWin()) {
            path = this.decodeWinPath(path);
        }
        path = nodePath.normalize(path);
        return path;
    }
    static toSysPathMany(uris) {
        const asPaths = uris.map((uri) => this.toSysPath(uri));
        return asPaths;
    }
    /**
     * Linux/macOS just prefix `file://`
     * Windows: convert backslash to forwardslash and encode
     */
    static toVscodeUri(filePath) {
        // filePath; /*?*/
        // const uri = pathToFileURL(filePath).href;
        let uri = filePath;
        if (this.isWin()) {
            uri = this.encodeWinPath(filePath);
            uri = `file:///${uri}`;
        }
        else {
            uri = `file://${uri}`;
        }
        return uri;
    }
    static isWin() {
        return nodePath.sep === '\\';
    }
    static encodeWinPath(path) {
        // C%3A/Users/hdn%20local/.vscode/extensions/wallabyjs.wallaby-vscode-1.0.318/projects/01d527eb4e87d260/instrumented/tests/testFixture/scoped-for-testing/src/view/custom-element/other-custom-element-user.html
        let encodePath = path.replace(/\\\\?/g, () => '/');
        // fix colon
        encodePath = encodePath.replace(':', '%3A');
        // fix whitespace
        encodePath = encodePath.replace(' ', '%20');
        return encodePath;
    }
    static decodeWinPath(path) {
        // C%3A/Users/hdn%20local/.vscode/extensions/wallabyjs.wallaby-vscode-1.0.318/projects/01d527eb4e87d260/instrumented/tests/testFixture/scoped-for-testing/src/view/custom-element/other-custom-element-user.html
        let winPath = path;
        if (winPath.startsWith('/')) {
            winPath = winPath.replace('/', '');
        }
        winPath = winPath.replace(/\//g, '\\');
        winPath = winPath.replace(/%3A/g, ':');
        winPath = winPath.replace(/%20/g, ' ');
        return winPath;
    }
    static removeFileProtocol(fileUri) {
        const removed = fileUri.replace(/^file:\/\/?\/?/g, '');
        if (this.isWin()) {
            return removed;
        }
        const addSlashAtStart = `/${removed}`;
        return addSlashAtStart;
    }
}
exports.UriUtils = UriUtils;
//# sourceMappingURL=uri-utils.js.map
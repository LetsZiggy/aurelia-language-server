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
exports.getSaveData = exports.saveDataToDisk = void 0;
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
const fs = __importStar(require("fs"));
const SAVE_FILE_PATH = '/Users/hdn/Desktop/aurelia-vscode-extension/vscode-extension/server/src/common/debugging/debugging-data.json';
function saveDataToDisk(data) {
    let finalData = {};
    if (fs.existsSync(SAVE_FILE_PATH)) {
        const existingSave = fs.readFileSync(SAVE_FILE_PATH, 'utf-8');
        const asJson = JSON.parse(existingSave || '{}');
        finalData = asJson;
    }
    finalData = Object.assign(Object.assign({}, finalData), data);
    const asJsonString = JSON.stringify(finalData, null, 4);
    fs.writeFileSync(SAVE_FILE_PATH, asJsonString);
}
exports.saveDataToDisk = saveDataToDisk;
function getSaveData() {
    if (fs.existsSync(SAVE_FILE_PATH)) {
        const existingSave = fs.readFileSync(SAVE_FILE_PATH, 'utf-8');
        const asJson = JSON.parse(existingSave);
        return asJson;
    }
    throw new Error('No Save data');
}
exports.getSaveData = getSaveData;
//# sourceMappingURL=saveDataToDisk.js.map
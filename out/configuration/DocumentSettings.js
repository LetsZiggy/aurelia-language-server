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
exports.DocumentSettings = exports.defaultProjectOptions = exports.AURELIA_ATTRIBUTES_KEYWORDS = exports.settingsName = void 0;
require("reflect-metadata");
const logger_1 = require("../common/logging/logger");
const logger = new logger_1.Logger('DocumentSettings');
exports.settingsName = 'aurelia';
exports.AURELIA_ATTRIBUTES_KEYWORDS = [
    'bind',
    'bindable',
    'one-way',
    'two-way',
    'one-time',
    'from-view',
    'to-view',
    'delegate',
    'trigger',
    'call',
    'capture',
    'ref',
];
exports.defaultProjectOptions = {
    include: [],
    exclude: [],
    rootDirectory: '',
};
class DocumentSettings {
    constructor(extensionSettings) {
        var _a, _b;
        this.extensionSettings = extensionSettings;
        this.defaultSettings = {
            relatedFiles: {
                script: ['.js', '.ts'],
                style: ['.less', '.sass', '.scss', '.styl', '.css'],
                unit: ['.spec.js', '.spec.ts'],
                view: ['.html'],
            },
        };
        // Cache the settings of all open documents
        this.settingsMap = new Map();
        this.hasConfigurationCapability = true;
        this.globalSettings = Object.assign(Object.assign({}, this.defaultSettings), this.extensionSettings);
        let exclude = (_a = this.extensionSettings.aureliaProject) === null || _a === void 0 ? void 0 : _a.exclude;
        let finalExcludes = [];
        if (exclude === undefined) {
            logger.log('No excludes provided. Defaulting to', { logLevel: 'INFO' });
            const defaultExcludes = [
                '**/node_modules',
                'aurelia_project',
                '**/out',
                '**/build',
                '**/dist',
            ];
            finalExcludes.push(...defaultExcludes);
        }
        else {
            finalExcludes = exclude;
        }
        logger.log('Exclude files based on globs (from setting: aureliaProject.exclude): ', { logLevel: 'INFO' });
        logger.log(`  ${finalExcludes.join(', ')}`, { logLevel: 'INFO' });
        exclude = finalExcludes;
        const include = (_b = this.extensionSettings.aureliaProject) === null || _b === void 0 ? void 0 : _b.include;
        logger.log('Include files based on globs (from setting: aureliaProject.include): ', { logLevel: 'INFO' });
        if (include !== undefined) {
            logger.log(`  ${include.join(', ')}`, { logLevel: 'INFO' });
        }
        else {
            logger.log('No includes provided.', { logLevel: 'INFO' });
        }
    }
    getSettings() {
        return this.globalSettings;
    }
    setSettings(extensionSettings) {
        this.globalSettings = Object.assign(Object.assign({}, this.globalSettings), { aureliaProject: Object.assign(Object.assign({}, this.globalSettings.aureliaProject), extensionSettings.aureliaProject) });
    }
    inject(connection, hasConfigurationCapability) {
        this.connection = connection;
        this.hasConfigurationCapability = hasConfigurationCapability;
    }
    /**
     * @param resource - Allow not to provide a resource, will then return global settings
     * @example
     *   ```ts
     *   const settings = await documentSettingsClass.getDocumentSettings(textDocument.uri);
     *   const settings = await documentSettingsClass.getDocumentSettings();
     *   ```
     */
    getDocumentSettings(resource = '') {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.hasConfigurationCapability) {
                return Promise.resolve(this.globalSettings);
            }
            let result = this.settingsMap.get(resource);
            if (result === undefined) {
                // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
                result = yield this.connection.workspace.getConfiguration({
                    section: exports.settingsName,
                });
                if (result) {
                    this.settingsMap.set(resource, result);
                }
            }
            return result;
        });
    }
}
exports.DocumentSettings = DocumentSettings;
// export const documentSettings = globalContainer.get(DocumentSettings);
// export const documentSettings = new DocumentSettings({});
//# sourceMappingURL=DocumentSettings.js.map
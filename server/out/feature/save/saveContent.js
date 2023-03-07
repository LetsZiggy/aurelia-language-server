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
exports.onDidSave = void 0;
const logger_1 = require("../../common/logging/logger");
const AureliaProjects_1 = require("../../core/AureliaProjects");
const logger = new logger_1.Logger('saveContent');
function onDidSave(container, { document }) {
    return __awaiter(this, void 0, void 0, function* () {
        const aureliaProjects = container.get(AureliaProjects_1.AureliaProjects);
        aureliaProjects.clearEditingTracker();
        if (aureliaProjects.preventHydration(document))
            return;
        switch (document.languageId) {
            case 'javascript':
            case 'typescript': {
                aureliaProjects.updateManyViewModel([document]);
                logger.log('View model saved and updated.');
                break;
            }
            case 'html': {
                aureliaProjects.updateManyView([document]);
                logger.log('View saved and updated');
            }
        }
    });
}
exports.onDidSave = onDidSave;
//# sourceMappingURL=saveContent.js.map
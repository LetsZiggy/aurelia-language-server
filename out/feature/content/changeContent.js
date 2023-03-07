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
exports.onConnectionDidChangeContent = void 0;
const logger_1 = require("../../common/logging/logger");
const AureliaProjects_1 = require("../../core/AureliaProjects");
const logger = new logger_1.Logger('changeContent');
function onConnectionDidChangeContent(container, { document }) {
    return __awaiter(this, void 0, void 0, function* () {
        const aureliaProjects = container.get(AureliaProjects_1.AureliaProjects);
        // Keep track of changed map
        aureliaProjects.addDocumentToEditingTracker(document);
        // Hydration
        if (!aureliaProjects.isHydrated()) {
            /* prettier-ignore */ logger.log('Initilization started.', { logMs: true, msStart: true });
            yield aureliaProjects.hydrate([document]);
            /* prettier-ignore */ logger.log('Initilization done. Aurelia Extension is ready to use. 🚀', { logMs: true, msEnd: true });
            return;
        }
        if (aureliaProjects.preventHydration(document))
            return;
        // Updating
        switch (document.languageId) {
            case 'javascript':
            case 'typescript': {
                aureliaProjects.updateManyViewModel([document]);
                logger.log('View model updated.');
                break;
            }
            case 'html': {
                aureliaProjects.updateManyView([document]);
                logger.log('View updated');
            }
        }
    });
}
exports.onConnectionDidChangeContent = onConnectionDidChangeContent;
//# sourceMappingURL=changeContent.js.map
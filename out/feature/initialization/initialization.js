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
exports.onConnectionInitialized = void 0;
const logger_1 = require("../../common/logging/logger");
const AureliaProjects_1 = require("../../core/AureliaProjects");
const logger = new logger_1.Logger('initialization');
/**
 * 1. Init DI
 * 2. Detect Aurelia project
 * 3. Hydrate Project map
 */
function onConnectionInitialized(container, extensionSettings, activeDocuments = [], forceReinit = false) {
    return __awaiter(this, void 0, void 0, function* () {
        /* prettier-ignore */ logger.log('Initilization started.', { logMs: true, msStart: true });
        const aureliaProjects = container.get(AureliaProjects_1.AureliaProjects);
        const isAureliaProject = yield aureliaProjects.getAureliaProjectsOnly(extensionSettings);
        if (!isAureliaProject)
            return;
        const hydrated = yield aureliaProjects.hydrate(activeDocuments, forceReinit);
        if (hydrated) {
            /* prettier-ignore */ logger.log('Initilization done. Aurelia Extension is ready to use. 🚀', { logMs: true, msEnd: true });
        }
    });
}
exports.onConnectionInitialized = onConnectionInitialized;
//# sourceMappingURL=initialization.js.map
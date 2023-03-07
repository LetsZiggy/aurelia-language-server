"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AnalyzerService = void 0;
const AureliaProjects_1 = require("../../core/AureliaProjects");
class AnalyzerService {
    static getComponentByDocumennt(container, document) {
        const aureliaProjects = container.get(AureliaProjects_1.AureliaProjects);
        const targetProject = aureliaProjects.getFromUri(document.uri);
        if (!targetProject)
            return;
        const aureliaProgram = targetProject === null || targetProject === void 0 ? void 0 : targetProject.aureliaProgram;
        if (!aureliaProgram)
            return;
        const component = aureliaProgram.aureliaComponents.getOneByFromDocument(document);
        if (!component)
            return;
        return component;
    }
}
exports.AnalyzerService = AnalyzerService;
//# sourceMappingURL=AnalyzerService.js.map
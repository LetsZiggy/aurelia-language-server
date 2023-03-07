"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initDependencyInjection = exports.AllDocumentsInjection = exports.ConnectionInjection = void 0;
const aurelia_dependency_injection_1 = require("aurelia-dependency-injection");
const DocumentSettings_1 = require("../configuration/DocumentSettings");
const declareViewModelVariable_1 = require("../feature/commands/declareViewModelVariable/declareViewModelVariable");
const extractComponent_1 = require("../feature/commands/extractComponent/extractComponent");
const AureliaProjects_1 = require("./AureliaProjects");
exports.ConnectionInjection = 'Connection';
exports.AllDocumentsInjection = 'AllDocuments';
function initDependencyInjection(container, connection, extensionSettings, allDocuments) {
    container.registerInstance(aurelia_dependency_injection_1.Container);
    container.registerInstance(exports.ConnectionInjection, connection);
    container.registerInstance(exports.AllDocumentsInjection, allDocuments);
    container.registerInstance(DocumentSettings_1.DocumentSettings, new DocumentSettings_1.DocumentSettings(extensionSettings));
    const settings = container.get(DocumentSettings_1.DocumentSettings);
    container.registerInstance(AureliaProjects_1.AureliaProjects, new AureliaProjects_1.AureliaProjects(settings));
    const aureliaProjects = container.get(AureliaProjects_1.AureliaProjects);
    container.registerInstance(extractComponent_1.ExtractComponent, new extractComponent_1.ExtractComponent(container, connection, allDocuments, aureliaProjects));
    container.registerInstance(declareViewModelVariable_1.DeclareViewModelVariable, new declareViewModelVariable_1.DeclareViewModelVariable(container, connection, allDocuments, aureliaProjects));
}
exports.initDependencyInjection = initDependencyInjection;
//# sourceMappingURL=depdencenyInjection.js.map
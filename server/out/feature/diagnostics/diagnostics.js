"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createDiagnostics = void 0;
const RegionService_1 = require("../../common/services/RegionService");
function createDiagnostics(container, document) {
    const regions = RegionService_1.RegionService.getRegionsInDocument(container, document);
    return [];
}
exports.createDiagnostics = createDiagnostics;
//# sourceMappingURL=diagnostics.js.map
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PositionUtils = void 0;
const vscode_languageserver_1 = require("vscode-languageserver");
const project_position_1 = require("../view/project-position");
class PositionUtils {
    static convertToZeroIndexed(line, character) {
        const position = vscode_languageserver_1.Position.create(line - 1, character - 1);
        return position;
    }
    static isIncluded(start, end, target) {
        const projectedStart = (0, project_position_1.projectPosition)(start);
        const projectedEnd = (0, project_position_1.projectPosition)(end);
        const projectedSources = (0, project_position_1.projectPosition)(target);
        const isIncluded = projectedStart <= projectedSources && projectedSources <= projectedEnd;
        return isIncluded;
    }
}
exports.PositionUtils = PositionUtils;
//# sourceMappingURL=PositionUtils.js.map
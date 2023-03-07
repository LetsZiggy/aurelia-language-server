"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.projectPosition = exports.projectLocation = void 0;
/**
 * Project 2dim line x character to a 1dim value
 */
function projectLocation(location) {
    var _a, _b;
    const line = (_a = location.startLine) !== null && _a !== void 0 ? _a : location.endLine;
    const character = (_b = location.startCol) !== null && _b !== void 0 ? _b : location.endCol;
    if (line == null)
        return;
    if (character == null)
        return;
    const projection = projectPosition({ line, character });
    return projection;
}
exports.projectLocation = projectLocation;
/**
 * Project 2dim line x character to a 1dim value
 */
function projectPosition(position) {
    const projection = position.line * 100000 + position.character;
    return projection;
}
exports.projectPosition = projectPosition;
//# sourceMappingURL=project-position.js.map
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
exports.remapWallabyToNormalProject = exports.prettifyCallstack = void 0;
/* eslint-disable @typescript-eslint/strict-boolean-expressions */
/* eslint-disable @typescript-eslint/restrict-template-expressions */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable no-useless-escape */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const project_config_1 = require("../../project.config");
const ObjectUtils_1 = require("../object/ObjectUtils");
const StringUtils_1 = require("../string/StringUtils");
const uri_utils_1 = require("../view/uri-utils");
const errorStackLogging_1 = require("./errorStackLogging");
const errorStacks = [
    `at logFoundAureliaProjects (/home/hdn/.vscode/extensions/wallabyjs.wallaby-vscode-1.0.317/projects/832463c82f802eb4/instrumented/server/src/core/AureliaProjects.js:313:33)
    at AureliaProjects.<anonymous> (/home/hdn/.vscode/extensions/wallabyjs.wallaby-vscode-1.0.317/projects/832463c82f802eb4/instrumented/server/src/core/AureliaProjects.js:111:33)
    at Generator.next (<anonymous>)
    at fulfilled (/home/hdn/.vscode/extensions/wallabyjs.wallaby-vscode-1.0.317/projects/832463c82f802eb4/instrumented/server/src/core/AureliaProjects.js:62:52)
  `,
    // region other logs
    // ` at (/home/hdn/.vscode/extensions/wallabyjs.wallaby-vscode-1.0.317/projects/832463c82f802eb4/instrumented/server/src/core/AureliaProjects.js:316:37
    //   at Array.forEach (<anonymous>)
    //   at logFoundAureliaProjects (/home/hdn/.vscode/extensions/wallabyjs.wallaby-vscode-1.0.317/projects/832463c82f802eb4/instrumented/server/src/core/AureliaProjects.js:314:42)
    //   at AureliaProjects.<anonymous> (/home/hdn/.vscode/extensions/wallabyjs.wallaby-vscode-1.0.317/projects/832463c82f802eb4/instrumented/server/src/core/AureliaProjects.js:111:33)
    // `,
    // ` at AureliaProjects.<anonymous> (/home/hdn/.vscode/extensions/wallabyjs.wallaby-vscode-1.0.317/projects/832463c82f802eb4/instrumented/server/src/core/AureliaProjects.js:143:40)
    //   at Generator.next (<anonymous>)
    //   at (/home/hdn/.vscode/extensions/wallabyjs.wallaby-vscode-1.0.317/projects/832463c82f802eb4/instrumented/server/src/core/AureliaProjects.js:79:135
    //   at new Promise (<anonymous>)
    // `,
    // ` at DiagnosticMessages.log (/home/hdn/.vscode/extensions/wallabyjs.wallaby-vscode-1.0.317/projects/832463c82f802eb4/instrumented/server/src/common/diagnosticMessages/DiagnosticMessages.js:20:37)
    //   at (/home/hdn/.vscode/extensions/wallabyjs.wallaby-vscode-1.0.317/projects/832463c82f802eb4/instrumented/server/src/core/regions/ViewRegions.js:577:42
    //   at Array.forEach (<anonymous>)
    //   at Function.parse5Start (/home/hdn/.vscode/extensions/wallabyjs.wallaby-vscode-1.0.317/projects/832463c82f802eb4/instrumented/server/src/core/regions/ViewRegions.js:572:58)
    // `,
    // ` at DiagnosticMessages.additionalLog (/home/hdn/.vscode/extensions/wallabyjs.wallaby-vscode-1.0.317/projects/832463c82f802eb4/instrumented/server/src/common/diagnosticMessages/DiagnosticMessages.js:24:37)
    //   at (/home/hdn/.vscode/extensions/wallabyjs.wallaby-vscode-1.0.317/projects/832463c82f802eb4/instrumented/server/src/core/regions/ViewRegions.js:578:42
    //   at Array.forEach (<anonymous>)
    //   at Function.parse5Start (/home/hdn/.vscode/extensions/wallabyjs.wallaby-vscode-1.0.317/projects/832463c82f802eb4/instrumented/server/src/core/regions/ViewRegions.js:572:58)
    // `,
    // ` at logComponentList (/home/hdn/.vscode/extensions/wallabyjs.wallaby-vscode-1.0.317/projects/832463c82f802eb4/instrumented/server/src/core/viewModel/AureliaComponents.js:264:34)
    //   at AureliaComponents.init (/home/hdn/.vscode/extensions/wallabyjs.wallaby-vscode-1.0.317/projects/832463c82f802eb4/instrumented/server/src/core/viewModel/AureliaComponents.js:109:30)
    //   at AureliaProgram.initAureliaComponents (/home/hdn/.vscode/extensions/wallabyjs.wallaby-vscode-1.0.317/projects/832463c82f802eb4/instrumented/server/src/core/viewModel/AureliaProgram.js:23:53)
    //   at AureliaProjects.<anonymous> (/home/hdn/.vscode/extensions/wallabyjs.wallaby-vscode-1.0.317/projects/832463c82f802eb4/instrumented/server/src/core/AureliaProjects.js:230:57)
    // `,
    // ` at AureliaProjects.<anonymous> (/home/hdn/.vscode/extensions/wallabyjs.wallaby-vscode-1.0.317/projects/832463c82f802eb4/instrumented/server/src/core/AureliaProjects.js:151:41)
    //   at Generator.next (<anonymous>)
    //   at fulfilled (/home/hdn/.vscode/extensions/wallabyjs.wallaby-vscode-1.0.317/projects/832463c82f802eb4/instrumented/server/src/core/AureliaProjects.js:62:52)
    //   at processTicksAndRejections (node:internal/process/task_queues:96:5)
    // `,
];
// endregion other logs
const wish = `
  | File name       | linenumber | Call site
  | AureliaProjects | 111        | AureliaProjects.<anonymous>
  | AureliaProjects | 313        |     logFoundAureliaProjects

  | AureliaProjects | 111        | AureliaProjects.<anonymous>
  | AureliaProjects | 314        |     logFoundAureliaProjects

  | initialization  | 49         | -
  | AureliaProjects | 141        |     AureliaProjects.hydrate
  | AureliaProjects | 143        |         AureliaProjects.<anonymous>
  |                 |            |             Array.forEach

  | RegionParser    | 82         | -
  | ViewRegions     | 572        |     Function.parse5Start
  | DiagnosticMesss | 20         |         DiagnosticMessages.log

  | RegionParser    | 82         | -
  | ViewRegions     | 572        |     Function.parse5Start
  | DiagnosticMesss | 24         |         DiagnosticMessages.additionalLog

  | AureliaProjects | 230        | AureliaProjects.<anonymous>
  | AureliaProgram  | 23         |     AureliaProgram.initAureliaComponents
  | AureliaComponen | 109        |         AureliaComponents.init
  | AureliaComponen | 264        |             logComponentList

  | AureliaProjects | 151        | AureliaProjects.<anonymous>
`;
const errorStackTracker = {};
const TRACKER_SEPARATOR = ':';
const DONT_TRACK = [
    'node:internal/process',
    '(<anonymous>)',
    'Promise',
    'fulfilled',
];
function shouldNotTrack(source) {
    const shouldNot = DONT_TRACK.find((donts) => source.includes(donts));
    return shouldNot;
}
function prettifyCallstack(rawErrorSplit) {
    const errorSplit = rawErrorSplit.reverse();
    // errorSplit; /*?*/
    // TODO findIndex of Logger.log (stack always starts with 4 elements we are not interested in (Error\nfindLog\nLogmsseag...))
    // - 1. Turn into tracker list
    const rawToTrackerList = turnIntoRawTrackerList(errorSplit);
    rawToTrackerList.forEach((rawTrackerEntry) => {
        if (rawTrackerEntry == null)
            return;
        const [fileName, lineNumber, caller] = rawTrackerEntry.split(TRACKER_SEPARATOR);
        const nameLineTracker = `${fileName}${TRACKER_SEPARATOR}${lineNumber}`;
    });
    const result = (0, errorStackLogging_1.generateDependencyTreeSingle)(errorStackTracker, rawToTrackerList);
    // - 2. Only get actual stack
    const pickedStack = {};
    ObjectUtils_1.ObjectUtils.atPath(result, rawToTrackerList, pickedStack);
    // rawToTrackerList.forEach((trackerLine) => {
    //   if (trackerLine == null) return;
    //   // @ts-ignore
    //   actualStack[trackerLine] = result[trackerLine];
    //   trackerLine;
    // });
    // - 3. Put into actual tracker
    // ^ TODO
    // ...
    return { pickedStack, rawToTrackerList };
}
exports.prettifyCallstack = prettifyCallstack;
/**
 * @example
 * new Error().stack
 * -->
 * [
 *   'AureliaProjects.js:62:fulfilled',
 *   'AureliaProjects.js:111:AureliaProjects.<anonymous>',
 *   'AureliaProjects.js:313:logFoundAureliaProjects'
 * ]
 */
function turnIntoRawTrackerList(errorSplit) {
    return errorSplit
        .map((errorLine) => {
        var _a, _b;
        // errorLine.trim(); /*?*/
        const splitLine = errorLine.trim().split(' ');
        const cleanedLine = splitLine.filter((line) => line);
        if (cleanedLine.length === 0)
            return false;
        const [_at, _caller, ..._paths] = cleanedLine;
        let targetPath = _paths[0];
        if (_paths.length >= 2) {
            targetPath = _paths.join(' ');
        }
        try {
            if (shouldNotTrack(targetPath))
                return false;
            if (shouldNotTrack(_caller))
                return false;
            const remapped = remapWallabyToNormalProject(targetPath);
            if (typeof remapped === 'string')
                return false;
            const jsPath = (_b = (_a = getJsPathMatch(targetPath)) === null || _a === void 0 ? void 0 : _a.groups) === null || _b === void 0 ? void 0 : _b.PATH;
            // const jsLine = getJsPathMatch(_path)?.groups?.LINE;
            const jsFileName = path.basename(jsPath !== null && jsPath !== void 0 ? jsPath : '').replace(/.js$/, '.ts');
            const trackerKey = `${jsFileName}${TRACKER_SEPARATOR}${remapped.remappedLine}${TRACKER_SEPARATOR}${_caller}`;
            return trackerKey;
        }
        catch (_error) {
            return false;
        }
    })
        .filter((line) => line);
}
function remapWallabyToNormalProject(targetPath) {
    // - 1. Find in .js file
    // Before: (path/to/file.js:151:41)
    // Match: path/to/file.js
    const jsPathMatch = getJsPathMatch(targetPath);
    if (jsPathMatch == null)
        return '`findLogSource` File not found';
    if (jsPathMatch.groups == null)
        return '`findLogSource` No Group';
    const jsPath = jsPathMatch.groups.PATH;
    const targetJsLine = Number(jsPathMatch.groups.LINE) - 1;
    const jsFile = fs.readFileSync(jsPath, 'utf-8');
    const jsLine = jsFile.split('\n')[targetJsLine];
    // Before: $_$w(39, 106, $_$c), original.code('');
    // Match: original.code('');
    const jsCodeRegex = /(?:\$_\$w\(.*\), )(?<ORIGINAL>.*)/;
    const jsCodeMatch = jsCodeRegex.exec(jsLine);
    if (jsCodeMatch == null)
        return '`findLogSource` No line';
    if (jsCodeMatch.groups == null)
        return '`findLogSource` No original group';
    const originalCode = jsCodeMatch.groups.ORIGINAL;
    // - 2. Find in .ts file
    const tsPath = jsPath.replace('.js', '.ts');
    const tsFile = fs.readFileSync(tsPath, 'utf-8');
    const targetTsLines = tsFile
        .split('\n')
        .map((line, index) => {
        const normalizedLine = StringUtils_1.StringUtils.replaceAll(line, ' ', '');
        const normalizedOriginalCode = StringUtils_1.StringUtils.replaceAll(originalCode, ' ', '');
        if (!normalizedLine.includes(normalizedOriginalCode))
            return false;
        return [index + 1, line]; // + 1 Lines are shown 1-indexed
    })
        .filter((line) => line != false);
    // - 3. Map back instrumented to project
    // Before: ~/.vscode/extensions/wallabyjs.wallaby-vscode-1.0.317/projects/832463c82f802eb4/instrumented/your/code
    // Match: ~/.vscode/extensions/wallabyjs.wallaby-vscode-1.0.317/projects/832463c82f802eb4/instrumented/
    const wallabyPathRegex = /(.*wallabyjs.wallaby.*instrumented)/;
    const wallabyPathMatch = wallabyPathRegex.exec(tsPath);
    if (wallabyPathMatch == null)
        return 'wallaby not found';
    const wallabyPath = wallabyPathMatch[1];
    const finalTsPath = tsPath.replace(wallabyPath, project_config_1.PROJECT_CONFIG.projectPath);
    const finalLinesNumberText = targetTsLines
        .map(([lineNumber, _code] = []) => lineNumber)
        .join(', ');
    const finalSourceName = `Loc: file://${finalTsPath} ${finalLinesNumberText}`;
    // const finalSourceName = finalLinesText;
    return {
        remappdeLocation: finalSourceName,
        remappedLine: finalLinesNumberText,
    };
}
exports.remapWallabyToNormalProject = remapWallabyToNormalProject;
function getJsPathMatch(targetPath) {
    targetPath = uri_utils_1.UriUtils.toSysPath(targetPath);
    const jsPathRegexp = /(?:\(?)(?<PATH>.*)\:(?<LINE>\d+)\:\d+(?:\)?)$/;
    const jsPathMatch = jsPathRegexp.exec(targetPath);
    return jsPathMatch;
}
//# sourceMappingURL=WallabyUtils.js.map
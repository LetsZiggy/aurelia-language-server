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
exports.defaultLogger = exports.Logger = void 0;
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/restrict-template-expressions */
const path = __importStar(require("path"));
const colorette_1 = require("colorette");
const culog_1 = require("culog");
const performance_measure_1 = require("./performance-measure");
const WallabyUtils_1 = require("./WallabyUtils");
const DEV_IS_WALLABY = __dirname.includes('wallabyjs.wallaby-vscode');
const isCI = Boolean(process.env.CI);
const shouldLog = !isCI;
const DEFAULT_LOG_OPTIONS = {
    // log: false,
    log: shouldLog,
    // focusedLogging: true,
    // ignoreFirstXLogs: 5,
    // ignoreAfterXLogs: 1,
    // measurePerf: true,
    // focusedPerf: true,
    // logPerf: false,
    shouldLogMs: true,
    env: 'prod',
    reset: false,
    highlight: false,
    projectPath: '',
};
const performanceMeasure = new performance_measure_1.PerformanceMeasure();
let ignoreLogCount = 0;
class Logger {
    constructor(
    // eslint-disable-next-line default-param-last
    scope = 'Aurelia', classOptions = DEFAULT_LOG_OPTIONS) {
        this.classOptions = classOptions;
        this.culogger = new culog_1.Logger({ scope });
        // const isJest = __dirname.includes('vscode-extension/server/');
        // const isWallaby =
        //   __dirname.includes('wallabyjs') && __dirname.includes('instrumented');
        // const log = !isJest && !isWallaby;
        // const log = true;
        this.culogger.overwriteDefaultLogOtpions({
            // log,
            logLevel: 'INFO',
            focusedLogging: true,
            // logScope: false,
        });
        if (this.classOptions.measurePerf === true) {
            this.performanceMeasure = performanceMeasure;
        }
    }
    log(message, options) {
        var _a, _b, _c, _d;
        const localOptions = Object.assign(Object.assign({}, this.classOptions), options);
        let finalMessage = message;
        // region measure perf
        if (localOptions.measurePerf === true) {
            if (localOptions.focusedPerf === true) {
                if (localOptions.logPerf === true) {
                    (_a = this.getPerformanceMeasure()) === null || _a === void 0 ? void 0 : _a.performance.mark(message);
                    (_b = this.getPerformanceMeasure()) === null || _b === void 0 ? void 0 : _b.continousMeasuring(message, {
                        reset: localOptions.reset,
                    });
                }
            }
            else {
                (_c = this.getPerformanceMeasure()) === null || _c === void 0 ? void 0 : _c.performance.mark(message);
                (_d = this.getPerformanceMeasure()) === null || _d === void 0 ? void 0 : _d.continousMeasuring(message, {
                    reset: localOptions.reset,
                });
            }
        }
        // endregion measure perf
        if (localOptions.highlight === true) {
            console.log((0, colorette_1.bold)((0, colorette_1.blueBright)((0, colorette_1.bgWhite)('------------ v HIGHLIGHT v ------------'))));
        }
        if (localOptions.env !== this.classOptions.env)
            return;
        // region ignore
        if (localOptions.ignoreFirstXLogs != null &&
            localOptions.ignoreAfterXLogs != null) {
            const ignoreFirst = ignoreLogCount >= localOptions.ignoreFirstXLogs;
            const ignoreAfter = ignoreLogCount < localOptions.ignoreAfterXLogs;
            const shouldIgnore = !(ignoreFirst && ignoreAfter);
            ignoreLogCount++;
            if (shouldIgnore) {
                // ('Early return because of ignore...Logs'); /* ? */ // LOGDEBUG
                return;
            }
        }
        // Log count
        if (localOptions.ignoreFirstXLogs != null &&
            ignoreLogCount < localOptions.ignoreFirstXLogs) {
            // ('Early return because of ignoreFirstXLogs'); /* ? */ // LOGDEBUG
            ignoreLogCount++;
            return;
        }
        // endregion ignore
        // region measure ms
        if (localOptions.shouldLogMs === true) {
            if (localOptions.msStart === true) {
                this.msStartTime = performance_measure_1.performance.now();
            }
            else if (localOptions.msEnd === true) {
                this.msEndTime = performance_measure_1.performance.now();
                let duration = this.msEndTime - this.msStartTime;
                duration = Math.round(duration * 10) / 10;
                finalMessage = `${finalMessage} (took ${duration} ms)`;
            }
        }
        // endregion measure ms
        /**
         * Wallaby logic.
         * Wallaby does not console.log from external library.
         */
        this.logMessage(finalMessage, localOptions);
    }
    logMessage(message, options = DEFAULT_LOG_OPTIONS) {
        const { log } = options;
        const loggedMessage = this.culogger.debug([message], {
            logLevel: 'INFO',
            log,
        });
        // Below this guard only for development with wallaby.
        if (DEV_IS_WALLABY) {
            if (loggedMessage !== undefined) {
                const logSource = findLogSource();
                // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
                let finalMessage = loggedMessage[0];
                if (options.env !== 'prod') {
                    finalMessage = `${loggedMessage[0]} (at ${logSource})`;
                }
                console.log(finalMessage);
                if (loggedMessage.length > 1) {
                    console.log('There are more log messages');
                }
            }
        }
    }
    stack() {
        const errorStack = new Error().stack;
        if (errorStack == null)
            return;
        const [, ...errorTrace] = errorStack.split('\n');
        const withOutLogger = errorTrace.filter((line) => !line.includes(path.normalize('logging/logger.')));
        // errorSplit.slice(4, 25).join('\n'); /* ? */
        const stack = (0, WallabyUtils_1.prettifyCallstack)(withOutLogger);
        console.log(stack.rawToTrackerList);
    }
    getPerformanceMeasure() {
        if (this.classOptions.measurePerf !== undefined &&
            this.performanceMeasure === undefined) {
            throw new Error('Performance measuring not active. To activate set this.optinos.measurePerf = true.');
        }
        return this.performanceMeasure;
    }
}
exports.Logger = Logger;
/**
 * Assumption:
 *   1. logger.log (source)
 *   2. logger.logMessage
 *   3. findLogSource (this function)
 *   4. Error (from new Error().stack format)
 */
function findLogSource() {
    const errorStack = new Error().stack;
    if (errorStack == null)
        return;
    const [_error, ...errorTrace] = errorStack.split('\n');
    const withOutLogger = errorTrace.filter((line) => !line.includes(path.normalize('logging/logger.')));
    // errorSplit.slice(4, 25).join('\n'); /* ? */
    // prettifyCallstack(withOutLogger);
    // const [_errorWord, _findLogSource, _LoggerLogMessage, _LoggerLog, rawTarget] =
    const rawTarget = withOutLogger.map((str) => str.trim());
    const rawSplit = rawTarget[0].split(' ');
    /** Path could have space, thus we join those */
    let targetPath = rawSplit[rawSplit.length - 1];
    if (rawSplit.length >= 4) {
        const [_at, _caller, ...pathToJoin] = rawSplit;
        targetPath = pathToJoin.join(' ');
    }
    let sourceName = path.basename(targetPath);
    if (sourceName.endsWith(')')) {
        sourceName = sourceName.replace(/\)$/, '');
    }
    if (DEV_IS_WALLABY) {
        try {
            const remapped = (0, WallabyUtils_1.remapWallabyToNormalProject)(targetPath);
            if (typeof remapped !== 'string') {
                return remapped.remappedLine;
                // return remapped.remappdeLocation;
            }
            // eslint-disable-next-line no-empty
        }
        catch (_error) { }
    }
    return sourceName;
}
exports.defaultLogger = new Logger('defaultLogger');
//# sourceMappingURL=logger.js.map
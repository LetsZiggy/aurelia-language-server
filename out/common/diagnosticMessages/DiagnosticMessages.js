"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DiagnosticMessages = void 0;
const logger_1 = require("../logging/logger");
const diagnosticMessagesData_1 = require("./diagnosticMessagesData");
const logger = new logger_1.Logger('Diagnostics');
class DiagnosticMessages {
    constructor(message) {
        this.message = message;
        this.aureliaCode = 'auvsc';
        this.message = message;
        this.diagnosticCodeForMessage = `${this.aureliaCode}(${diagnosticMessagesData_1.diagnosticMessagesData[message].code})`;
    }
    log() {
        const targetMessage = diagnosticMessagesData_1.diagnosticMessagesData[this.message];
        const consoleMessage = `[${targetMessage.category}] ${this.message} ${this.diagnosticCodeForMessage}`;
        // logger.log(consoleMessage);
    }
    additionalLog(message, data) {
        // logger.log(`${message}: ${data} ${this.diagnosticCodeForMessage}`);
    }
}
exports.DiagnosticMessages = DiagnosticMessages;
//# sourceMappingURL=DiagnosticMessages.js.map
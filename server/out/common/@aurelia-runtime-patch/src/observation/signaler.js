"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Signaler = exports.ISignaler = void 0;
const kernel_1 = require("@aurelia/kernel");
const utilities_objects_1 = require("../utilities-objects");
exports.ISignaler = kernel_1.DI.createInterface('ISignaler', x => x.singleton(Signaler));
class Signaler {
    constructor() {
        this.signals = (0, utilities_objects_1.createLookup)();
    }
    dispatchSignal(name, flags) {
        const listeners = this.signals[name];
        if (listeners === undefined) {
            return;
        }
        let listener;
        for (listener of listeners.keys()) {
            listener.handleChange(undefined, undefined, flags);
        }
    }
    addSignalListener(name, listener) {
        const signals = this.signals;
        const listeners = signals[name];
        if (listeners === undefined) {
            signals[name] = new Set([listener]);
        }
        else {
            listeners.add(listener);
        }
    }
    removeSignalListener(name, listener) {
        const listeners = this.signals[name];
        if (listeners) {
            listeners.delete(listener);
        }
    }
}
exports.Signaler = Signaler;
//# sourceMappingURL=signaler.js.map
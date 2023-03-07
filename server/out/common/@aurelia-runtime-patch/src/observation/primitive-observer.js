"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PrimitiveObserver = void 0;
class PrimitiveObserver {
    constructor(obj, key) {
        this.type = 0 /* None */;
        this._obj = obj;
        this._key = key;
    }
    get doNotCache() { return true; }
    getValue() {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access,@typescript-eslint/no-explicit-any
        return this._obj[this._key];
    }
    setValue() { }
    subscribe() { }
    unsubscribe() { }
}
exports.PrimitiveObserver = PrimitiveObserver;
//# sourceMappingURL=primitive-observer.js.map
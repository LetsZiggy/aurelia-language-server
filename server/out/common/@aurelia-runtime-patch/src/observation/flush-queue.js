"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FlushQueue = exports.withFlushQueue = void 0;
const utilities_objects_1 = require("../utilities-objects");
function withFlushQueue(target) {
    return target == null ? queueableDeco : queueableDeco(target);
}
exports.withFlushQueue = withFlushQueue;
function queueableDeco(target) {
    const proto = target.prototype;
    (0, utilities_objects_1.def)(proto, 'queue', { get: getFlushQueue });
}
class FlushQueue {
    constructor() {
        /** @internal */
        this._flushing = false;
        /** @internal */
        this._items = new Set();
    }
    get count() {
        return this._items.size;
    }
    add(callable) {
        this._items.add(callable);
        if (this._flushing) {
            return;
        }
        this._flushing = true;
        try {
            this._items.forEach(flushItem);
        }
        finally {
            this._flushing = false;
        }
    }
    clear() {
        this._items.clear();
        this._flushing = false;
    }
}
exports.FlushQueue = FlushQueue;
FlushQueue.instance = new FlushQueue();
function getFlushQueue() {
    return FlushQueue.instance;
}
function flushItem(item, _, items) {
    items.delete(item);
    item.flush();
}
//# sourceMappingURL=flush-queue.js.map
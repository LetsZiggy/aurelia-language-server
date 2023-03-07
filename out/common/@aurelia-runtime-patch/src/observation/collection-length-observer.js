"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CollectionSizeObserver = exports.CollectionLengthObserver = void 0;
const kernel_1 = require("@aurelia/kernel");
const subscriber_collection_1 = require("./subscriber-collection");
const utilities_objects_1 = require("../utilities-objects");
const flush_queue_1 = require("./flush-queue");
class CollectionLengthObserver {
    constructor(owner) {
        this.owner = owner;
        this.type = 18 /* Array */;
        /** @internal */
        this.f = 0 /* none */;
        this._value = this._oldvalue = (this._obj = owner.collection).length;
    }
    getValue() {
        return this._obj.length;
    }
    setValue(newValue, flags) {
        const currentValue = this._value;
        // if in the template, length is two-way bound directly
        // then there's a chance that the new value is invalid
        // add a guard so that we don't accidentally broadcast invalid values
        if (newValue !== currentValue && (0, kernel_1.isArrayIndex)(newValue)) {
            if ((flags & 256 /* noFlush */) === 0) {
                this._obj.length = newValue;
            }
            this._value = newValue;
            this._oldvalue = currentValue;
            this.f = flags;
            this.queue.add(this);
        }
    }
    handleCollectionChange(_, flags) {
        const oldValue = this._value;
        const value = this._obj.length;
        if ((this._value = value) !== oldValue) {
            this._oldvalue = oldValue;
            this.f = flags;
            this.queue.add(this);
        }
    }
    flush() {
        oV = this._oldvalue;
        this._oldvalue = this._value;
        this.subs.notify(this._value, oV, this.f);
    }
}
exports.CollectionLengthObserver = CollectionLengthObserver;
class CollectionSizeObserver {
    constructor(owner) {
        this.owner = owner;
        /** @internal */
        this.f = 0 /* none */;
        this._value = this._oldvalue = (this._obj = owner.collection).size;
        this.type = this._obj instanceof Map ? 66 /* Map */ : 34 /* Set */;
    }
    getValue() {
        return this._obj.size;
    }
    setValue() {
        if (true /**/)
            throw new Error('Map/Set "size" is a readonly property');
        else
            throw new Error('AUR02');
    }
    handleCollectionChange(_, flags) {
        const oldValue = this._value;
        const value = this._obj.size;
        if ((this._value = value) !== oldValue) {
            this._oldvalue = oldValue;
            this.f = flags;
            this.queue.add(this);
        }
    }
    flush() {
        oV = this._oldvalue;
        this._oldvalue = this._value;
        this.subs.notify(this._value, oV, this.f);
    }
}
exports.CollectionSizeObserver = CollectionSizeObserver;
function implementLengthObserver(klass) {
    const proto = klass.prototype;
    (0, utilities_objects_1.ensureProto)(proto, 'subscribe', subscribe, true);
    (0, utilities_objects_1.ensureProto)(proto, 'unsubscribe', unsubscribe, true);
    (0, flush_queue_1.withFlushQueue)(klass);
    (0, subscriber_collection_1.subscriberCollection)(klass);
}
function subscribe(subscriber) {
    if (this.subs.add(subscriber) && this.subs.count === 1) {
        this.owner.subscribe(this);
    }
}
function unsubscribe(subscriber) {
    if (this.subs.remove(subscriber) && this.subs.count === 0) {
        this.owner.subscribe(this);
    }
}
implementLengthObserver(CollectionLengthObserver);
implementLengthObserver(CollectionSizeObserver);
// a reusable variable for `.flush()` methods of observers
// so that there doesn't need to create an env record for every call
let oV = void 0;
//# sourceMappingURL=collection-length-observer.js.map
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SetterNotifier = exports.SetterObserver = void 0;
const subscriber_collection_1 = require("./subscriber-collection");
const utilities_objects_1 = require("../utilities-objects");
const flush_queue_1 = require("./flush-queue");
// a reusable variable for `.flush()` methods of observers
// so that there doesn't need to create an env record for every call
let oV = void 0;
/**
 * Observer for the mutation of object property value employing getter-setter strategy.
 * This is used for observing object properties that has no decorator.
 */
class SetterObserver {
    constructor(obj, key) {
        // todo(bigopon): tweak the flag based on typeof obj (array/set/map/iterator/proxy etc...)
        this.type = 1 /* Observer */;
        /** @internal */
        this._value = void 0;
        /** @internal */
        this._oldValue = void 0;
        /** @internal */
        this._observing = false;
        /** @internal */
        this.f = 0 /* none */;
        this._obj = obj;
        this._key = key;
    }
    getValue() {
        return this._value;
    }
    setValue(newValue, flags) {
        if (this._observing) {
            if (Object.is(newValue, this._value)) {
                return;
            }
            this._oldValue = this._value;
            this._value = newValue;
            this.f = flags;
            this.queue.add(this);
        }
        else {
            // If subscribe() has been called, the target property descriptor is replaced by these getter/setter methods,
            // so calling obj[propertyKey] will actually return this.value.
            // However, if subscribe() was not yet called (indicated by !this.observing), the target descriptor
            // is unmodified and we need to explicitly set the property value.
            // This will happen in one-time, to-view and two-way bindings during $bind, meaning that the $bind will not actually update the target value.
            // This wasn't visible in vCurrent due to connect-queue always doing a delayed update, so in many cases it didn't matter whether $bind updated the target or not.
            this._obj[this._key] = newValue;
        }
    }
    subscribe(subscriber) {
        if (this._observing === false) {
            this.start();
        }
        this.subs.add(subscriber);
    }
    flush() {
        oV = this._oldValue;
        this._oldValue = this._value;
        this.subs.notify(this._value, oV, this.f);
    }
    start() {
        if (this._observing === false) {
            this._observing = true;
            this._value = this._obj[this._key];
            (0, utilities_objects_1.def)(this._obj, this._key, {
                enumerable: true,
                configurable: true,
                get: ( /* Setter Observer */) => this.getValue(),
                set: (/* Setter Observer */ value) => {
                    this.setValue(value, 0 /* none */);
                },
            });
        }
        return this;
    }
    stop() {
        if (this._observing) {
            (0, utilities_objects_1.def)(this._obj, this._key, {
                enumerable: true,
                configurable: true,
                writable: true,
                value: this._value,
            });
            this._observing = false;
            // todo(bigopon/fred): add .removeAllSubscribers()
        }
        return this;
    }
}
exports.SetterObserver = SetterObserver;
class SetterNotifier {
    constructor(obj, callbackKey, set, initialValue) {
        this.type = 1 /* Observer */;
        /** @internal */
        this._value = void 0;
        /** @internal */
        this._oldValue = void 0;
        /** @internal */
        this.f = 0 /* none */;
        this._obj = obj;
        this._setter = set;
        this._hasSetter = (0, utilities_objects_1.isFunction)(set);
        const callback = obj[callbackKey];
        this.cb = (0, utilities_objects_1.isFunction)(callback) ? callback : void 0;
        this._value = initialValue;
    }
    getValue() {
        return this._value;
    }
    setValue(value, flags) {
        var _a;
        if (this._hasSetter) {
            value = this._setter(value);
        }
        if (!Object.is(value, this._value)) {
            this._oldValue = this._value;
            this._value = value;
            this.f = flags;
            (_a = this.cb) === null || _a === void 0 ? void 0 : _a.call(this._obj, this._value, this._oldValue, flags);
            this.queue.add(this);
        }
    }
    flush() {
        oV = this._oldValue;
        this._oldValue = this._value;
        this.subs.notify(this._value, oV, this.f);
    }
}
exports.SetterNotifier = SetterNotifier;
(0, subscriber_collection_1.subscriberCollection)(SetterObserver);
(0, subscriber_collection_1.subscriberCollection)(SetterNotifier);
(0, flush_queue_1.withFlushQueue)(SetterObserver);
(0, flush_queue_1.withFlushQueue)(SetterNotifier);
//# sourceMappingURL=setter-observer.js.map
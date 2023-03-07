"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ComputedObserver = void 0;
const subscriber_collection_1 = require("./subscriber-collection");
const connectable_switcher_1 = require("./connectable-switcher");
const connectable_1 = require("../binding/connectable");
const proxy_observation_1 = require("./proxy-observation");
const utilities_objects_1 = require("../utilities-objects");
const flush_queue_1 = require("./flush-queue");
class ComputedObserver {
    constructor(obj, get, set, useProxy, observerLocator) {
        this.interceptor = this;
        this.type = 1 /* Observer */;
        /** @internal */
        this._value = void 0;
        /** @internal */
        this._oldValue = void 0;
        // todo: maybe use a counter allow recursive call to a certain level
        /** @internal */
        this._isRunning = false;
        /** @internal */
        this._isDirty = false;
        this._obj = obj;
        this.get = get;
        this.set = set;
        this._useProxy = useProxy;
        this.oL = observerLocator;
    }
    static create(obj, key, descriptor, observerLocator, useProxy) {
        const getter = descriptor.get;
        const setter = descriptor.set;
        const observer = new ComputedObserver(obj, getter, setter, useProxy, observerLocator);
        const $get = (( /* Computed Observer */) => observer.getValue());
        $get.getObserver = () => observer;
        (0, utilities_objects_1.def)(obj, key, {
            enumerable: descriptor.enumerable,
            configurable: true,
            get: $get,
            set: (/* Computed Observer */ v) => {
                observer.setValue(v, 0 /* none */);
            },
        });
        return observer;
    }
    getValue() {
        if (this.subs.count === 0) {
            return this.get.call(this._obj, this);
        }
        if (this._isDirty) {
            this.compute();
            this._isDirty = false;
        }
        return this._value;
    }
    // deepscan-disable-next-line
    setValue(v, _flags) {
        if ((0, utilities_objects_1.isFunction)(this.set)) {
            if (v !== this._value) {
                // setting running true as a form of batching
                this._isRunning = true;
                this.set.call(this._obj, v);
                this._isRunning = false;
                this.run();
            }
        }
        else {
            if (true /**/)
                throw new Error('Property is readonly');
            else
                throw new Error('AUR0221');
        }
    }
    handleChange() {
        this._isDirty = true;
        if (this.subs.count > 0) {
            this.run();
        }
    }
    handleCollectionChange() {
        this._isDirty = true;
        if (this.subs.count > 0) {
            this.run();
        }
    }
    subscribe(subscriber) {
        // in theory, a collection subscriber could be added before a property subscriber
        // and it should be handled similarly in subscribeToCollection
        // though not handling for now, and wait until the merge of normal + collection subscription
        if (this.subs.add(subscriber) && this.subs.count === 1) {
            this.compute();
            this._isDirty = false;
        }
    }
    unsubscribe(subscriber) {
        if (this.subs.remove(subscriber) && this.subs.count === 0) {
            this._isDirty = true;
            this.obs.clearAll();
        }
    }
    flush() {
        oV = this._oldValue;
        this._oldValue = this._value;
        this.subs.notify(this._value, oV, 0 /* none */);
    }
    run() {
        if (this._isRunning) {
            return;
        }
        const oldValue = this._value;
        const newValue = this.compute();
        this._isDirty = false;
        if (!Object.is(newValue, oldValue)) {
            this._oldValue = oldValue;
            this.queue.add(this);
        }
    }
    compute() {
        this._isRunning = true;
        this.obs.version++;
        try {
            (0, connectable_switcher_1.enterConnectable)(this);
            return this._value = (0, proxy_observation_1.unwrap)(this.get.call(this._useProxy ? (0, proxy_observation_1.wrap)(this._obj) : this._obj, this));
        }
        finally {
            this.obs.clear();
            this._isRunning = false;
            (0, connectable_switcher_1.exitConnectable)(this);
        }
    }
}
exports.ComputedObserver = ComputedObserver;
(0, connectable_1.connectable)(ComputedObserver);
(0, subscriber_collection_1.subscriberCollection)(ComputedObserver);
(0, flush_queue_1.withFlushQueue)(ComputedObserver);
// a reusable variable for `.flush()` methods of observers
// so that there doesn't need to create an env record for every call
let oV = void 0;
//# sourceMappingURL=computed-observer.js.map
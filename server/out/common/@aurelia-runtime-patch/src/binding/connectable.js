"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BindingMediator = exports.connectable = exports.BindingObserverRecord = void 0;
const utilities_objects_1 = require("../utilities-objects");
const array_observer_1 = require("../observation/array-observer");
const set_observer_1 = require("../observation/set-observer");
const map_observer_1 = require("../observation/map-observer");
function observe(obj, key) {
    const observer = this.oL.getObserver(obj, key);
    /* Note: we need to cast here because we can indeed get an accessor instead of an observer,
     *  in which case the call to observer.subscribe will throw. It's not very clean and we can solve this in 2 ways:
     *  1. Fail earlier: only let the locator resolve observers from .getObserver, and throw if no branches are left (e.g. it would otherwise return an accessor)
     *  2. Fail silently (without throwing): give all accessors a no-op subscribe method
     *
     * We'll probably want to implement some global configuration (like a "strict" toggle) so users can pick between enforced correctness vs. ease-of-use
     */
    this.obs.add(observer);
}
function getObserverRecord() {
    return (0, utilities_objects_1.defineHiddenProp)(this, 'obs', new BindingObserverRecord(this));
}
function observeCollection(collection) {
    let obs;
    if (collection instanceof Array) {
        obs = (0, array_observer_1.getArrayObserver)(collection);
    }
    else if (collection instanceof Set) {
        obs = (0, set_observer_1.getSetObserver)(collection);
    }
    else if (collection instanceof Map) {
        obs = (0, map_observer_1.getMapObserver)(collection);
    }
    else {
        if (true /**/)
            throw new Error('Unrecognised collection type.');
        else
            throw new Error('AUR0210');
    }
    this.obs.add(obs);
}
function subscribeTo(subscribable) {
    this.obs.add(subscribable);
}
function noopHandleChange() {
    if (true /**/)
        throw new Error('method "handleChange" not implemented');
    else
        throw new Error(`AUR2011:handleChange`);
}
function noopHandleCollectionChange() {
    if (true /**/)
        throw new Error('method "handleCollectionChange" not implemented');
    else
        throw new Error('AUR2012:handleCollectionChange');
}
class BindingObserverRecord {
    constructor(b) {
        this.version = 0;
        this.count = 0;
        /** @internal */
        // a map of the observers (subscribables) that the owning binding of this record
        // is currently subscribing to. The values are the version of the observers,
        // as the observers version may need to be changed during different evaluation
        this.o = new Map();
        this.b = b;
    }
    handleChange(value, oldValue, flags) {
        return this.b.interceptor.handleChange(value, oldValue, flags);
    }
    handleCollectionChange(indexMap, flags) {
        this.b.interceptor.handleCollectionChange(indexMap, flags);
    }
    /**
     * Add, and subscribe to a given observer
     */
    add(observer) {
        if (!this.o.has(observer)) {
            observer.subscribe(this);
            ++this.count;
        }
        this.o.set(observer, this.version);
    }
    /**
     * Unsubscribe the observers that are not up to date with the record version
     */
    clear() {
        this.o.forEach(unsubscribeStale, this);
        this.count = this.o.size;
    }
    clearAll() {
        this.o.forEach(unsubscribeAll, this);
        this.o.clear();
        this.count = 0;
    }
}
exports.BindingObserverRecord = BindingObserverRecord;
function unsubscribeAll(version, subscribable) {
    subscribable.unsubscribe(this);
}
function unsubscribeStale(version, subscribable) {
    if (this.version !== version) {
        subscribable.unsubscribe(this);
        this.o.delete(subscribable);
    }
}
function connectableDecorator(target) {
    const proto = target.prototype;
    (0, utilities_objects_1.ensureProto)(proto, 'observe', observe, true);
    (0, utilities_objects_1.ensureProto)(proto, 'observeCollection', observeCollection, true);
    (0, utilities_objects_1.ensureProto)(proto, 'subscribeTo', subscribeTo, true);
    (0, utilities_objects_1.def)(proto, 'obs', { get: getObserverRecord });
    // optionally add these two methods to normalize a connectable impl
    (0, utilities_objects_1.ensureProto)(proto, 'handleChange', noopHandleChange);
    (0, utilities_objects_1.ensureProto)(proto, 'handleCollectionChange', noopHandleCollectionChange);
    return target;
}
function connectable(target) {
    return target == null ? connectableDecorator : connectableDecorator(target);
}
exports.connectable = connectable;
class BindingMediator {
    constructor(key, binding, oL, locator) {
        this.key = key;
        this.binding = binding;
        this.oL = oL;
        this.locator = locator;
        this.interceptor = this;
    }
    $bind() {
        if (true /**/)
            throw new Error('Method not implemented.');
        else
            throw new Error('AUR0213:$bind');
    }
    $unbind() {
        if (true /**/)
            throw new Error('Method not implemented.');
        else
            throw new Error('AUR0214:$unbind');
    }
    handleChange(newValue, previousValue, flags) {
        this.binding[this.key](newValue, previousValue, flags);
    }
}
exports.BindingMediator = BindingMediator;
connectableDecorator(BindingMediator);
//# sourceMappingURL=connectable.js.map
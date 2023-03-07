"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCollectionObserver = exports.ObserverLocator = exports.INodeObserverLocator = exports.IObserverLocator = exports.propertyAccessor = void 0;
const kernel_1 = require("@aurelia/kernel");
const array_observer_1 = require("./array-observer");
const computed_observer_1 = require("./computed-observer");
const dirty_checker_1 = require("./dirty-checker");
const map_observer_1 = require("./map-observer");
const primitive_observer_1 = require("./primitive-observer");
const property_accessor_1 = require("./property-accessor");
const set_observer_1 = require("./set-observer");
const setter_observer_1 = require("./setter-observer");
const utilities_objects_1 = require("../utilities-objects");
exports.propertyAccessor = new property_accessor_1.PropertyAccessor();
exports.IObserverLocator = kernel_1.DI.createInterface('IObserverLocator', (x) => x.singleton(ObserverLocator));
exports.INodeObserverLocator = kernel_1.DI.createInterface('INodeObserverLocator', (x) => x.cachedCallback((handler) => {
    handler.getAll(kernel_1.ILogger).forEach((logger) => {
        logger.error('Using default INodeObserverLocator implementation. Will not be able to observe nodes (HTML etc...).');
    });
    return new DefaultNodeObserverLocator();
}));
class DefaultNodeObserverLocator {
    handles() {
        return false;
    }
    getObserver() {
        return exports.propertyAccessor;
    }
    getAccessor() {
        return exports.propertyAccessor;
    }
}
class ObserverLocator {
    constructor(_dirtyChecker, _nodeObserverLocator) {
        this._dirtyChecker = _dirtyChecker;
        this._nodeObserverLocator = _nodeObserverLocator;
        this._adapters = [];
    }
    addAdapter(adapter) {
        this._adapters.push(adapter);
    }
    getObserver(obj, key) {
        var _a;
        return (((_a = obj.$observers) === null || _a === void 0 ? void 0 : _a[key]) ||
            this._cache(obj, key, this.createObserver(obj, key)));
    }
    getAccessor(obj, key) {
        var _a;
        const cached = (_a = obj.$observers) === null || _a === void 0 ? void 0 : _a[key];
        if (cached !== void 0) {
            return cached;
        }
        if (this._nodeObserverLocator.handles(obj, key, this)) {
            return this._nodeObserverLocator.getAccessor(obj, key, this);
        }
        return exports.propertyAccessor;
    }
    getArrayObserver(observedArray) {
        return (0, array_observer_1.getArrayObserver)(observedArray);
    }
    getMapObserver(observedMap) {
        return (0, map_observer_1.getMapObserver)(observedMap);
    }
    getSetObserver(observedSet) {
        return (0, set_observer_1.getSetObserver)(observedSet);
    }
    createObserver(obj, key) {
        var _a, _b, _c, _d;
        if (!(obj instanceof Object)) {
            return new primitive_observer_1.PrimitiveObserver(obj, key);
        }
        if (this._nodeObserverLocator.handles(obj, key, this)) {
            return this._nodeObserverLocator.getObserver(obj, key, this);
        }
        switch (key) {
            case 'length':
                if (obj instanceof Array) {
                    return (0, array_observer_1.getArrayObserver)(obj).getLengthObserver();
                }
                break;
            case 'size':
                if (obj instanceof Map) {
                    return (0, map_observer_1.getMapObserver)(obj).getLengthObserver();
                }
                else if (obj instanceof Set) {
                    return (0, set_observer_1.getSetObserver)(obj).getLengthObserver();
                }
                break;
            default:
                if (obj instanceof Array && (0, kernel_1.isArrayIndex)(key)) {
                    return (0, array_observer_1.getArrayObserver)(obj).getIndexObserver(Number(key));
                }
                break;
        }
        let pd = getOwnPropDesc(obj, key);
        // Only instance properties will yield a descriptor here, otherwise walk up the proto chain
        if (pd === void 0) {
            let proto = getProto(obj);
            while (proto !== null) {
                pd = getOwnPropDesc(proto, key);
                if (pd === void 0) {
                    proto = getProto(proto);
                }
                else {
                    break;
                }
            }
        }
        // If the descriptor does not have a 'value' prop, it must have a getter and/or setter
        if (pd !== void 0 && !utilities_objects_1.hasOwnProp.call(pd, 'value')) {
            let obs = this._getAdapterObserver(obj, key, pd);
            if (obs == null) {
                obs = (_d = ((_b = (_a = pd.get) === null || _a === void 0 ? void 0 : _a.getObserver) !== null && _b !== void 0 ? _b : (_c = pd.set) === null || _c === void 0 ? void 0 : _c.getObserver)) === null || _d === void 0 ? void 0 : _d(obj, this);
            }
            return obs == null
                ? pd.configurable
                    ? computed_observer_1.ComputedObserver.create(obj, key, pd, this, 
                    /* AOT: not true for IE11 */ true)
                    : this._dirtyChecker.createProperty(obj, key)
                : obs;
        }
        // Ordinary get/set observation (the common use case)
        // TODO: think about how to handle a data property that does not sit on the instance (should we do anything different?)
        return new setter_observer_1.SetterObserver(obj, key);
    }
    _getAdapterObserver(obj, propertyName, pd) {
        if (this._adapters.length > 0) {
            for (const adapter of this._adapters) {
                const observer = adapter.getObserver(obj, propertyName, pd, this);
                if (observer != null) {
                    return observer;
                }
            }
        }
        return null;
    }
    _cache(obj, key, observer) {
        if (observer.doNotCache === true) {
            return observer;
        }
        if (obj.$observers === void 0) {
            (0, utilities_objects_1.def)(obj, '$observers', { value: { [key]: observer } });
            return observer;
        }
        return (obj.$observers[key] = observer);
    }
}
exports.ObserverLocator = ObserverLocator;
ObserverLocator.inject = [dirty_checker_1.IDirtyChecker, exports.INodeObserverLocator];
function getCollectionObserver(collection) {
    let obs;
    if (collection instanceof Array) {
        obs = (0, array_observer_1.getArrayObserver)(collection);
    }
    else if (collection instanceof Map) {
        obs = (0, map_observer_1.getMapObserver)(collection);
    }
    else if (collection instanceof Set) {
        obs = (0, set_observer_1.getSetObserver)(collection);
    }
    return obs;
}
exports.getCollectionObserver = getCollectionObserver;
const getProto = Object.getPrototypeOf;
const getOwnPropDesc = Object.getOwnPropertyDescriptor;
//# sourceMappingURL=observer-locator.js.map
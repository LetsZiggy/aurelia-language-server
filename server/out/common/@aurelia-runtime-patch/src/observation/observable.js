"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.observable = void 0;
const setter_observer_1 = require("./setter-observer");
const utilities_objects_1 = require("../utilities-objects");
const connectable_switcher_1 = require("./connectable-switcher");
function getObserversLookup(obj) {
    if (obj.$observers === void 0) {
        (0, utilities_objects_1.def)(obj, '$observers', { value: {} });
        // todo: define in a weakmap
    }
    return obj.$observers;
}
const noValue = {};
// impl, wont be seen
function observable(targetOrConfig, key, descriptor) {
    // either this check, or arguments.length === 3
    // or could be both, so can throw against user error for better DX
    if (key == null) {
        // for:
        //    @observable('prop')
        //    class {}
        //
        //    @observable({ name: 'prop', callback: ... })
        //    class {}
        //
        //    class {
        //      @observable() prop
        //      @observable({ callback: ... }) prop2
        //    }
        return ((t, k, d) => deco(t, k, d, targetOrConfig));
    }
    // for:
    //    class {
    //      @observable prop
    //    }
    return deco(targetOrConfig, key, descriptor);
    function deco(target, key, descriptor, config) {
        var _a;
        // class decorator?
        const isClassDecorator = key === void 0;
        config = typeof config !== 'object'
            ? { name: config }
            : (config || {});
        if (isClassDecorator) {
            key = config.name;
        }
        if (key == null || key === '') {
            if (true /**/)
                throw new Error('Invalid usage, cannot determine property name for @observable');
            else
                throw new Error('AUR0224');
        }
        // determine callback name based on config or convention.
        const callback = config.callback || `${String(key)}Changed`;
        let initialValue = noValue;
        if (descriptor) {
            // we're adding a getter and setter which means the property descriptor
            // cannot have a "value" or "writable" attribute
            delete descriptor.value;
            delete descriptor.writable;
            initialValue = (_a = descriptor.initializer) === null || _a === void 0 ? void 0 : _a.call(descriptor);
            delete descriptor.initializer;
        }
        else {
            descriptor = { configurable: true };
        }
        // make the accessor enumerable by default, as fields are enumerable
        if (!('enumerable' in descriptor)) {
            descriptor.enumerable = true;
        }
        // todo(bigopon/fred): discuss string api for converter
        const $set = config.set;
        descriptor.get = function g( /* @observable */) {
            var _a;
            const notifier = getNotifier(this, key, callback, initialValue, $set);
            (_a = (0, connectable_switcher_1.currentConnectable)()) === null || _a === void 0 ? void 0 : _a.subscribeTo(notifier);
            return notifier.getValue();
        };
        descriptor.set = function s(newValue) {
            getNotifier(this, key, callback, initialValue, $set).setValue(newValue, 0 /* none */);
        };
        descriptor.get.getObserver = function gO(/* @observable */ obj) {
            return getNotifier(obj, key, callback, initialValue, $set);
        };
        if (isClassDecorator) {
            (0, utilities_objects_1.def)(target.prototype, key, descriptor);
        }
        else {
            return descriptor;
        }
    }
}
exports.observable = observable;
function getNotifier(obj, key, callbackKey, initialValue, set) {
    const lookup = getObserversLookup(obj);
    let notifier = lookup[key];
    if (notifier == null) {
        notifier = new setter_observer_1.SetterNotifier(obj, callbackKey, set, initialValue === noValue ? void 0 : initialValue);
        lookup[key] = notifier;
    }
    return notifier;
}
/*
          | typescript       | babel
----------|------------------|-------------------------
property  | config           | config
w/parens  | target, key      | target, key, descriptor
----------|------------------|-------------------------
property  | target, key      | target, key, descriptor
no parens | n/a              | n/a
----------|------------------|-------------------------
class     | config           | config
          | target           | target
*/
//# sourceMappingURL=observable.js.map
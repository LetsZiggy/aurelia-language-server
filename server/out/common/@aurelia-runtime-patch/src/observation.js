"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isIndexMap = exports.cloneIndexMap = exports.createIndexMap = exports.copyIndexMap = exports.DelegationStrategy = exports.BindingMode = void 0;
/*
* Note: the oneTime binding now has a non-zero value for 2 reasons:
*  - plays nicer with bitwise operations (more consistent code, more explicit settings)
*  - allows for potentially having something like BindingMode.oneTime | BindingMode.fromView, where an initial value is set once to the view but updates from the view also propagate back to the view model
*
* Furthermore, the "default" mode would be for simple ".bind" expressions to make it explicit for our logic that the default is being used.
* This essentially adds extra information which binding could use to do smarter things and allows bindingBehaviors that add a mode instead of simply overwriting it
*/
var BindingMode;
(function (BindingMode) {
    BindingMode[BindingMode["oneTime"] = 1] = "oneTime";
    BindingMode[BindingMode["toView"] = 2] = "toView";
    BindingMode[BindingMode["fromView"] = 4] = "fromView";
    BindingMode[BindingMode["twoWay"] = 6] = "twoWay";
    BindingMode[BindingMode["default"] = 8] = "default";
})(BindingMode = exports.BindingMode || (exports.BindingMode = {}));
var DelegationStrategy;
(function (DelegationStrategy) {
    DelegationStrategy[DelegationStrategy["none"] = 0] = "none";
    DelegationStrategy[DelegationStrategy["capturing"] = 1] = "capturing";
    DelegationStrategy[DelegationStrategy["bubbling"] = 2] = "bubbling";
})(DelegationStrategy = exports.DelegationStrategy || (exports.DelegationStrategy = {}));
function copyIndexMap(existing, deletedItems) {
    const { length } = existing;
    const arr = Array(length);
    let i = 0;
    while (i < length) {
        arr[i] = existing[i];
        ++i;
    }
    if (deletedItems !== void 0) {
        arr.deletedItems = deletedItems.slice(0);
    }
    else if (existing.deletedItems !== void 0) {
        arr.deletedItems = existing.deletedItems.slice(0);
    }
    else {
        arr.deletedItems = [];
    }
    arr.isIndexMap = true;
    return arr;
}
exports.copyIndexMap = copyIndexMap;
function createIndexMap(length = 0) {
    const arr = Array(length);
    let i = 0;
    while (i < length) {
        arr[i] = i++;
    }
    arr.deletedItems = [];
    arr.isIndexMap = true;
    return arr;
}
exports.createIndexMap = createIndexMap;
function cloneIndexMap(indexMap) {
    const clone = indexMap.slice();
    clone.deletedItems = indexMap.deletedItems.slice();
    clone.isIndexMap = true;
    return clone;
}
exports.cloneIndexMap = cloneIndexMap;
function isIndexMap(value) {
    return value instanceof Array && value.isIndexMap === true;
}
exports.isIndexMap = isIndexMap;
//# sourceMappingURL=observation.js.map
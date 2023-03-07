"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.appendResourceKey = exports.getResourceKeyFor = exports.getAnnotationKeyFor = exports.defineMetadata = exports.hasOwnMetadata = exports.getOwnMetadata = exports.createLookup = exports.ensureProto = exports.defineHiddenProp = exports.isString = exports.isFunction = exports.def = exports.hasOwnProp = void 0;
const kernel_1 = require("@aurelia/kernel");
/**
 * A shortcut to Object.prototype.hasOwnProperty
 * Needs to do explicit .call
 *
 * @internal
 */
exports.hasOwnProp = Object.prototype.hasOwnProperty;
/** @internal */ exports.def = Reflect.defineProperty;
// eslint-disable-next-line @typescript-eslint/ban-types
// @ts-ignore
/** @internal */ const isFunction = (v) => typeof v === 'function';
exports.isFunction = isFunction;
/** @internal */ const isString = (v) => typeof v === 'string';
exports.isString = isString;
/** @internal */ function defineHiddenProp(obj, key, value) {
    (0, exports.def)(obj, key, {
        enumerable: false,
        configurable: true,
        writable: true,
        value
    });
    return value;
}
exports.defineHiddenProp = defineHiddenProp;
/** @internal */ function ensureProto(proto, key, defaultValue, force = false) {
    if (force || !exports.hasOwnProp.call(proto, key)) {
        defineHiddenProp(proto, key, defaultValue);
    }
}
exports.ensureProto = ensureProto;
/** @internal */ const createLookup = () => Object.create(null);
exports.createLookup = createLookup;
/** @internal */ exports.getOwnMetadata = kernel_1.Metadata.getOwn;
/** @internal */ exports.hasOwnMetadata = kernel_1.Metadata.hasOwn;
/** @internal */ exports.defineMetadata = kernel_1.Metadata.define;
/** @internal */ exports.getAnnotationKeyFor = kernel_1.Protocol.annotation.keyFor;
/** @internal */ exports.getResourceKeyFor = kernel_1.Protocol.resource.keyFor;
/** @internal */ exports.appendResourceKey = kernel_1.Protocol.resource.appendTo;
//# sourceMappingURL=utilities-objects.js.map
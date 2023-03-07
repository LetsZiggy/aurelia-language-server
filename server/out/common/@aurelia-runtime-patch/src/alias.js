"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerAliases = exports.alias = void 0;
const kernel_1 = require("@aurelia/kernel");
const utilities_objects_1 = require("./utilities-objects");
function alias(...aliases) {
    return function (target) {
        const key = (0, utilities_objects_1.getAnnotationKeyFor)('aliases');
        const existing = (0, utilities_objects_1.getOwnMetadata)(key, target);
        if (existing === void 0) {
            (0, utilities_objects_1.defineMetadata)(key, aliases, target);
        }
        else {
            existing.push(...aliases);
        }
    };
}
exports.alias = alias;
function registerAliases(aliases, resource, key, container) {
    for (let i = 0, ii = aliases.length; i < ii; ++i) {
        kernel_1.Registration.aliasTo(key, resource.keyFrom(aliases[i])).register(container);
    }
}
exports.registerAliases = registerAliases;
//# sourceMappingURL=alias.js.map
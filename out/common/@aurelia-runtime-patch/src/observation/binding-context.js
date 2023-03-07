"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OverrideContext = exports.Scope = exports.BindingContext = void 0;
const marker = Object.freeze({});
class BindingContext {
    constructor(keyOrObj, value) {
        if (keyOrObj !== void 0) {
            if (value !== void 0) {
                // if value is defined then it's just a property and a value to initialize with
                this[keyOrObj] = value;
            }
            else {
                // can either be some random object or another bindingContext to clone from
                for (const prop in keyOrObj) {
                    if (Object.prototype.hasOwnProperty.call(keyOrObj, prop)) {
                        this[prop] = keyOrObj[prop];
                    }
                }
            }
        }
    }
    static create(keyOrObj, value) {
        return new BindingContext(keyOrObj, value);
    }
    static get(scope, name, ancestor, flags) {
        var _a, _b;
        if (scope == null) {
            if (true /**/)
                throw new Error(`Scope is ${scope}.`);
            else
                throw new Error(`AUR0203:${scope}`);
        }
        let overrideContext = scope.overrideContext;
        let currentScope = scope;
        // let bc: IBindingContext | null;
        if (ancestor > 0) {
            // jump up the required number of ancestor contexts (eg $parent.$parent requires two jumps)
            while (ancestor > 0) {
                ancestor--;
                currentScope = currentScope.parentScope;
                if ((currentScope === null || currentScope === void 0 ? void 0 : currentScope.overrideContext) == null) {
                    return void 0;
                }
            }
            overrideContext = currentScope.overrideContext;
            // Here we are giving benefit of doubt considering the dev has used one or more `$parent` token, and thus should know what s/he is targeting.
            return name in overrideContext ? overrideContext : overrideContext.bindingContext;
        }
        // walk the scope hierarchy until
        // the first scope that has the property in its contexts
        // or
        // the closet boundary scope
        // -------------------------
        // this behavior is different with v1
        // where it would fallback to the immediate scope instead of the root one
        // TODO: maybe avoid immediate loop and return earlier
        // -------------------------
        while (!(currentScope === null || currentScope === void 0 ? void 0 : currentScope.isBoundary)
            && overrideContext != null
            && !(name in overrideContext)
            && !(overrideContext.bindingContext
                && name in overrideContext.bindingContext)) {
            currentScope = (_a = currentScope.parentScope) !== null && _a !== void 0 ? _a : null;
            overrideContext = (_b = currentScope === null || currentScope === void 0 ? void 0 : currentScope.overrideContext) !== null && _b !== void 0 ? _b : null;
        }
        if (overrideContext) {
            return name in overrideContext ? overrideContext : overrideContext.bindingContext;
        }
        // This following code block is the v1 behavior of scope selection
        // where it would walk the scope hierarchy and stop at the first scope
        // that has matching property.
        // if no scope in the hierarchy, until the closest boundary scope has the property
        // then pick the scope it started with
        // ------------------
        // if (currentScope.isBoundary) {
        //   if (overrideContext != null) {
        //     if (name in overrideContext) {
        //       return overrideContext;
        //     }
        //     bc = overrideContext.bindingContext;
        //     if (bc != null && name in bc) {
        //       return bc;
        //     }
        //   }
        // } else {
        //   // traverse the context and it's ancestors, searching for a context that has the name.
        //   do {
        //     if (overrideContext != null) {
        //       if (name in overrideContext) {
        //         return overrideContext;
        //       }
        //       bc = overrideContext.bindingContext;
        //       if (bc != null && name in bc) {
        //         return bc;
        //       }
        //     }
        //     if (currentScope.isBoundary) {
        //       break;
        //     }
        //     currentScope = currentScope.parentScope;
        //     overrideContext = currentScope == null ? null : currentScope.overrideContext;
        //   } while (currentScope != null);
        // }
        // still nothing found. return the root binding context (or null
        // if this is a parent scope traversal, to ensure we fall back to the
        // correct level)
        if (flags & 16 /* isTraversingParentScope */) {
            return marker;
        }
        return scope.bindingContext || scope.overrideContext;
    }
}
exports.BindingContext = BindingContext;
class Scope {
    constructor(parentScope, bindingContext, overrideContext, isBoundary) {
        this.parentScope = parentScope;
        this.bindingContext = bindingContext;
        this.overrideContext = overrideContext;
        this.isBoundary = isBoundary;
    }
    static create(bc, oc, isBoundary) {
        return new Scope(null, bc, oc == null ? OverrideContext.create(bc) : oc, isBoundary !== null && isBoundary !== void 0 ? isBoundary : false);
    }
    static fromOverride(oc) {
        if (oc == null) {
            if (true /**/)
                throw new Error(`OverrideContext is ${oc}`);
            else
                throw new Error(`AUR0204:${oc}`);
        }
        return new Scope(null, oc.bindingContext, oc, false);
    }
    static fromParent(ps, bc) {
        if (ps == null) {
            if (true /**/)
                throw new Error(`ParentScope is ${ps}`);
            else
                throw new Error(`AUR0205:${ps}`);
        }
        return new Scope(ps, bc, OverrideContext.create(bc), false);
    }
}
exports.Scope = Scope;
class OverrideContext {
    constructor(bindingContext) {
        this.bindingContext = bindingContext;
    }
    static create(bc) {
        return new OverrideContext(bc);
    }
}
exports.OverrideContext = OverrideContext;
//# sourceMappingURL=binding-context.js.map
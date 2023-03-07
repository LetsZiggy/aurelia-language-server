"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BindingBehavior = exports.BindingInterceptor = exports.BindingBehaviorFactory = exports.BindingBehaviorDefinition = exports.bindingBehavior = void 0;
const kernel_1 = require("@aurelia/kernel");
const alias_1 = require("./alias");
const utilities_objects_1 = require("./utilities-objects");
function bindingBehavior(nameOrDef) {
    return function (target) {
        return exports.BindingBehavior.define(nameOrDef, target);
    };
}
exports.bindingBehavior = bindingBehavior;
class BindingBehaviorDefinition {
    constructor(Type, name, aliases, key, strategy) {
        this.Type = Type;
        this.name = name;
        this.aliases = aliases;
        this.key = key;
        this.strategy = strategy;
    }
    static create(nameOrDef, Type) {
        let name;
        let def;
        if ((0, utilities_objects_1.isString)(nameOrDef)) {
            name = nameOrDef;
            def = { name };
        }
        else {
            name = nameOrDef.name;
            def = nameOrDef;
        }
        const inheritsFromInterceptor = Object.getPrototypeOf(Type) === BindingInterceptor;
        return new BindingBehaviorDefinition(Type, (0, kernel_1.firstDefined)(getBehaviorAnnotation(Type, 'name'), name), (0, kernel_1.mergeArrays)(getBehaviorAnnotation(Type, 'aliases'), def.aliases, Type.aliases), exports.BindingBehavior.keyFrom(name), (0, kernel_1.fromAnnotationOrDefinitionOrTypeOrDefault)('strategy', def, Type, () => inheritsFromInterceptor ? 2 /* interceptor */ : 1 /* singleton */));
    }
    register(container) {
        const { Type, key, aliases, strategy } = this;
        switch (strategy) {
            case 1 /* singleton */:
                kernel_1.Registration.singleton(key, Type).register(container);
                break;
            case 2 /* interceptor */:
                kernel_1.Registration.instance(key, new BindingBehaviorFactory(container, Type)).register(container);
                break;
        }
        kernel_1.Registration.aliasTo(key, Type).register(container);
        (0, alias_1.registerAliases)(aliases, exports.BindingBehavior, key, container);
    }
}
exports.BindingBehaviorDefinition = BindingBehaviorDefinition;
class BindingBehaviorFactory {
    constructor(ctn, Type) {
        this.ctn = ctn;
        this.Type = Type;
        this.deps = kernel_1.DI.getDependencies(Type);
    }
    construct(binding, expr) {
        const container = this.ctn;
        const deps = this.deps;
        switch (deps.length) {
            case 0:
                // TODO(fkleuver): fix this cast
                return new this.Type(binding, expr);
            case 1:
                return new this.Type(container.get(deps[0]), binding, expr);
            case 2:
                return new this.Type(container.get(deps[0]), container.get(deps[1]), binding, expr);
            default:
                return new this.Type(...deps.map(d => container.get(d)), binding, expr);
        }
    }
}
exports.BindingBehaviorFactory = BindingBehaviorFactory;
class BindingInterceptor {
    constructor(binding, expr) {
        this.binding = binding;
        this.expr = expr;
        this.interceptor = this;
        let interceptor;
        while (binding.interceptor !== this) {
            interceptor = binding.interceptor;
            binding.interceptor = this;
            binding = interceptor;
        }
    }
    get oL() {
        return this.binding.oL;
    }
    get locator() {
        return this.binding.locator;
    }
    get $scope() {
        return this.binding.$scope;
    }
    get isBound() {
        return this.binding.isBound;
    }
    get obs() {
        return this.binding.obs;
    }
    get sourceExpression() {
        return this.binding.sourceExpression;
    }
    updateTarget(value, flags) {
        this.binding.updateTarget(value, flags);
    }
    updateSource(value, flags) {
        this.binding.updateSource(value, flags);
    }
    callSource(args) {
        return this.binding.callSource(args);
    }
    handleChange(newValue, previousValue, flags) {
        this.binding.handleChange(newValue, previousValue, flags);
    }
    handleCollectionChange(indexMap, flags) {
        this.binding.handleCollectionChange(indexMap, flags);
    }
    observe(obj, key) {
        this.binding.observe(obj, key);
    }
    observeCollection(observer) {
        this.binding.observeCollection(observer);
    }
    $bind(flags, scope) {
        this.binding.$bind(flags, scope);
    }
    $unbind(flags) {
        this.binding.$unbind(flags);
    }
}
exports.BindingInterceptor = BindingInterceptor;
const bbBaseName = (0, utilities_objects_1.getResourceKeyFor)('binding-behavior');
const getBehaviorAnnotation = (Type, prop) => (0, utilities_objects_1.getOwnMetadata)((0, utilities_objects_1.getAnnotationKeyFor)(prop), Type);
exports.BindingBehavior = Object.freeze({
    name: bbBaseName,
    keyFrom(name) {
        return `${bbBaseName}:${name}`;
    },
    isType(value) {
        return (0, utilities_objects_1.isFunction)(value) && (0, utilities_objects_1.hasOwnMetadata)(bbBaseName, value);
    },
    define(nameOrDef, Type) {
        const definition = BindingBehaviorDefinition.create(nameOrDef, Type);
        (0, utilities_objects_1.defineMetadata)(bbBaseName, definition, definition.Type);
        (0, utilities_objects_1.defineMetadata)(bbBaseName, definition, definition);
        (0, utilities_objects_1.appendResourceKey)(Type, bbBaseName);
        return definition.Type;
    },
    getDefinition(Type) {
        const def = (0, utilities_objects_1.getOwnMetadata)(bbBaseName, Type);
        if (def === void 0) {
            if (true /**/)
                throw new Error(`No definition found for type ${Type.name}`);
            else
                throw new Error(`AUR0151:${Type.name}`);
        }
        return def;
    },
    annotate(Type, prop, value) {
        (0, utilities_objects_1.defineMetadata)((0, utilities_objects_1.getAnnotationKeyFor)(prop), value, Type);
    },
    getAnnotation: getBehaviorAnnotation,
});
//# sourceMappingURL=binding-behavior.js.map
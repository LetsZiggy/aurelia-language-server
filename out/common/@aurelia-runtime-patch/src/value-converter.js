"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ValueConverter = exports.ValueConverterDefinition = exports.valueConverter = void 0;
const kernel_1 = require("@aurelia/kernel");
const alias_1 = require("./alias");
const utilities_objects_1 = require("./utilities-objects");
function valueConverter(nameOrDef) {
    return function (target) {
        return exports.ValueConverter.define(nameOrDef, target);
    };
}
exports.valueConverter = valueConverter;
class ValueConverterDefinition {
    constructor(Type, name, aliases, key) {
        this.Type = Type;
        this.name = name;
        this.aliases = aliases;
        this.key = key;
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
        return new ValueConverterDefinition(Type, (0, kernel_1.firstDefined)(getConverterAnnotation(Type, 'name'), name), (0, kernel_1.mergeArrays)(getConverterAnnotation(Type, 'aliases'), def.aliases, Type.aliases), exports.ValueConverter.keyFrom(name));
    }
    register(container) {
        const { Type, key, aliases } = this;
        kernel_1.Registration.singleton(key, Type).register(container);
        kernel_1.Registration.aliasTo(key, Type).register(container);
        (0, alias_1.registerAliases)(aliases, exports.ValueConverter, key, container);
    }
}
exports.ValueConverterDefinition = ValueConverterDefinition;
const vcBaseName = (0, utilities_objects_1.getResourceKeyFor)('value-converter');
const getConverterAnnotation = (Type, prop) => (0, utilities_objects_1.getOwnMetadata)((0, utilities_objects_1.getAnnotationKeyFor)(prop), Type);
exports.ValueConverter = Object.freeze({
    name: vcBaseName,
    keyFrom: (name) => `${vcBaseName}:${name}`,
    isType(value) {
        return (0, utilities_objects_1.isFunction)(value) && (0, utilities_objects_1.hasOwnMetadata)(vcBaseName, value);
    },
    define(nameOrDef, Type) {
        const definition = ValueConverterDefinition.create(nameOrDef, Type);
        (0, utilities_objects_1.defineMetadata)(vcBaseName, definition, definition.Type);
        (0, utilities_objects_1.defineMetadata)(vcBaseName, definition, definition);
        (0, utilities_objects_1.appendResourceKey)(Type, vcBaseName);
        return definition.Type;
    },
    getDefinition(Type) {
        const def = (0, utilities_objects_1.getOwnMetadata)(vcBaseName, Type);
        if (def === void 0) {
            if (true /**/)
                throw new Error(`No definition found for type ${Type.name}`);
            else
                throw new Error(`AUR0152:${Type.name}`);
        }
        return def;
    },
    annotate(Type, prop, value) {
        (0, utilities_objects_1.defineMetadata)((0, utilities_objects_1.getAnnotationKeyFor)(prop), value, Type);
    },
    getAnnotation: getConverterAnnotation,
});
//# sourceMappingURL=value-converter.js.map
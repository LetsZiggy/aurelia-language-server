"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DirtyCheckProperty = exports.DirtyChecker = exports.DirtyCheckSettings = exports.IDirtyChecker = void 0;
const kernel_1 = require("@aurelia/kernel");
const subscriber_collection_1 = require("./subscriber-collection");
const flush_queue_1 = require("./flush-queue");
exports.IDirtyChecker = kernel_1.DI.createInterface('IDirtyChecker', x => x.singleton(DirtyChecker));
exports.DirtyCheckSettings = {
    /**
     * Default: `6`
     *
     * Adjust the global dirty check frequency.
     * Measures in "timeouts per check", such that (given a default of 250 timeouts per second in modern browsers):
     * - A value of 1 will result in 250 dirty checks per second (or 1 dirty check per second for an inactive tab)
     * - A value of 25 will result in 10 dirty checks per second (or 1 dirty check per 25 seconds for an inactive tab)
     */
    timeoutsPerCheck: 25,
    /**
     * Default: `false`
     *
     * Disable dirty-checking entirely. Properties that cannot be observed without dirty checking
     * or an adapter, will simply not be observed.
     */
    disabled: false,
    /**
     * Default: `false`
     *
     * Throw an error if a property is being dirty-checked.
     */
    throw: false,
    /**
     * Resets all dirty checking settings to the framework's defaults.
     */
    resetToDefault() {
        this.timeoutsPerCheck = 6;
        this.disabled = false;
        this.throw = false;
    }
};
const queueTaskOpts = {
    persistent: true,
};
class DirtyChecker {
    constructor(p) {
        this.p = p;
        this.tracked = [];
        this._task = null;
        this._elapsedFrames = 0;
        this.check = () => {
            if (exports.DirtyCheckSettings.disabled) {
                return;
            }
            if (++this._elapsedFrames < exports.DirtyCheckSettings.timeoutsPerCheck) {
                return;
            }
            this._elapsedFrames = 0;
            const tracked = this.tracked;
            const len = tracked.length;
            let current;
            let i = 0;
            for (; i < len; ++i) {
                current = tracked[i];
                if (current.isDirty()) {
                    this.queue.add(current);
                }
            }
        };
    }
    createProperty(obj, key) {
        if (exports.DirtyCheckSettings.throw) {
            if (true /**/)
                throw new Error(`Property '${key}' is being dirty-checked.`);
            else
                throw new Error(`AUR0222:${key}`);
        }
        return new DirtyCheckProperty(this, obj, key);
    }
    addProperty(property) {
        this.tracked.push(property);
        if (this.tracked.length === 1) {
            this._task = this.p.taskQueue.queueTask(this.check, queueTaskOpts);
        }
    }
    removeProperty(property) {
        this.tracked.splice(this.tracked.indexOf(property), 1);
        if (this.tracked.length === 0) {
            this._task.cancel();
            this._task = null;
        }
    }
}
exports.DirtyChecker = DirtyChecker;
/**
 * @internal
 */
DirtyChecker.inject = [kernel_1.IPlatform];
(0, flush_queue_1.withFlushQueue)(DirtyChecker);
class DirtyCheckProperty {
    constructor(dirtyChecker, obj, key) {
        this.obj = obj;
        this.key = key;
        this.type = 0 /* None */;
        /** @internal */
        this._oldValue = void 0;
        this._dirtyChecker = dirtyChecker;
    }
    getValue() {
        return this.obj[this.key];
    }
    setValue(v, f) {
        // todo: this should be allowed, probably
        // but the construction of dirty checker should throw instead
        throw new Error(`Trying to set value for property ${this.key} in dirty checker`);
    }
    isDirty() {
        return this._oldValue !== this.obj[this.key];
    }
    flush() {
        const oldValue = this._oldValue;
        const newValue = this.getValue();
        this._oldValue = newValue;
        this.subs.notify(newValue, oldValue, 0 /* none */);
    }
    subscribe(subscriber) {
        if (this.subs.add(subscriber) && this.subs.count === 1) {
            this._oldValue = this.obj[this.key];
            this._dirtyChecker.addProperty(this);
        }
    }
    unsubscribe(subscriber) {
        if (this.subs.remove(subscriber) && this.subs.count === 0) {
            this._dirtyChecker.removeProperty(this);
        }
    }
}
exports.DirtyCheckProperty = DirtyCheckProperty;
(0, subscriber_collection_1.subscriberCollection)(DirtyCheckProperty);
//# sourceMappingURL=dirty-checker.js.map
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SubscriberRecord = exports.subscriberCollection = void 0;
const utilities_objects_1 = require("../utilities-objects");
function subscriberCollection(target) {
    return target == null ? subscriberCollectionDeco : subscriberCollectionDeco(target);
}
exports.subscriberCollection = subscriberCollection;
function subscriberCollectionDeco(target) {
    const proto = target.prototype;
    // not configurable, as in devtool, the getter could be invoked on the prototype,
    // and become permanently broken
    (0, utilities_objects_1.def)(proto, 'subs', { get: getSubscriberRecord });
    (0, utilities_objects_1.ensureProto)(proto, 'subscribe', addSubscriber);
    (0, utilities_objects_1.ensureProto)(proto, 'unsubscribe', removeSubscriber);
}
/* eslint-enable @typescript-eslint/ban-types */
class SubscriberRecord {
    constructor() {
        /**
         * subscriber flags: bits indicating the existence status of the subscribers of this record
         */
        this.sf = 0 /* None */;
        this.count = 0;
    }
    add(subscriber) {
        if (this.has(subscriber)) {
            return false;
        }
        const subscriberFlags = this.sf;
        if ((subscriberFlags & 1 /* Subscriber0 */) === 0) {
            this.s0 = subscriber;
            this.sf |= 1 /* Subscriber0 */;
        }
        else if ((subscriberFlags & 2 /* Subscriber1 */) === 0) {
            this.s1 = subscriber;
            this.sf |= 2 /* Subscriber1 */;
        }
        else if ((subscriberFlags & 4 /* Subscriber2 */) === 0) {
            this.s2 = subscriber;
            this.sf |= 4 /* Subscriber2 */;
        }
        else if ((subscriberFlags & 8 /* SubscribersRest */) === 0) {
            this.sr = [subscriber];
            this.sf |= 8 /* SubscribersRest */;
        }
        else {
            this.sr.push(subscriber); // Non-null is implied by else branch of (subscriberFlags & SF.SubscribersRest) === 0
        }
        ++this.count;
        return true;
    }
    has(subscriber) {
        // Flags here is just a perf tweak
        // Compared to not using flags, it's a moderate speed-up when this collection does not have the subscriber;
        // and minor slow-down when it does, and the former is more common than the latter.
        const subscriberFlags = this.sf;
        if ((subscriberFlags & 1 /* Subscriber0 */) > 0 && this.s0 === subscriber) {
            return true;
        }
        if ((subscriberFlags & 2 /* Subscriber1 */) > 0 && this.s1 === subscriber) {
            return true;
        }
        if ((subscriberFlags & 4 /* Subscriber2 */) > 0 && this.s2 === subscriber) {
            return true;
        }
        if ((subscriberFlags & 8 /* SubscribersRest */) > 0) {
            const subscribers = this.sr; // Non-null is implied by (subscriberFlags & SF.SubscribersRest) > 0
            const ii = subscribers.length;
            let i = 0;
            for (; i < ii; ++i) {
                if (subscribers[i] === subscriber) {
                    return true;
                }
            }
        }
        return false;
    }
    any() {
        return this.sf !== 0 /* None */;
    }
    remove(subscriber) {
        const subscriberFlags = this.sf;
        if ((subscriberFlags & 1 /* Subscriber0 */) > 0 && this.s0 === subscriber) {
            this.s0 = void 0;
            this.sf = (this.sf | 1 /* Subscriber0 */) ^ 1 /* Subscriber0 */;
            --this.count;
            return true;
        }
        else if ((subscriberFlags & 2 /* Subscriber1 */) > 0 && this.s1 === subscriber) {
            this.s1 = void 0;
            this.sf = (this.sf | 2 /* Subscriber1 */) ^ 2 /* Subscriber1 */;
            --this.count;
            return true;
        }
        else if ((subscriberFlags & 4 /* Subscriber2 */) > 0 && this.s2 === subscriber) {
            this.s2 = void 0;
            this.sf = (this.sf | 4 /* Subscriber2 */) ^ 4 /* Subscriber2 */;
            --this.count;
            return true;
        }
        else if ((subscriberFlags & 8 /* SubscribersRest */) > 0) {
            const subscribers = this.sr; // Non-null is implied by (subscriberFlags & SF.SubscribersRest) > 0
            const ii = subscribers.length;
            let i = 0;
            for (; i < ii; ++i) {
                if (subscribers[i] === subscriber) {
                    subscribers.splice(i, 1);
                    if (ii === 1) {
                        this.sf = (this.sf | 8 /* SubscribersRest */) ^ 8 /* SubscribersRest */;
                    }
                    --this.count;
                    return true;
                }
            }
        }
        return false;
    }
    notify(val, oldVal, flags) {
        /**
         * Note: change handlers may have the side-effect of adding/removing subscribers to this collection during this
         * callSubscribers invocation, so we're caching them all before invoking any.
         * Subscribers added during this invocation are not invoked (and they shouldn't be).
         * Subscribers removed during this invocation will still be invoked (and they also shouldn't be,
         * however this is accounted for via $isBound and similar flags on the subscriber objects)
         */
        const sub0 = this.s0;
        const sub1 = this.s1;
        const sub2 = this.s2;
        let subs = this.sr;
        if (subs !== void 0) {
            subs = subs.slice();
        }
        if (sub0 !== void 0) {
            sub0.handleChange(val, oldVal, flags);
        }
        if (sub1 !== void 0) {
            sub1.handleChange(val, oldVal, flags);
        }
        if (sub2 !== void 0) {
            sub2.handleChange(val, oldVal, flags);
        }
        if (subs !== void 0) {
            const ii = subs.length;
            let sub;
            let i = 0;
            for (; i < ii; ++i) {
                sub = subs[i];
                if (sub !== void 0) {
                    sub.handleChange(val, oldVal, flags);
                }
            }
        }
    }
    notifyCollection(indexMap, flags) {
        const sub0 = this.s0;
        const sub1 = this.s1;
        const sub2 = this.s2;
        let subs = this.sr;
        if (subs !== void 0) {
            subs = subs.slice();
        }
        if (sub0 !== void 0) {
            sub0.handleCollectionChange(indexMap, flags);
        }
        if (sub1 !== void 0) {
            sub1.handleCollectionChange(indexMap, flags);
        }
        if (sub2 !== void 0) {
            sub2.handleCollectionChange(indexMap, flags);
        }
        if (subs !== void 0) {
            const ii = subs.length;
            let sub;
            let i = 0;
            for (; i < ii; ++i) {
                sub = subs[i];
                if (sub !== void 0) {
                    sub.handleCollectionChange(indexMap, flags);
                }
            }
        }
    }
}
exports.SubscriberRecord = SubscriberRecord;
function getSubscriberRecord() {
    return (0, utilities_objects_1.defineHiddenProp)(this, 'subs', new SubscriberRecord());
}
function addSubscriber(subscriber) {
    return this.subs.add(subscriber);
}
function removeSubscriber(subscriber) {
    return this.subs.remove(subscriber);
}
//# sourceMappingURL=subscriber-collection.js.map
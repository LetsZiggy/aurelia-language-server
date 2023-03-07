"use strict";
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
Object.defineProperty(exports, "__esModule", { value: true });
exports.MyLodash = void 0;
class MyLodash {
    /** https://stackoverflow.com/questions/35228052/debounce-function-implemented-with-promises */
    static debouncePromise(inner, ms = 0) {
        let timer = null;
        let resolves = [];
        return function (...args) {
            // Run the function after a certain amount of time
            clearTimeout(timer);
            timer = setTimeout(() => {
                // Get the result of the inner function, then apply it to the resolve function of
                // each promise that has been created since the last time the inner function was run
                const result = inner(...args);
                // eslint-disable-next-line @typescript-eslint/no-unsafe-return
                resolves.forEach((r) => r(result));
                resolves = [];
            }, ms);
            return new Promise((r) => resolves.push(r));
        };
    }
    /** https://gist.github.com/nmsdvid/8807205#gistcomment-3939848 */
    static debounce(func, delay = 200) {
        let timeout;
        return function (...args) {
            clearTimeout(timeout);
            timeout = setTimeout(() => func(...args), delay);
        };
    }
}
exports.MyLodash = MyLodash;
//# sourceMappingURL=MyLodash.js.map
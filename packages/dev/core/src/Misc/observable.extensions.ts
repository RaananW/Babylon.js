/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import observable.extensions.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./observable.extensions.pure";

import { Observable } from "./observable";


Observable.prototype.notifyObserversWithPromise = async function <T>(eventData: T, mask: number = -1, target?: any, currentTarget?: any, userInfo?: any): Promise<T> {
    // create an empty promise
    let p: Promise<any> = Promise.resolve(eventData);

    // no observers? return this promise.
    if (!this.observers.length) {
        return await p;
    }

    const state = this._eventState;
    state.mask = mask;
    state.target = target;
    state.currentTarget = currentTarget;
    state.skipNextObservers = false;
    state.userInfo = userInfo;

    // execute one callback after another (not using Promise.all, the order is important)
    for (const obs of this.observers) {
        if (state.skipNextObservers) {
            continue;
        }
        if (obs._willBeUnregistered) {
            continue;
        }
        if (obs.mask & mask) {
            if (obs.scope) {
                // eslint-disable-next-line github/no-then
                p = p.then((lastReturnedValue) => {
                    state.lastReturnValue = lastReturnedValue;
                    return obs.callback.apply(obs.scope, [eventData, state]);
                });
            } else {
                // eslint-disable-next-line github/no-then
                p = p.then((lastReturnedValue) => {
                    state.lastReturnValue = lastReturnedValue;
                    return obs.callback(eventData, state);
                });
            }
            if (obs.unregisterOnNextCall) {
                this._deferUnregister(obs);
            }
        }
    }

    // return the eventData
    await p;
    return eventData;
};

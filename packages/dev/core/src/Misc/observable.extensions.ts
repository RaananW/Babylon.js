/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import observable.extensions.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./observable.extensions.pure";

import { Observable } from "./observable";

declare module "./observable" {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    export interface Observable<T> {
        /**
         * Calling this will execute each callback, expecting it to be a promise or return a value.
         * If at any point in the chain one function fails, the promise will fail and the execution will not continue.
         * This is useful when a chain of events (sometimes async events) is needed to initialize a certain object
         * and it is crucial that all callbacks will be executed.
         * The order of the callbacks is kept, callbacks are not executed parallel.
         *
         * @param eventData The data to be sent to each callback
         * @param mask is used to filter observers defaults to -1
         * @param target defines the callback target (see EventState)
         * @param currentTarget defines he current object in the bubbling phase
         * @param userInfo defines any user info to send to observers
         * @returns {Promise<T>} will return a Promise than resolves when all callbacks executed successfully.
         */
        notifyObserversWithPromise(eventData: T, mask?: number, target?: any, currentTarget?: any, userInfo?: any): Promise<T>;
    }
}

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

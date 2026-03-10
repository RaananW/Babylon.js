/** This file must only contain pure code and pure imports */

import type { Nullable } from "../types";
import type { Observer, EventState } from "./observable";
import { Observable } from "./observable";

/**
 * Represent a list of observers registered to multiple Observables object.
 */
export class MultiObserver<T> {
    private _observers: Nullable<Observer<T>[]>;
    private _observables: Nullable<Observable<T>[]>;

    /**
     * Release associated resources
     */
    public dispose(): void {
        if (this._observers && this._observables) {
            for (let index = 0; index < this._observers.length; index++) {
                this._observables[index].remove(this._observers[index]);
            }
        }

        this._observers = null;
        this._observables = null;
    }

    /**
     * Raise a callback when one of the observable will notify
     * @param observables defines a list of observables to watch
     * @param callback defines the callback to call on notification
     * @param mask defines the mask used to filter notifications
     * @param scope defines the current scope used to restore the JS context
     * @returns the new MultiObserver
     */
    public static Watch<T>(observables: Observable<T>[], callback: (eventData: T, eventState: EventState) => void, mask: number = -1, scope: any = null): MultiObserver<T> {
        const result = new MultiObserver<T>();

        result._observers = new Array<Observer<T>>();
        result._observables = observables;

        for (const observable of observables) {
            const observer = observable.add(callback, mask, false, scope);
            if (observer) {
                result._observers.push(observer);
            }
        }

        return result;
    }
}

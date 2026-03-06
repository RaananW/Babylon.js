/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import observableCoroutine.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./observableCoroutine.pure";

import { Observable } from "./observable";
import { runCoroutineAsync } from "./coroutine";
import type { AsyncCoroutine } from "./coroutine";


// eslint-disable-next-line @typescript-eslint/promise-function-async
Observable.prototype.runCoroutineAsync = function (coroutine: AsyncCoroutine<void>) {
    if (!this._coroutineScheduler) {
        const schedulerAndDispose = CreateObservableScheduler<void>(this);
        this._coroutineScheduler = schedulerAndDispose.scheduler;
        this._coroutineSchedulerDispose = schedulerAndDispose.dispose;
    }

    return runCoroutineAsync(coroutine, this._coroutineScheduler);
};


Observable.prototype.cancelAllCoroutines = function () {
    if (this._coroutineSchedulerDispose) {
        this._coroutineSchedulerDispose();
    }
    this._coroutineScheduler = undefined;
    this._coroutineSchedulerDispose = undefined;
};

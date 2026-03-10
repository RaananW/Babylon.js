import { AsyncLock, AsyncLockLockAsync } from "./asyncLock.pure";

declare module "./asyncLock.pure" {
    namespace AsyncLock {
        export { AsyncLockLockAsync as LockAsync };
    }
}

AsyncLock.LockAsync = AsyncLockLockAsync;

export * from "./asyncLock.pure";

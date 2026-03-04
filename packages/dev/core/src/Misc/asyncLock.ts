import { AsyncLock, AsyncLockLockAsync } from "./asyncLock.pure";

declare module "./asyncLock.pure" {
    // eslint-disable-next-line @typescript-eslint/no-namespace
    namespace AsyncLock {
        export { AsyncLockLockAsync as LockAsync };
    }
}

AsyncLock.LockAsync = AsyncLockLockAsync;

export * from "./asyncLock.pure";

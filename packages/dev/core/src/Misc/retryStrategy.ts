import { RetryStrategy, RetryStrategyExponentialBackoff } from "./retryStrategy.pure";

declare module "./retryStrategy.pure" {
    // eslint-disable-next-line @typescript-eslint/no-namespace
    namespace RetryStrategy {
        export { RetryStrategyExponentialBackoff as ExponentialBackoff };
    }
}

RetryStrategy.ExponentialBackoff = RetryStrategyExponentialBackoff;

export * from "./retryStrategy.pure";

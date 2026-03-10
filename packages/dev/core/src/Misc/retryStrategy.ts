import { RetryStrategy, RetryStrategyExponentialBackoff } from "./retryStrategy.pure";

declare module "./retryStrategy.pure" {
    namespace RetryStrategy {
        export { RetryStrategyExponentialBackoff as ExponentialBackoff };
    }
}

RetryStrategy.ExponentialBackoff = RetryStrategyExponentialBackoff;

export * from "./retryStrategy.pure";

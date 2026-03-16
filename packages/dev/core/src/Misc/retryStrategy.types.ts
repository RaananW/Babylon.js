export {};

declare module "./retryStrategy.pure" {
    namespace RetryStrategy {
        export { RetryStrategyExponentialBackoff as ExponentialBackoff };
    }
}

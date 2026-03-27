import { describe, it, expect, beforeEach, vi } from "vitest";
import { AsyncLock } from "core/Misc/asyncLock";
import { ShaderStore } from "core/Engines/shaderStore";

describe("ShaderStore", () => {
    describe("LoadPendingIncludesAsync", () => {
        beforeEach(() => {
            // Reset state between tests
            ShaderStore._PendingIncludesLoaders.length = 0;
            // Reset the AsyncLock so no test can leak a pending lock into the next
            (ShaderStore as any)._LoadLock = new AsyncLock();
        });

        it("resolves immediately when no loaders are pending", async () => {
            await ShaderStore.LoadPendingIncludesAsync();
            // Should not throw, should resolve instantly
            expect(ShaderStore._PendingIncludesLoaders).toHaveLength(0);
        });

        it("calls all pending loaders and clears the list", async () => {
            const loader1 = vi.fn().mockResolvedValue(undefined);
            const loader2 = vi.fn().mockResolvedValue(undefined);
            ShaderStore._PendingIncludesLoaders.push(loader1, loader2);

            await ShaderStore.LoadPendingIncludesAsync();

            expect(loader1).toHaveBeenCalledOnce();
            expect(loader2).toHaveBeenCalledOnce();
            expect(ShaderStore._PendingIncludesLoaders).toHaveLength(0);
        });

        it("handles nested loaders added during loading", async () => {
            const nestedLoader = vi.fn().mockResolvedValue(undefined);
            const outerLoader = vi.fn().mockImplementation(async () => {
                // Simulates an include file that pushes its own nested loaders when imported
                ShaderStore._PendingIncludesLoaders.push(nestedLoader);
            });
            ShaderStore._PendingIncludesLoaders.push(outerLoader);

            await ShaderStore.LoadPendingIncludesAsync();

            expect(outerLoader).toHaveBeenCalledOnce();
            expect(nestedLoader).toHaveBeenCalledOnce();
            expect(ShaderStore._PendingIncludesLoaders).toHaveLength(0);
        });

        it("concurrent callers serialize via lock — loader is called exactly once", async () => {
            let resolveLoader: () => void;
            const loaderPromise = new Promise<void>((r) => (resolveLoader = r));
            const loader = vi.fn().mockReturnValue(loaderPromise);
            ShaderStore._PendingIncludesLoaders.push(loader);

            // Start two concurrent callers
            const p1 = ShaderStore.LoadPendingIncludesAsync();
            const p2 = ShaderStore.LoadPendingIncludesAsync();

            resolveLoader!();
            await Promise.all([p1, p2]);

            // Loader should be called exactly once: the second caller finds the queue empty
            expect(loader).toHaveBeenCalledOnce();
            expect(ShaderStore._PendingIncludesLoaders).toHaveLength(0);
        });

        it("lock is released after successful completion", async () => {
            const loader = vi.fn().mockResolvedValue(undefined);
            ShaderStore._PendingIncludesLoaders.push(loader);

            await ShaderStore.LoadPendingIncludesAsync();

            // Calling again with a new loader should work — lock must be free
            const loader2 = vi.fn().mockResolvedValue(undefined);
            ShaderStore._PendingIncludesLoaders.push(loader2);
            await ShaderStore.LoadPendingIncludesAsync();
            expect(loader2).toHaveBeenCalledOnce();
        });

        it("lock is released even if a loader rejects", async () => {
            const error = new Error("loader failed");
            const loader = vi.fn().mockRejectedValue(error);
            ShaderStore._PendingIncludesLoaders.push(loader);

            await expect(ShaderStore.LoadPendingIncludesAsync()).rejects.toThrow("loader failed");

            // Subsequent call should not hang — lock must be free
            const loader2 = vi.fn().mockResolvedValue(undefined);
            ShaderStore._PendingIncludesLoaders.push(loader2);
            await ShaderStore.LoadPendingIncludesAsync();
            expect(loader2).toHaveBeenCalledOnce();
        });

        it("second caller picks up loaders added after first batch finishes", async () => {
            let resolveFirst: () => void;
            const firstPromise = new Promise<void>((r) => (resolveFirst = r));
            const firstLoader = vi.fn().mockReturnValue(firstPromise);
            const lateLoader = vi.fn().mockResolvedValue(undefined);

            ShaderStore._PendingIncludesLoaders.push(firstLoader);

            const p1 = ShaderStore.LoadPendingIncludesAsync();

            // While first is in-flight, add another loader and start a second caller
            ShaderStore._PendingIncludesLoaders.push(lateLoader);
            const p2 = ShaderStore.LoadPendingIncludesAsync();

            resolveFirst!();
            await Promise.all([p1, p2]);

            expect(firstLoader).toHaveBeenCalledOnce();
            expect(lateLoader).toHaveBeenCalledOnce();
            expect(ShaderStore._PendingIncludesLoaders).toHaveLength(0);
        });
    });
});

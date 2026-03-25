import { describe, it, expect, beforeEach, vi } from "vitest";
import { ShaderStore } from "core/Engines/shaderStore";

describe("ShaderStore", () => {
    describe("LoadPendingIncludesAsync", () => {
        beforeEach(() => {
            // Reset state between tests
            ShaderStore._PendingIncludesLoaders.length = 0;
            // Force clear any in-flight promise by accessing private field
            (ShaderStore as any)._CurrentLoadingPromise = null;
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

        it("concurrent callers share the same loading promise", async () => {
            let resolveLoader: () => void;
            const loaderPromise = new Promise<void>((r) => (resolveLoader = r));
            const loader = vi.fn().mockReturnValue(loaderPromise);
            ShaderStore._PendingIncludesLoaders.push(loader);

            // Start two concurrent calls
            const p1 = ShaderStore.LoadPendingIncludesAsync();
            const p2 = ShaderStore.LoadPendingIncludesAsync();

            // Loader should only be called once despite two callers
            expect(loader).toHaveBeenCalledOnce();

            resolveLoader!();
            await Promise.all([p1, p2]);

            expect(ShaderStore._PendingIncludesLoaders).toHaveLength(0);
        });

        it("clears in-flight promise after completion", async () => {
            const loader = vi.fn().mockResolvedValue(undefined);
            ShaderStore._PendingIncludesLoaders.push(loader);

            await ShaderStore.LoadPendingIncludesAsync();

            expect((ShaderStore as any)._CurrentLoadingPromise).toBeNull();
        });

        it("clears in-flight promise even if a loader rejects", async () => {
            const error = new Error("loader failed");
            const loader = vi.fn().mockRejectedValue(error);
            ShaderStore._PendingIncludesLoaders.push(loader);

            await expect(ShaderStore.LoadPendingIncludesAsync()).rejects.toThrow("loader failed");
            expect((ShaderStore as any)._CurrentLoadingPromise).toBeNull();
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

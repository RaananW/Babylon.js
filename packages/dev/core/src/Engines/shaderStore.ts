import { ShaderLanguage } from "../Materials/shaderLanguage";
import { AsyncLock } from "../Misc/asyncLock";

/**
 * Defines the shader related stores and directory
 */
export class ShaderStore {
    /**
     * Gets or sets the relative url used to load shaders if using the engine in non-minified mode
     */
    public static ShadersRepository = "src/Shaders/";
    /**
     * Store of each shader (The can be looked up using effect.key)
     */
    public static ShadersStore: { [key: string]: string } = {};
    /**
     * Store of each included file for a shader (The can be looked up using effect.key)
     */
    public static IncludesShadersStore: { [key: string]: string } = {};

    /**
     * Gets or sets the relative url used to load shaders (WGSL) if using the engine in non-minified mode
     */
    public static ShadersRepositoryWGSL = "src/ShadersWGSL/";
    /**
     * Store of each shader  (WGSL)
     */
    public static ShadersStoreWGSL: { [key: string]: string } = {};
    /**
     * Store of each included file for a shader (WGSL)
     */
    public static IncludesShadersStoreWGSL: { [key: string]: string } = {};

    /**
     * Gets the shaders repository path for a given shader language
     * @param shaderLanguage the shader language
     * @returns the path to the shaders repository
     */
    public static GetShadersRepository(shaderLanguage = ShaderLanguage.GLSL): string {
        return shaderLanguage === ShaderLanguage.GLSL ? ShaderStore.ShadersRepository : ShaderStore.ShadersRepositoryWGSL;
    }

    /**
     * Gets the shaders store of a given shader language
     * @param shaderLanguage the shader language
     * @returns the shaders store
     */
    public static GetShadersStore(shaderLanguage = ShaderLanguage.GLSL): { [key: string]: string } {
        return shaderLanguage === ShaderLanguage.GLSL ? ShaderStore.ShadersStore : ShaderStore.ShadersStoreWGSL;
    }

    /**
     * Gets the include shaders store of a given shader language
     * @param shaderLanguage the shader language
     * @returns the include shaders store
     */
    public static GetIncludesShadersStore(shaderLanguage = ShaderLanguage.GLSL): { [key: string]: string } {
        return shaderLanguage === ShaderLanguage.GLSL ? ShaderStore.IncludesShadersStore : ShaderStore.IncludesShadersStoreWGSL;
    }

    /**
     * @internal
     * Map of shader name to a function that eagerly loads all of its include dependencies in parallel.
     * Populated at module load time by generated shader .ts files.
     * Consumed by LoadPendingIncludesAsync().
     */
    static _PendingIncludesLoaders: Array<() => Promise<unknown>> = [];

    /**
     * @internal
     * Lock used to serialize concurrent calls to LoadPendingIncludesAsync so that
     * multiple callers don't duplicate include-loading work.
     */
    private static _LoadLock = new AsyncLock();

    /**
     * Call after importing shader modules to eagerly load all their include dependencies.
     * Each generated shader module registers a batch-loader at import time.
     * This method fires them all in parallel and clears the pending list.
     * It loops to also load nested include dependencies (include files that themselves
     * reference further includes push their own loaders when imported).
     * Concurrent callers are serialized via AsyncLock to avoid duplicate work.
     * @internal
     */
    static async LoadPendingIncludesAsync(): Promise<void> {
        // Fast path: nothing pending
        if (ShaderStore._PendingIncludesLoaders.length === 0) {
            return;
        }
        await ShaderStore._LoadLock.lockAsync(async () => {
            while (ShaderStore._PendingIncludesLoaders.length > 0) {
                const loaders = ShaderStore._PendingIncludesLoaders.splice(0);
                // eslint-disable-next-line no-await-in-loop
                await Promise.all(loaders.map((fn) => fn()));
            }
        });
    }
}

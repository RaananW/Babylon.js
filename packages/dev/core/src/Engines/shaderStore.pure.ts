import { ShaderLanguage } from "../Materials/shaderLanguage";

/**
 * Defines the shader related stores and directory
 */

export * from "./shaderStore.types";
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
}

/**
 * Gets the shaders repository path for a given shader language
 * @param shaderLanguage the shader language
 * @returns the path to the shaders repository
 */
export function ShaderStoreGetShadersRepository(shaderLanguage = ShaderLanguage.GLSL): string {
    return shaderLanguage === ShaderLanguage.GLSL ? ShaderStore.ShadersRepository : ShaderStore.ShadersRepositoryWGSL;
}

/**
 * Gets the shaders store of a given shader language
 * @param shaderLanguage the shader language
 * @returns the shaders store
 */
export function ShaderStoreGetShadersStore(shaderLanguage = ShaderLanguage.GLSL): { [key: string]: string } {
    return shaderLanguage === ShaderLanguage.GLSL ? ShaderStore.ShadersStore : ShaderStore.ShadersStoreWGSL;
}

/**
 * Gets the include shaders store of a given shader language
 * @param shaderLanguage the shader language
 * @returns the include shaders store
 */
export function ShaderStoreGetIncludesShadersStore(shaderLanguage = ShaderLanguage.GLSL): { [key: string]: string } {
    return shaderLanguage === ShaderLanguage.GLSL ? ShaderStore.IncludesShadersStore : ShaderStore.IncludesShadersStoreWGSL;
}

let _registered = false;

/**
 * Register side effects for shaderStore.
 * Safe to call multiple times; only the first call has an effect.
 */
export function registerShaderStore(): void {
    if (_registered) {
        return;
    }
    _registered = true;

    ShaderStore.GetShadersRepository = ShaderStoreGetShadersRepository;
    ShaderStore.GetShadersStore = ShaderStoreGetShadersStore;
    ShaderStore.GetIncludesShadersStore = ShaderStoreGetIncludesShadersStore;
}

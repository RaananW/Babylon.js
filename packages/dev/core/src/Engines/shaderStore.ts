import { ShaderStore, ShaderStoreGetShadersRepository, ShaderStoreGetShadersStore, ShaderStoreGetIncludesShadersStore } from "./shaderStore.pure";

declare module "./shaderStore.pure" {
    namespace ShaderStore {
        export let GetShadersRepository: typeof ShaderStoreGetShadersRepository;
        export let GetShadersStore: typeof ShaderStoreGetShadersStore;
        export let GetIncludesShadersStore: typeof ShaderStoreGetIncludesShadersStore;
    }
}
ShaderStore.GetShadersRepository = ShaderStoreGetShadersRepository;
ShaderStore.GetShadersStore = ShaderStoreGetShadersStore;
ShaderStore.GetIncludesShadersStore = ShaderStoreGetIncludesShadersStore;

export * from "./shaderStore.pure";

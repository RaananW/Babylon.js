export {};

declare module "./shaderStore.pure" {
    namespace ShaderStore {
        export let GetShadersRepository: typeof ShaderStoreGetShadersRepository;
        export let GetShadersStore: typeof ShaderStoreGetShadersStore;
        export let GetIncludesShadersStore: typeof ShaderStoreGetIncludesShadersStore;
    }
}

export {};

declare module "./rawTexture.pure" {
    namespace RawTexture {
        export let CreateLuminanceTexture: typeof RawTextureCreateLuminanceTexture;
        export let CreateLuminanceAlphaTexture: typeof RawTextureCreateLuminanceAlphaTexture;
        export let CreateAlphaTexture: typeof RawTextureCreateAlphaTexture;
        export let CreateRGBTexture: typeof RawTextureCreateRGBTexture;
        export let CreateRGBATexture: typeof RawTextureCreateRGBATexture;
        export let CreateRGBAStorageTexture: typeof RawTextureCreateRGBAStorageTexture;
        export let CreateRTexture: typeof RawTextureCreateRTexture;
        export let CreateRStorageTexture: typeof RawTextureCreateRStorageTexture;
    }
}

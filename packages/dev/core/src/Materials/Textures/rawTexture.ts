export * from "./rawTexture.pure";
import {
    RawTexture,
    RawTextureCreateLuminanceTexture,
    RawTextureCreateLuminanceAlphaTexture,
    RawTextureCreateAlphaTexture,
    RawTextureCreateRGBTexture,
    RawTextureCreateRGBATexture,
    RawTextureCreateRGBAStorageTexture,
    RawTextureCreateRTexture,
    RawTextureCreateRStorageTexture,
} from "./rawTexture.pure";

declare module "./rawTexture.pure" {
    // eslint-disable-next-line no-shadow
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

RawTexture.CreateLuminanceTexture = RawTextureCreateLuminanceTexture;
RawTexture.CreateLuminanceAlphaTexture = RawTextureCreateLuminanceAlphaTexture;
RawTexture.CreateAlphaTexture = RawTextureCreateAlphaTexture;
RawTexture.CreateRGBTexture = RawTextureCreateRGBTexture;
RawTexture.CreateRGBATexture = RawTextureCreateRGBATexture;
RawTexture.CreateRGBAStorageTexture = RawTextureCreateRGBAStorageTexture;
RawTexture.CreateRTexture = RawTextureCreateRTexture;
RawTexture.CreateRStorageTexture = RawTextureCreateRStorageTexture;

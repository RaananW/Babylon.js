import { KhronosTextureContainer2, KhronosTextureContainer2IsValid } from "./khronosTextureContainer2.pure";

declare module "./khronosTextureContainer2.pure" {
    // eslint-disable-next-line @typescript-eslint/no-namespace
    namespace KhronosTextureContainer2 {
        export { KhronosTextureContainer2IsValid as IsValid };
    }
}

KhronosTextureContainer2.IsValid = KhronosTextureContainer2IsValid;

export * from "./khronosTextureContainer2.pure";

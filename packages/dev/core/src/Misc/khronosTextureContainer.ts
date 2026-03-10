import { KhronosTextureContainer, KhronosTextureContainerIsValid } from "./khronosTextureContainer.pure";

declare module "./khronosTextureContainer.pure" {
    namespace KhronosTextureContainer {
        export { KhronosTextureContainerIsValid as IsValid };
    }
}

KhronosTextureContainer.IsValid = KhronosTextureContainerIsValid;

export * from "./khronosTextureContainer.pure";

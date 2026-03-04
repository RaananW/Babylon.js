import { KhronosTextureContainer, KhronosTextureContainerIsValid } from "./khronosTextureContainer.pure";

declare module "./khronosTextureContainer.pure" {
    // eslint-disable-next-line @typescript-eslint/no-namespace
    namespace KhronosTextureContainer {
        export { KhronosTextureContainerIsValid as IsValid };
    }
}

KhronosTextureContainer.IsValid = KhronosTextureContainerIsValid;

export * from "./khronosTextureContainer.pure";

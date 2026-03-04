import { FrameGraphTextureManager, FrameGraphTextureManagerCloneTextureOptions } from "./frameGraphTextureManager.pure";

declare module "./frameGraphTextureManager.pure" {
    // eslint-disable-next-line @typescript-eslint/no-namespace
    namespace FrameGraphTextureManager {
        export { FrameGraphTextureManagerCloneTextureOptions as CloneTextureOptions };
    }
}

FrameGraphTextureManager.CloneTextureOptions = FrameGraphTextureManagerCloneTextureOptions;

export * from "./frameGraphTextureManager.pure";

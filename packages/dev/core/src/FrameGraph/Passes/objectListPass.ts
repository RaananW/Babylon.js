import { FrameGraphObjectListPass, FrameGraphObjectListPassIsObjectListPass } from "./objectListPass.pure";

declare module "./objectListPass.pure" {
    // eslint-disable-next-line @typescript-eslint/no-namespace
    namespace FrameGraphObjectListPass {
        export { FrameGraphObjectListPassIsObjectListPass as IsObjectListPass };
    }
}

FrameGraphObjectListPass.IsObjectListPass = FrameGraphObjectListPassIsObjectListPass;

export * from "./objectListPass.pure";

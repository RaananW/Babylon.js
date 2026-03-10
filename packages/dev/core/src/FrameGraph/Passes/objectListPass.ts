import { FrameGraphObjectListPass, FrameGraphObjectListPassIsObjectListPass } from "./objectListPass.pure";

declare module "./objectListPass.pure" {
    namespace FrameGraphObjectListPass {
        export { FrameGraphObjectListPassIsObjectListPass as IsObjectListPass };
    }
}

FrameGraphObjectListPass.IsObjectListPass = FrameGraphObjectListPassIsObjectListPass;

export * from "./objectListPass.pure";

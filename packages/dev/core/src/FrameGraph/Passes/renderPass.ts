import { FrameGraphRenderPass, FrameGraphRenderPassIsRenderPass } from "./renderPass.pure";

declare module "./renderPass.pure" {
    namespace FrameGraphRenderPass {
        export { FrameGraphRenderPassIsRenderPass as IsRenderPass };
    }
}

FrameGraphRenderPass.IsRenderPass = FrameGraphRenderPassIsRenderPass;

export * from "./renderPass.pure";

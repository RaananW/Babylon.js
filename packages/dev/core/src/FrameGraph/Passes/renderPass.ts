import { FrameGraphRenderPass, FrameGraphRenderPassIsRenderPass } from "./renderPass.pure";

declare module "./renderPass.pure" {
    // eslint-disable-next-line @typescript-eslint/no-namespace
    namespace FrameGraphRenderPass {
        export { FrameGraphRenderPassIsRenderPass as IsRenderPass };
    }
}

FrameGraphRenderPass.IsRenderPass = FrameGraphRenderPassIsRenderPass;

export * from "./renderPass.pure";

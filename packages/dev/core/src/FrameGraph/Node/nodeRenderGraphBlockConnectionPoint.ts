import { NodeRenderGraphConnectionPoint, NodeRenderGraphConnectionPointIsTextureHandle, NodeRenderGraphConnectionPointIsShadowGenerator, NodeRenderGraphConnectionPointIsShadowLight } from "./nodeRenderGraphBlockConnectionPoint.pure";

declare module "./nodeRenderGraphBlockConnectionPoint.pure" {
    // eslint-disable-next-line @typescript-eslint/no-namespace
    namespace NodeRenderGraphConnectionPoint {
        export { NodeRenderGraphConnectionPointIsTextureHandle as IsTextureHandle };
        export { NodeRenderGraphConnectionPointIsShadowGenerator as IsShadowGenerator };
        export { NodeRenderGraphConnectionPointIsShadowLight as IsShadowLight };
    }
}

NodeRenderGraphConnectionPoint.IsTextureHandle = NodeRenderGraphConnectionPointIsTextureHandle;
NodeRenderGraphConnectionPoint.IsShadowGenerator = NodeRenderGraphConnectionPointIsShadowGenerator;
NodeRenderGraphConnectionPoint.IsShadowLight = NodeRenderGraphConnectionPointIsShadowLight;

export * from "./nodeRenderGraphBlockConnectionPoint.pure";

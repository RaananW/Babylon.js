export * from "./buffer.pure";
import { VertexBuffer, VertexBufferDeduceStride, VertexBufferGetDataType, VertexBufferGetTypeByteLength, VertexBufferForEach, VertexBufferGetFloatData } from "./buffer.pure";

declare module "./buffer.pure" {
    namespace VertexBuffer {
        export let DeduceStride: typeof VertexBufferDeduceStride;
        export let GetDataType: typeof VertexBufferGetDataType;
        export let GetTypeByteLength: typeof VertexBufferGetTypeByteLength;
        export let ForEach: typeof VertexBufferForEach;
        export let GetFloatData: typeof VertexBufferGetFloatData;
    }
}

VertexBuffer.DeduceStride = VertexBufferDeduceStride;
VertexBuffer.GetDataType = VertexBufferGetDataType;
VertexBuffer.GetTypeByteLength = VertexBufferGetTypeByteLength;
VertexBuffer.ForEach = VertexBufferForEach;
VertexBuffer.GetFloatData = VertexBufferGetFloatData;

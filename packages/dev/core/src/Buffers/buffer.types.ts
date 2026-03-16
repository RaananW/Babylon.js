export {};

declare module "./buffer.pure" {
    namespace VertexBuffer {
        export let DeduceStride: typeof VertexBufferDeduceStride;
        export let GetDataType: typeof VertexBufferGetDataType;
        export let GetTypeByteLength: typeof VertexBufferGetTypeByteLength;
        export let ForEach: typeof VertexBufferForEach;
        export let GetFloatData: typeof VertexBufferGetFloatData;
    }
}

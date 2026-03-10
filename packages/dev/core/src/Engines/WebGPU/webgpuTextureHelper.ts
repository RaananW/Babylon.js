export * from "./webgpuTextureHelper.pure";
import { WebGPUTextureHelper } from "./webgpuTextureHelper.pure";
import {
    WebGPUTextureHelperComputeNumMipmapLevels,
    WebGPUTextureHelperGetTextureTypeFromFormat,
    WebGPUTextureHelperGetBlockInformationFromFormat,
    WebGPUTextureHelperIsHardwareTexture,
    WebGPUTextureHelperIsInternalTexture,
    WebGPUTextureHelperIsImageBitmap,
    WebGPUTextureHelperIsImageBitmapArray,
    WebGPUTextureHelperIsCompressedFormat,
    WebGPUTextureHelperGetWebGPUTextureFormat,
    WebGPUTextureHelperGetNumChannelsFromWebGPUTextureFormat,
    WebGPUTextureHelperHasStencilAspect,
    WebGPUTextureHelperHasDepthAspect,
    WebGPUTextureHelperHasDepthAndStencilAspects,
    WebGPUTextureHelperGetDepthFormatOnly,
    WebGPUTextureHelperGetSample,
} from "./webgpuTextureHelper.pure";

declare module "./webgpuTextureHelper.pure" {
    namespace WebGPUTextureHelper {
        export let ComputeNumMipmapLevels: typeof WebGPUTextureHelperComputeNumMipmapLevels;
        export let GetTextureTypeFromFormat: typeof WebGPUTextureHelperGetTextureTypeFromFormat;
        export let GetBlockInformationFromFormat: typeof WebGPUTextureHelperGetBlockInformationFromFormat;
        export let IsHardwareTexture: typeof WebGPUTextureHelperIsHardwareTexture;
        export let IsInternalTexture: typeof WebGPUTextureHelperIsInternalTexture;
        export let IsImageBitmap: typeof WebGPUTextureHelperIsImageBitmap;
        export let IsImageBitmapArray: typeof WebGPUTextureHelperIsImageBitmapArray;
        export let IsCompressedFormat: typeof WebGPUTextureHelperIsCompressedFormat;
        export let GetWebGPUTextureFormat: typeof WebGPUTextureHelperGetWebGPUTextureFormat;
        export let GetNumChannelsFromWebGPUTextureFormat: typeof WebGPUTextureHelperGetNumChannelsFromWebGPUTextureFormat;
        export let HasStencilAspect: typeof WebGPUTextureHelperHasStencilAspect;
        export let HasDepthAspect: typeof WebGPUTextureHelperHasDepthAspect;
        export let HasDepthAndStencilAspects: typeof WebGPUTextureHelperHasDepthAndStencilAspects;
        export let GetDepthFormatOnly: typeof WebGPUTextureHelperGetDepthFormatOnly;
        export let GetSample: typeof WebGPUTextureHelperGetSample;
    }
}

WebGPUTextureHelper.ComputeNumMipmapLevels = WebGPUTextureHelperComputeNumMipmapLevels;
WebGPUTextureHelper.GetTextureTypeFromFormat = WebGPUTextureHelperGetTextureTypeFromFormat;
WebGPUTextureHelper.GetBlockInformationFromFormat = WebGPUTextureHelperGetBlockInformationFromFormat;
WebGPUTextureHelper.IsHardwareTexture = WebGPUTextureHelperIsHardwareTexture;
WebGPUTextureHelper.IsInternalTexture = WebGPUTextureHelperIsInternalTexture;
WebGPUTextureHelper.IsImageBitmap = WebGPUTextureHelperIsImageBitmap;
WebGPUTextureHelper.IsImageBitmapArray = WebGPUTextureHelperIsImageBitmapArray;
WebGPUTextureHelper.IsCompressedFormat = WebGPUTextureHelperIsCompressedFormat;
WebGPUTextureHelper.GetWebGPUTextureFormat = WebGPUTextureHelperGetWebGPUTextureFormat;
WebGPUTextureHelper.GetNumChannelsFromWebGPUTextureFormat = WebGPUTextureHelperGetNumChannelsFromWebGPUTextureFormat;
WebGPUTextureHelper.HasStencilAspect = WebGPUTextureHelperHasStencilAspect;
WebGPUTextureHelper.HasDepthAspect = WebGPUTextureHelperHasDepthAspect;
WebGPUTextureHelper.HasDepthAndStencilAspects = WebGPUTextureHelperHasDepthAndStencilAspects;
WebGPUTextureHelper.GetDepthFormatOnly = WebGPUTextureHelperGetDepthFormatOnly;
WebGPUTextureHelper.GetSample = WebGPUTextureHelperGetSample;

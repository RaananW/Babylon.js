/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import tools.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./tools.pure";

import {
    Tools,
    ToolsBackCompatCameraNoPreventDefault,
    ToolsClearLogCache,
    ToolsCreateScreenshot,
    ToolsCreateScreenshotAsync,
    ToolsCreateScreenshotUsingRenderTarget,
    ToolsCreateScreenshotUsingRenderTargetAsync,
    ToolsDecodeBase64,
    ToolsDeepCopy,
    ToolsDelayAsync,
    ToolsDownload,
    ToolsDumpData,
    ToolsDumpDataAsync,
    ToolsDumpFramebuffer,
    ToolsError,
    ToolsFetchToRef,
    ToolsFileAsURL,
    ToolsFirst,
    ToolsFloatRound,
    ToolsFormat,
    ToolsGetClassName,
    ToolsGetFilename,
    ToolsGetFolderPath,
    ToolsGetPointerPrefix,
    ToolsInstantiate,
    ToolsIsAbsoluteUrl,
    ToolsIsBase64,
    ToolsIsEmpty,
    ToolsIsSafari,
    ToolsLoadFile,
    ToolsLoadFileAsync,
    ToolsLoadImage,
    ToolsLog,
    ToolsMakeArray,
    ToolsRandomId,
    ToolsReadFile,
    ToolsReadFileAsDataURL,
    ToolsRegisterTopRootEvents,
    ToolsSetCorsBehavior,
    ToolsSetImmediate,
    ToolsSetReferrerPolicyBehavior,
    ToolsSmoothAngleChange,
    ToolsToDegrees,
    ToolsToRadians,
    ToolsUnregisterTopRootEvents,
    ToolsWarn,
    ToolsgetFullClassName,
} from "./tools.pure";
import { EngineStore } from "../Engines/engineStore";
import { Mix, IsExponentOfTwo } from "./tools.functions";

Tools.IsAbsoluteUrl = ToolsIsAbsoluteUrl;

Tools.FetchToRef = ToolsFetchToRef;

Tools.Instantiate = ToolsInstantiate;

Tools.SetImmediate = ToolsSetImmediate;

Tools.FloatRound = ToolsFloatRound;

Tools.GetFilename = ToolsGetFilename;

Tools.GetFolderPath = ToolsGetFolderPath;

Tools.ToDegrees = ToolsToDegrees;

Tools.ToRadians = ToolsToRadians;

Tools.SmoothAngleChange = ToolsSmoothAngleChange;

Tools.MakeArray = ToolsMakeArray;

Tools.GetPointerPrefix = ToolsGetPointerPrefix;

Tools.SetCorsBehavior = ToolsSetCorsBehavior;

Tools.SetReferrerPolicyBehavior = ToolsSetReferrerPolicyBehavior;

Tools.LoadImage = ToolsLoadImage;

Tools.LoadFile = ToolsLoadFile;

Tools.LoadFileAsync = ToolsLoadFileAsync;

Tools.ReadFileAsDataURL = ToolsReadFileAsDataURL;

Tools.ReadFile = ToolsReadFile;

Tools.FileAsURL = ToolsFileAsURL;

Tools.Format = ToolsFormat;

Tools.DeepCopy = ToolsDeepCopy;

Tools.IsEmpty = ToolsIsEmpty;

Tools.RegisterTopRootEvents = ToolsRegisterTopRootEvents;

Tools.UnregisterTopRootEvents = ToolsUnregisterTopRootEvents;

Tools.DumpData = ToolsDumpData;

Tools.DumpFramebuffer = ToolsDumpFramebuffer;

Tools.DumpDataAsync = ToolsDumpDataAsync;

Tools.Download = ToolsDownload;

Tools.BackCompatCameraNoPreventDefault = ToolsBackCompatCameraNoPreventDefault;

Tools.CreateScreenshot = ToolsCreateScreenshot;

Tools.CreateScreenshotAsync = ToolsCreateScreenshotAsync;

Tools.CreateScreenshotUsingRenderTarget = ToolsCreateScreenshotUsingRenderTarget;

Tools.CreateScreenshotUsingRenderTargetAsync = ToolsCreateScreenshotUsingRenderTargetAsync;

Tools.RandomId = ToolsRandomId;

Tools.IsBase64 = ToolsIsBase64;

Tools.DecodeBase64 = ToolsDecodeBase64;

Tools.Log = ToolsLog;

Tools.Warn = ToolsWarn;

Tools.Error = ToolsError;

Tools.ClearLogCache = ToolsClearLogCache;

Tools.GetClassName = ToolsGetClassName;

Tools.First = ToolsFirst;

Tools.getFullClassName = ToolsgetFullClassName;

Tools.DelayAsync = ToolsDelayAsync;

Tools.IsSafari = ToolsIsSafari;

Tools.Mix = Mix;

Tools.IsExponentOfTwo = IsExponentOfTwo;

// Will only be define if Tools is imported freeing up some space when only engine is required
EngineStore.FallbackTexture =
    "data:image/jpg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD/4QBmRXhpZgAATU0AKgAAAAgABAEaAAUAAAABAAAAPgEbAAUAAAABAAAARgEoAAMAAAABAAIAAAExAAIAAAAQAAAATgAAAAAAAABgAAAAAQAAAGAAAAABcGFpbnQubmV0IDQuMC41AP/bAEMABAIDAwMCBAMDAwQEBAQFCQYFBQUFCwgIBgkNCw0NDQsMDA4QFBEODxMPDAwSGBITFRYXFxcOERkbGRYaFBYXFv/bAEMBBAQEBQUFCgYGChYPDA8WFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFv/AABEIAQABAAMBIgACEQEDEQH/xAAfAAABBQEBAQEBAQAAAAAAAAAAAQIDBAUGBwgJCgv/xAC1EAACAQMDAgQDBQUEBAAAAX0BAgMABBEFEiExQQYTUWEHInEUMoGRoQgjQrHBFVLR8CQzYnKCCQoWFxgZGiUmJygpKjQ1Njc4OTpDREVGR0hJSlNUVVZXWFlaY2RlZmdoaWpzdHV2d3h5eoOEhYaHiImKkpOUlZaXmJmaoqOkpaanqKmqsrO0tba3uLm6wsPExcbHyMnK0tPU1dbX2Nna4eLj5OXm5+jp6vHy8/T19vf4+fr/xAAfAQADAQEBAQEBAQEBAAAAAAAAAQIDBAUGBwgJCgv/xAC1EQACAQIEBAMEBwUEBAABAncAAQIDEQQFITEGEkFRB2FxEyIygQgUQpGhscEJIzNS8BVictEKFiQ04SXxFxgZGiYnKCkqNTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqCg4SFhoeIiYqSk5SVlpeYmZqio6Slpqeoqaqys7S1tre4ubrCw8TFxsfIycrS09TV1tfY2dri4+Tl5ufo6ery8/T19vf4+fr/2gAMAwEAAhEDEQA/APH6KKK+FP76Pl+iiivuj+BT6gooor4U/vo+X6KKK+6P4FPqCiiivhT++j5fooor7o/gU+oKKKK+FP76Pl+iiivuj+BT6gooor4U/vo+X6KKK+6P4FPqCiiivhT++j5fooor7o/gU+oKKKK+FP76Pl+iiivuj+BT6gooor4U/vo+X6KKK+6P4FCiiigD6gooor4U/vo+X6KKK+6P4FPqCiiivhT++j5fooor7o/gU+oKKKK+FP76Pl+iiivuj+BT6gooor4U/vo+X6KKK+6P4FPqCiiivhT++j5fooor7o/gU+oKKKK+FP76Pl+iiivuj+BT6gooor4U/vo+X6KKK+6P4FPqCiiivhT++gooooA+X6KKK+6P4FPqCiiivhT++j5fooor7o/gU+oKKKK+FP76Pl+iiivuj+BT6gooor4U/vo+X6KKK+6P4FPqCiiivhT++j5fooor7o/gU+oKKKK+FP76Pl+iiivuj+BT6gooor4U/vo+X6KKK+6P4FPqCiiivhT++j5fooor7o/gUKKKKAPqCiiivhT++j5fooor7o/gU+oKKKK+FP76Pl+iiivuj+BT6gooor4U/vo+X6KKK+6P4FPqCiiivhT++j5fooor7o/gU+oKKKK+FP76Pl+iiivuj+BT6gooor4U/vo+X6KKK+6P4FPqCiiivhT++j5fooor7o/gU+oKKKK+FP76CiiigD5fooor7o/gU+oKKKK+FP76Pl+iiivuj+BT6gooor4U/vo+X6KKK+6P4FPqCiiivhT++j5fooor7o/gU+oKKKK+FP76Pl+iiivuj+BT6gooor4U/vo+X6KKK+6P4FPqCiiivhT++j5fooor7o/gU+oKKKK+FP76Pl+iiivuj+BQooooA+oKKKK+FP76Pl+iiivuj+BT6gooor4U/vo+X6KKK+6P4FPqCiiivhT++j5fooor7o/gU+oKKKK+FP76Pl+iiivuj+BT6gooor4U/vo+X6KKK+6P4FPqCiiivhT++j5fooor7o/gU+oKKKK+FP76Pl+iiivuj+BT6gooor4U/voKKKKAPl+iiivuj+BT6gooor4U/vo+X6KKK+6P4FPqCiiivhT++j5fooor7o/gU+oKKKK+FP76Pl+iiivuj+BT6gooor4U/vo+X6KKK+6P4FPqCiiivhT++j5fooor7o/gU+oKKKK+FP76Pl+iiivuj+BT6gooor4U/vo+X6KKK+6P4FCiiigD6gooor4U/vo+X6KKK+6P4FPqCiiivhT++j5fooor7o/gU+oKKKK+FP76Pl+iiivuj+BT6gooor4U/vo+X6KKK+6P4FPqCiiivhT++j5fooor7o/gU+oKKKK+FP76Pl+iiivuj+BT6gooor4U/vo+X6KKK+6P4FPqCiiivhT++gooooA+X6KKK+6P4FPqCiiivhT++j5fooor7o/gU+oKKKK+FP76Pl+iiivuj+BT6gooor4U/vo+X6KKK+6P4FPqCiiivhT++j5fooor7o/gU+oKKKK+FP76Pl+iiivuj+BT6gooor4U/vo+X6KKK+6P4FPqCiiivhT++j5fooor7o/gUKKKKAPqCiiivhT++j5fooor7o/gU+oKKKK+FP76Pl+iiivuj+BT6gooor4U/vo+X6KKK+6P4FPqCiiivhT++j5fooor7o/gU+oKKKK+FP76Pl+iiivuj+BT6gooor4U/vo+X6KKK+6P4FPqCiiivhT++j5fooor7o/gU+oKKKK+FP76CiiigD5fooor7o/gU+oKKKK+FP76Pl+iiivuj+BT6gooor4U/vo+X6KKK+6P4FPqCiiivhT++j5fooor7o/gU+oKKKK+FP76Pl+iiivuj+BT6gooor4U/vo+X6KKK+6P4FPqCiiivhT++j5fooor7o/gU+oKKKK+FP76Pl+iiivuj+BQooooA+oKKKK+FP76Pl+iiivuj+BT6gooor4U/vo+X6KKK+6P4FPqCiiivhT++j5fooor7o/gU+oKKKK+FP76Pl+iiivuj+BT6gooor4U/vo+X6KKK+6P4FPqCiiivhT++j5fooor7o/gU+oKKKK+FP76Pl+iiivuj+BT6gooor4U/voKKKKAPl+iiivuj+BT6gooor4U/vo+X6KKK+6P4FPqCiiivhT++j5fooor7o/gU+oKKKK+FP76Pl+iiivuj+BT6gooor4U/vo+X6KKK+6P4FPqCiiivhT++j5fooor7o/gU+oKKKK+FP76Pl+iiivuj+BT6gooor4U/vo+X6KKK+6P4FCiiigD6gooor4U/vo+X6KKK+6P4FPqCiiivhT++j5fooor7o/gU+oKKKK+FP76Pl+iiivuj+BT6gooor4U/vo+X6KKK+6P4FPqCiiivhT++j5fooor7o/gU+oKKKK+FP76Pl+iiivuj+BT6gooor4U/vo+X6KKK+6P4FPqCiiivhT++gooooA+X6KKK+6P4FPqCiiivhT++j5fooor7o/gU+oKKKK+FP76Pl+iiivuj+BT6gooor4U/vo+X6KKK+6P4FPqCiiivhT++j5fooor7o/gU+oKKKK+FP76Pl+iiivuj+BT6gooor4U/vo+X6KKK+6P4FPqCiiivhT++j5fooor7o/gUKKKKAPqCiiivhT++j5fooor7o/gU+oKKKK+FP76Pl+iiivuj+BT6gooor4U/vo+X6KKK+6P4FPqCiiivhT++j5fooor7o/gU+oKKKK+FP76Pl+iiivuj+BT6gooor4U/vo+X6KKK+6P4FPqCiiivhT++j5fooor7o/gU+oKKKK+FP76P//Z";

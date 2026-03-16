export {};

declare module "./tools.pure" {
    namespace Tools {
        export let IsAbsoluteUrl: typeof ToolsIsAbsoluteUrl;
        export let FetchToRef: typeof ToolsFetchToRef;
        export let Instantiate: typeof ToolsInstantiate;
        export let SetImmediate: typeof ToolsSetImmediate;
        export let FloatRound: typeof ToolsFloatRound;
        export let GetFilename: typeof ToolsGetFilename;
        export let GetFolderPath: typeof ToolsGetFolderPath;
        export let ToDegrees: typeof ToolsToDegrees;
        export let ToRadians: typeof ToolsToRadians;
        export let SmoothAngleChange: typeof ToolsSmoothAngleChange;
        export let MakeArray: typeof ToolsMakeArray;
        export let GetPointerPrefix: typeof ToolsGetPointerPrefix;
        export let SetCorsBehavior: typeof ToolsSetCorsBehavior;
        export let SetReferrerPolicyBehavior: typeof ToolsSetReferrerPolicyBehavior;
        export let LoadImage: typeof ToolsLoadImage;
        export let LoadFile: typeof ToolsLoadFile;
        export let LoadFileAsync: typeof ToolsLoadFileAsync;
        export let ReadFileAsDataURL: typeof ToolsReadFileAsDataURL;
        export let ReadFile: typeof ToolsReadFile;
        export let FileAsURL: typeof ToolsFileAsURL;
        export let Format: typeof ToolsFormat;
        export let DeepCopy: typeof ToolsDeepCopy;
        export let IsEmpty: typeof ToolsIsEmpty;
        export let RegisterTopRootEvents: typeof ToolsRegisterTopRootEvents;
        export let UnregisterTopRootEvents: typeof ToolsUnregisterTopRootEvents;
        export let DumpData: typeof ToolsDumpData;
        export let DumpFramebuffer: typeof ToolsDumpFramebuffer;
        export let DumpDataAsync: typeof ToolsDumpDataAsync;
        export let Download: typeof ToolsDownload;
        export let BackCompatCameraNoPreventDefault: typeof ToolsBackCompatCameraNoPreventDefault;
        export let CreateScreenshot: typeof ToolsCreateScreenshot;
        export let CreateScreenshotAsync: typeof ToolsCreateScreenshotAsync;
        export let CreateScreenshotUsingRenderTarget: typeof ToolsCreateScreenshotUsingRenderTarget;
        export let CreateScreenshotUsingRenderTargetAsync: typeof ToolsCreateScreenshotUsingRenderTargetAsync;
        export let RandomId: typeof ToolsRandomId;
        export let IsBase64: typeof ToolsIsBase64;
        export let DecodeBase64: typeof ToolsDecodeBase64;
        export let Log: typeof ToolsLog;
        export let Warn: typeof ToolsWarn;
        export let Error: typeof ToolsError;
        export let ClearLogCache: typeof ToolsClearLogCache;
        export let GetClassName: typeof ToolsGetClassName;
        export let First: typeof ToolsFirst;
        export let getFullClassName: typeof ToolsgetFullClassName;
        export let DelayAsync: typeof ToolsDelayAsync;
        export let IsSafari: typeof ToolsIsSafari;
    }
}

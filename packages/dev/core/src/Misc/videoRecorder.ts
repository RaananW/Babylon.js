import { VideoRecorder, VideoRecorderIsSupported } from "./videoRecorder.pure";

declare module "./videoRecorder.pure" {
    // eslint-disable-next-line @typescript-eslint/no-namespace
    namespace VideoRecorder {
        export { VideoRecorderIsSupported as IsSupported };
    }
}

VideoRecorder.IsSupported = VideoRecorderIsSupported;

export * from "./videoRecorder.pure";

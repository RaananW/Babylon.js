import { VideoRecorder, VideoRecorderIsSupported } from "./videoRecorder.pure";

declare module "./videoRecorder.pure" {
    namespace VideoRecorder {
        export { VideoRecorderIsSupported as IsSupported };
    }
}

VideoRecorder.IsSupported = VideoRecorderIsSupported;

export * from "./videoRecorder.pure";

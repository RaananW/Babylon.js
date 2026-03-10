import { TimingTools, TimingToolsSetImmediate } from "./timingTools.pure";

declare module "./timingTools.pure" {
    namespace TimingTools {
        export { TimingToolsSetImmediate as SetImmediate };
    }
}

TimingTools.SetImmediate = TimingToolsSetImmediate;

export * from "./timingTools.pure";

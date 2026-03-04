import { TimingTools, TimingToolsSetImmediate } from "./timingTools.pure";

declare module "./timingTools.pure" {
    // eslint-disable-next-line @typescript-eslint/no-namespace
    namespace TimingTools {
        export { TimingToolsSetImmediate as SetImmediate };
    }
}

TimingTools.SetImmediate = TimingToolsSetImmediate;

export * from "./timingTools.pure";

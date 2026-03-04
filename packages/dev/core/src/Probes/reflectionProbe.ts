import { ReflectionProbe, ReflectionProbeParse } from "./reflectionProbe.pure";

declare module "./reflectionProbe.pure" {
    // eslint-disable-next-line @typescript-eslint/no-namespace
    namespace ReflectionProbe {
        export { ReflectionProbeParse as Parse };
    }
}

ReflectionProbe.Parse = ReflectionProbeParse;

export * from "./reflectionProbe.pure";

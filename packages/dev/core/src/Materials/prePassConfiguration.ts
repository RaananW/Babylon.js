import { PrePassConfiguration, PrePassConfigurationAddUniforms, PrePassConfigurationAddSamplers } from "./prePassConfiguration.pure";

declare module "./prePassConfiguration.pure" {
    // eslint-disable-next-line @typescript-eslint/no-namespace
    namespace PrePassConfiguration {
        export { PrePassConfigurationAddUniforms as AddUniforms };
        export { PrePassConfigurationAddSamplers as AddSamplers };
    }
}

PrePassConfiguration.AddUniforms = PrePassConfigurationAddUniforms;
PrePassConfiguration.AddSamplers = PrePassConfigurationAddSamplers;

export * from "./prePassConfiguration.pure";

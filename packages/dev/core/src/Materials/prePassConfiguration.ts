import { PrePassConfiguration, PrePassConfigurationAddUniforms, PrePassConfigurationAddSamplers } from "./prePassConfiguration.pure";

declare module "./prePassConfiguration.pure" {
    namespace PrePassConfiguration {
        export { PrePassConfigurationAddUniforms as AddUniforms };
        export { PrePassConfigurationAddSamplers as AddSamplers };
    }
}

PrePassConfiguration.AddUniforms = PrePassConfigurationAddUniforms;
PrePassConfiguration.AddSamplers = PrePassConfigurationAddSamplers;

export * from "./prePassConfiguration.pure";

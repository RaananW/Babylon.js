import { DDSTools, DDSToolsGetDDSInfo } from "./dds.pure";

import "../Engines/AbstractEngine/abstractEngine.cubeTexture";

declare module "./dds.pure" {
    namespace DDSTools {
        export { DDSToolsGetDDSInfo as GetDDSInfo };
    }
}

DDSTools.GetDDSInfo = DDSToolsGetDDSInfo;

export * from "./dds.pure";

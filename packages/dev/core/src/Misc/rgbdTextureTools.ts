import { RGBDTextureTools, RGBDTextureToolsExpandRGBDTexture, RGBDTextureToolsEncodeTextureToRGBD } from "./rgbdTextureTools.pure";

declare module "./rgbdTextureTools.pure" {
    namespace RGBDTextureTools {
        export { RGBDTextureToolsExpandRGBDTexture as ExpandRGBDTexture };
        export { RGBDTextureToolsEncodeTextureToRGBD as EncodeTextureToRGBD };
    }
}

RGBDTextureTools.ExpandRGBDTexture = RGBDTextureToolsExpandRGBDTexture;
RGBDTextureTools.EncodeTextureToRGBD = RGBDTextureToolsEncodeTextureToRGBD;

export * from "./rgbdTextureTools.pure";

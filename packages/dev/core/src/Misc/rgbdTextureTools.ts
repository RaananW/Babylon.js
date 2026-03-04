import { RGBDTextureTools, RGBDTextureToolsExpandRGBDTexture, RGBDTextureToolsEncodeTextureToRGBD } from "./rgbdTextureTools.pure";

declare module "./rgbdTextureTools.pure" {
    // eslint-disable-next-line @typescript-eslint/no-namespace
    namespace RGBDTextureTools {
        export { RGBDTextureToolsExpandRGBDTexture as ExpandRGBDTexture };
        export { RGBDTextureToolsEncodeTextureToRGBD as EncodeTextureToRGBD };
    }
}

RGBDTextureTools.ExpandRGBDTexture = RGBDTextureToolsExpandRGBDTexture;
RGBDTextureTools.EncodeTextureToRGBD = RGBDTextureToolsEncodeTextureToRGBD;

export * from "./rgbdTextureTools.pure";

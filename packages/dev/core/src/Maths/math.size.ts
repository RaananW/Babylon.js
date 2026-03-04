import { Size, SizeZero, SizeLerp } from "./math.size.pure";

declare module "./math.size.pure" {
    namespace Size {
        export let Zero: typeof SizeZero;
        export let Lerp: typeof SizeLerp;
    }
}
Size.Zero = SizeZero;
Size.Lerp = SizeLerp;

export * from "./math.size.pure";

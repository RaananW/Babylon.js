export {};

declare module "./ray.core" {
    namespace Ray {
        export let Zero: typeof RayZero;
        export let CreateNew: typeof RayCreateNew;
        export let CreateNewFromTo: typeof RayCreateNewFromTo;
        export let CreateFromToToRef: typeof RayCreateFromToToRef;
        export let Transform: typeof RayTransform;
        export let TransformToRef: typeof RayTransformToRef;
    }
}

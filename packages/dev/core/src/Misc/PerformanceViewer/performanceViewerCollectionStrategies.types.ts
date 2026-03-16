export {};

declare module "./performanceViewerCollectionStrategies.pure" {
    namespace PerfCollectionStrategy {
        export let FpsStrategy: typeof PerfCollectionStrategyFpsStrategy;
        export let ThermalStrategy: typeof PerfCollectionStrategyThermalStrategy;
        export let PowerSupplyStrategy: typeof PerfCollectionStrategyPowerSupplyStrategy;
        export let PressureStrategy: typeof PerfCollectionStrategyPressureStrategy;
        export let TotalMeshesStrategy: typeof PerfCollectionStrategyTotalMeshesStrategy;
        export let ActiveMeshesStrategy: typeof PerfCollectionStrategyActiveMeshesStrategy;
        export let ActiveIndicesStrategy: typeof PerfCollectionStrategyActiveIndicesStrategy;
        export let ActiveFacesStrategy: typeof PerfCollectionStrategyActiveFacesStrategy;
        export let ActiveBonesStrategy: typeof PerfCollectionStrategyActiveBonesStrategy;
        export let ActiveParticlesStrategy: typeof PerfCollectionStrategyActiveParticlesStrategy;
        export let DrawCallsStrategy: typeof PerfCollectionStrategyDrawCallsStrategy;
        export let TotalLightsStrategy: typeof PerfCollectionStrategyTotalLightsStrategy;
        export let TotalVerticesStrategy: typeof PerfCollectionStrategyTotalVerticesStrategy;
        export let TotalMaterialsStrategy: typeof PerfCollectionStrategyTotalMaterialsStrategy;
        export let TotalTexturesStrategy: typeof PerfCollectionStrategyTotalTexturesStrategy;
        export let AbsoluteFpsStrategy: typeof PerfCollectionStrategyAbsoluteFpsStrategy;
        export let MeshesSelectionStrategy: typeof PerfCollectionStrategyMeshesSelectionStrategy;
        export let RenderTargetsStrategy: typeof PerfCollectionStrategyRenderTargetsStrategy;
        export let ParticlesStrategy: typeof PerfCollectionStrategyParticlesStrategy;
        export let SpritesStrategy: typeof PerfCollectionStrategySpritesStrategy;
        export let AnimationsStrategy: typeof PerfCollectionStrategyAnimationsStrategy;
        export let PhysicsStrategy: typeof PerfCollectionStrategyPhysicsStrategy;
        export let RenderStrategy: typeof PerfCollectionStrategyRenderStrategy;
        export let FrameTotalStrategy: typeof PerfCollectionStrategyFrameTotalStrategy;
        export let InterFrameStrategy: typeof PerfCollectionStrategyInterFrameStrategy;
        export let GpuFrameTimeStrategy: typeof PerfCollectionStrategyGpuFrameTimeStrategy;
    }
}

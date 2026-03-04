export * from "./performanceViewerCollectionStrategies.pure";
import { PerfCollectionStrategy } from "./performanceViewerCollectionStrategies.pure";
import {
    PerfCollectionStrategyFpsStrategy,
    PerfCollectionStrategyThermalStrategy,
    PerfCollectionStrategyPowerSupplyStrategy,
    PerfCollectionStrategyPressureStrategy,
    PerfCollectionStrategyTotalMeshesStrategy,
    PerfCollectionStrategyActiveMeshesStrategy,
    PerfCollectionStrategyActiveIndicesStrategy,
    PerfCollectionStrategyActiveFacesStrategy,
    PerfCollectionStrategyActiveBonesStrategy,
    PerfCollectionStrategyActiveParticlesStrategy,
    PerfCollectionStrategyDrawCallsStrategy,
    PerfCollectionStrategyTotalLightsStrategy,
    PerfCollectionStrategyTotalVerticesStrategy,
    PerfCollectionStrategyTotalMaterialsStrategy,
    PerfCollectionStrategyTotalTexturesStrategy,
    PerfCollectionStrategyAbsoluteFpsStrategy,
    PerfCollectionStrategyMeshesSelectionStrategy,
    PerfCollectionStrategyRenderTargetsStrategy,
    PerfCollectionStrategyParticlesStrategy,
    PerfCollectionStrategySpritesStrategy,
    PerfCollectionStrategyAnimationsStrategy,
    PerfCollectionStrategyPhysicsStrategy,
    PerfCollectionStrategyRenderStrategy,
    PerfCollectionStrategyFrameTotalStrategy,
    PerfCollectionStrategyInterFrameStrategy,
    PerfCollectionStrategyGpuFrameTimeStrategy,
} from "./performanceViewerCollectionStrategies.pure";

declare module "./performanceViewerCollectionStrategies.pure" {
    // eslint-disable-next-line @typescript-eslint/no-namespace
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

PerfCollectionStrategy.FpsStrategy = PerfCollectionStrategyFpsStrategy;
PerfCollectionStrategy.ThermalStrategy = PerfCollectionStrategyThermalStrategy;
PerfCollectionStrategy.PowerSupplyStrategy = PerfCollectionStrategyPowerSupplyStrategy;
PerfCollectionStrategy.PressureStrategy = PerfCollectionStrategyPressureStrategy;
PerfCollectionStrategy.TotalMeshesStrategy = PerfCollectionStrategyTotalMeshesStrategy;
PerfCollectionStrategy.ActiveMeshesStrategy = PerfCollectionStrategyActiveMeshesStrategy;
PerfCollectionStrategy.ActiveIndicesStrategy = PerfCollectionStrategyActiveIndicesStrategy;
PerfCollectionStrategy.ActiveFacesStrategy = PerfCollectionStrategyActiveFacesStrategy;
PerfCollectionStrategy.ActiveBonesStrategy = PerfCollectionStrategyActiveBonesStrategy;
PerfCollectionStrategy.ActiveParticlesStrategy = PerfCollectionStrategyActiveParticlesStrategy;
PerfCollectionStrategy.DrawCallsStrategy = PerfCollectionStrategyDrawCallsStrategy;
PerfCollectionStrategy.TotalLightsStrategy = PerfCollectionStrategyTotalLightsStrategy;
PerfCollectionStrategy.TotalVerticesStrategy = PerfCollectionStrategyTotalVerticesStrategy;
PerfCollectionStrategy.TotalMaterialsStrategy = PerfCollectionStrategyTotalMaterialsStrategy;
PerfCollectionStrategy.TotalTexturesStrategy = PerfCollectionStrategyTotalTexturesStrategy;
PerfCollectionStrategy.AbsoluteFpsStrategy = PerfCollectionStrategyAbsoluteFpsStrategy;
PerfCollectionStrategy.MeshesSelectionStrategy = PerfCollectionStrategyMeshesSelectionStrategy;
PerfCollectionStrategy.RenderTargetsStrategy = PerfCollectionStrategyRenderTargetsStrategy;
PerfCollectionStrategy.ParticlesStrategy = PerfCollectionStrategyParticlesStrategy;
PerfCollectionStrategy.SpritesStrategy = PerfCollectionStrategySpritesStrategy;
PerfCollectionStrategy.AnimationsStrategy = PerfCollectionStrategyAnimationsStrategy;
PerfCollectionStrategy.PhysicsStrategy = PerfCollectionStrategyPhysicsStrategy;
PerfCollectionStrategy.RenderStrategy = PerfCollectionStrategyRenderStrategy;
PerfCollectionStrategy.FrameTotalStrategy = PerfCollectionStrategyFrameTotalStrategy;
PerfCollectionStrategy.InterFrameStrategy = PerfCollectionStrategyInterFrameStrategy;
PerfCollectionStrategy.GpuFrameTimeStrategy = PerfCollectionStrategyGpuFrameTimeStrategy;

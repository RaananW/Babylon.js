import { EngineInstrumentation } from "../../Instrumentation/engineInstrumentation";
import type { Scene } from "../../scene";
import { PrecisionDate } from "../precisionDate";
import { SceneInstrumentation } from "../../Instrumentation/sceneInstrumentation";
import { PressureObserverWrapper } from "../pressureObserverWrapper";
import type { Nullable } from "../../types";

/**
 * Defines the general structure of what is necessary for a collection strategy.
 */
export interface IPerfViewerCollectionStrategy {
    /**
     * The id of the strategy.
     */
    id: string;
    /**
     * Function which gets the data for the strategy.
     */
    getData: () => number;
    /**
     * Function which does any necessary cleanup. Called when performanceViewerCollector.dispose() is called.
     */
    dispose: () => void;
}
// Dispose which does nothing.
const DefaultDisposeImpl = () => {};

/**
 * Initializer callback for a strategy
 */
export type PerfStrategyInitialization = (scene: Scene) => IPerfViewerCollectionStrategy;
/**
 * Defines the predefined strategies used in the performance viewer.
 */
export class PerfCollectionStrategy {}

function _PerfCollectionStrategy_PressureStrategy(name: string, factor: Nullable<PressureFactor> = null): PerfStrategyInitialization {
    return () => {
        let value = 0;

        const wrapper = new PressureObserverWrapper();
        wrapper.observe("cpu");

        wrapper.onPressureChanged.add((update) => {
            for (const record of update) {
                if ((factor && record.factors.includes(factor)) || (!factor && (record.factors?.length ?? 0) === 0)) {
                    // Let s consider each step being 25% of the total pressure.
                    switch (record.state) {
                        case "nominal":
                            value = 0;
                            break;
                        case "fair":
                            value = 0.25;
                            break;
                        case "serious":
                            value = 0.5;
                            break;
                        case "critical":
                            value = 1;
                            break;
                    }
                }
            }
        });
        return {
            id: name,
            getData: () => value,
            dispose: () => wrapper.dispose(),
        };
    };
}

/**
 * Gets the initializer for the strategy used for collection of fps metrics
 * @returns the initializer for the fps strategy
 */
export function PerfCollectionStrategyFpsStrategy(): PerfStrategyInitialization {
    return (scene) => {
        const engine = scene.getEngine();
        return {
            id: "FPS",
            getData: () => engine.getFps(),
            dispose: DefaultDisposeImpl,
        };
    };
}

/**
 * Gets the initializer for the strategy used for collection of thermal utilization metrics.
 * Needs the experimental pressure API.
 * @returns the initializer for the thermal utilization strategy
 */
export function PerfCollectionStrategyThermalStrategy(): PerfStrategyInitialization {
    return _PerfCollectionStrategy_PressureStrategy("Thermal utilization", "thermal");
}

/**
 * Gets the initializer for the strategy used for collection of power supply utilization metrics.
 * Needs the experimental pressure API.
 * @returns the initializer for the power supply utilization strategy
 */
export function PerfCollectionStrategyPowerSupplyStrategy(): PerfStrategyInitialization {
    return _PerfCollectionStrategy_PressureStrategy("Power supply utilization", "power-supply");
}

/**
 * Gets the initializer for the strategy used for collection of pressure metrics.
 * Needs the experimental pressure API.
 * @returns the initializer for the pressure strategy
 */
export function PerfCollectionStrategyPressureStrategy(): PerfStrategyInitialization {
    return _PerfCollectionStrategy_PressureStrategy("Pressure");
}

/**
 * Gets the initializer for the strategy used for collection of total meshes metrics.
 * @returns the initializer for the total meshes strategy
 */
export function PerfCollectionStrategyTotalMeshesStrategy(): PerfStrategyInitialization {
    return (scene) => {
        return {
            id: "Total meshes",
            getData: () => scene.meshes.length,
            dispose: DefaultDisposeImpl,
        };
    };
}

/**
 * Gets the initializer for the strategy used for collection of active meshes metrics.
 * @returns the initializer for the active meshes strategy
 */
export function PerfCollectionStrategyActiveMeshesStrategy(): PerfStrategyInitialization {
    return (scene) => {
        return {
            id: "Active meshes",
            getData: () => scene.getActiveMeshes().length,
            dispose: DefaultDisposeImpl,
        };
    };
}

/**
 * Gets the initializer for the strategy used for collection of active indices metrics.
 * @returns the initializer for the active indices strategy
 */
export function PerfCollectionStrategyActiveIndicesStrategy(): PerfStrategyInitialization {
    return (scene) => {
        return {
            id: "Active indices",
            getData: () => scene.getActiveIndices(),
            dispose: DefaultDisposeImpl,
        };
    };
}

/**
 * Gets the initializer for the strategy used for collection of active faces metrics.
 * @returns the initializer for the active faces strategy
 */
export function PerfCollectionStrategyActiveFacesStrategy(): PerfStrategyInitialization {
    return (scene) => {
        return {
            id: "Active faces",
            getData: () => scene.getActiveIndices() / 3,
            dispose: DefaultDisposeImpl,
        };
    };
}

/**
 * Gets the initializer for the strategy used for collection of active bones metrics.
 * @returns the initializer for the active bones strategy
 */
export function PerfCollectionStrategyActiveBonesStrategy(): PerfStrategyInitialization {
    return (scene) => {
        return {
            id: "Active bones",
            getData: () => scene.getActiveBones(),
            dispose: DefaultDisposeImpl,
        };
    };
}

/**
 * Gets the initializer for the strategy used for collection of active particles metrics.
 * @returns the initializer for the active particles strategy
 */
export function PerfCollectionStrategyActiveParticlesStrategy(): PerfStrategyInitialization {
    return (scene) => {
        return {
            id: "Active particles",
            getData: () => scene.getActiveParticles(),
            dispose: DefaultDisposeImpl,
        };
    };
}

/**
 * Gets the initializer for the strategy used for collection of draw calls metrics.
 * @returns the initializer for the draw calls strategy
 */
export function PerfCollectionStrategyDrawCallsStrategy(): PerfStrategyInitialization {
    return (scene) => {
        let drawCalls = 0;
        const onBeforeAnimationsObserver = scene.onBeforeAnimationsObservable.add(() => {
            scene.getEngine()._drawCalls.fetchNewFrame();
        });

        const onAfterRenderObserver = scene.onAfterRenderObservable.add(() => {
            drawCalls = scene.getEngine()._drawCalls.current;
        });

        return {
            id: "Draw calls",
            getData: () => drawCalls,
            dispose: () => {
                scene.onBeforeAnimationsObservable.remove(onBeforeAnimationsObserver);
                scene.onAfterRenderObservable.remove(onAfterRenderObserver);
            },
        };
    };
}

/**
 * Gets the initializer for the strategy used for collection of total lights metrics.
 * @returns the initializer for the total lights strategy
 */
export function PerfCollectionStrategyTotalLightsStrategy(): PerfStrategyInitialization {
    return (scene) => {
        return {
            id: "Total lights",
            getData: () => scene.lights.length,
            dispose: DefaultDisposeImpl,
        };
    };
}

/**
 * Gets the initializer for the strategy used for collection of total vertices metrics.
 * @returns the initializer for the total vertices strategy
 */
export function PerfCollectionStrategyTotalVerticesStrategy(): PerfStrategyInitialization {
    return (scene) => {
        return {
            id: "Total vertices",
            getData: () => scene.getTotalVertices(),
            dispose: DefaultDisposeImpl,
        };
    };
}

/**
 * Gets the initializer for the strategy used for collection of total materials metrics.
 * @returns the initializer for the total materials strategy
 */
export function PerfCollectionStrategyTotalMaterialsStrategy(): PerfStrategyInitialization {
    return (scene) => {
        return {
            id: "Total materials",
            getData: () => scene.materials.length,
            dispose: DefaultDisposeImpl,
        };
    };
}

/**
 * Gets the initializer for the strategy used for collection of total textures metrics.
 * @returns the initializer for the total textures strategy
 */
export function PerfCollectionStrategyTotalTexturesStrategy(): PerfStrategyInitialization {
    return (scene) => {
        return {
            id: "Total textures",
            getData: () => scene.textures.length,
            dispose: DefaultDisposeImpl,
        };
    };
}

/**
 * Gets the initializer for the strategy used for collection of absolute fps metrics.
 * @returns the initializer for the absolute fps strategy
 */
export function PerfCollectionStrategyAbsoluteFpsStrategy(): PerfStrategyInitialization {
    return (scene) => {
        const sceneInstrumentation = new SceneInstrumentation(scene);
        sceneInstrumentation.captureFrameTime = true;

        return {
            id: "Absolute FPS",
            getData: () => {
                return 1000.0 / sceneInstrumentation.frameTimeCounter.lastSecAverage;
            },
            dispose: DefaultDisposeImpl,
        };
    };
}

/**
 * Gets the initializer for the strategy used for collection of meshes selection time metrics.
 * @returns the initializer for the meshes selection time strategy
 */
export function PerfCollectionStrategyMeshesSelectionStrategy(): PerfStrategyInitialization {
    return (scene) => {
        let startTime = PrecisionDate.Now;
        let timeTaken = 0;
        const onBeforeActiveMeshesObserver = scene.onBeforeActiveMeshesEvaluationObservable.add(() => {
            startTime = PrecisionDate.Now;
        });

        const onAfterActiveMeshesObserver = scene.onAfterActiveMeshesEvaluationObservable.add(() => {
            timeTaken = PrecisionDate.Now - startTime;
        });

        return {
            id: "Meshes Selection",
            getData: () => timeTaken,
            dispose: () => {
                scene.onBeforeActiveMeshesEvaluationObservable.remove(onBeforeActiveMeshesObserver);
                scene.onAfterActiveMeshesEvaluationObservable.remove(onAfterActiveMeshesObserver);
            },
        };
    };
}

/**
 * Gets the initializer for the strategy used for collection of render targets time metrics.
 * @returns the initializer for the render targets time strategy
 */
export function PerfCollectionStrategyRenderTargetsStrategy(): PerfStrategyInitialization {
    return (scene) => {
        let startTime = PrecisionDate.Now;
        let timeTaken = 0;
        const onBeforeRenderTargetsObserver = scene.onBeforeRenderTargetsRenderObservable.add(() => {
            startTime = PrecisionDate.Now;
        });

        const onAfterRenderTargetsObserver = scene.onAfterRenderTargetsRenderObservable.add(() => {
            timeTaken = PrecisionDate.Now - startTime;
        });

        return {
            id: "Render Targets",
            getData: () => timeTaken,
            dispose: () => {
                scene.onBeforeRenderTargetsRenderObservable.remove(onBeforeRenderTargetsObserver);
                scene.onAfterRenderTargetsRenderObservable.remove(onAfterRenderTargetsObserver);
            },
        };
    };
}

/**
 * Gets the initializer for the strategy used for collection of particles time metrics.
 * @returns the initializer for the particles time strategy
 */
export function PerfCollectionStrategyParticlesStrategy(): PerfStrategyInitialization {
    return (scene) => {
        let startTime = PrecisionDate.Now;
        let timeTaken = 0;
        const onBeforeParticlesObserver = scene.onBeforeParticlesRenderingObservable.add(() => {
            startTime = PrecisionDate.Now;
        });

        const onAfterParticlesObserver = scene.onAfterParticlesRenderingObservable.add(() => {
            timeTaken = PrecisionDate.Now - startTime;
        });

        return {
            id: "Particles",
            getData: () => timeTaken,
            dispose: () => {
                scene.onBeforeParticlesRenderingObservable.remove(onBeforeParticlesObserver);
                scene.onAfterParticlesRenderingObservable.remove(onAfterParticlesObserver);
            },
        };
    };
}

/**
 * Gets the initializer for the strategy used for collection of sprites time metrics.
 * @returns the initializer for the sprites time strategy
 */
export function PerfCollectionStrategySpritesStrategy(): PerfStrategyInitialization {
    return (scene) => {
        let startTime = PrecisionDate.Now;
        let timeTaken = 0;
        const onBeforeSpritesObserver = scene.onBeforeSpritesRenderingObservable?.add(() => {
            startTime = PrecisionDate.Now;
        });

        const onAfterSpritesObserver = scene.onAfterSpritesRenderingObservable?.add(() => {
            timeTaken = PrecisionDate.Now - startTime;
        });

        return {
            id: "Sprites",
            getData: () => timeTaken,
            dispose: () => {
                scene.onBeforeSpritesRenderingObservable?.remove(onBeforeSpritesObserver);
                scene.onAfterSpritesRenderingObservable?.remove(onAfterSpritesObserver);
            },
        };
    };
}

/**
 * Gets the initializer for the strategy used for collection of animations time metrics.
 * @returns the initializer for the animations time strategy
 */
export function PerfCollectionStrategyAnimationsStrategy(): PerfStrategyInitialization {
    return (scene) => {
        let startTime = PrecisionDate.Now;
        let timeTaken = 0;
        const onBeforeAnimationsObserver = scene.onBeforeAnimationsObservable.add(() => {
            startTime = PrecisionDate.Now;
        });

        const onAfterAnimationsObserver = scene.onAfterAnimationsObservable.add(() => {
            timeTaken = PrecisionDate.Now - startTime;
        });

        return {
            id: "Animations",
            getData: () => timeTaken,
            dispose: () => {
                scene.onBeforeAnimationsObservable.remove(onBeforeAnimationsObserver);
                scene.onAfterAnimationsObservable.remove(onAfterAnimationsObserver);
            },
        };
    };
}

/**
 * Gets the initializer for the strategy used for collection of physics time metrics.
 * @returns the initializer for the physics time strategy
 */
export function PerfCollectionStrategyPhysicsStrategy(): PerfStrategyInitialization {
    return (scene) => {
        let startTime = PrecisionDate.Now;
        let timeTaken = 0;
        const onBeforePhysicsObserver = scene.onBeforePhysicsObservable?.add(() => {
            startTime = PrecisionDate.Now;
        });

        const onAfterPhysicsObserver = scene.onAfterPhysicsObservable?.add(() => {
            timeTaken = PrecisionDate.Now - startTime;
        });

        return {
            id: "Physics",
            getData: () => timeTaken,
            dispose: () => {
                scene.onBeforePhysicsObservable?.remove(onBeforePhysicsObserver);
                scene.onAfterPhysicsObservable?.remove(onAfterPhysicsObserver);
            },
        };
    };
}

/**
 * Gets the initializer for the strategy used for collection of render time metrics.
 * @returns the initializer for the render time strategy
 */
export function PerfCollectionStrategyRenderStrategy(): PerfStrategyInitialization {
    return (scene) => {
        let startTime = PrecisionDate.Now;
        let timeTaken = 0;
        const onBeforeDrawPhaseObserver = scene.onBeforeDrawPhaseObservable.add(() => {
            startTime = PrecisionDate.Now;
        });

        const onAfterDrawPhaseObserver = scene.onAfterDrawPhaseObservable.add(() => {
            timeTaken = PrecisionDate.Now - startTime;
        });

        return {
            id: "Render",
            getData: () => timeTaken,
            dispose: () => {
                scene.onBeforeDrawPhaseObservable.remove(onBeforeDrawPhaseObserver);
                scene.onAfterDrawPhaseObservable.remove(onAfterDrawPhaseObserver);
            },
        };
    };
}

/**
 * Gets the initializer for the strategy used for collection of total frame time metrics.
 * @returns the initializer for the total frame time strategy
 */
export function PerfCollectionStrategyFrameTotalStrategy(): PerfStrategyInitialization {
    return (scene) => {
        let startTime = PrecisionDate.Now;
        let timeTaken = 0;
        const onBeforeAnimationsObserver = scene.onBeforeAnimationsObservable.add(() => {
            startTime = PrecisionDate.Now;
        });

        const onAfterRenderObserver = scene.onAfterRenderObservable.add(() => {
            timeTaken = PrecisionDate.Now - startTime;
        });

        return {
            id: "Frame Total",
            getData: () => timeTaken,
            dispose: () => {
                scene.onBeforeAnimationsObservable.remove(onBeforeAnimationsObserver);
                scene.onAfterRenderObservable.remove(onAfterRenderObserver);
            },
        };
    };
}

/**
 * Gets the initializer for the strategy used for collection of inter-frame time metrics.
 * @returns the initializer for the inter-frame time strategy
 */
export function PerfCollectionStrategyInterFrameStrategy(): PerfStrategyInitialization {
    return (scene) => {
        let startTime = PrecisionDate.Now;
        let timeTaken = 0;

        const onBeforeAnimationsObserver = scene.onBeforeAnimationsObservable.add(() => {
            timeTaken = PrecisionDate.Now - startTime;
        });

        const onAfterRenderObserver = scene.onAfterRenderObservable.add(() => {
            startTime = PrecisionDate.Now;
        });

        return {
            id: "Inter-frame",
            getData: () => timeTaken,
            dispose: () => {
                scene.onBeforeAnimationsObservable.remove(onBeforeAnimationsObserver);
                scene.onAfterRenderObservable.remove(onAfterRenderObserver);
            },
        };
    };
}

/**
 * Gets the initializer for the strategy used for collection of gpu frame time metrics.
 * @returns the initializer for the gpu frame time strategy
 */
export function PerfCollectionStrategyGpuFrameTimeStrategy(): PerfStrategyInitialization {
    return (scene) => {
        const engineInstrumentation = new EngineInstrumentation(scene.getEngine());
        engineInstrumentation.captureGPUFrameTime = true;
        return {
            id: "GPU frame time",
            getData: () => Math.max(engineInstrumentation.gpuFrameTimeCounter!.current * 0.000001, 0),
            dispose: () => {
                engineInstrumentation.dispose();
            },
        };
    };
}


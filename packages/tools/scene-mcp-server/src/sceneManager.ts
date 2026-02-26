/* eslint-disable @typescript-eslint/naming-convention, babylonjs/available, babylonjs/syntax */
/**
 * SceneManager – holds an in-memory representation of a Babylon.js scene
 * that the MCP tools build up incrementally. When the user is satisfied,
 * the scene can be exported as a declarative JSON descriptor that a
 * Babylon.js runtime loader can interpret to reconstruct the full scene.
 *
 * Design goals
 * ────────────
 * 1. **No Babylon.js runtime dependency** – the MCP server remains a light,
 *    standalone process. We work with a JSON data model.
 * 2. **Orchestrator role** – this manager ties together meshes, cameras, lights,
 *    materials (including NME JSON references), animations, model loading
 *    descriptors, flow graph references, and physics bodies.
 * 3. **Multiple scenes** can coexist keyed by scene name.
 */

import {
    MeshPrimitives,
    CameraTypes,
    LightTypes,
    MaterialPresets,
    AnimatableProperties,
    AnimationLoopModes,
    AnimationDataTypes,
    PhysicsBodyTypes,
    PhysicsShapeTypes,
    ParticleEmitterTypes,
    PhysicsConstraintTypes,
} from "./catalog.js";

import { generateSceneCode, generateProjectFiles, type ICodeGeneratorOptions } from "./codeGenerator.js";

// ═══════════════════════════════════════════════════════════════════════════
//  Serialized types — these form the scene descriptor JSON
// ═══════════════════════════════════════════════════════════════════════════

/**
 *
 */
export interface IVector3 {
    /** X component */
    x: number;
    /** Y component */
    y: number;
    /** Z component */
    z: number;
}

/**
 *
 */
export interface IColor3 {
    /** Red component (0–1) */
    r: number;
    /** Green component (0–1) */
    g: number;
    /** Blue component (0–1) */
    b: number;
}

/**
 *
 */
export interface IColor4 {
    /** Red component (0–1) */
    r: number;
    /** Green component (0–1) */
    g: number;
    /** Blue component (0–1) */
    b: number;
    /** Alpha component (0–1) */
    a: number;
}

/**
 *
 */
export interface ITransform {
    /** Position in 3D space */
    position?: IVector3;
    /** Rotation in Euler angles (radians) */
    rotation?: IVector3;
    /** Scale factors along each axis */
    scaling?: IVector3;
}

/**
 *
 */
export interface ISerializedTexture {
    /** Unique ID within the scene */
    id: string;
    /** Human-readable name */
    name: string;
    /** URL or relative path to the texture file */
    url: string;
    /** UV tiling on U axis */
    uScale?: number;
    /** UV tiling on V axis */
    vScale?: number;
    /** UV offset on U axis */
    uOffset?: number;
    /** UV offset on V axis */
    vOffset?: number;
    /** Whether to generate mipmaps */
    hasAlpha?: boolean;
    /** Level (intensity) */
    level?: number;
}

/**
 *
 */
export interface ISerializedMaterial {
    /** Unique ID within the scene */
    id: string;
    /** Human-readable name */
    name: string;
    /** Material class: StandardMaterial, PBRMaterial, or NodeMaterial */
    type: string;
    /** Material properties (diffuseColor, metallic, roughness, etc.) */
    properties: Record<string, unknown>;
    /** For NodeMaterial: the full NME JSON */
    nmeJson?: string;
    /** For NodeMaterial: snippet ID for lazy loading */
    snippetId?: string;
    /** Texture references used by this material */
    textures?: Record<string, string>; // property name -> texture id
}

/**
 *
 */
export interface ISerializedMesh {
    /** Unique ID within the scene */
    id: string;
    /** Human-readable name */
    name: string;
    /** Primitive type (Box, Sphere, etc.) or "imported" for models */
    primitiveType?: string;
    /** Creation options for the primitive */
    primitiveOptions?: Record<string, unknown>;
    /** Transform relative to parent */
    transform: ITransform;
    /** Parent node ID (for scene hierarchy) */
    parentId?: string;
    /** Material ID assigned to this mesh */
    materialId?: string;
    /** Whether the mesh is visible */
    isVisible?: boolean;
    /** Whether the mesh is pickable */
    isPickable?: boolean;
    /** Whether the mesh receives shadows */
    receiveShadows?: boolean;
    /** Whether the mesh casts shadows (added to shadow generators) */
    castsShadows?: boolean;
    /** Physics body configuration */
    physics?: ISerializedPhysicsBody;
    /** Tags for querying */
    tags?: string[];
    /** Metadata */
    metadata?: Record<string, unknown>;
}

/**
 *
 */
export interface ISerializedTransformNode {
    /** Unique ID */
    id: string;
    /** Name */
    name: string;
    /** Transform */
    transform: ITransform;
    /** Parent node ID */
    parentId?: string;
    /** Tags */
    tags?: string[];
}

/**
 *
 */
export interface ISerializedCamera {
    /** Unique ID */
    id: string;
    /** Name */
    name: string;
    /** Camera type (ArcRotateCamera, FreeCamera, etc.) */
    type: string;
    /** Camera-specific properties */
    properties: Record<string, unknown>;
    /** Whether this is the active camera */
    isActive?: boolean;
}

/**
 *
 */
export interface ISerializedLight {
    /** Unique ID */
    id: string;
    /** Name */
    name: string;
    /** Light type */
    type: string;
    /** Light-specific properties */
    properties: Record<string, unknown>;
    /** Whether enabled */
    isEnabled?: boolean;
}

/**
 *
 */
export interface ISerializedModel {
    /** Unique ID */
    id: string;
    /** Name */
    name: string;
    /** URL or path to the model file */
    url: string;
    /** Root path for the model (directory) */
    rootUrl?: string;
    /** File name within rootUrl */
    fileName?: string;
    /** Transform to apply to the root node */
    transform: ITransform;
    /** Parent node ID for the imported root */
    parentId?: string;
    /** Plugin name for specific loader (e.g. "gltf") */
    pluginExtension?: string;
    /** Animation groups expected from this model */
    animationGroups?: string[];
    /** Material overrides: mesh name -> material id */
    materialOverrides?: Record<string, string>;
}

/**
 *
 */
export interface IAnimationKeyframe {
    /** Frame number */
    frame: number;
    /** Value at this frame (number, Vector3, Color3, etc.) */
    value: unknown;
    /** In-tangent for cubic interpolation */
    inTangent?: unknown;
    /** Out-tangent for cubic interpolation */
    outTangent?: unknown;
}

/**
 *
 */
export interface ISerializedAnimation {
    /** Unique ID */
    id: string;
    /** Name */
    name: string;
    /** Target node ID */
    targetId: string;
    /** Property path on the target (e.g. "position", "rotation.y") */
    property: string;
    /** Data type (Float=0, Vector3=1, etc.) */
    dataType: number;
    /** Frames per second */
    fps: number;
    /** Loop behavior (Relative=0, Cycle=1, Constant=2, Yoyo=4) */
    loopMode: number;
    /** Keyframes */
    keys: IAnimationKeyframe[];
    /** Easing function type */
    easingFunction?: string;
    /** Easing mode (0=EaseIn, 1=EaseOut, 2=EaseInOut) */
    easingMode?: number;
}

/**
 *
 */
export interface ISerializedAnimationGroup {
    /** Unique ID */
    id: string;
    /** Name */
    name: string;
    /** Animation IDs included in this group */
    animationIds: string[];
    /** Whether to start automatically */
    autoStart?: boolean;
    /** Whether to loop */
    isLooping?: boolean;
    /** Playback speed ratio */
    speedRatio?: number;
    /** Start frame override */
    from?: number;
    /** End frame override */
    to?: number;
}

/**
 *
 */
export interface ISerializedPhysicsBody {
    /** Body type: Static=0, Dynamic=1, Animated=2 */
    bodyType: number;
    /** Shape type: Box, Sphere, Capsule, etc. */
    shapeType: string;
    /** Mass (0 for static) */
    mass?: number;
    /** Friction coefficient */
    friction?: number;
    /** Restitution (bounciness) */
    restitution?: number;
    /** Linear damping */
    linearDamping?: number;
    /** Angular damping */
    angularDamping?: number;
}

/**
 *
 */
export interface ISerializedEnvironment {
    /** Clear (background) color */
    clearColor?: IColor4;
    /** Ambient color */
    ambientColor?: IColor3;
    /** Whether fog is enabled */
    fogEnabled?: boolean;
    /** Fog mode: 0=None, 1=Exp, 2=Exp2, 3=Linear */
    fogMode?: number;
    /** Fog color */
    fogColor?: IColor3;
    /** Fog density */
    fogDensity?: number;
    /** Fog start distance */
    fogStart?: number;
    /** Fog end distance */
    fogEnd?: number;
    /** HDR environment texture URL (.env or .hdr) */
    environmentTexture?: string;
    /** Skybox size (0 = no skybox) */
    skyboxSize?: number;
    /** Whether to create a default ground */
    createDefaultGround?: boolean;
    /** Ground size */
    groundSize?: number;
    /** Ground color */
    groundColor?: IColor3;
    /** Gravity vector */
    gravity?: IVector3;
    /** Whether physics is enabled */
    physicsEnabled?: boolean;
    /** Physics plugin to use */
    physicsPlugin?: string;
}

/**
 *
 */
export interface ISerializedFlowGraphRef {
    /** Unique ID */
    id: string;
    /** Name */
    name: string;
    /** The complete flow graph coordinator JSON */
    coordinatorJson: string;
    /** Optional: nodes this flow graph is scoped to */
    scopeNodeIds?: string[];
}

// ═══════════════════════════════════════════════════════════════════════════
//  Audio V2 types
// ═══════════════════════════════════════════════════════════════════════════

/**
 *
 */
export interface ISerializedSound {
    /** Unique ID */
    id: string;
    /** Human-readable name */
    name: string;
    /** Sound source URL */
    url: string;
    /** Sound type: 'static' or 'streaming' */
    soundType: "static" | "streaming";
    /** Whether to autoplay */
    autoplay?: boolean;
    /** Whether to loop */
    loop?: boolean;
    /** Volume (0-1+) */
    volume?: number;
    /** Playback rate */
    playbackRate?: number;
    /** Start offset in seconds */
    startOffset?: number;
    /** Max simultaneous instances (static sounds only) */
    maxInstances?: number;
    /** Spatial audio enabled */
    spatialEnabled?: boolean;
    /** Spatial distance model */
    spatialDistanceModel?: "linear" | "inverse" | "exponential";
    /** Spatial max distance */
    spatialMaxDistance?: number;
    /** Spatial min distance (reference distance) */
    spatialMinDistance?: number;
    /** Spatial rolloff factor */
    spatialRolloffFactor?: number;
    /** Spatial panning model */
    spatialPanningModel?: "equalpower" | "HRTF";
    /** Spatial position (if not attached to a mesh) */
    spatialPosition?: IVector3;
    /** Mesh ID to attach spatial audio to */
    attachedMeshId?: string;
}

// ═══════════════════════════════════════════════════════════════════════════
//  Particle system types
// ═══════════════════════════════════════════════════════════════════════════

/**
 *
 */
export interface ISerializedParticleColorGradient {
    /** Gradient stop position (0–1) */
    gradient: number;
    /** Primary color at this gradient stop */
    color: IColor4;
    /** Optional secondary color for randomization */
    color2?: IColor4;
}

/**
 *
 */
export interface ISerializedParticleFactorGradient {
    /** Gradient stop position (0–1) */
    gradient: number;
    /** Primary factor value at this gradient stop */
    factor: number;
    /** Optional secondary factor for randomization */
    factor2?: number;
}

/**
 *
 */
export interface ISerializedParticleSystem {
    /** Unique ID */
    id: string;
    /** Human-readable name */
    name: string;
    /** Whether to use GPU particle system */
    isGpu?: boolean;
    /** Particle capacity */
    capacity: number;
    /** Emitter position (Vector3) or mesh ID */
    emitter: IVector3 | string;
    /** Particle texture URL */
    particleTexture?: string;
    /** Emitter type */
    emitterType?: string;
    /** Emitter options */
    emitterOptions?: Record<string, unknown>;
    /** Emission rate (particles per frame) */
    emitRate?: number;
    /** Minimum lifetime (seconds) */
    minLifeTime?: number;
    /** Maximum lifetime (seconds) */
    maxLifeTime?: number;
    /** Minimum particle size */
    minSize?: number;
    /** Maximum particle size */
    maxSize?: number;
    /** Minimum emit power (velocity magnitude) */
    minEmitPower?: number;
    /** Maximum emit power */
    maxEmitPower?: number;
    /** Minimum angular speed */
    minAngularSpeed?: number;
    /** Maximum angular speed */
    maxAngularSpeed?: number;
    /** Gravity vector */
    gravity?: IVector3;
    /** Color1 */
    color1?: IColor4;
    /** Color2 */
    color2?: IColor4;
    /** Dead color */
    colorDead?: IColor4;
    /** Blend mode */
    blendMode?: number;
    /** Target stop duration (0 = never) */
    targetStopDuration?: number;
    /** Dispose when stopped */
    disposeOnStop?: boolean;
    /** Pre-warm cycles */
    preWarmCycles?: number;
    /** Update speed */
    updateSpeed?: number;
    /** Color gradients */
    colorGradients?: ISerializedParticleColorGradient[];
    /** Size gradients */
    sizeGradients?: ISerializedParticleFactorGradient[];
    /** Velocity gradients */
    velocityGradients?: ISerializedParticleFactorGradient[];
    /** Whether to autostart */
    autoStart?: boolean;
}

// ═══════════════════════════════════════════════════════════════════════════
//  Physics constraint types
// ═══════════════════════════════════════════════════════════════════════════

/**
 *
 */
export interface ISerializedPhysicsConstraint {
    /** Unique ID */
    id: string;
    /** Human-readable name */
    name: string;
    /** Constraint type */
    constraintType: string;
    /** Parent body mesh ID */
    parentMeshId: string;
    /** Child body mesh ID */
    childMeshId: string;
    /** Pivot on parent body (local space) */
    pivotA?: IVector3;
    /** Pivot on child body (local space) */
    pivotB?: IVector3;
    /** Axis on parent body */
    axisA?: IVector3;
    /** Axis on child body */
    axisB?: IVector3;
    /** Max distance (for Distance constraint) */
    maxDistance?: number;
    /** Minimum angular/linear limit (for Hinge and Slider constraints) */
    minLimit?: number;
    /** Maximum angular/linear limit (for Hinge and Slider constraints) */
    maxLimit?: number;
    /** Enable collision between constrained bodies */
    collision?: boolean;
    /** Spring stiffness (for Spring constraint) */
    stiffness?: number;
    /** Spring damping (for Spring constraint) */
    damping?: number;
}

// ═══════════════════════════════════════════════════════════════════════════
//  Post-processing / Render pipeline types
// ═══════════════════════════════════════════════════════════════════════════

/**
 *
 */
export interface ISerializedRenderPipeline {
    /** Unique ID */
    id: string;
    /** Human-readable name */
    name: string;
    /** Whether HDR rendering is enabled */
    hdr?: boolean;
    /** Whether bloom effect is enabled */
    bloomEnabled?: boolean;
    /** Bloom kernel size */
    bloomKernel?: number;
    /** Bloom weight (intensity) */
    bloomWeight?: number;
    /** Bloom luminance threshold */
    bloomThreshold?: number;
    /** Bloom render scale */
    bloomScale?: number;
    /** Whether depth of field is enabled */
    depthOfFieldEnabled?: boolean;
    /** Depth of field blur level */
    depthOfFieldBlurLevel?: number;
    /** FXAA */
    fxaaEnabled?: boolean;
    /** Sharpen */
    sharpenEnabled?: boolean;
    /** Chromatic aberration */
    chromaticAberrationEnabled?: boolean;
    /** Grain */
    grainEnabled?: boolean;
    /** Image processing */
    imageProcessingEnabled?: boolean;
}

// ═══════════════════════════════════════════════════════════════════════════
//  Glow and Highlight layer types
// ═══════════════════════════════════════════════════════════════════════════

/**
 *
 */
export interface ISerializedGlowLayer {
    /** Unique ID */
    id: string;
    /** Human-readable name */
    name: string;
    /** Blur kernel size */
    blurKernelSize?: number;
    /** Intensity */
    intensity?: number;
    /** Mesh IDs to include exclusively (if set, only these glow) */
    includedOnlyMeshIds?: string[];
    /** Mesh IDs to exclude from glow */
    excludedMeshIds?: string[];
}

/**
 *
 */
export interface ISerializedHighlightLayer {
    /** Unique ID */
    id: string;
    /** Human-readable name */
    name: string;
    /** Whether to render as stroke (outline) rather than fill */
    isStroke?: boolean;
    /** Vertical blur kernel size */
    blurVerticalSize?: number;
    /** Horizontal blur kernel size */
    blurHorizontalSize?: number;
    /** Mesh-color pairs */
    meshes: Array<{
        meshId: string;
        color: IColor3;
        glowEmissiveOnly?: boolean;
    }>;
    /** Mesh IDs to exclude */
    excludedMeshIds?: string[];
}

/**
 * Complete scene descriptor — the export target.
 */
export interface ISerializedScene {
    /** Schema version for forward compatibility */
    version: string;
    /** Scene name */
    name: string;
    /** Scene description / comment */
    description?: string;
    /** Environment settings */
    environment: ISerializedEnvironment;
    /** Textures used in the scene */
    textures: ISerializedTexture[];
    /** Materials */
    materials: ISerializedMaterial[];
    /** Transform nodes (empty grouping nodes) */
    transformNodes: ISerializedTransformNode[];
    /** Meshes (primitives + imported mesh references) */
    meshes: ISerializedMesh[];
    /** External model references to load */
    models: ISerializedModel[];
    /** Cameras */
    cameras: ISerializedCamera[];
    /** Lights */
    lights: ISerializedLight[];
    /** Animations */
    animations: ISerializedAnimation[];
    /** Animation groups */
    animationGroups: ISerializedAnimationGroup[];
    /** Flow graph references (behavior) */
    flowGraphs: ISerializedFlowGraphRef[];
    /** Audio V2 sounds */
    sounds: ISerializedSound[];
    /** Particle systems */
    particleSystems: ISerializedParticleSystem[];
    /** Physics constraints (joints between bodies) */
    physicsConstraints: ISerializedPhysicsConstraint[];
    /** Post-processing render pipeline */
    renderPipeline?: ISerializedRenderPipeline;
    /** Glow layers */
    glowLayers: ISerializedGlowLayer[];
    /** Highlight layers */
    highlightLayers: ISerializedHighlightLayer[];
    /** Active camera ID */
    activeCameraId?: string;
    /**
     * Runtime integrations — declarative bridges between subsystems
     * (physics↔FlowGraph, FlowGraph↔materials, GUI↔FlowGraph, etc.)
     */
    integrations?: ISerializedIntegration[];
    /** Inspector v2 configuration (when enabled, shows the scene debugger/inspector) */
    inspector?: ISerializedInspector;
    /** GUI descriptor JSON (from the GUI MCP server). Stored here so the scene is the single source of truth. */
    guiJson?: unknown;
    /**
     * Node Render Graph JSON (from the NRG MCP server).
     * When present, the code generator emits NodeRenderGraph.Parse() + buildAsync() calls.
     */
    nodeRenderGraphJson?: unknown;
    /**
     * Node Geometry meshes (from the NGE MCP server).
     * Each entry's ngeJson is used to emit NodeGeometry.Parse() + build() + createMesh() calls.
     */
    nodeGeometryMeshes?: Array<{ name: string; ngeJson: unknown }>;
}

/**
 * Inspector v2 configuration — controls whether the Babylon.js Inspector
 * is loaded and shown when the scene runs.
 */
export interface ISerializedInspector {
    /** Whether the inspector is enabled */
    enabled: boolean;
    /** Whether to use overlay mode (floats on top of scene instead of side-by-side) */
    overlay?: boolean;
    /** Initial tab to open: 'scene' | 'properties' | 'debug' | 'stats' | 'tools' | 'settings' */
    initialTab?: string;
}

// ─── Integration types ────────────────────────────────────────────────────

/** Physics collision dispatches a FlowGraph custom event */
export interface IPhysicsCollisionEventIntegration {
    /** Type of integration */
    type: "physicsCollision";
    /** Mesh name whose physics body is one of the collision pair */
    sourceBody: string;
    /** Mesh name whose physics body is the other collision partner */
    targetBody: string;
    /** FlowGraph custom event ID to dispatch on collision */
    eventId: string;
}

/** Syncs a FlowGraph variable to a mesh/material property each frame */
export interface IVariableToPropertyIntegration {
    type: "variableToProperty";
    /** FlowGraph variable name (set by SetVariable block) */
    variableName: string;
    /** Mesh name to update */
    meshName: string;
    /** Property path on the material, e.g. "albedoColor" */
    property: string;
    /** How to interpret the value. Color3 converts Vector3→Color3 */
    valueType: "Color3" | "Vector3" | "number" | "boolean";
    /** When true and valueType is Color3, use a random color each time the variable changes */
    randomize?: boolean;
}

/** GUI button click dispatches a FlowGraph custom event */
export interface IGuiButtonEventIntegration {
    type: "guiButton";
    /** GUI button control name */
    buttonName: string;
    /** FlowGraph custom event ID to dispatch */
    eventId: string;
    /** If provided, button text toggles between these two labels */
    toggleLabels?: [string, string];
}

/** Counts physics collisions and displays in a GUI TextBlock */
export interface ICollisionCounterIntegration {
    type: "collisionCounter";
    /** GUI TextBlock name to update */
    textBlockName: string;
    /** Text prefix, e.g. "Collisions: " */
    prefix: string;
}

/** Resets physics bodies back to given positions when a GUI button is clicked */
export interface IPhysicsPositionResetIntegration {
    type: "physicsPositionReset";
    /** GUI button control name that triggers the reset */
    triggerButtonName: string;
    /** Meshes to teleport back to their positions */
    resets: Array<{
        meshName: string;
        position: { x: number; y: number; z: number };
    }>;
    /** If true, also resets the _collisionCount variable and counter text */
    resetCollisionCounter?: boolean;
}

export type ISerializedIntegration =
    | IPhysicsCollisionEventIntegration
    | IVariableToPropertyIntegration
    | IGuiButtonEventIntegration
    | ICollisionCounterIntegration
    | IPhysicsPositionResetIntegration;

// ═══════════════════════════════════════════════════════════════════════════
//  Scene Manager
// ═══════════════════════════════════════════════════════════════════════════

/**
 *
 */
export class SceneManager {
    private scenes = new Map<string, ISerializedScene>();
    private idCounters = new Map<string, number>();

    // ── Helpers ──────────────────────────────────────────────────────────

    getScene(name: string): ISerializedScene | undefined {
        return this.scenes.get(name);
    }

    private nextId(sceneName: string, prefix: string): string {
        const key = `${sceneName}:${prefix}`;
        const count = (this.idCounters.get(key) ?? 0) + 1;
        this.idCounters.set(key, count);
        return `${prefix}_${count}`;
    }

    private findMesh(scene: ISerializedScene, id: string): ISerializedMesh | undefined {
        return scene.meshes.find((m) => m.id === id || m.name === id);
    }

    private findNode(scene: ISerializedScene, id: string): (ISerializedMesh | ISerializedTransformNode | ISerializedCamera | ISerializedLight) | undefined {
        return (
            scene.meshes.find((m) => m.id === id || m.name === id) ??
            scene.transformNodes.find((n) => n.id === id || n.name === id) ??
            scene.cameras.find((c) => c.id === id || c.name === id) ??
            scene.lights.find((l) => l.id === id || l.name === id)
        );
    }

    private parseVector3(v: unknown): IVector3 {
        if (Array.isArray(v) && v.length >= 3) {
            return { x: v[0], y: v[1], z: v[2] };
        }
        if (typeof v === "object" && v !== null && "x" in v) {
            return v as IVector3;
        }
        return { x: 0, y: 0, z: 0 };
    }

    private parseColor3(v: unknown): IColor3 {
        if (Array.isArray(v) && v.length >= 3) {
            return { r: v[0], g: v[1], b: v[2] };
        }
        if (typeof v === "object" && v !== null && "r" in v) {
            return v as IColor3;
        }
        return { r: 1, g: 1, b: 1 };
    }

    private parseColor4(v: unknown): IColor4 {
        if (Array.isArray(v) && v.length >= 4) {
            return { r: v[0], g: v[1], b: v[2], a: v[3] };
        }
        if (Array.isArray(v) && v.length >= 3) {
            return { r: v[0], g: v[1], b: v[2], a: 1 };
        }
        if (typeof v === "object" && v !== null && "r" in v) {
            return v as IColor4;
        }
        return { r: 0.2, g: 0.2, b: 0.3, a: 1 };
    }

    // ── Scene lifecycle ──────────────────────────────────────────────────

    createScene(name: string, description?: string): void {
        if (this.scenes.has(name)) {
            // Overwrite
        }
        const scene: ISerializedScene = {
            version: "1.0.0",
            name,
            description,
            environment: {
                clearColor: { r: 0.2, g: 0.2, b: 0.3, a: 1 },
                ambientColor: { r: 0, g: 0, b: 0 },
                gravity: { x: 0, y: -9.81, z: 0 },
            },
            textures: [],
            materials: [],
            transformNodes: [],
            meshes: [],
            models: [],
            cameras: [],
            lights: [],
            animations: [],
            animationGroups: [],
            flowGraphs: [],
            sounds: [],
            particleSystems: [],
            physicsConstraints: [],
            glowLayers: [],
            highlightLayers: [],
        };
        this.scenes.set(name, scene);
    }

    deleteScene(name: string): boolean {
        return this.scenes.delete(name);
    }

    listScenes(): string[] {
        return Array.from(this.scenes.keys());
    }

    // ── Environment ──────────────────────────────────────────────────────

    setEnvironment(sceneName: string, env: Partial<ISerializedEnvironment>): string {
        const scene = this.getScene(sceneName);
        if (!scene) {
            return `Scene "${sceneName}" not found.`;
        }
        if (env.clearColor !== undefined) {
            scene.environment.clearColor = this.parseColor4(env.clearColor);
        }
        if (env.ambientColor !== undefined) {
            scene.environment.ambientColor = this.parseColor3(env.ambientColor);
        }
        if (env.fogEnabled !== undefined) {
            scene.environment.fogEnabled = env.fogEnabled;
        }
        if (env.fogMode !== undefined) {
            scene.environment.fogMode = env.fogMode;
        }
        if (env.fogColor !== undefined) {
            scene.environment.fogColor = this.parseColor3(env.fogColor);
        }
        if (env.fogDensity !== undefined) {
            scene.environment.fogDensity = env.fogDensity;
        }
        if (env.fogStart !== undefined) {
            scene.environment.fogStart = env.fogStart;
        }
        if (env.fogEnd !== undefined) {
            scene.environment.fogEnd = env.fogEnd;
        }
        if (env.environmentTexture !== undefined) {
            scene.environment.environmentTexture = env.environmentTexture;
        }
        if (env.skyboxSize !== undefined) {
            scene.environment.skyboxSize = env.skyboxSize;
        }
        if (env.createDefaultGround !== undefined) {
            scene.environment.createDefaultGround = env.createDefaultGround;
        }
        if (env.groundSize !== undefined) {
            scene.environment.groundSize = env.groundSize;
        }
        if (env.groundColor !== undefined) {
            scene.environment.groundColor = this.parseColor3(env.groundColor);
        }
        if (env.gravity !== undefined) {
            scene.environment.gravity = this.parseVector3(env.gravity);
        }
        if (env.physicsEnabled !== undefined) {
            scene.environment.physicsEnabled = env.physicsEnabled;
        }
        if (env.physicsPlugin !== undefined) {
            scene.environment.physicsPlugin = env.physicsPlugin;
        }
        return "OK";
    }

    // ── Textures ─────────────────────────────────────────────────────────

    addTexture(
        sceneName: string,
        name: string,
        url: string,
        options?: Partial<ISerializedTexture>
    ):
        | string
        | {
              id: string;
          } {
        const scene = this.getScene(sceneName);
        if (!scene) {
            return `Scene "${sceneName}" not found.`;
        }
        const id = this.nextId(sceneName, "tex");
        const tex: ISerializedTexture = { id, name, url, ...options };
        scene.textures.push(tex);
        return { id };
    }

    // ── Materials ────────────────────────────────────────────────────────

    addMaterial(
        sceneName: string,
        name: string,
        type: string,
        properties?: Record<string, unknown>,
        nmeJson?: string,
        snippetId?: string
    ):
        | string
        | {
              id: string;
          } {
        const scene = this.getScene(sceneName);
        if (!scene) {
            return `Scene "${sceneName}" not found.`;
        }
        if (!MaterialPresets[type] && type !== "NodeMaterial" && type !== "StandardMaterial" && type !== "PBRMaterial") {
            return `Unknown material type "${type}". Known types: ${Object.keys(MaterialPresets).join(", ")}`;
        }
        const id = this.nextId(sceneName, "mat");
        const mat: ISerializedMaterial = { id, name, type, properties: properties ?? {}, nmeJson, snippetId };
        scene.materials.push(mat);
        return { id };
    }

    removeMaterial(sceneName: string, materialId: string): string {
        const scene = this.getScene(sceneName);
        if (!scene) {
            return `Scene "${sceneName}" not found.`;
        }
        const idx = scene.materials.findIndex((m) => m.id === materialId || m.name === materialId);
        if (idx < 0) {
            return `Material "${materialId}" not found.`;
        }
        scene.materials.splice(idx, 1);
        return "OK";
    }

    // ── Transform nodes ──────────────────────────────────────────────────

    addTransformNode(
        sceneName: string,
        name: string,
        transform?: ITransform,
        parentId?: string
    ):
        | string
        | {
              id: string;
          } {
        const scene = this.getScene(sceneName);
        if (!scene) {
            return `Scene "${sceneName}" not found.`;
        }
        const id = this.nextId(sceneName, "node");
        scene.transformNodes.push({
            id,
            name,
            transform: transform ?? { position: { x: 0, y: 0, z: 0 }, rotation: { x: 0, y: 0, z: 0 }, scaling: { x: 1, y: 1, z: 1 } },
            parentId,
        });
        return { id };
    }

    // ── Meshes ───────────────────────────────────────────────────────────

    addMesh(
        sceneName: string,
        name: string,
        primitiveType: string,
        options?: Record<string, unknown>,
        transform?: ITransform,
        parentId?: string,
        materialId?: string
    ):
        | string
        | {
              id: string;
          } {
        const scene = this.getScene(sceneName);
        if (!scene) {
            return `Scene "${sceneName}" not found.`;
        }
        if (!MeshPrimitives[primitiveType]) {
            return `Unknown primitive type "${primitiveType}". Known types: ${Object.keys(MeshPrimitives).join(", ")}`;
        }
        const id = this.nextId(sceneName, "mesh");
        scene.meshes.push({
            id,
            name,
            primitiveType,
            primitiveOptions: options,
            transform: transform ?? { position: { x: 0, y: 0, z: 0 }, rotation: { x: 0, y: 0, z: 0 }, scaling: { x: 1, y: 1, z: 1 } },
            parentId,
            materialId,
            isVisible: true,
            isPickable: true,
            receiveShadows: true,
        });
        return { id };
    }

    removeMesh(sceneName: string, meshId: string): string {
        const scene = this.getScene(sceneName);
        if (!scene) {
            return `Scene "${sceneName}" not found.`;
        }
        const idx = scene.meshes.findIndex((m) => m.id === meshId || m.name === meshId);
        if (idx < 0) {
            return `Mesh "${meshId}" not found.`;
        }
        scene.meshes.splice(idx, 1);
        return "OK";
    }

    // ── Transform ────────────────────────────────────────────────────────

    setTransform(sceneName: string, nodeId: string, transform: Partial<ITransform>): string {
        const scene = this.getScene(sceneName);
        if (!scene) {
            return `Scene "${sceneName}" not found.`;
        }
        const node = this.findNode(scene, nodeId);
        if (!node) {
            return `Node "${nodeId}" not found.`;
        }
        // Only meshes and transform nodes have a transform property
        if (!("transform" in node)) {
            return `Node "${nodeId}" is a ${"type" in node ? node.type : "camera/light"} and does not have a direct transform. Use configure_camera or configure_light instead.`;
        }
        if (transform.position) {
            node.transform.position = this.parseVector3(transform.position);
        }
        if (transform.rotation) {
            node.transform.rotation = this.parseVector3(transform.rotation);
        }
        if (transform.scaling) {
            node.transform.scaling = this.parseVector3(transform.scaling);
        }
        return "OK";
    }

    setParent(sceneName: string, childId: string, parentId: string | null): string {
        const scene = this.getScene(sceneName);
        if (!scene) {
            return `Scene "${sceneName}" not found.`;
        }
        const mesh = scene.meshes.find((m) => m.id === childId || m.name === childId);
        if (mesh) {
            mesh.parentId = parentId ?? undefined;
            return "OK";
        }
        const tn = scene.transformNodes.find((n) => n.id === childId || n.name === childId);
        if (tn) {
            tn.parentId = parentId ?? undefined;
            return "OK";
        }
        return `Node "${childId}" not found.`;
    }

    assignMaterial(sceneName: string, meshId: string, materialId: string): string {
        const scene = this.getScene(sceneName);
        if (!scene) {
            return `Scene "${sceneName}" not found.`;
        }
        const mesh = this.findMesh(scene, meshId);
        if (!mesh) {
            return `Mesh "${meshId}" not found.`;
        }
        const matExists = scene.materials.some((m) => m.id === materialId || m.name === materialId);
        if (!matExists) {
            return `Material "${materialId}" not found. Add it first with add_material.`;
        }
        mesh.materialId = materialId;
        return "OK";
    }

    setMeshProperties(sceneName: string, meshId: string, props: Record<string, unknown>): string {
        const scene = this.getScene(sceneName);
        if (!scene) {
            return `Scene "${sceneName}" not found.`;
        }
        const mesh = this.findMesh(scene, meshId);
        if (!mesh) {
            return `Mesh "${meshId}" not found.`;
        }
        if (props.isVisible !== undefined) {
            mesh.isVisible = props.isVisible as boolean;
        }
        if (props.isPickable !== undefined) {
            mesh.isPickable = props.isPickable as boolean;
        }
        if (props.receiveShadows !== undefined) {
            mesh.receiveShadows = props.receiveShadows as boolean;
        }
        if (props.castsShadows !== undefined) {
            mesh.castsShadows = props.castsShadows as boolean;
        }
        if (props.tags !== undefined) {
            mesh.tags = props.tags as string[];
        }
        if (props.metadata !== undefined) {
            mesh.metadata = props.metadata as Record<string, unknown>;
        }
        return "OK";
    }

    // ── Models ───────────────────────────────────────────────────────────

    addModel(
        sceneName: string,
        name: string,
        url: string,
        transform?: ITransform,
        parentId?: string,
        options?: Partial<ISerializedModel>
    ):
        | string
        | {
              id: string;
          } {
        const scene = this.getScene(sceneName);
        if (!scene) {
            return `Scene "${sceneName}" not found.`;
        }
        const id = this.nextId(sceneName, "model");

        // Parse rootUrl and fileName from url if not explicitly given
        let rootUrl = options?.rootUrl;
        let fileName = options?.fileName;
        if (!rootUrl || !fileName) {
            const lastSlash = url.lastIndexOf("/");
            if (lastSlash >= 0) {
                rootUrl = rootUrl ?? url.substring(0, lastSlash + 1);
                fileName = fileName ?? url.substring(lastSlash + 1);
            } else {
                rootUrl = rootUrl ?? "";
                fileName = fileName ?? url;
            }
        }

        scene.models.push({
            id,
            name,
            url,
            rootUrl,
            fileName,
            transform: transform ?? { position: { x: 0, y: 0, z: 0 }, rotation: { x: 0, y: 0, z: 0 }, scaling: { x: 1, y: 1, z: 1 } },
            parentId,
            pluginExtension: options?.pluginExtension,
            animationGroups: options?.animationGroups,
            materialOverrides: options?.materialOverrides,
        });
        return { id };
    }

    removeModel(sceneName: string, modelId: string): string {
        const scene = this.getScene(sceneName);
        if (!scene) {
            return `Scene "${sceneName}" not found.`;
        }
        const idx = scene.models.findIndex((m) => m.id === modelId || m.name === modelId);
        if (idx < 0) {
            return `Model "${modelId}" not found.`;
        }
        scene.models.splice(idx, 1);
        return "OK";
    }

    // ── Cameras ──────────────────────────────────────────────────────────

    addCamera(
        sceneName: string,
        name: string,
        type: string,
        properties?: Record<string, unknown>,
        isActive?: boolean
    ):
        | string
        | {
              id: string;
          } {
        const scene = this.getScene(sceneName);
        if (!scene) {
            return `Scene "${sceneName}" not found.`;
        }
        if (!CameraTypes[type]) {
            return `Unknown camera type "${type}". Known types: ${Object.keys(CameraTypes).join(", ")}`;
        }
        const id = this.nextId(sceneName, "cam");
        scene.cameras.push({ id, name, type, properties: properties ?? {}, isActive });
        if (isActive) {
            scene.activeCameraId = id;
        }
        return { id };
    }

    setActiveCamera(sceneName: string, cameraId: string): string {
        const scene = this.getScene(sceneName);
        if (!scene) {
            return `Scene "${sceneName}" not found.`;
        }
        const cam = scene.cameras.find((c) => c.id === cameraId || c.name === cameraId);
        if (!cam) {
            return `Camera "${cameraId}" not found.`;
        }
        scene.activeCameraId = cam.id;
        scene.cameras.forEach((c) => (c.isActive = c.id === cam.id));
        return "OK";
    }

    configureCameraProperties(sceneName: string, cameraId: string, properties: Record<string, unknown>): string {
        const scene = this.getScene(sceneName);
        if (!scene) {
            return `Scene "${sceneName}" not found.`;
        }
        const cam = scene.cameras.find((c) => c.id === cameraId || c.name === cameraId);
        if (!cam) {
            return `Camera "${cameraId}" not found.`;
        }
        Object.assign(cam.properties, properties);
        return "OK";
    }

    // ── Lights ───────────────────────────────────────────────────────────

    addLight(
        sceneName: string,
        name: string,
        type: string,
        properties?: Record<string, unknown>
    ):
        | string
        | {
              id: string;
          } {
        const scene = this.getScene(sceneName);
        if (!scene) {
            return `Scene "${sceneName}" not found.`;
        }
        if (!LightTypes[type]) {
            return `Unknown light type "${type}". Known types: ${Object.keys(LightTypes).join(", ")}`;
        }
        const id = this.nextId(sceneName, "light");
        scene.lights.push({ id, name, type, properties: properties ?? {}, isEnabled: true });
        return { id };
    }

    configureLightProperties(sceneName: string, lightId: string, properties: Record<string, unknown>): string {
        const scene = this.getScene(sceneName);
        if (!scene) {
            return `Scene "${sceneName}" not found.`;
        }
        const light = scene.lights.find((l) => l.id === lightId || l.name === lightId);
        if (!light) {
            return `Light "${lightId}" not found.`;
        }
        Object.assign(light.properties, properties);
        return "OK";
    }

    // ── Animations ───────────────────────────────────────────────────────

    addAnimation(
        sceneName: string,
        name: string,
        targetId: string,
        property: string,
        fps: number,
        keys: IAnimationKeyframe[],
        loopMode?: string | number,
        easingFunction?: string,
        easingMode?: number
    ):
        | string
        | {
              id: string;
          } {
        const scene = this.getScene(sceneName);
        if (!scene) {
            return `Scene "${sceneName}" not found.`;
        }

        // Resolve property info
        const propInfo = AnimatableProperties[property];
        let dataType = propInfo?.dataType ?? 0;
        if (!propInfo) {
            // Try to infer from the first keyframe
            const firstVal = keys[0]?.value;
            if (typeof firstVal === "number") {
                dataType = AnimationDataTypes.Float;
            } else if (typeof firstVal === "object" && firstVal !== null) {
                if ("x" in (firstVal as Record<string, unknown>)) {
                    dataType = AnimationDataTypes.Vector3;
                } else if ("r" in (firstVal as Record<string, unknown>)) {
                    dataType = AnimationDataTypes.Color3;
                }
            }
        }

        const resolvedLoop = typeof loopMode === "string" ? (AnimationLoopModes[loopMode] ?? 1) : (loopMode ?? 1);

        const id = this.nextId(sceneName, "anim");
        scene.animations.push({
            id,
            name,
            targetId,
            property,
            dataType,
            fps,
            loopMode: resolvedLoop,
            keys,
            easingFunction,
            easingMode,
        });
        return { id };
    }

    createAnimationGroup(
        sceneName: string,
        name: string,
        animationIds: string[],
        options?: {
            autoStart?: boolean;
            isLooping?: boolean;
            speedRatio?: number;
            from?: number;
            to?: number;
        }
    ): string | { id: string } {
        const scene = this.getScene(sceneName);
        if (!scene) {
            return `Scene "${sceneName}" not found.`;
        }
        const id = this.nextId(sceneName, "animgrp");
        scene.animationGroups.push({
            id,
            name,
            animationIds,
            autoStart: options?.autoStart,
            isLooping: options?.isLooping,
            speedRatio: options?.speedRatio,
            from: options?.from,
            to: options?.to,
        });
        return { id };
    }

    // ── Physics ──────────────────────────────────────────────────────────

    addPhysicsBody(
        sceneName: string,
        meshId: string,
        bodyType: string | number,
        shapeType: string,
        options?: {
            mass?: number;
            friction?: number;
            restitution?: number;
            linearDamping?: number;
            angularDamping?: number;
        }
    ): string {
        const scene = this.getScene(sceneName);
        if (!scene) {
            return `Scene "${sceneName}" not found.`;
        }
        const mesh = this.findMesh(scene, meshId);
        if (!mesh) {
            return `Mesh "${meshId}" not found.`;
        }

        const resolvedBodyType = typeof bodyType === "string" ? (PhysicsBodyTypes[bodyType] ?? 1) : bodyType;
        if (!PhysicsShapeTypes[shapeType]) {
            return `Unknown shape type "${shapeType}". Known: ${Object.keys(PhysicsShapeTypes).join(", ")}`;
        }

        mesh.physics = {
            bodyType: resolvedBodyType,
            shapeType,
            mass: options?.mass,
            friction: options?.friction,
            restitution: options?.restitution,
            linearDamping: options?.linearDamping,
            angularDamping: options?.angularDamping,
        };
        return "OK";
    }

    // ── Flow graphs ──────────────────────────────────────────────────────

    attachFlowGraph(
        sceneName: string,
        name: string,
        coordinatorJson: string,
        scopeNodeIds?: string[]
    ):
        | string
        | {
              id: string;
              warnings?: string[];
          } {
        const scene = this.getScene(sceneName);
        if (!scene) {
            return `Scene "${sceneName}" not found.`;
        }
        const id = this.nextId(sceneName, "fg");
        scene.flowGraphs.push({ id, name, coordinatorJson, scopeNodeIds });

        // Validate mesh references inside the coordinator JSON
        const warnings: string[] = [];
        try {
            const parsed = typeof coordinatorJson === "string" ? JSON.parse(coordinatorJson) : coordinatorJson;
            const knownMeshNames = new Set([...scene.meshes.map((m) => m.name), ...scene.transformNodes.map((t) => t.name)]);
            const knownMeshIds = new Set([...scene.meshes.map((m) => m.id), ...scene.transformNodes.map((t) => t.id)]);

            // Walk all blocks in all flow graphs looking for mesh/camera references in config
            const graphs = parsed.flowGraphs ?? parsed.graphs ?? [];
            for (const fg of graphs) {
                const blocks = fg.allBlocks ?? fg.blocks ?? [];
                for (const block of blocks) {
                    const config = block.config;
                    if (!config) {
                        continue;
                    }
                    for (const [key, val] of Object.entries(config)) {
                        if (val && typeof val === "object" && "type" in (val as Record<string, unknown>) && "name" in (val as Record<string, unknown>)) {
                            const ref = val as { type: string; name: string };
                            const meshTypes = ["Mesh", "AbstractMesh", "InstancedMesh", "TransformNode", "GroundMesh", "LinesMesh"];
                            if (meshTypes.includes(ref.type)) {
                                if (!knownMeshNames.has(ref.name) && !knownMeshIds.has(ref.name)) {
                                    const className = block.className ?? "unknown";
                                    warnings.push(
                                        `Block "${className}" config.${key} references ${ref.type} "${ref.name}" which was not found in the scene. ` +
                                            `Available meshes/transforms: ${[...knownMeshNames].join(", ") || "(none)"}`
                                    );
                                }
                            }
                        }
                    }
                }
            }
        } catch {
            // JSON parsing failed — don't block attachment, but warn
            warnings.push("Could not parse coordinator JSON to validate mesh references.");
        }

        return { id, ...(warnings.length > 0 ? { warnings } : {}) };
    }

    removeFlowGraph(sceneName: string, fgId: string): string {
        const scene = this.getScene(sceneName);
        if (!scene) {
            return `Scene "${sceneName}" not found.`;
        }
        const idx = scene.flowGraphs.findIndex((fg) => fg.id === fgId || fg.name === fgId);
        if (idx < 0) {
            return `Flow graph "${fgId}" not found.`;
        }
        scene.flowGraphs.splice(idx, 1);
        return "OK";
    }

    // ── Audio V2 ─────────────────────────────────────────────────────────

    addSound(
        sceneName: string,
        name: string,
        url: string,
        soundType: "static" | "streaming",
        options?: Partial<Omit<ISerializedSound, "id" | "name" | "url" | "soundType">>
    ):
        | string
        | {
              id: string;
          } {
        const scene = this.getScene(sceneName);
        if (!scene) {
            return `Scene "${sceneName}" not found.`;
        }
        const id = this.nextId(sceneName, "snd");
        scene.sounds.push({ id, name, url, soundType, ...options });
        return { id };
    }

    removeSound(sceneName: string, soundId: string): string {
        const scene = this.getScene(sceneName);
        if (!scene) {
            return `Scene "${sceneName}" not found.`;
        }
        const idx = scene.sounds.findIndex((s) => s.id === soundId || s.name === soundId);
        if (idx < 0) {
            return `Sound "${soundId}" not found.`;
        }
        scene.sounds.splice(idx, 1);
        return "OK";
    }

    configureSoundProperties(sceneName: string, soundId: string, properties: Partial<Omit<ISerializedSound, "id" | "name" | "url" | "soundType">>): string {
        const scene = this.getScene(sceneName);
        if (!scene) {
            return `Scene "${sceneName}" not found.`;
        }
        const snd = scene.sounds.find((s) => s.id === soundId || s.name === soundId);
        if (!snd) {
            return `Sound "${soundId}" not found.`;
        }
        Object.assign(snd, properties);
        return "OK";
    }

    attachSoundToMesh(sceneName: string, soundId: string, meshId: string): string {
        const scene = this.getScene(sceneName);
        if (!scene) {
            return `Scene "${sceneName}" not found.`;
        }
        const snd = scene.sounds.find((s) => s.id === soundId || s.name === soundId);
        if (!snd) {
            return `Sound "${soundId}" not found.`;
        }
        const mesh = this.findMesh(scene, meshId);
        if (!mesh) {
            return `Mesh "${meshId}" not found.`;
        }
        snd.attachedMeshId = mesh.id;
        snd.spatialEnabled = true;
        return "OK";
    }

    // ── Particle systems ─────────────────────────────────────────────────

    addParticleSystem(
        sceneName: string,
        name: string,
        capacity: number,
        emitter: IVector3 | string,
        options?: Partial<Omit<ISerializedParticleSystem, "id" | "name" | "capacity" | "emitter">>
    ):
        | string
        | {
              id: string;
          } {
        const scene = this.getScene(sceneName);
        if (!scene) {
            return `Scene "${sceneName}" not found.`;
        }

        // Validate emitter type if specified
        if (options?.emitterType && !ParticleEmitterTypes[options.emitterType]) {
            return `Unknown emitter type "${options.emitterType}". Known: ${Object.keys(ParticleEmitterTypes).join(", ")}`;
        }

        // If emitter is a string, validate it's a known mesh
        if (typeof emitter === "string") {
            const mesh = this.findMesh(scene, emitter);
            if (!mesh) {
                return `Emitter mesh "${emitter}" not found.`;
            }
        }

        const id = this.nextId(sceneName, "ps");
        const ps: ISerializedParticleSystem = {
            id,
            name,
            capacity,
            emitter: typeof emitter === "string" ? emitter : this.parseVector3(emitter),
            ...options,
        };
        scene.particleSystems.push(ps);
        return { id };
    }

    removeParticleSystem(sceneName: string, psId: string): string {
        const scene = this.getScene(sceneName);
        if (!scene) {
            return `Scene "${sceneName}" not found.`;
        }
        const idx = scene.particleSystems.findIndex((ps) => ps.id === psId || ps.name === psId);
        if (idx < 0) {
            return `Particle system "${psId}" not found.`;
        }
        scene.particleSystems.splice(idx, 1);
        return "OK";
    }

    configureParticleSystem(sceneName: string, psId: string, properties: Partial<Omit<ISerializedParticleSystem, "id" | "name">>): string {
        const scene = this.getScene(sceneName);
        if (!scene) {
            return `Scene "${sceneName}" not found.`;
        }
        const ps = scene.particleSystems.find((p) => p.id === psId || p.name === psId);
        if (!ps) {
            return `Particle system "${psId}" not found.`;
        }
        Object.assign(ps, properties);
        return "OK";
    }

    addParticleGradient(sceneName: string, psId: string, gradientType: "color" | "size" | "velocity", gradient: number, value: unknown, value2?: unknown): string {
        const scene = this.getScene(sceneName);
        if (!scene) {
            return `Scene "${sceneName}" not found.`;
        }
        const ps = scene.particleSystems.find((p) => p.id === psId || p.name === psId);
        if (!ps) {
            return `Particle system "${psId}" not found.`;
        }

        if (gradientType === "color") {
            if (!ps.colorGradients) {
                ps.colorGradients = [];
            }
            ps.colorGradients.push({
                gradient,
                color: this.parseColor4(value),
                color2: value2 !== undefined ? this.parseColor4(value2) : undefined,
            });
        } else if (gradientType === "size") {
            if (!ps.sizeGradients) {
                ps.sizeGradients = [];
            }
            ps.sizeGradients.push({
                gradient,
                factor: value as number,
                factor2: value2 as number | undefined,
            });
        } else if (gradientType === "velocity") {
            if (!ps.velocityGradients) {
                ps.velocityGradients = [];
            }
            ps.velocityGradients.push({
                gradient,
                factor: value as number,
                factor2: value2 as number | undefined,
            });
        }
        return "OK";
    }

    // ── Physics constraints ──────────────────────────────────────────────

    addPhysicsConstraint(
        sceneName: string,
        name: string,
        constraintType: string,
        parentMeshId: string,
        childMeshId: string,
        options?: Partial<Omit<ISerializedPhysicsConstraint, "id" | "name" | "constraintType" | "parentMeshId" | "childMeshId">>
    ):
        | string
        | {
              id: string;
          } {
        const scene = this.getScene(sceneName);
        if (!scene) {
            return `Scene "${sceneName}" not found.`;
        }

        if (!PhysicsConstraintTypes[constraintType]) {
            return `Unknown constraint type "${constraintType}". Known: ${Object.keys(PhysicsConstraintTypes).join(", ")}`;
        }

        // Validate meshes have physics bodies
        const parentMesh = this.findMesh(scene, parentMeshId);
        if (!parentMesh) {
            return `Parent mesh "${parentMeshId}" not found.`;
        }
        if (!parentMesh.physics) {
            return `Parent mesh "${parentMeshId}" has no physics body. Add one with add_physics_body first.`;
        }

        const childMesh = this.findMesh(scene, childMeshId);
        if (!childMesh) {
            return `Child mesh "${childMeshId}" not found.`;
        }
        if (!childMesh.physics) {
            return `Child mesh "${childMeshId}" has no physics body. Add one with add_physics_body first.`;
        }

        const id = this.nextId(sceneName, "constraint");
        scene.physicsConstraints.push({
            id,
            name,
            constraintType,
            parentMeshId: parentMesh.id,
            childMeshId: childMesh.id,
            pivotA: options?.pivotA ? this.parseVector3(options.pivotA) : undefined,
            pivotB: options?.pivotB ? this.parseVector3(options.pivotB) : undefined,
            axisA: options?.axisA ? this.parseVector3(options.axisA) : undefined,
            axisB: options?.axisB ? this.parseVector3(options.axisB) : undefined,
            maxDistance: options?.maxDistance,
            minLimit: options?.minLimit,
            maxLimit: options?.maxLimit,
            collision: options?.collision,
            stiffness: options?.stiffness,
            damping: options?.damping,
        });
        return { id };
    }

    removePhysicsConstraint(sceneName: string, constraintId: string): string {
        const scene = this.getScene(sceneName);
        if (!scene) {
            return `Scene "${sceneName}" not found.`;
        }
        const idx = scene.physicsConstraints.findIndex((c) => c.id === constraintId || c.name === constraintId);
        if (idx < 0) {
            return `Constraint "${constraintId}" not found.`;
        }
        scene.physicsConstraints.splice(idx, 1);
        return "OK";
    }

    // ── Render pipeline ──────────────────────────────────────────────────

    configureRenderPipeline(sceneName: string, properties: Partial<Omit<ISerializedRenderPipeline, "id" | "name">>): string {
        const scene = this.getScene(sceneName);
        if (!scene) {
            return `Scene "${sceneName}" not found.`;
        }

        if (!scene.renderPipeline) {
            scene.renderPipeline = {
                id: this.nextId(sceneName, "pipeline"),
                name: "defaultPipeline",
                hdr: true,
            };
        }
        Object.assign(scene.renderPipeline, properties);
        return "OK";
    }

    // ── Glow layer ───────────────────────────────────────────────────────

    addGlowLayer(
        sceneName: string,
        name: string,
        options?: {
            blurKernelSize?: number;
            intensity?: number;
        }
    ): string | { id: string } {
        const scene = this.getScene(sceneName);
        if (!scene) {
            return `Scene "${sceneName}" not found.`;
        }
        const id = this.nextId(sceneName, "glow");
        scene.glowLayers.push({
            id,
            name,
            blurKernelSize: options?.blurKernelSize,
            intensity: options?.intensity,
            includedOnlyMeshIds: [],
            excludedMeshIds: [],
        });
        return { id };
    }

    addMeshToGlowLayer(sceneName: string, glowLayerId: string, meshId: string, mode: "include" | "exclude"): string {
        const scene = this.getScene(sceneName);
        if (!scene) {
            return `Scene "${sceneName}" not found.`;
        }
        const glow = scene.glowLayers.find((g) => g.id === glowLayerId || g.name === glowLayerId);
        if (!glow) {
            return `Glow layer "${glowLayerId}" not found.`;
        }
        const mesh = this.findMesh(scene, meshId);
        if (!mesh) {
            return `Mesh "${meshId}" not found.`;
        }

        if (mode === "include") {
            if (!glow.includedOnlyMeshIds) {
                glow.includedOnlyMeshIds = [];
            }
            glow.includedOnlyMeshIds.push(mesh.id);
        } else {
            if (!glow.excludedMeshIds) {
                glow.excludedMeshIds = [];
            }
            glow.excludedMeshIds.push(mesh.id);
        }
        return "OK";
    }

    removeGlowLayer(sceneName: string, glowLayerId: string): string {
        const scene = this.getScene(sceneName);
        if (!scene) {
            return `Scene "${sceneName}" not found.`;
        }
        const idx = scene.glowLayers.findIndex((g) => g.id === glowLayerId || g.name === glowLayerId);
        if (idx < 0) {
            return `Glow layer "${glowLayerId}" not found.`;
        }
        scene.glowLayers.splice(idx, 1);
        return "OK";
    }

    // ── Highlight layer ──────────────────────────────────────────────────

    addHighlightLayer(
        sceneName: string,
        name: string,
        options?: {
            isStroke?: boolean;
            blurVerticalSize?: number;
            blurHorizontalSize?: number;
        }
    ): string | { id: string } {
        const scene = this.getScene(sceneName);
        if (!scene) {
            return `Scene "${sceneName}" not found.`;
        }
        const id = this.nextId(sceneName, "highlight");
        scene.highlightLayers.push({
            id,
            name,
            isStroke: options?.isStroke,
            blurVerticalSize: options?.blurVerticalSize,
            blurHorizontalSize: options?.blurHorizontalSize,
            meshes: [],
            excludedMeshIds: [],
        });
        return { id };
    }

    addMeshToHighlightLayer(sceneName: string, highlightLayerId: string, meshId: string, color: unknown, glowEmissiveOnly?: boolean): string {
        const scene = this.getScene(sceneName);
        if (!scene) {
            return `Scene "${sceneName}" not found.`;
        }
        const hl = scene.highlightLayers.find((h) => h.id === highlightLayerId || h.name === highlightLayerId);
        if (!hl) {
            return `Highlight layer "${highlightLayerId}" not found.`;
        }
        const mesh = this.findMesh(scene, meshId);
        if (!mesh) {
            return `Mesh "${meshId}" not found.`;
        }
        hl.meshes.push({
            meshId: mesh.id,
            color: this.parseColor3(color),
            glowEmissiveOnly,
        });
        return "OK";
    }

    removeMeshFromHighlightLayer(sceneName: string, highlightLayerId: string, meshId: string): string {
        const scene = this.getScene(sceneName);
        if (!scene) {
            return `Scene "${sceneName}" not found.`;
        }
        const hl = scene.highlightLayers.find((h) => h.id === highlightLayerId || h.name === highlightLayerId);
        if (!hl) {
            return `Highlight layer "${highlightLayerId}" not found.`;
        }
        const idx = hl.meshes.findIndex((m) => m.meshId === meshId);
        if (idx < 0) {
            return `Mesh "${meshId}" not found in highlight layer.`;
        }
        hl.meshes.splice(idx, 1);
        return "OK";
    }

    removeHighlightLayer(sceneName: string, highlightLayerId: string): string {
        const scene = this.getScene(sceneName);
        if (!scene) {
            return `Scene "${sceneName}" not found.`;
        }
        const idx = scene.highlightLayers.findIndex((h) => h.id === highlightLayerId || h.name === highlightLayerId);
        if (idx < 0) {
            return `Highlight layer "${highlightLayerId}" not found.`;
        }
        scene.highlightLayers.splice(idx, 1);
        return "OK";
    }

    // ── Description ──────────────────────────────────────────────────────

    describeScene(sceneName: string): string {
        const scene = this.getScene(sceneName);
        if (!scene) {
            return `Scene "${sceneName}" not found.`;
        }

        const lines: string[] = [];
        lines.push(`# Scene: ${scene.name}`);
        if (scene.description) {
            lines.push(`Description: ${scene.description}`);
        }
        lines.push(`Version: ${scene.version}`);
        lines.push("");

        // Environment
        lines.push("## Environment");
        const env = scene.environment;
        if (env.clearColor) {
            lines.push(`  Clear color: rgba(${env.clearColor.r}, ${env.clearColor.g}, ${env.clearColor.b}, ${env.clearColor.a})`);
        }
        if (env.environmentTexture) {
            lines.push(`  Environment texture: ${env.environmentTexture}`);
        }
        if (env.fogEnabled) {
            lines.push(`  Fog: mode=${env.fogMode}, density=${env.fogDensity}`);
        }
        if (env.physicsEnabled) {
            lines.push(`  Physics: enabled (${env.physicsPlugin ?? "default"})`);
        }
        lines.push("");

        // Cameras
        if (scene.cameras.length > 0) {
            lines.push(`## Cameras (${scene.cameras.length})`);
            for (const cam of scene.cameras) {
                const active = cam.isActive ? " [ACTIVE]" : "";
                lines.push(`  • [${cam.id}] "${cam.name}" (${cam.type})${active}`);
            }
            lines.push("");
        }

        // Lights
        if (scene.lights.length > 0) {
            lines.push(`## Lights (${scene.lights.length})`);
            for (const light of scene.lights) {
                lines.push(`  • [${light.id}] "${light.name}" (${light.type})`);
            }
            lines.push("");
        }

        // Materials
        if (scene.materials.length > 0) {
            lines.push(`## Materials (${scene.materials.length})`);
            for (const mat of scene.materials) {
                const extra = mat.nmeJson ? " [NME]" : mat.snippetId ? ` [snippet:${mat.snippetId}]` : "";
                lines.push(`  • [${mat.id}] "${mat.name}" (${mat.type})${extra}`);
                // Show material properties for visibility
                if (mat.properties && Object.keys(mat.properties).length > 0) {
                    for (const [key, value] of Object.entries(mat.properties)) {
                        lines.push(`      ${key}: ${JSON.stringify(value)}`);
                    }
                } else if (mat.type !== "NodeMaterial") {
                    lines.push(`      (no properties set — using defaults)`);
                }
            }
            lines.push("");
        }

        // Transform nodes
        if (scene.transformNodes.length > 0) {
            lines.push(`## Transform Nodes (${scene.transformNodes.length})`);
            for (const tn of scene.transformNodes) {
                const parent = tn.parentId ? ` (parent: ${tn.parentId})` : "";
                lines.push(`  • [${tn.id}] "${tn.name}"${parent}`);
            }
            lines.push("");
        }

        // Meshes
        if (scene.meshes.length > 0) {
            lines.push(`## Meshes (${scene.meshes.length})`);
            for (const mesh of scene.meshes) {
                const parent = mesh.parentId ? ` parent=${mesh.parentId}` : "";
                const mat = mesh.materialId ? ` mat=${mesh.materialId}` : "";
                const phys = mesh.physics ? ` [physics:${mesh.physics.shapeType}]` : "";
                const prim = mesh.primitiveType ?? "imported";
                lines.push(`  • [${mesh.id}] "${mesh.name}" (${prim})${parent}${mat}${phys}`);
                const t = mesh.transform;
                if (t.position) {
                    lines.push(`      pos: (${t.position.x}, ${t.position.y}, ${t.position.z})`);
                }
            }
            lines.push("");
        }

        // Models
        if (scene.models.length > 0) {
            lines.push(`## Models (${scene.models.length})`);
            for (const model of scene.models) {
                lines.push(`  • [${model.id}] "${model.name}" — ${model.url}`);
                if (model.animationGroups?.length) {
                    lines.push(`      animations: ${model.animationGroups.join(", ")}`);
                }
            }
            lines.push("");
        }

        // Animations
        if (scene.animations.length > 0) {
            lines.push(`## Animations (${scene.animations.length})`);
            for (const anim of scene.animations) {
                lines.push(`  • [${anim.id}] "${anim.name}" → ${anim.targetId}.${anim.property} (${anim.keys.length} keys, ${anim.fps}fps)`);
            }
            lines.push("");
        }

        // Animation groups
        if (scene.animationGroups.length > 0) {
            lines.push(`## Animation Groups (${scene.animationGroups.length})`);
            for (const ag of scene.animationGroups) {
                const flags = [ag.autoStart ? "autoStart" : null, ag.isLooping ? "loop" : null].filter(Boolean).join(", ");
                lines.push(`  • [${ag.id}] "${ag.name}" [${ag.animationIds.join(", ")}]${flags ? ` (${flags})` : ""}`);
            }
            lines.push("");
        }

        // Flow graphs
        if (scene.flowGraphs.length > 0) {
            lines.push(`## Flow Graphs (${scene.flowGraphs.length})`);
            for (const fg of scene.flowGraphs) {
                const scope = fg.scopeNodeIds?.length ? ` scoped to: ${fg.scopeNodeIds.join(", ")}` : "";
                lines.push(`  • [${fg.id}] "${fg.name}"${scope}`);
                // Parse and summarize flow graph contents
                try {
                    const parsed = typeof fg.coordinatorJson === "string" ? JSON.parse(fg.coordinatorJson) : fg.coordinatorJson;
                    const graphs = parsed.flowGraphs ?? parsed.graphs ?? [];
                    for (const g of graphs) {
                        const blocks = g.allBlocks ?? g.blocks ?? [];
                        for (const block of blocks) {
                            const displayName = block.metadata?.displayName ?? block.className ?? "?";
                            const className = block.className ?? "";
                            // Summarize config (especially mesh references)
                            const configParts: string[] = [];
                            if (block.config) {
                                for (const [k, v] of Object.entries(block.config)) {
                                    if (v && typeof v === "object" && "type" in (v as Record<string, unknown>) && "name" in (v as Record<string, unknown>)) {
                                        configParts.push(`${k}: ${(v as { type: string }).type} "${(v as { name: string }).name}"`);
                                    } else if (v !== undefined && v !== null) {
                                        const str = JSON.stringify(v);
                                        configParts.push(`${k}: ${str.length > 40 ? str.slice(0, 37) + "..." : str}`);
                                    }
                                }
                            }
                            const configStr = configParts.length > 0 ? ` { ${configParts.join(", ")} }` : "";
                            lines.push(`      ◦ ${displayName} (${className})${configStr}`);
                        }
                    }
                } catch {
                    lines.push(`      (could not parse coordinator JSON)`);
                }
            }
            lines.push("");
        }

        // Sounds
        if (scene.sounds.length > 0) {
            lines.push(`## Sounds (${scene.sounds.length})`);
            for (const snd of scene.sounds) {
                const spatial = snd.spatialEnabled ? " [spatial]" : "";
                const attached = snd.attachedMeshId ? ` → mesh:${snd.attachedMeshId}` : "";
                lines.push(`  • [${snd.id}] "${snd.name}" (${snd.soundType})${spatial}${attached}`);
            }
            lines.push("");
        }

        // Particle systems
        if (scene.particleSystems.length > 0) {
            lines.push(`## Particle Systems (${scene.particleSystems.length})`);
            for (const ps of scene.particleSystems) {
                const gpu = ps.isGpu ? " [GPU]" : "";
                const emitterStr =
                    typeof ps.emitter === "string" ? `mesh:${ps.emitter}` : `(${(ps.emitter as IVector3).x}, ${(ps.emitter as IVector3).y}, ${(ps.emitter as IVector3).z})`;
                lines.push(`  • [${ps.id}] "${ps.name}" cap=${ps.capacity} emitter=${emitterStr}${gpu}`);
            }
            lines.push("");
        }

        // Physics constraints
        if (scene.physicsConstraints.length > 0) {
            lines.push(`## Physics Constraints (${scene.physicsConstraints.length})`);
            for (const c of scene.physicsConstraints) {
                lines.push(`  • [${c.id}] "${c.name}" (${c.constraintType}) ${c.parentMeshId} ↔ ${c.childMeshId}`);
            }
            lines.push("");
        }

        // Render pipeline
        if (scene.renderPipeline) {
            lines.push(`## Render Pipeline`);
            const rp = scene.renderPipeline;
            const effects = [
                rp.bloomEnabled && "bloom",
                rp.depthOfFieldEnabled && "DOF",
                rp.fxaaEnabled && "FXAA",
                rp.sharpenEnabled && "sharpen",
                rp.chromaticAberrationEnabled && "chromatic",
                rp.grainEnabled && "grain",
            ].filter(Boolean);
            lines.push(`  Effects: ${effects.length > 0 ? effects.join(", ") : "none configured"}`);
            lines.push("");
        }

        // Glow layers
        if (scene.glowLayers.length > 0) {
            lines.push(`## Glow Layers (${scene.glowLayers.length})`);
            for (const g of scene.glowLayers) {
                lines.push(`  • [${g.id}] "${g.name}" intensity=${g.intensity ?? 1} blur=${g.blurKernelSize ?? 32}`);
            }
            lines.push("");
        }

        // Highlight layers
        if (scene.highlightLayers.length > 0) {
            lines.push(`## Highlight Layers (${scene.highlightLayers.length})`);
            for (const h of scene.highlightLayers) {
                lines.push(`  • [${h.id}] "${h.name}" (${h.meshes.length} meshes)${h.isStroke ? " [stroke]" : ""}`);
            }
            lines.push("");
        }

        // GUI
        if (scene.guiJson) {
            const gui = scene.guiJson as { root?: { children?: Array<{ name?: string; className?: string }> } };
            const controlCount = gui.root?.children?.length ?? 0;
            lines.push(`## GUI (attached — ${controlCount} top-level controls)`);
            lines.push("");
        }

        // Integrations
        if (scene.integrations && scene.integrations.length > 0) {
            lines.push(`## Integrations (${scene.integrations.length})`);
            for (let i = 0; i < scene.integrations.length; i++) {
                const integ = scene.integrations[i];
                switch (integ.type) {
                    case "physicsCollision":
                        lines.push(`  [${i}] physicsCollision: "${integ.sourceBody}" ↔ "${integ.targetBody}" → event "${integ.eventId}"`);
                        break;
                    case "variableToProperty":
                        lines.push(`  [${i}] variableToProperty: var "${integ.variableName}" → ${integ.meshName}.material.${integ.property} (${integ.valueType})`);
                        break;
                    case "guiButton":
                        lines.push(`  [${i}] guiButton: "${integ.buttonName}" → event "${integ.eventId}"`);
                        break;
                    case "collisionCounter":
                        lines.push(`  [${i}] collisionCounter: "${integ.textBlockName}" prefix="${integ.prefix}"`);
                        break;
                    default:
                        lines.push(`  [${i}] ${JSON.stringify(integ)}`);
                }
            }
            lines.push("");
        }

        return lines.join("\n");
    }

    describeNode(sceneName: string, nodeId: string): string {
        const scene = this.getScene(sceneName);
        if (!scene) {
            return `Scene "${sceneName}" not found.`;
        }

        const mesh = scene.meshes.find((m) => m.id === nodeId || m.name === nodeId);
        if (mesh) {
            const lines: string[] = [];
            lines.push(`## Mesh: ${mesh.name} [${mesh.id}]`);
            lines.push(`Primitive: ${mesh.primitiveType ?? "imported"}`);
            if (mesh.primitiveOptions) {
                lines.push(`Options: ${JSON.stringify(mesh.primitiveOptions)}`);
            }
            const t = mesh.transform;
            lines.push(`Position: (${t.position?.x ?? 0}, ${t.position?.y ?? 0}, ${t.position?.z ?? 0})`);
            lines.push(`Rotation: (${t.rotation?.x ?? 0}, ${t.rotation?.y ?? 0}, ${t.rotation?.z ?? 0})`);
            lines.push(`Scaling: (${t.scaling?.x ?? 1}, ${t.scaling?.y ?? 1}, ${t.scaling?.z ?? 1})`);
            if (mesh.parentId) {
                lines.push(`Parent: ${mesh.parentId}`);
            }
            if (mesh.materialId) {
                lines.push(`Material: ${mesh.materialId}`);
            }
            lines.push(`Visible: ${mesh.isVisible ?? true}, Pickable: ${mesh.isPickable ?? true}`);
            if (mesh.physics) {
                lines.push(`Physics: ${mesh.physics.shapeType} (bodyType=${mesh.physics.bodyType})`);
            }
            if (mesh.tags?.length) {
                lines.push(`Tags: ${mesh.tags.join(", ")}`);
            }
            return lines.join("\n");
        }

        const tn = scene.transformNodes.find((n) => n.id === nodeId || n.name === nodeId);
        if (tn) {
            const t = tn.transform;
            return [
                `## TransformNode: ${tn.name} [${tn.id}]`,
                `Position: (${t.position?.x ?? 0}, ${t.position?.y ?? 0}, ${t.position?.z ?? 0})`,
                `Rotation: (${t.rotation?.x ?? 0}, ${t.rotation?.y ?? 0}, ${t.rotation?.z ?? 0})`,
                `Scaling: (${t.scaling?.x ?? 1}, ${t.scaling?.y ?? 1}, ${t.scaling?.z ?? 1})`,
                tn.parentId ? `Parent: ${tn.parentId}` : "",
            ]
                .filter(Boolean)
                .join("\n");
        }

        return `Node "${nodeId}" not found.`;
    }

    // ── Validation ───────────────────────────────────────────────────────

    validateScene(sceneName: string): string[] {
        const scene = this.getScene(sceneName);
        if (!scene) {
            return [`ERROR: Scene "${sceneName}" not found.`];
        }

        const issues: string[] = [];

        // Must have at least one camera
        if (scene.cameras.length === 0) {
            issues.push("WARNING: No camera defined. Add a camera with add_camera.");
        }

        // Must have at least one light
        if (scene.lights.length === 0) {
            issues.push("WARNING: No lights defined. The scene will be dark.");
        }

        // Check active camera
        if (scene.cameras.length > 0 && !scene.activeCameraId) {
            issues.push("WARNING: No active camera set. The first camera will be used by default.");
        }

        // Check material references
        const materialIds = new Set(scene.materials.map((m) => m.id).concat(scene.materials.map((m) => m.name)));
        for (const mesh of scene.meshes) {
            if (mesh.materialId && !materialIds.has(mesh.materialId)) {
                issues.push(`ERROR: Mesh "${mesh.name}" references material "${mesh.materialId}" which doesn't exist.`);
            }
        }

        // Check parent references
        const allNodeIds = new Set<string>();
        scene.meshes.forEach((m) => {
            allNodeIds.add(m.id);
            allNodeIds.add(m.name);
        });
        scene.transformNodes.forEach((n) => {
            allNodeIds.add(n.id);
            allNodeIds.add(n.name);
        });
        scene.cameras.forEach((c) => {
            allNodeIds.add(c.id);
            allNodeIds.add(c.name);
        });
        scene.lights.forEach((l) => {
            allNodeIds.add(l.id);
            allNodeIds.add(l.name);
        });

        for (const mesh of scene.meshes) {
            if (mesh.parentId && !allNodeIds.has(mesh.parentId)) {
                issues.push(`ERROR: Mesh "${mesh.name}" has parent "${mesh.parentId}" which doesn't exist.`);
            }
        }
        for (const tn of scene.transformNodes) {
            if (tn.parentId && !allNodeIds.has(tn.parentId)) {
                issues.push(`ERROR: TransformNode "${tn.name}" has parent "${tn.parentId}" which doesn't exist.`);
            }
        }

        // Check animation targets
        for (const anim of scene.animations) {
            if (!allNodeIds.has(anim.targetId)) {
                issues.push(`ERROR: Animation "${anim.name}" targets "${anim.targetId}" which doesn't exist.`);
            }
        }

        // Check animation group references
        const animIds = new Set(scene.animations.map((a) => a.id));
        for (const ag of scene.animationGroups) {
            for (const animId of ag.animationIds) {
                if (!animIds.has(animId)) {
                    issues.push(`ERROR: AnimationGroup "${ag.name}" references animation "${animId}" which doesn't exist.`);
                }
            }
        }

        // Check sound attachments
        const meshIds = new Set(scene.meshes.map((m) => m.id));
        for (const snd of scene.sounds) {
            if (snd.attachedMeshId && !meshIds.has(snd.attachedMeshId)) {
                issues.push(`ERROR: Sound "${snd.name}" attached to mesh "${snd.attachedMeshId}" which doesn't exist.`);
            }
        }

        // Check particle system emitter references
        for (const ps of scene.particleSystems) {
            if (typeof ps.emitter === "string" && !meshIds.has(ps.emitter)) {
                issues.push(`ERROR: ParticleSystem "${ps.name}" emitter references mesh "${ps.emitter}" which doesn't exist.`);
            }
        }

        // Check physics constraint body references
        const meshesWithBodies = new Set(scene.meshes.filter((m) => m.physics).map((m) => m.id));
        for (const c of scene.physicsConstraints) {
            if (!meshIds.has(c.parentMeshId)) {
                issues.push(`ERROR: PhysicsConstraint "${c.name}" references parent mesh "${c.parentMeshId}" which doesn't exist.`);
            } else if (!meshesWithBodies.has(c.parentMeshId)) {
                issues.push(`WARNING: PhysicsConstraint "${c.name}" parent mesh "${c.parentMeshId}" has no physics body.`);
            }
            if (!meshIds.has(c.childMeshId)) {
                issues.push(`ERROR: PhysicsConstraint "${c.name}" references child mesh "${c.childMeshId}" which doesn't exist.`);
            } else if (!meshesWithBodies.has(c.childMeshId)) {
                issues.push(`WARNING: PhysicsConstraint "${c.name}" child mesh "${c.childMeshId}" has no physics body.`);
            }
        }

        // Check glow layer mesh references
        for (const g of scene.glowLayers) {
            for (const mid of g.includedOnlyMeshIds ?? []) {
                if (!meshIds.has(mid)) {
                    issues.push(`ERROR: GlowLayer "${g.name}" includes mesh "${mid}" which doesn't exist.`);
                }
            }
            for (const mid of g.excludedMeshIds ?? []) {
                if (!meshIds.has(mid)) {
                    issues.push(`ERROR: GlowLayer "${g.name}" excludes mesh "${mid}" which doesn't exist.`);
                }
            }
        }

        // Check highlight layer mesh references
        for (const h of scene.highlightLayers) {
            for (const entry of h.meshes) {
                if (!meshIds.has(entry.meshId)) {
                    issues.push(`ERROR: HighlightLayer "${h.name}" references mesh "${entry.meshId}" which doesn't exist.`);
                }
            }
        }

        if (issues.length === 0) {
            issues.push("OK: Scene is valid!");
        }

        return issues;
    }

    // ── Inspector ─────────────────────────────────────────────────────────

    enableInspector(sceneName: string, enabled: boolean, options?: { overlay?: boolean; initialTab?: string }): string {
        const scene = this.getScene(sceneName);
        if (!scene) {
            return `Scene "${sceneName}" not found.`;
        }
        if (enabled) {
            scene.inspector = {
                enabled: true,
                overlay: options?.overlay,
                initialTab: options?.initialTab,
            };
        } else {
            delete scene.inspector;
        }
        return "OK";
    }

    // ── GUI ───────────────────────────────────────────────────────────────

    /**
     * Attach a GUI descriptor to the scene. This stores the GUI JSON as part of the scene state
     * so that export tools automatically include it without needing external input.
     * @param sceneName The scene to attach the GUI to
     * @param guiJson The GUI descriptor JSON (from the GUI MCP server's export_gui_json)
     * @returns "OK" or an error message
     */
    attachGUI(sceneName: string, guiJson: unknown): string {
        const scene = this.getScene(sceneName);
        if (!scene) {
            return `Scene "${sceneName}" not found.`;
        }
        // Basic validation — must have a root container
        if (typeof guiJson === "string") {
            try {
                guiJson = JSON.parse(guiJson);
            } catch (e) {
                return `Invalid GUI JSON: ${e instanceof Error ? e.message : String(e)}`;
            }
        }
        const gui = guiJson as { root?: unknown };
        if (!gui || typeof gui !== "object" || !gui.root) {
            return "Invalid GUI JSON: must contain a 'root' object.";
        }
        scene.guiJson = guiJson;
        return "OK";
    }

    /**
     * Remove the GUI descriptor from the scene.
     * @param sceneName The scene to detach the GUI from
     * @returns "OK" or an error message
     */
    detachGUI(sceneName: string): string {
        const scene = this.getScene(sceneName);
        if (!scene) {
            return `Scene "${sceneName}" not found.`;
        }
        delete scene.guiJson;
        return "OK";
    }

    /**
     * Describe the attached GUI (if any).
     * This is a simple recursive traversal of the GUI JSON structure to list all controls and their types.
     * @param sceneName The scene to describe the GUI of
     * @returns A markdown string describing the GUI structure, or an error message
     */
    describeGUI(sceneName: string): string {
        const scene = this.getScene(sceneName);
        if (!scene) {
            return `Scene "${sceneName}" not found.`;
        }
        if (!scene.guiJson) {
            return "No GUI attached to this scene.";
        }
        const gui = scene.guiJson as { root?: { children?: Array<{ name?: string; className?: string; text?: string; children?: unknown[] }> } };
        const lines: string[] = [];
        lines.push("## GUI (attached)");
        if (gui.root?.children) {
            function describeControl(ctrl: { name?: string; className?: string; text?: string; children?: unknown[] }, indent: string): void {
                const text = ctrl.text ? ` — "${ctrl.text}"` : "";
                lines.push(`${indent}• "${ctrl.name ?? "unnamed"}" (${ctrl.className ?? "unknown"})${text}`);
                if (ctrl.children) {
                    for (const child of ctrl.children) {
                        describeControl(child as { name?: string; className?: string; text?: string; children?: unknown[] }, indent + "  ");
                    }
                }
            }
            for (const child of gui.root.children) {
                describeControl(child, "  ");
            }
        }
        return lines.join("\n");
    }

    // ── Integrations ─────────────────────────────────────────────────────

    /**
     * Add a runtime integration (bridge between subsystems) to the scene.
     * The integration will be included in exports so that the generated code sets it up at runtime.
     * @param sceneName The scene to add the integration to
     * @param integration The integration descriptor (type and parameters)
     * @returns "OK" or an error message
     */
    addIntegration(sceneName: string, integration: ISerializedIntegration): string {
        const scene = this.getScene(sceneName);
        if (!scene) {
            return `Scene "${sceneName}" not found.`;
        }
        if (!scene.integrations) {
            scene.integrations = [];
        }
        scene.integrations.push(integration);
        return "OK";
    }

    /**
     * Remove an integration by index.
     * Returns "OK" on success, or an error string.
     * @param sceneName The scene to remove the integration from
     * @param index The index of the integration to remove
     * @returns "OK" or an error message
     */
    removeIntegration(sceneName: string, index: number): string {
        const scene = this.getScene(sceneName);
        if (!scene) {
            return `Scene "${sceneName}" not found.`;
        }
        if (!scene.integrations || index < 0 || index >= scene.integrations.length) {
            return `Integration index ${index} out of range.`;
        }
        scene.integrations.splice(index, 1);
        return "OK";
    }

    /**
     * List all integrations attached to the scene.
     * @param sceneName The scene to list integrations of
     * @returns A markdown string describing all integrations, or an error message
     */
    listIntegrations(sceneName: string): string {
        const scene = this.getScene(sceneName);
        if (!scene) {
            return `Scene "${sceneName}" not found.`;
        }
        if (!scene.integrations || scene.integrations.length === 0) {
            return "No integrations configured.";
        }
        const lines: string[] = [`# Integrations for "${sceneName}" (${scene.integrations.length})`];
        for (let i = 0; i < scene.integrations.length; i++) {
            const integ = scene.integrations[i];
            switch (integ.type) {
                case "physicsCollision":
                    lines.push(`  [${i}] physicsCollision: "${integ.sourceBody}" ↔ "${integ.targetBody}" → event "${integ.eventId}"`);
                    break;
                case "variableToProperty":
                    lines.push(`  [${i}] variableToProperty: var "${integ.variableName}" → ${integ.meshName}.material.${integ.property} (${integ.valueType})`);
                    break;
                case "guiButton":
                    lines.push(
                        `  [${i}] guiButton: "${integ.buttonName}" → event "${integ.eventId}"${integ.toggleLabels ? ` (toggle: "${integ.toggleLabels[0]}"/"${integ.toggleLabels[1]}")` : ""}`
                    );
                    break;
                case "collisionCounter":
                    lines.push(`  [${i}] collisionCounter: "${integ.textBlockName}" prefix="${integ.prefix}"`);
                    break;
                case "physicsPositionReset":
                    lines.push(
                        `  [${i}] physicsPositionReset: button "${integ.triggerButtonName}" → reset ${integ.resets.map((r) => `"${r.meshName}" to (${r.position.x},${r.position.y},${r.position.z})`).join(", ")}${integ.resetCollisionCounter ? " + reset counter" : ""}`
                    );
                    break;
                default:
                    lines.push(`  [${i}] ${JSON.stringify(integ)}`);
            }
        }
        return lines.join("\n");
    }

    // ── Export / Import ──────────────────────────────────────────────────

    exportJSON(sceneName: string): string | null {
        const scene = this.getScene(sceneName);
        if (!scene) {
            return null;
        }
        return JSON.stringify(scene, null, 2);
    }

    /**
     * Attach a Node Render Graph JSON descriptor to a scene.
     * The JSON must be NRGE-compatible (from the NRG MCP server's export_graph_json tool).
     * @param sceneName The scene to attach the NRG to
     * @param nrgJson The NRG descriptor JSON
     * @returns "OK" or an error message
     */
    attachNodeRenderGraph(sceneName: string, nrgJson: unknown): string {
        const scene = this.getScene(sceneName);
        if (!scene) {
            return `Scene "${sceneName}" not found.`;
        }
        if (typeof nrgJson === "string") {
            try {
                nrgJson = JSON.parse(nrgJson);
            } catch (e) {
                return `Invalid NRG JSON: ${(e as Error).message}`;
            }
        }
        const nrg = nrgJson as { customType?: string };
        if (nrg.customType !== "BABYLON.NodeRenderGraph") {
            return `Invalid NRG JSON: customType must be "BABYLON.NodeRenderGraph" but got "${nrg.customType}".`;
        }
        scene.nodeRenderGraphJson = nrgJson;
        return "OK";
    }

    /** Remove an attached Node Render Graph from a scene.
     * @param sceneName The scene to detach the NRG from
     * @returns "OK" or an error message
     */
    detachNodeRenderGraph(sceneName: string): string {
        const scene = this.getScene(sceneName);
        if (!scene) {
            return `Scene "${sceneName}" not found.`;
        }
        delete scene.nodeRenderGraphJson;
        return "OK";
    }

    /**
     * Add (or replace) a Node Geometry mesh on a scene.
     * The ngeJson must have customType === "BABYLON.NodeGeometry".
     * @param sceneName The scene to add the mesh to
     * @param meshName The name to give the created mesh
     * @param ngeJson The NGE descriptor JSON (from the NGE MCP server's export_geometry_json)
     * @returns "OK" or an error message
     */
    addNodeGeometryMesh(sceneName: string, meshName: string, ngeJson: unknown): string {
        const scene = this.getScene(sceneName);
        if (!scene) {
            return `Scene "${sceneName}" not found.`;
        }
        if (typeof ngeJson === "string") {
            try {
                ngeJson = JSON.parse(ngeJson);
            } catch (e) {
                return `Invalid NGE JSON: ${(e as Error).message}`;
            }
        }
        const nge = ngeJson as { customType?: string };
        if (nge.customType !== "BABYLON.NodeGeometry") {
            return `Invalid NGE JSON: customType must be "BABYLON.NodeGeometry" but got "${nge.customType}".`;
        }
        if (!scene.nodeGeometryMeshes) {
            scene.nodeGeometryMeshes = [];
        }
        // Replace existing entry with same name, or push new one
        const idx = scene.nodeGeometryMeshes.findIndex((e) => e.name === meshName);
        if (idx >= 0) {
            scene.nodeGeometryMeshes[idx] = { name: meshName, ngeJson };
        } else {
            scene.nodeGeometryMeshes.push({ name: meshName, ngeJson });
        }
        return "OK";
    }

    /**
     * Remove a Node Geometry mesh from a scene.
     * @param sceneName The scene to remove the mesh from
     * @param meshName The name of the mesh to remove
     * @returns "OK" or an error message
     */
    removeNodeGeometryMesh(sceneName: string, meshName: string): string {
        const scene = this.getScene(sceneName);
        if (!scene) {
            return `Scene "${sceneName}" not found.`;
        }
        if (!scene.nodeGeometryMeshes) {
            return `No node geometry meshes on scene "${sceneName}".`;
        }
        const before = scene.nodeGeometryMeshes.length;
        scene.nodeGeometryMeshes = scene.nodeGeometryMeshes.filter((e) => e.name !== meshName);
        if (scene.nodeGeometryMeshes.length === before) {
            return `Mesh "${meshName}" not found in scene "${sceneName}".`;
        }
        return "OK";
    }

    exportCode(sceneName: string, options?: ICodeGeneratorOptions): string | null {
        const scene = this.getScene(sceneName);
        if (!scene) {
            return null;
        }
        // Auto-use stored GUI unless caller provides an explicit override
        const opts = { ...options };
        if (opts.guiJson === undefined && scene.guiJson) {
            opts.guiJson = scene.guiJson;
        }
        if (opts.nodeRenderGraphJson === undefined && scene.nodeRenderGraphJson) {
            opts.nodeRenderGraphJson = scene.nodeRenderGraphJson;
        }
        if (opts.nodeGeometryMeshes === undefined && scene.nodeGeometryMeshes) {
            opts.nodeGeometryMeshes = scene.nodeGeometryMeshes;
        }
        return generateSceneCode(scene, opts);
    }

    /**
     * Generate a complete ES6 project structure from a scene.
     * Returns a map of relative file paths to file content strings.
     * This includes package.json, tsconfig.json, vite.config.ts, index.html, and src/index.ts.
     * @param sceneName The name of the scene to export
     * @param options Optional code generation options
     * @returns A map of relative file paths to file content strings, or null if scene not found
     */
    exportProject(sceneName: string, options?: ICodeGeneratorOptions): Record<string, string> | null {
        const scene = this.getScene(sceneName);
        if (!scene) {
            return null;
        }
        // Auto-use stored GUI unless caller provides an explicit override
        const opts = { ...options };
        if (opts.guiJson === undefined && scene.guiJson) {
            opts.guiJson = scene.guiJson;
        }
        if (opts.nodeRenderGraphJson === undefined && scene.nodeRenderGraphJson) {
            opts.nodeRenderGraphJson = scene.nodeRenderGraphJson;
        }
        if (opts.nodeGeometryMeshes === undefined && scene.nodeGeometryMeshes) {
            opts.nodeGeometryMeshes = scene.nodeGeometryMeshes;
        }
        return generateProjectFiles(scene, opts);
    }

    importJSON(sceneName: string, json: string): string {
        try {
            const parsed = JSON.parse(json) as ISerializedScene;
            if (!parsed.version || !parsed.meshes) {
                return "Invalid scene JSON: missing required fields (version, meshes).";
            }
            parsed.name = sceneName;
            this.scenes.set(sceneName, parsed);

            // Update id counters based on imported data
            const allIds = [
                ...parsed.meshes.map((m) => m.id),
                ...parsed.transformNodes.map((n) => n.id),
                ...parsed.cameras.map((c) => c.id),
                ...parsed.lights.map((l) => l.id),
                ...parsed.materials.map((m) => m.id),
                ...parsed.textures.map((t) => t.id),
                ...parsed.animations.map((a) => a.id),
                ...parsed.animationGroups.map((ag) => ag.id),
                ...parsed.models.map((m) => m.id),
                ...parsed.flowGraphs.map((fg) => fg.id),
                ...(parsed.sounds ?? []).map((s) => s.id),
                ...(parsed.particleSystems ?? []).map((ps) => ps.id),
                ...(parsed.physicsConstraints ?? []).map((c) => c.id),
                ...(parsed.glowLayers ?? []).map((g) => g.id),
                ...(parsed.highlightLayers ?? []).map((h) => h.id),
            ];
            for (const id of allIds) {
                const match = id.match(/^(.+)_(\d+)$/);
                if (match) {
                    const prefix = match[1];
                    const num = parseInt(match[2], 10);
                    const key = `${sceneName}:${prefix}`;
                    if (num > (this.idCounters.get(key) ?? 0)) {
                        this.idCounters.set(key, num);
                    }
                }
            }

            return "OK";
        } catch (e) {
            return `Failed to parse JSON: ${e instanceof Error ? e.message : String(e)}`;
        }
    }
}

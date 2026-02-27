/* eslint-disable @typescript-eslint/naming-convention */
/**
 * Code Generator — converts an ISerializedScene into runnable TypeScript code
 * that uses the Babylon.js API to construct the entire scene programmatically.
 *
 * This approach is necessary because:
 * 1. The .babylon JSON format does NOT support FlowGraph serialization
 * 2. Code can express everything: scene setup, NME materials, flow graphs,
 *    animations, physics, model loading, etc.
 * 3. Code is immediately runnable and easy to modify
 * 4. Follows the pattern established by NodeMaterial.generateCode()
 */

import {
    type ISerializedScene,
    type ISerializedCamera,
    type ISerializedLight,
    type ISerializedMaterial,
    type ISerializedMesh,
    type ISerializedModel,
    type ISerializedAnimation,
    type ISerializedAnimationGroup,
    type ISerializedTransformNode,
    type ISerializedFlowGraphRef,
    type ISerializedEnvironment,
    type ISerializedSound,
    type ISerializedParticleSystem,
    type ISerializedPhysicsConstraint,
    type ISerializedRenderPipeline,
    type ISerializedGlowLayer,
    type ISerializedHighlightLayer,
    type ISerializedIntegration,
    type IPhysicsCollisionEventIntegration,
    type IVariableToPropertyIntegration,
    type IGuiButtonEventIntegration,
    type ICollisionCounterIntegration,
    type IPhysicsPositionResetIntegration,
    type ISerializedInspector,
    type IVector3,
    type IColor3,
    type IColor4,
    type ITransform,
} from "./sceneManager.js";

// ─── Helpers ──────────────────────────────────────────────────────────────

function indent(code: string, level: number): string {
    const pad = "    ".repeat(level);
    return code
        .split("\n")
        .map((line) => (line.trim() ? pad + line : ""))
        .join("\n");
}

function vec3(v: IVector3 | undefined): string {
    if (!v) {
        return "BABYLON.Vector3.Zero()";
    }
    return `new BABYLON.Vector3(${v.x}, ${v.y}, ${v.z})`;
}

function col3(c: IColor3 | undefined): string {
    if (!c) {
        return "new BABYLON.Color3(1, 1, 1)";
    }
    return `new BABYLON.Color3(${c.r}, ${c.g}, ${c.b})`;
}

function col4(c: IColor4 | undefined): string {
    if (!c) {
        return "new BABYLON.Color4(0.2, 0.2, 0.3, 1)";
    }
    return `new BABYLON.Color4(${c.r}, ${c.g}, ${c.b}, ${c.a})`;
}

function varName(name: string): string {
    // Convert a human-readable name to a valid JS variable name
    return name.replace(/[^a-zA-Z0-9_$]/g, "_").replace(/^(\d)/, "_$1");
}

function sanitizeStringLiteral(s: string): string {
    return s.replace(/\\/g, "\\\\").replace(/"/g, '\\"').replace(/\n/g, "\\n");
}

/**
 * Extract the numeric suffix from internal IDs like "mesh_5" → 5, "cam_1" → 1.
 * This is used to set `uniqueId` on generated objects so that FlowGraph's
 * GetAssetBlock (with useIndexAsUniqueId: true) can resolve assets correctly.
 * @param internalId - The internal ID string to extract the numeric suffix from
 * @returns The numeric suffix as a number, or null if no numeric suffix is found
 */
function extractNumericId(internalId: string): number | null {
    const match = internalId.match(/_(\d+)$/);
    return match ? parseInt(match[1], 10) : null;
}

/**
 * Safely emit a value for properties like color/vector that can be obj or array.
 * @param key - The property key, used to infer the type (e.g. color vs vector)
 * @param value - The raw value to convert to a code string
 * @returns A string of Babylon.js code representing the value
 */
function emitPropertyValue(key: string, value: unknown): string {
    if (value === null || value === undefined) {
        return "undefined";
    }
    if (typeof value === "boolean" || typeof value === "number") {
        return String(value);
    }
    if (typeof value === "string") {
        return `"${sanitizeStringLiteral(value)}"`;
    }
    if (Array.isArray(value)) {
        if (value.length === 3) {
            // Could be Vector3 or Color3 — context dependent
            if (
                key.toLowerCase().includes("color") ||
                key.toLowerCase().includes("diffuse") ||
                key.toLowerCase().includes("specular") ||
                key.toLowerCase().includes("emissive") ||
                key.toLowerCase().includes("ambient")
            ) {
                return `new BABYLON.Color3(${value[0]}, ${value[1]}, ${value[2]})`;
            }
            return `new BABYLON.Vector3(${value[0]}, ${value[1]}, ${value[2]})`;
        }
        if (value.length === 4) {
            return `new BABYLON.Color4(${value[0]}, ${value[1]}, ${value[2]}, ${value[3]})`;
        }
        return JSON.stringify(value);
    }
    if (typeof value === "object") {
        const obj = value as Record<string, unknown>;
        if ("x" in obj && "y" in obj && "z" in obj) {
            return `new BABYLON.Vector3(${obj.x}, ${obj.y}, ${obj.z})`;
        }
        if ("r" in obj && "g" in obj && "b" in obj) {
            if ("a" in obj) {
                return `new BABYLON.Color4(${obj.r}, ${obj.g}, ${obj.b}, ${obj.a})`;
            }
            return `new BABYLON.Color3(${obj.r}, ${obj.g}, ${obj.b})`;
        }
        return JSON.stringify(value);
    }
    return String(value);
}

// ─── Animation data type constants ────────────────────────────────────────

const ANIM_DATA_TYPE_NAMES: Record<number, string> = {
    0: "BABYLON.Animation.ANIMATIONTYPE_FLOAT",
    1: "BABYLON.Animation.ANIMATIONTYPE_VECTOR3",
    2: "BABYLON.Animation.ANIMATIONTYPE_QUATERNION",
    3: "BABYLON.Animation.ANIMATIONTYPE_COLOR3",
    4: "BABYLON.Animation.ANIMATIONTYPE_COLOR4",
    5: "BABYLON.Animation.ANIMATIONTYPE_VECTOR2",
};

const ANIM_LOOP_MODE_NAMES: Record<number, string> = {
    0: "BABYLON.Animation.ANIMATIONLOOPMODE_RELATIVE",
    1: "BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE",
    2: "BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT",
    4: "BABYLON.Animation.ANIMATIONLOOPMODE_YOYO",
};

const PHYSICS_BODY_TYPE_NAMES: Record<number, string> = {
    0: "BABYLON.PhysicsMotionType.STATIC",
    1: "BABYLON.PhysicsMotionType.ANIMATED",
    2: "BABYLON.PhysicsMotionType.DYNAMIC",
};

// ═══════════════════════════════════════════════════════════════════════════
//  Section generators
// ═══════════════════════════════════════════════════════════════════════════

function generateHeader(scene: ISerializedScene): string {
    const lines: string[] = [];
    lines.push(`/**`);
    lines.push(` * ${scene.name}`);
    if (scene.description) {
        lines.push(` * ${scene.description}`);
    }
    lines.push(` *`);
    lines.push(` * Generated by Babylon.js Scene MCP Server`);
    lines.push(` * Version: ${scene.version}`);
    lines.push(` */`);
    lines.push(``);
    return lines.join("\n");
}

function generateImports(scene: ISerializedScene): string {
    const lines: string[] = [];
    lines.push(`// ─── Imports ──────────────────────────────────────────────────────────────`);
    lines.push(`// If using ES modules / npm:`);
    lines.push(`// import * as BABYLON from "@babylonjs/core";`);
    lines.push(`// import "@babylonjs/loaders"; // For glTF/OBJ model loading`);

    const hasPhysics = scene.environment.physicsEnabled || scene.meshes.some((m) => m.physics);
    if (hasPhysics) {
        const plugin = scene.environment.physicsPlugin ?? "havok";
        if (plugin === "havok") {
            lines.push(`// import HavokPhysics from "@babylonjs/havok";`);
        }
    }

    const hasFlowGraph = scene.flowGraphs.length > 0;
    if (hasFlowGraph) {
        lines.push(`// import "@babylonjs/core/FlowGraph"; // For flow graph support`);
    }

    const hasNRG = !!scene.nodeRenderGraphJson;
    if (hasNRG) {
        lines.push(`// import "@babylonjs/core/FrameGraph"; // For NodeRenderGraph support`);
    }

    const hasNGE = (scene.nodeGeometryMeshes ?? []).length > 0;
    if (hasNGE) {
        lines.push(`// import "@babylonjs/core/Meshes/Node/nodeGeometry"; // For NodeGeometry support`);
    }

    const hasAudio = (scene.sounds ?? []).length > 0;
    if (hasAudio) {
        lines.push(`// import "@babylonjs/core/Audio/v2"; // For Audio V2 support`);
    }
    lines.push(``);
    return lines.join("\n");
}

function generateEnvironment(env: ISerializedEnvironment, sceneVar: string): string {
    const lines: string[] = [];
    lines.push(`// ─── Environment ──────────────────────────────────────────────────────────`);

    if (env.clearColor) {
        lines.push(`${sceneVar}.clearColor = ${col4(env.clearColor)};`);
    }
    if (env.ambientColor) {
        lines.push(`${sceneVar}.ambientColor = ${col3(env.ambientColor)};`);
    }

    // Fog
    if (env.fogEnabled) {
        const fogModeMap: Record<number, string> = {
            0: "BABYLON.Scene.FOGMODE_NONE",
            1: "BABYLON.Scene.FOGMODE_EXP",
            2: "BABYLON.Scene.FOGMODE_EXP2",
            3: "BABYLON.Scene.FOGMODE_LINEAR",
        };
        lines.push(`${sceneVar}.fogEnabled = true;`);
        lines.push(`${sceneVar}.fogMode = ${fogModeMap[env.fogMode ?? 1]};`);
        if (env.fogColor) {
            lines.push(`${sceneVar}.fogColor = ${col3(env.fogColor)};`);
        }
        if (env.fogDensity !== undefined) {
            lines.push(`${sceneVar}.fogDensity = ${env.fogDensity};`);
        }
        if (env.fogStart !== undefined) {
            lines.push(`${sceneVar}.fogStart = ${env.fogStart};`);
        }
        if (env.fogEnd !== undefined) {
            lines.push(`${sceneVar}.fogEnd = ${env.fogEnd};`);
        }
    }

    // Environment texture
    if (env.environmentTexture) {
        lines.push(`${sceneVar}.environmentTexture = BABYLON.CubeTexture.CreateFromPrefilteredData("${sanitizeStringLiteral(env.environmentTexture)}", ${sceneVar});`);
    }

    // Skybox
    if (env.skyboxSize && env.skyboxSize > 0) {
        lines.push(``);
        lines.push(`// Skybox`);
        lines.push(`const skybox = BABYLON.MeshBuilder.CreateBox("skybox", { size: ${env.skyboxSize} }, ${sceneVar});`);
        lines.push(`const skyboxMaterial = new BABYLON.StandardMaterial("skyboxMat", ${sceneVar});`);
        lines.push(`skyboxMaterial.backFaceCulling = false;`);
        if (env.environmentTexture) {
            lines.push(
                `skyboxMaterial.reflectionTexture = ${sceneVar}.environmentTexture?.clone?.() ?? new BABYLON.CubeTexture("${sanitizeStringLiteral(env.environmentTexture)}", ${sceneVar});`
            );
            lines.push(`skyboxMaterial.reflectionTexture.coordinatesMode = BABYLON.Texture.SKYBOX_MODE;`);
        } else {
            // No environment texture – leave reflectionTexture unset so
            // we don't create a CubeTexture("") that never becomes ready
            // (which would block scene.whenReadyAsync() forever).
            lines.push(`// No environmentTexture set – skybox will render as solid dark box.`);
        }
        lines.push(`skyboxMaterial.diffuseColor = new BABYLON.Color3(0, 0, 0);`);
        lines.push(`skyboxMaterial.specularColor = new BABYLON.Color3(0, 0, 0);`);
        lines.push(`skybox.material = skyboxMaterial;`);
        lines.push(`skybox.infiniteDistance = true;`);
    }

    // Default ground
    if (env.createDefaultGround) {
        const sz = env.groundSize ?? 10;
        lines.push(``);
        lines.push(`// Default ground`);
        lines.push(`const defaultGround = BABYLON.MeshBuilder.CreateGround("defaultGround", { width: ${sz}, height: ${sz} }, ${sceneVar});`);
        if (env.groundColor) {
            lines.push(`const defaultGroundMat = new BABYLON.StandardMaterial("defaultGroundMat", ${sceneVar});`);
            lines.push(`defaultGroundMat.diffuseColor = ${col3(env.groundColor)};`);
            lines.push(`defaultGround.material = defaultGroundMat;`);
        }
    }

    // Gravity
    if (env.gravity) {
        lines.push(`${sceneVar}.gravity = ${vec3(env.gravity)};`);
    }

    lines.push(``);
    return lines.join("\n");
}

function generatePhysicsInit(env: ISerializedEnvironment, sceneVar: string): string {
    if (!env.physicsEnabled && !env.gravity) {
        return "";
    }
    const lines: string[] = [];
    const plugin = (env.physicsPlugin ?? "havok").toLowerCase().replace("plugin", "").replace("physics", "") || "havok";

    lines.push(`// ─── Physics ──────────────────────────────────────────────────────────────`);
    if (plugin.includes("havok") || plugin === "havok") {
        lines.push(`const havokInstance = await HavokPhysics();`);
        lines.push(`const havokPlugin = new BABYLON.HavokPlugin(true, havokInstance);`);
        lines.push(`${sceneVar}.enablePhysics(${vec3(env.gravity)}, havokPlugin);`);
    } else {
        // Default to Havok Physics V2 — the only supported physics engine
        lines.push(`const havokInstance = await HavokPhysics();`);
        lines.push(`const havokPlugin = new BABYLON.HavokPlugin(true, havokInstance);`);
        lines.push(`${sceneVar}.enablePhysics(${vec3(env.gravity)}, havokPlugin);`);
    }
    lines.push(``);
    return lines.join("\n");
}

function generateCamera(cam: ISerializedCamera, sceneVar: string): string {
    const lines: string[] = [];
    const v = varName(cam.name);
    const props = cam.properties;

    switch (cam.type) {
        case "ArcRotateCamera": {
            const alpha = props.alpha ?? -Math.PI / 2;
            const beta = props.beta ?? Math.PI / 2;
            const radius = props.radius ?? 10;
            const target = props.target;
            const targetStr = target ? emitPropertyValue("target", target) : "BABYLON.Vector3.Zero()";
            lines.push(`const ${v} = new BABYLON.ArcRotateCamera("${sanitizeStringLiteral(cam.name)}", ${alpha}, ${beta}, ${radius}, ${targetStr}, ${sceneVar});`);
            break;
        }
        case "FreeCamera": {
            const pos = props.position;
            const posStr = pos ? emitPropertyValue("position", pos) : "new BABYLON.Vector3(0, 5, -10)";
            lines.push(`const ${v} = new BABYLON.FreeCamera("${sanitizeStringLiteral(cam.name)}", ${posStr}, ${sceneVar});`);
            break;
        }
        case "UniversalCamera": {
            const pos = props.position;
            const posStr = pos ? emitPropertyValue("position", pos) : "new BABYLON.Vector3(0, 5, -10)";
            lines.push(`const ${v} = new BABYLON.UniversalCamera("${sanitizeStringLiteral(cam.name)}", ${posStr}, ${sceneVar});`);
            break;
        }
        case "FollowCamera": {
            const pos = props.position;
            const posStr = pos ? emitPropertyValue("position", pos) : "new BABYLON.Vector3(0, 5, -10)";
            lines.push(`const ${v} = new BABYLON.FollowCamera("${sanitizeStringLiteral(cam.name)}", ${posStr}, ${sceneVar});`);
            break;
        }
        default:
            lines.push(`const ${v} = new BABYLON.${cam.type}("${sanitizeStringLiteral(cam.name)}", BABYLON.Vector3.Zero(), ${sceneVar});`);
    }

    // Set uniqueId so FlowGraph GetAssetBlock (useIndexAsUniqueId) can resolve this camera
    const camNumId = extractNumericId(cam.id);
    if (camNumId !== null) {
        lines.push(`${v}.uniqueId = ${camNumId};`);
    }

    // Set remaining properties (skip the ones already used in constructor)
    const skipProps = new Set(["alpha", "beta", "radius", "target", "position", "attachControl"]);
    for (const [key, value] of Object.entries(props)) {
        if (skipProps.has(key)) {
            continue;
        }
        if (key === "lockedTarget") {
            // Will be set later after meshes are created
            continue;
        }
        lines.push(`${v}.${key} = ${emitPropertyValue(key, value)};`);
    }

    // target for FreeCamera/UniversalCamera
    if ((cam.type === "FreeCamera" || cam.type === "UniversalCamera") && props.target) {
        lines.push(`${v}.setTarget(${emitPropertyValue("target", props.target)});`);
    }

    if (props.speed !== undefined) {
        lines.push(`${v}.speed = ${props.speed};`);
    }

    // Attach control
    if (props.attachControl !== false) {
        lines.push(`${v}.attachControl(canvas, true);`);
    }

    return lines.join("\n");
}

function generateLight(light: ISerializedLight, sceneVar: string): string {
    const lines: string[] = [];
    const v = varName(light.name);
    const props = light.properties;

    switch (light.type) {
        case "HemisphericLight": {
            const dir = props.direction;
            const dirStr = dir ? emitPropertyValue("direction", dir) : "new BABYLON.Vector3(0, 1, 0)";
            lines.push(`const ${v} = new BABYLON.HemisphericLight("${sanitizeStringLiteral(light.name)}", ${dirStr}, ${sceneVar});`);
            break;
        }
        case "PointLight": {
            const pos = props.position;
            const posStr = pos ? emitPropertyValue("position", pos) : "new BABYLON.Vector3(0, 5, 0)";
            lines.push(`const ${v} = new BABYLON.PointLight("${sanitizeStringLiteral(light.name)}", ${posStr}, ${sceneVar});`);
            break;
        }
        case "DirectionalLight": {
            const dir = props.direction;
            const dirStr = dir ? emitPropertyValue("direction", dir) : "new BABYLON.Vector3(0, -1, 0)";
            lines.push(`const ${v} = new BABYLON.DirectionalLight("${sanitizeStringLiteral(light.name)}", ${dirStr}, ${sceneVar});`);
            break;
        }
        case "SpotLight": {
            const pos = props.position ?? { x: 0, y: 10, z: 0 };
            const dir = props.direction ?? { x: 0, y: -1, z: 0 };
            const angle = props.angle ?? Math.PI / 3;
            const exponent = props.exponent ?? 2;
            lines.push(
                `const ${v} = new BABYLON.SpotLight("${sanitizeStringLiteral(light.name)}", ${emitPropertyValue("pos", pos)}, ${emitPropertyValue("dir", dir)}, ${angle}, ${exponent}, ${sceneVar});`
            );
            break;
        }
        default:
            lines.push(`const ${v} = new BABYLON.${light.type}("${sanitizeStringLiteral(light.name)}", BABYLON.Vector3.Zero(), ${sceneVar});`);
    }

    // Set uniqueId so FlowGraph GetAssetBlock (useIndexAsUniqueId) can resolve this light
    const lightNumId = extractNumericId(light.id);
    if (lightNumId !== null) {
        lines.push(`${v}.uniqueId = ${lightNumId};`);
    }

    // Set remaining properties
    const skipProps = new Set(["direction", "position", "angle", "exponent"]);
    for (const [key, value] of Object.entries(props)) {
        if (skipProps.has(key)) {
            continue;
        }
        if (key === "shadowEnabled" && value) {
            lines.push(`const ${v}ShadowGen = new BABYLON.ShadowGenerator(${props.shadowMapSize ?? 1024}, ${v});`);
            continue;
        }
        if (key === "shadowMapSize") {
            continue;
        } // handled with shadowEnabled
        lines.push(`${v}.${key} = ${emitPropertyValue(key, value)};`);
    }

    if (light.isEnabled === false) {
        lines.push(`${v}.setEnabled(false);`);
    }

    return lines.join("\n");
}

function generateMaterial(mat: ISerializedMaterial, sceneVar: string): string {
    const lines: string[] = [];
    const v = varName(mat.name);

    if (mat.type === "NodeMaterial") {
        // NodeMaterial — either from NME JSON or snippet
        if (mat.snippetId) {
            lines.push(`const ${v} = await BABYLON.NodeMaterial.ParseFromSnippetAsync("${sanitizeStringLiteral(mat.snippetId)}", ${sceneVar});`);
            lines.push(`${v}.name = "${sanitizeStringLiteral(mat.name)}";`);
        } else if (mat.nmeJson) {
            lines.push(`// NodeMaterial from NME JSON`);
            lines.push(`const ${v}Json = ${mat.nmeJson};`);
            lines.push(`const ${v} = BABYLON.NodeMaterial.Parse(${v}Json, ${sceneVar});`);
            lines.push(`${v}.name = "${sanitizeStringLiteral(mat.name)}";`);
            // Note: NodeMaterial.Parse() already calls .build() internally — no need to call it again
        } else {
            lines.push(`const ${v} = new BABYLON.NodeMaterial("${sanitizeStringLiteral(mat.name)}", ${sceneVar});`);
            lines.push(`// TODO: Configure NodeMaterial blocks programmatically or load from snippet/JSON`);
        }
    } else {
        // Standard or PBR material
        const className = mat.type === "PBRMaterial" ? "PBRMaterial" : "StandardMaterial";
        lines.push(`const ${v} = new BABYLON.${className}("${sanitizeStringLiteral(mat.name)}", ${sceneVar});`);

        // Set uniqueId so FlowGraph GetAssetBlock (useIndexAsUniqueId) can resolve this material
        const matNumId = extractNumericId(mat.id);
        if (matNumId !== null) {
            lines.push(`${v}.uniqueId = ${matNumId};`);
        }

        for (const [key, value] of Object.entries(mat.properties)) {
            if (value === undefined || value === null) {
                continue;
            }

            // Texture properties
            if (typeof value === "string" && (key.endsWith("Texture") || key.endsWith("texture"))) {
                lines.push(`${v}.${key} = new BABYLON.Texture("${sanitizeStringLiteral(value)}", ${sceneVar});`);
                continue;
            }

            lines.push(`${v}.${key} = ${emitPropertyValue(key, value)};`);
        }
    }

    return lines.join("\n");
}

function generateTransformCode(v: string, transform: ITransform): string {
    const lines: string[] = [];
    if (transform.position && (transform.position.x !== 0 || transform.position.y !== 0 || transform.position.z !== 0)) {
        lines.push(`${v}.position = ${vec3(transform.position)};`);
    }
    if (transform.rotation && (transform.rotation.x !== 0 || transform.rotation.y !== 0 || transform.rotation.z !== 0)) {
        lines.push(`${v}.rotation = ${vec3(transform.rotation)};`);
    }
    if (transform.scaling && (transform.scaling.x !== 1 || transform.scaling.y !== 1 || transform.scaling.z !== 1)) {
        lines.push(`${v}.scaling = ${vec3(transform.scaling)};`);
    }
    return lines.join("\n");
}

function generateTransformNode(node: ISerializedTransformNode, sceneVar: string): string {
    const lines: string[] = [];
    const v = varName(node.name);
    lines.push(`const ${v} = new BABYLON.TransformNode("${sanitizeStringLiteral(node.name)}", ${sceneVar});`);
    const transformCode = generateTransformCode(v, node.transform);
    if (transformCode) {
        lines.push(transformCode);
    }
    return lines.join("\n");
}

function generateMesh(mesh: ISerializedMesh, sceneVar: string): string {
    const lines: string[] = [];
    const v = varName(mesh.name);
    const pType = mesh.primitiveType ?? "Box";

    // Construct options object literal
    const opts = mesh.primitiveOptions ?? {};
    const optsEntries = Object.entries(opts).filter(([, val]) => val !== undefined);
    const optsStr = optsEntries.length > 0 ? `{ ${optsEntries.map(([k, val]) => `${k}: ${JSON.stringify(val)}`).join(", ")} }` : "{}";

    lines.push(`const ${v} = BABYLON.MeshBuilder.Create${pType}("${sanitizeStringLiteral(mesh.name)}", ${optsStr}, ${sceneVar});`);

    // Set uniqueId so FlowGraph GetAssetBlock (useIndexAsUniqueId) can resolve this mesh
    const meshNumId = extractNumericId(mesh.id);
    if (meshNumId !== null) {
        lines.push(`${v}.uniqueId = ${meshNumId};`);
    }

    // Transform
    const transformCode = generateTransformCode(v, mesh.transform);
    if (transformCode) {
        lines.push(transformCode);
    }

    // Properties
    if (mesh.isVisible === false) {
        lines.push(`${v}.isVisible = false;`);
    }
    if (mesh.isPickable === false) {
        lines.push(`${v}.isPickable = false;`);
    }
    if (mesh.receiveShadows) {
        lines.push(`${v}.receiveShadows = true;`);
    }

    return lines.join("\n");
}

function generateModel(model: ISerializedModel, sceneVar: string): string {
    const lines: string[] = [];
    const v = varName(model.name);
    const rootUrl = model.rootUrl ?? "";
    const fileName = model.fileName ?? model.url;

    lines.push(`const ${v}Result = await BABYLON.SceneLoader.ImportMeshAsync("", "${sanitizeStringLiteral(rootUrl)}", "${sanitizeStringLiteral(fileName)}", ${sceneVar});`);
    lines.push(`const ${v} = ${v}Result.meshes[0];`);
    lines.push(`${v}.name = "${sanitizeStringLiteral(model.name)}";`);

    // Transform
    const transformCode = generateTransformCode(v, model.transform);
    if (transformCode) {
        lines.push(transformCode);
    }

    // Animation groups
    if (model.animationGroups?.length) {
        lines.push(``);
        lines.push(`// Animation groups from model`);
        for (const agName of model.animationGroups) {
            const agVar = varName(`${model.name}_${agName}`);
            lines.push(`const ${agVar} = ${sceneVar}.getAnimationGroupByName("${sanitizeStringLiteral(agName)}");`);
        }
    }

    return lines.join("\n");
}

function generateAnimation(anim: ISerializedAnimation, _sceneVar: string): string {
    const lines: string[] = [];
    const v = varName(anim.name);
    const dataType = ANIM_DATA_TYPE_NAMES[anim.dataType] ?? `${anim.dataType}`;
    const loopMode = ANIM_LOOP_MODE_NAMES[anim.loopMode] ?? `${anim.loopMode}`;

    lines.push(`const ${v} = new BABYLON.Animation("${sanitizeStringLiteral(anim.name)}", "${anim.property}", ${anim.fps}, ${dataType}, ${loopMode});`);

    // Keyframes
    lines.push(`${v}.setKeys([`);
    for (const key of anim.keys) {
        const valueStr = emitPropertyValue(anim.property, key.value);
        if (key.inTangent !== undefined || key.outTangent !== undefined) {
            const inT = key.inTangent !== undefined ? emitPropertyValue(anim.property, key.inTangent) : "undefined";
            const outT = key.outTangent !== undefined ? emitPropertyValue(anim.property, key.outTangent) : "undefined";
            lines.push(`    { frame: ${key.frame}, value: ${valueStr}, inTangent: ${inT}, outTangent: ${outT} },`);
        } else {
            lines.push(`    { frame: ${key.frame}, value: ${valueStr} },`);
        }
    }
    lines.push(`]);`);

    // Easing
    if (anim.easingFunction) {
        const easingVar = `${v}Easing`;
        lines.push(`const ${easingVar} = new BABYLON.${anim.easingFunction}();`);
        if (anim.easingMode !== undefined) {
            const modeMap: Record<number, string> = {
                0: "BABYLON.EasingFunction.EASINGMODE_EASEIN",
                1: "BABYLON.EasingFunction.EASINGMODE_EASEOUT",
                2: "BABYLON.EasingFunction.EASINGMODE_EASEINOUT",
            };
            lines.push(`${easingVar}.setEasingMode(${modeMap[anim.easingMode] ?? anim.easingMode});`);
        }
        lines.push(`${v}.setEasingFunction(${easingVar});`);
    }

    return lines.join("\n");
}

function generateAnimationGroup(ag: ISerializedAnimationGroup, scene: ISerializedScene, sceneVar: string): string {
    const lines: string[] = [];
    const v = varName(ag.name);

    lines.push(`const ${v} = new BABYLON.AnimationGroup("${sanitizeStringLiteral(ag.name)}", ${sceneVar});`);

    // Add targeted animations
    for (const animId of ag.animationIds) {
        const anim = scene.animations.find((a) => a.id === animId);
        if (anim) {
            const animVar = varName(anim.name);
            const targetVar = varName(anim.targetId);
            // Try to find the target by name first, then by id
            const targetNode =
                scene.meshes.find((m) => m.id === anim.targetId || m.name === anim.targetId) ??
                scene.transformNodes.find((n) => n.id === anim.targetId || n.name === anim.targetId);
            const resolvedTargetVar = targetNode ? varName(targetNode.name) : targetVar;
            lines.push(`${v}.addTargetedAnimation(${animVar}, ${resolvedTargetVar});`);
        }
    }

    if (ag.from !== undefined || ag.to !== undefined) {
        lines.push(`${v}.normalize(${ag.from ?? 0}, ${ag.to ?? 100});`);
    }
    if (ag.speedRatio !== undefined && ag.speedRatio !== 1) {
        lines.push(`${v}.speedRatio = ${ag.speedRatio};`);
    }
    if (ag.isLooping) {
        lines.push(`${v}.loopAnimation = true;`);
    }
    if (ag.autoStart) {
        lines.push(`${v}.play(${ag.isLooping ? "true" : ""});`);
    }

    return lines.join("\n");
}

function generatePhysicsBody(meshName: string, mesh: ISerializedMesh, enableCollisionCallbacks?: boolean): string {
    if (!mesh.physics) {
        return "";
    }
    const lines: string[] = [];
    const v = varName(meshName);
    const p = mesh.physics;
    const bodyTypeStr = PHYSICS_BODY_TYPE_NAMES[p.bodyType] ?? `${p.bodyType}`;

    lines.push(`// Physics for ${meshName}`);
    lines.push(`const ${v}PhysicsBody = new BABYLON.PhysicsBody(${v}, ${bodyTypeStr}, false, ${v}.getScene());`);

    // Shape — use FromMesh for geometric shapes (Box, Sphere, Capsule, Cylinder)
    // and direct constructors for mesh-based shapes (Mesh, ConvexHull)
    switch (p.shapeType) {
        case "Box":
        case "Sphere":
        case "Capsule":
        case "Cylinder":
            lines.push(`const ${v}PhysicsShape = BABYLON.PhysicsShape${p.shapeType}.FromMesh(${v});`);
            break;
        default:
            lines.push(`const ${v}PhysicsShape = new BABYLON.PhysicsShape${p.shapeType}(${v}, ${v}.getScene());`);
            break;
    }

    if (p.mass !== undefined) {
        lines.push(`${v}PhysicsBody.setMassProperties({ mass: ${p.mass} });`);
    }
    if (p.friction !== undefined) {
        lines.push(`${v}PhysicsShape.material = { friction: ${p.friction}${p.restitution !== undefined ? `, restitution: ${p.restitution}` : ""} };`);
    } else if (p.restitution !== undefined) {
        lines.push(`${v}PhysicsShape.material = { restitution: ${p.restitution} };`);
    }
    if (p.linearDamping !== undefined) {
        lines.push(`${v}PhysicsBody.setLinearDamping(${p.linearDamping});`);
    }
    if (p.angularDamping !== undefined) {
        lines.push(`${v}PhysicsBody.setAngularDamping(${p.angularDamping});`);
    }

    lines.push(`${v}PhysicsBody.shape = ${v}PhysicsShape;`);

    if (enableCollisionCallbacks) {
        lines.push(`${v}PhysicsBody.setCollisionCallbackEnabled(true);`);
    }

    return lines.join("\n");
}

/**
 * Extract blocks that have config.code from the coordinator JSON and need runtime
 * function injection.  Two patterns are supported:
 *
 * 1. **FunctionReference + CodeExecution** (Gap 20):
 *    The engine's FunctionReference block expects `functionName` + `object` data inputs
 *    (to do `object[functionName].bind(context)`) and completely ignores `config.code`.
 *    We compile config.code into a real function and inject it on the FunctionReference's
 *    OUTPUT connection so the downstream CodeExecution block can pick it up.
 *
 * 2. **Standalone CodeExecution** (Gap 31):
 *    The engine's CodeExecution block reads its `function` INPUT to get a callable.
 *    When the LLM places code directly in a CodeExecution block's config.code (without
 *    a FunctionReference upstream), the `function` input is unconnected → the block
 *    produces `undefined`.  We compile config.code and inject it on the CodeExecution
 *    block's `function` INPUT connection.
 */
interface _CodeInjection {
    /** Unique id of the block (for comment/debugging) */
    blockUniqueId: string;
    /** Human-readable label from metadata.displayName, if any */
    displayName: string;
    /** The raw code string from config.code */
    code: string;
    /** The uniqueId of the connection to inject the compiled function into */
    targetConnectionUniqueId: string;
}

function _extractCodeInjections(coordinatorJson: any): _CodeInjection[] {
    const injections: _CodeInjection[] = [];
    if (!coordinatorJson?._flowGraphs) {
        return injections;
    }
    for (const graph of coordinatorJson._flowGraphs) {
        if (!graph?.allBlocks) {
            continue;
        }
        for (const block of graph.allBlocks) {
            if (!block.config?.code) {
                continue;
            }

            // Pattern 1: FunctionReference with config.code → inject on OUTPUT
            if (block.className === "FlowGraphFunctionReference") {
                const outputConn = block.dataOutputs?.find((o: any) => o.name === "output");
                if (outputConn) {
                    injections.push({
                        blockUniqueId: block.uniqueId,
                        displayName: block.metadata?.displayName ?? block.uniqueId,
                        code: block.config.code,
                        targetConnectionUniqueId: outputConn.uniqueId,
                    });
                }
            }

            // Pattern 2: CodeExecution with config.code and unconnected function input
            if (block.className === "FlowGraphCodeExecutionBlock") {
                const funcInput = block.dataInputs?.find((i: any) => i.name === "function");
                if (funcInput && (!funcInput.connectedPointIds || funcInput.connectedPointIds.length === 0)) {
                    injections.push({
                        blockUniqueId: block.uniqueId,
                        displayName: block.metadata?.displayName ?? block.uniqueId,
                        code: block.config.code,
                        targetConnectionUniqueId: funcInput.uniqueId,
                    });
                }
            }
        }
    }
    return injections;
}

/**
 * Gap 34 fix: propagate block config values to matching unconnected data input defaults.
 * When a block has e.g. config.duration = 4 and a data input named "duration" that is
 * unconnected and has no explicit defaultValue, set defaultValue so the engine uses the
 * intended value instead of the type-level default (e.g. 0 for numbers).
 * @param coordinatorJson The parsed coordinator JSON to fix up in-place
 */
function _fixupConfigDefaults(coordinatorJson: any): void {
    if (!coordinatorJson?._flowGraphs) {
        return;
    }

    // Gap 35 fix: common config key alias map for LLM-generated names → canonical engine names
    const CONFIG_ALIASES: Record<string, string> = {
        variableName: "variable",
        variableNames: "variables",
        varName: "variable",
        eventName: "eventId",
    };
    // Canonical config keys per block class (only blocks known to have config mismatches)
    const BLOCK_CONFIG_KEYS: Record<string, Set<string>> = {
        FlowGraphSetVariableBlock: new Set(["variable", "variables"]),
        FlowGraphGetVariableBlock: new Set(["variable", "variables"]),
        FlowGraphSendCustomEventBlock: new Set(["eventId"]),
        FlowGraphReceiveCustomEventBlock: new Set(["eventId"]),
    };

    for (const fg of coordinatorJson._flowGraphs) {
        if (!fg.allBlocks) {
            continue;
        }
        for (const block of fg.allBlocks) {
            if (!block.config || !block.dataInputs) {
                continue;
            }

            // Normalize config key aliases (Gap 35)
            const knownKeys = BLOCK_CONFIG_KEYS[block.className];
            if (knownKeys) {
                for (const key of Object.keys(block.config)) {
                    if (!knownKeys.has(key)) {
                        const aliased = CONFIG_ALIASES[key];
                        if (aliased && knownKeys.has(aliased)) {
                            block.config[aliased] = block.config[key];
                            delete block.config[key];
                        }
                    }
                }
            }

            for (const di of block.dataInputs) {
                // Only fix unconnected inputs that don't already have an explicit defaultValue
                if (
                    (!di.connectedPointIds || di.connectedPointIds.length === 0) &&
                    di.name in block.config &&
                    block.config[di.name] !== undefined &&
                    di.defaultValue === undefined
                ) {
                    di.defaultValue = block.config[di.name];
                }
            }
        }
    }
}

function generateFlowGraph(fg: ISerializedFlowGraphRef, sceneVar: string): string {
    const lines: string[] = [];
    const v = varName(fg.name);

    lines.push(`// Flow Graph: ${fg.name}`);

    // Ensure coordinatorJson is properly emitted as a JS object literal.
    // The stored value should be a valid JSON string; emit it directly as a JS expression.
    let jsonLiteral: string;
    let parsedCoordinatorJson: any = null;
    try {
        // Parse to validate it's real JSON, then re-stringify with indentation for readability
        parsedCoordinatorJson = JSON.parse(fg.coordinatorJson);
        // Gap 34 fix: propagate config values to unconnected data input defaults
        _fixupConfigDefaults(parsedCoordinatorJson);
        jsonLiteral = JSON.stringify(parsedCoordinatorJson);
    } catch {
        // Not valid JSON — wrap the raw string as a JSON string literal as a fallback,
        // and add a warning comment so the developer knows something went wrong.
        lines.push(`// WARNING: coordinatorJson was not valid JSON — flow graph may not work.`);
        lines.push(`// Received: ${sanitizeStringLiteral(fg.coordinatorJson)}`);
        jsonLiteral = JSON.stringify(fg.coordinatorJson);
    }
    lines.push(`const ${v}CoordinatorJson = ${jsonLiteral};`);
    lines.push(`const ${v}Coordinator = await BABYLON.ParseCoordinatorAsync(${v}CoordinatorJson, {`);
    lines.push(`    scene: ${sceneVar},`);
    lines.push(`    pathConverter: { convert: () => ({ object: null, info: null }) },`);
    lines.push(`});`);

    // ── Gap 20 + Gap 31 fix: inject real JS functions for blocks with config.code ──
    // Handles both FunctionReference blocks (output injection) and standalone
    // CodeExecution blocks (function-input injection).  See _extractCodeInjections.
    if (parsedCoordinatorJson) {
        const injections = _extractCodeInjections(parsedCoordinatorJson);
        for (let i = 0; i < injections.length; i++) {
            const inj = injections[i];
            const fnVar = `${v}_codeFn${i}`;
            lines.push(``);
            lines.push(`// Injected runtime function for "${inj.displayName}" (${inj.blockUniqueId})`);
            lines.push(`const ${fnVar} = function(value, context) {`);
            // Emit each line of the user code, indented inside the function body.
            // The code may reference "scene" (closure from createScene()) and
            // "context" (FlowGraphContext, the second parameter).
            for (const codeLine of inj.code.split("\n")) {
                lines.push(`    ${codeLine}`);
            }
            lines.push(`};`);
            // Inject the function into the target connection in every execution context.
            lines.push(`for (const _fg of ${v}Coordinator.flowGraphs) {`);
            lines.push(`    for (let _ci = 0; _ci < 10; _ci++) {`);
            lines.push(`        const _ctx = _fg.getContext(_ci);`);
            lines.push(`        if (!_ctx) break;`);
            lines.push(`        _ctx._setConnectionValueByKey("${inj.targetConnectionUniqueId}", ${fnVar});`);
            lines.push(`    }`);
            lines.push(`}`);
        }
    }

    lines.push(`${v}Coordinator.start();`);

    return lines.join("\n");
}

/**
 * Generate code to parse and build a Node Render Graph.
 *
 * Usage:  `const nrg = await BABYLON.NodeRenderGraph.ParseAsync(json, scene);`
 *
 * The graph is automatically enabled, replacing the default render pipeline.
 * Make sure @babylonjs/core/FrameGraph is imported (or the UMD bundle includes it).
 *
 * @param nrgJson   The parsed NRG JSON object
 * @param sceneVar  The scene variable name in the generated code
 * @returns A string of code to create and build the Node Render Graph
 */
function generateNodeRenderGraph(nrgJson: unknown, sceneVar: string): string {
    const lines: string[] = [];
    const jsonStr = JSON.stringify(nrgJson);
    lines.push(`// ─── Node Render Graph ───────────────────────────────────────────────────`);
    lines.push(`const _nrgJson = JSON.parse(${JSON.stringify(jsonStr)});`);
    lines.push(`const _nodeRenderGraph = await BABYLON.NodeRenderGraph.ParseAsync(_nrgJson, ${sceneVar}, { autoFillExternalInputs: true });`);
    lines.push(`await _nodeRenderGraph.buildAsync();`);
    return lines.join("\n");
}

/**
 * Generates code to create a mesh from a Node Geometry (NGE) JSON.
 * Emits NodeGeometry.Parse() + build() + createMesh() calls.
 * @param meshName  The name to pass to createMesh()
 * @param ngeJson   The parsed NGE JSON object
 * @param sceneVar  The scene variable name in the generated code
 * @returns A string of code to create the mesh via Node Geometry
 */
function generateNodeGeometryMesh(meshName: string, ngeJson: unknown, sceneVar: string): string {
    const lines: string[] = [];
    const jsonStr = JSON.stringify(ngeJson);
    const safeId = meshName.replace(/[^a-zA-Z0-9_]/g, "_");
    lines.push(`// ─── Node Geometry: ${meshName} ─────────────────────────────────────────────`);
    lines.push(`const _ngeJson_${safeId} = JSON.parse(${JSON.stringify(jsonStr)});`);
    lines.push(`const _nodeGeometry_${safeId} = BABYLON.NodeGeometry.Parse(_ngeJson_${safeId});`);
    lines.push(`_nodeGeometry_${safeId}.build();`);
    lines.push(`const ${safeId} = _nodeGeometry_${safeId}.createMesh("${sanitizeStringLiteral(meshName)}", ${sceneVar});`);
    return lines.join("\n");
}

function generateSound(snd: ISerializedSound, sceneVar: string): string {
    const lines: string[] = [];
    const v = varName(snd.name);

    const factory = snd.soundType === "streaming" ? "CreateStreamingSoundAsync" : "CreateSoundAsync";
    lines.push(`// Sound: ${snd.name}`);
    lines.push(`const ${v} = await BABYLON.${factory}("${sanitizeStringLiteral(snd.name)}", "${sanitizeStringLiteral(snd.url)}", ${sceneVar}.audioEngine!, {`);
    if (snd.autoplay !== undefined) {
        lines.push(`    autoplay: ${snd.autoplay},`);
    }
    if (snd.loop !== undefined) {
        lines.push(`    loop: ${snd.loop},`);
    }
    if (snd.volume !== undefined) {
        lines.push(`    volume: ${snd.volume},`);
    }
    if (snd.playbackRate !== undefined) {
        lines.push(`    playbackRate: ${snd.playbackRate},`);
    }
    if (snd.startOffset !== undefined) {
        lines.push(`    startOffset: ${snd.startOffset},`);
    }
    if (snd.maxInstances !== undefined) {
        lines.push(`    maxInstances: ${snd.maxInstances},`);
    }
    lines.push(`});`);

    if (snd.spatialEnabled) {
        lines.push(`${v}.spatial = {`);
        if (snd.spatialDistanceModel) {
            lines.push(`    distanceModel: "${snd.spatialDistanceModel}",`);
        }
        if (snd.spatialMaxDistance !== undefined) {
            lines.push(`    maxDistance: ${snd.spatialMaxDistance},`);
        }
        if (snd.spatialMinDistance !== undefined) {
            lines.push(`    minDistance: ${snd.spatialMinDistance},`);
        }
        if (snd.spatialRolloffFactor !== undefined) {
            lines.push(`    rolloffFactor: ${snd.spatialRolloffFactor},`);
        }
        lines.push(`};`);
    }

    return lines.join("\n");
}

function generateSoundAttachment(snd: ISerializedSound, scene: ISerializedScene): string {
    if (!snd.attachedMeshId) {
        return "";
    }
    const mesh = scene.meshes.find((m) => m.id === snd.attachedMeshId || m.name === snd.attachedMeshId);
    if (!mesh) {
        return "";
    }
    return `${varName(snd.name)}.spatial?.attach(${varName(mesh.name)});`;
}

function generateParticleSystem(ps: ISerializedParticleSystem, sceneVar: string): string {
    const lines: string[] = [];
    const v = varName(ps.name);

    const ctor = ps.isGpu ? "GPUParticleSystem" : "ParticleSystem";
    const capacityArg = ps.isGpu ? `{ capacity: ${ps.capacity} }` : String(ps.capacity);
    lines.push(`// Particle System: ${ps.name}`);
    lines.push(`const ${v} = new BABYLON.${ctor}("${sanitizeStringLiteral(ps.name)}", ${capacityArg}, ${sceneVar});`);

    // Emitter
    if (typeof ps.emitter === "string") {
        lines.push(`${v}.emitter = ${varName(ps.emitter)}; // mesh reference`);
    } else if (ps.emitter && typeof ps.emitter === "object" && "x" in ps.emitter) {
        lines.push(`${v}.emitter = ${vec3(ps.emitter as IVector3)};`);
    }

    // Emitter type
    if (ps.emitterType) {
        const etVar = `${v}EmitterType`;
        switch (ps.emitterType) {
            case "Box":
                lines.push(`const ${etVar} = new BABYLON.BoxParticleEmitter();`);
                break;
            case "Sphere":
                lines.push(`const ${etVar} = new BABYLON.SphereParticleEmitter();`);
                break;
            case "Cone":
                lines.push(`const ${etVar} = new BABYLON.ConeParticleEmitter();`);
                break;
            case "Cylinder":
                lines.push(`const ${etVar} = new BABYLON.CylinderParticleEmitter();`);
                break;
            case "Hemisphere":
                lines.push(`const ${etVar} = new BABYLON.HemisphericParticleEmitter();`);
                break;
            case "Point":
                lines.push(`const ${etVar} = new BABYLON.PointParticleEmitter();`);
                break;
        }
        if (ps.emitterOptions) {
            for (const [key, val] of Object.entries(ps.emitterOptions)) {
                lines.push(`${etVar}.${key} = ${emitPropertyValue(key, val)};`);
            }
        }
        lines.push(`${v}.particleEmitterType = ${etVar};`);
    }

    // Properties
    if (ps.emitRate !== undefined) {
        lines.push(`${v}.emitRate = ${ps.emitRate};`);
    }
    if (ps.minLifeTime !== undefined) {
        lines.push(`${v}.minLifeTime = ${ps.minLifeTime};`);
    }
    if (ps.maxLifeTime !== undefined) {
        lines.push(`${v}.maxLifeTime = ${ps.maxLifeTime};`);
    }
    if (ps.minSize !== undefined) {
        lines.push(`${v}.minSize = ${ps.minSize};`);
    }
    if (ps.maxSize !== undefined) {
        lines.push(`${v}.maxSize = ${ps.maxSize};`);
    }
    if (ps.blendMode !== undefined) {
        lines.push(`${v}.blendMode = ${ps.blendMode};`);
    }
    if (ps.particleTexture) {
        lines.push(`${v}.particleTexture = new BABYLON.Texture("${sanitizeStringLiteral(ps.particleTexture)}", ${sceneVar});`);
    }
    if (ps.color1) {
        lines.push(`${v}.color1 = ${col4(ps.color1 as IColor4)};`);
    }
    if (ps.color2) {
        lines.push(`${v}.color2 = ${col4(ps.color2 as IColor4)};`);
    }
    if (ps.gravity) {
        lines.push(`${v}.gravity = ${vec3(ps.gravity as IVector3)};`);
    }

    // Gradients
    if (ps.colorGradients && ps.colorGradients.length > 0) {
        for (const cg of ps.colorGradients) {
            const c = cg.color;
            lines.push(`${v}.addColorGradient(${cg.gradient}, new BABYLON.Color4(${c.r}, ${c.g}, ${c.b}, ${c.a ?? 1}));`);
        }
    }
    if (ps.sizeGradients && ps.sizeGradients.length > 0) {
        for (const sg of ps.sizeGradients) {
            lines.push(`${v}.addSizeGradient(${sg.gradient}, ${sg.factor});`);
        }
    }
    if (ps.velocityGradients && ps.velocityGradients.length > 0) {
        for (const vg of ps.velocityGradients) {
            lines.push(`${v}.addVelocityGradient(${vg.gradient}, ${vg.factor});`);
        }
    }

    lines.push(`${v}.start();`);
    return lines.join("\n");
}

function generatePhysicsConstraint(constraint: ISerializedPhysicsConstraint, scene: ISerializedScene): string {
    const lines: string[] = [];
    const v = varName(constraint.name);

    const parentMesh = scene.meshes.find((m) => m.id === constraint.parentMeshId || m.name === constraint.parentMeshId);
    const childMesh = scene.meshes.find((m) => m.id === constraint.childMeshId || m.name === constraint.childMeshId);
    if (!parentMesh || !childMesh) {
        return `// Skipping constraint "${constraint.name}" — mesh not found`;
    }

    const parentVar = varName(parentMesh.name);
    const childVar = varName(childMesh.name);

    lines.push(`// Physics Constraint: ${constraint.name} (${constraint.constraintType})`);

    // Emit the constraint
    const pivotA = constraint.pivotA ? vec3(constraint.pivotA) : "BABYLON.Vector3.Zero()";
    const pivotB = constraint.pivotB ? vec3(constraint.pivotB) : "BABYLON.Vector3.Zero()";
    const axisA = constraint.axisA ? vec3(constraint.axisA) : "new BABYLON.Vector3(0, 1, 0)";
    const axisB = constraint.axisB ? vec3(constraint.axisB) : "new BABYLON.Vector3(0, 1, 0)";

    lines.push(`const ${v} = new BABYLON.Physics6DoFConstraint({`);
    lines.push(`    pivotA: ${pivotA},`);
    lines.push(`    pivotB: ${pivotB},`);
    lines.push(`    axisA: ${axisA},`);
    lines.push(`    axisB: ${axisB},`);

    // Limits based on constraint type
    switch (constraint.constraintType) {
        case "BallAndSocket":
            lines.push(`    limits: [],  // BallAndSocket: free rotation around pivot`);
            break;
        case "Hinge":
            lines.push(`    limits: [`);
            lines.push(`        { axis: BABYLON.PhysicsConstraintAxis.LINEAR_X, minLimit: 0, maxLimit: 0 },`);
            lines.push(`        { axis: BABYLON.PhysicsConstraintAxis.LINEAR_Y, minLimit: 0, maxLimit: 0 },`);
            lines.push(`        { axis: BABYLON.PhysicsConstraintAxis.LINEAR_Z, minLimit: 0, maxLimit: 0 },`);
            lines.push(`        { axis: BABYLON.PhysicsConstraintAxis.ANGULAR_Y, minLimit: 0, maxLimit: 0 },`);
            lines.push(`        { axis: BABYLON.PhysicsConstraintAxis.ANGULAR_Z, minLimit: 0, maxLimit: 0 },`);
            if (constraint.minLimit !== undefined || constraint.maxLimit !== undefined) {
                lines.push(`        { axis: BABYLON.PhysicsConstraintAxis.ANGULAR_X, minLimit: ${constraint.minLimit ?? -Math.PI}, maxLimit: ${constraint.maxLimit ?? Math.PI} },`);
            }
            lines.push(`    ],`);
            break;
        case "Slider":
            lines.push(`    limits: [`);
            lines.push(`        { axis: BABYLON.PhysicsConstraintAxis.LINEAR_Y, minLimit: 0, maxLimit: 0 },`);
            lines.push(`        { axis: BABYLON.PhysicsConstraintAxis.LINEAR_Z, minLimit: 0, maxLimit: 0 },`);
            if (constraint.minLimit !== undefined || constraint.maxLimit !== undefined) {
                lines.push(`        { axis: BABYLON.PhysicsConstraintAxis.LINEAR_X, minLimit: ${constraint.minLimit ?? -10}, maxLimit: ${constraint.maxLimit ?? 10} },`);
            }
            lines.push(`    ],`);
            break;
        case "Lock":
            lines.push(`    limits: [`);
            lines.push(`        { axis: BABYLON.PhysicsConstraintAxis.LINEAR_X, minLimit: 0, maxLimit: 0 },`);
            lines.push(`        { axis: BABYLON.PhysicsConstraintAxis.LINEAR_Y, minLimit: 0, maxLimit: 0 },`);
            lines.push(`        { axis: BABYLON.PhysicsConstraintAxis.LINEAR_Z, minLimit: 0, maxLimit: 0 },`);
            lines.push(`        { axis: BABYLON.PhysicsConstraintAxis.ANGULAR_X, minLimit: 0, maxLimit: 0 },`);
            lines.push(`        { axis: BABYLON.PhysicsConstraintAxis.ANGULAR_Y, minLimit: 0, maxLimit: 0 },`);
            lines.push(`        { axis: BABYLON.PhysicsConstraintAxis.ANGULAR_Z, minLimit: 0, maxLimit: 0 },`);
            lines.push(`    ],`);
            break;
        case "Distance":
            if (constraint.maxDistance !== undefined) {
                lines.push(`    limits: [`);
                lines.push(`        { axis: BABYLON.PhysicsConstraintAxis.LINEAR_DISTANCE, minLimit: 0, maxLimit: ${constraint.maxDistance} },`);
                lines.push(`    ],`);
            } else {
                lines.push(`    limits: [],`);
            }
            break;
        case "Spring":
            lines.push(`    limits: [`);
            if (constraint.stiffness !== undefined) {
                lines.push(`        { axis: BABYLON.PhysicsConstraintAxis.LINEAR_X, stiffness: ${constraint.stiffness}, damping: ${constraint.damping ?? 0} },`);
            }
            lines.push(`    ],`);
            break;
        default:
            lines.push(`    limits: [],`);
    }

    lines.push(`}, ${parentVar}Body, ${childVar}Body);`);
    lines.push(`${parentVar}Body.addConstraint(${childVar}Body, ${v});`);

    return lines.join("\n");
}

function generateRenderPipeline(rp: ISerializedRenderPipeline, sceneVar: string): string {
    const lines: string[] = [];

    lines.push(`// ─── Render Pipeline (Post-Processing) ────────────────────────────────────`);
    lines.push(`const defaultPipeline = new BABYLON.DefaultRenderingPipeline("defaultPipeline", true, ${sceneVar}, [${sceneVar}.activeCamera!]);`);

    if (rp.bloomEnabled !== undefined) {
        lines.push(`defaultPipeline.bloomEnabled = ${rp.bloomEnabled};`);
    }
    if (rp.bloomKernel !== undefined) {
        lines.push(`defaultPipeline.bloomKernel = ${rp.bloomKernel};`);
    }
    if (rp.bloomWeight !== undefined) {
        lines.push(`defaultPipeline.bloomWeight = ${rp.bloomWeight};`);
    }
    if (rp.bloomThreshold !== undefined) {
        lines.push(`defaultPipeline.bloomThreshold = ${rp.bloomThreshold};`);
    }
    if (rp.bloomScale !== undefined) {
        lines.push(`defaultPipeline.bloomScale = ${rp.bloomScale};`);
    }
    if (rp.depthOfFieldEnabled !== undefined) {
        lines.push(`defaultPipeline.depthOfFieldEnabled = ${rp.depthOfFieldEnabled};`);
    }
    if (rp.fxaaEnabled !== undefined) {
        lines.push(`defaultPipeline.fxaaEnabled = ${rp.fxaaEnabled};`);
    }
    if (rp.sharpenEnabled !== undefined) {
        lines.push(`defaultPipeline.sharpenEnabled = ${rp.sharpenEnabled};`);
    }
    if (rp.chromaticAberrationEnabled !== undefined) {
        lines.push(`defaultPipeline.chromaticAberrationEnabled = ${rp.chromaticAberrationEnabled};`);
    }
    if (rp.grainEnabled !== undefined) {
        lines.push(`defaultPipeline.grainEnabled = ${rp.grainEnabled};`);
    }
    if (rp.imageProcessingEnabled !== undefined) {
        lines.push(`defaultPipeline.imageProcessingEnabled = ${rp.imageProcessingEnabled};`);
    }

    return lines.join("\n");
}

function generateGlowLayer(glow: ISerializedGlowLayer, scene: ISerializedScene, sceneVar: string): string {
    const lines: string[] = [];
    const v = varName(glow.name);

    lines.push(`// Glow Layer: ${glow.name}`);
    lines.push(`const ${v} = new BABYLON.GlowLayer("${sanitizeStringLiteral(glow.name)}", ${sceneVar});`);
    if (glow.intensity !== undefined) {
        lines.push(`${v}.intensity = ${glow.intensity};`);
    }
    if (glow.blurKernelSize !== undefined) {
        lines.push(`${v}.blurKernelSize = ${glow.blurKernelSize};`);
    }

    for (const meshId of glow.includedOnlyMeshIds ?? []) {
        const mesh = scene.meshes.find((m) => m.id === meshId || m.name === meshId);
        if (mesh) {
            lines.push(`${v}.addIncludedOnlyMesh(${varName(mesh.name)});`);
        }
    }
    for (const meshId of glow.excludedMeshIds ?? []) {
        const mesh = scene.meshes.find((m) => m.id === meshId || m.name === meshId);
        if (mesh) {
            lines.push(`${v}.addExcludedMesh(${varName(mesh.name)});`);
        }
    }

    return lines.join("\n");
}

function generateHighlightLayer(hl: ISerializedHighlightLayer, scene: ISerializedScene, sceneVar: string): string {
    const lines: string[] = [];
    const v = varName(hl.name);

    lines.push(`// Highlight Layer: ${hl.name}`);
    const optsStr: string[] = [];
    if (hl.isStroke) {
        optsStr.push(`isStroke: true`);
    }
    if (hl.blurHorizontalSize !== undefined) {
        optsStr.push(`blurHorizontalSize: ${hl.blurHorizontalSize}`);
    }
    if (hl.blurVerticalSize !== undefined) {
        optsStr.push(`blurVerticalSize: ${hl.blurVerticalSize}`);
    }

    if (optsStr.length > 0) {
        lines.push(`const ${v} = new BABYLON.HighlightLayer("${sanitizeStringLiteral(hl.name)}", ${sceneVar}, { ${optsStr.join(", ")} });`);
    } else {
        lines.push(`const ${v} = new BABYLON.HighlightLayer("${sanitizeStringLiteral(hl.name)}", ${sceneVar});`);
    }

    for (const entry of hl.meshes) {
        const mesh = scene.meshes.find((m) => m.id === entry.meshId || m.name === entry.meshId);
        if (mesh) {
            const color = col3(entry.color);
            const emissive = entry.glowEmissiveOnly ? `, ${entry.glowEmissiveOnly}` : "";
            lines.push(`${v}.addMesh(${varName(mesh.name)}, ${color}${emissive});`);
        }
    }

    return lines.join("\n");
}

// ═══════════════════════════════════════════════════════════════════════════
//  GUI code generation
// ═══════════════════════════════════════════════════════════════════════════

interface IGUIControlDef {
    name?: string;
    className?: string;
    text?: string;
    textBlockName?: string;
    width?: string | number;
    height?: string | number;
    color?: string;
    background?: string;
    fontSize?: number;
    cornerRadius?: number;
    thickness?: number;
    left?: string | number;
    top?: string | number;
    horizontalAlignment?: number;
    verticalAlignment?: number;
    textHorizontalAlignment?: number;
    children?: IGUIControlDef[];
}

interface IGUIDescriptor {
    root?: IGUIControlDef;
    width?: number;
    height?: number;
}

interface IGUIGenResult {
    code: string;
    /** Map of GUI control name → JS variable name emitted in the generated code */
    controlVarMap: Map<string, string>;
}

function generateGUI(guiJson: unknown, sceneVar: string): IGUIGenResult {
    const gui = guiJson as IGUIDescriptor;
    const controlVarMap = new Map<string, string>();
    if (!gui?.root) {
        return { code: "", controlVarMap };
    }
    const lines: string[] = [];
    lines.push(`// ─── GUI ──────────────────────────────────────────────────────────────────`);
    lines.push(`const advancedTexture = BABYLON.GUI.AdvancedDynamicTexture.CreateFullscreenUI("UI", true, ${sceneVar});`);
    lines.push(``);

    // Alignment constant maps
    lines.push(`// Alignment maps for GUI controls`);
    lines.push(`const _HA = {`);
    lines.push(`    0: BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_LEFT,`);
    lines.push(`    1: BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_RIGHT,`);
    lines.push(`    2: BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_CENTER,`);
    lines.push(`};`);
    lines.push(`const _VA = {`);
    lines.push(`    0: BABYLON.GUI.Control.VERTICAL_ALIGNMENT_TOP,`);
    lines.push(`    1: BABYLON.GUI.Control.VERTICAL_ALIGNMENT_BOTTOM,`);
    lines.push(`    2: BABYLON.GUI.Control.VERTICAL_ALIGNMENT_CENTER,`);
    lines.push(`};`);
    lines.push(``);

    // Generate controls recursively
    function emitControl(def: IGUIControlDef, parentVar: string, indentLevel: number): void {
        const v = varName(def.name ?? "ctrl");
        // Track the mapping from control name → emitted variable name
        if (def.name) {
            controlVarMap.set(def.name, v);
        }
        const pad = "    ".repeat(indentLevel);

        switch (def.className) {
            case "Container":
                lines.push(`${pad}const ${v} = new BABYLON.GUI.Container("${sanitizeStringLiteral(def.name ?? "")}");`);
                break;
            case "Rectangle":
                lines.push(`${pad}const ${v} = new BABYLON.GUI.Rectangle("${sanitizeStringLiteral(def.name ?? "")}");`);
                break;
            case "Button": {
                // Button text lives on the auto-generated child TextBlock, not on .text directly
                let btnText = def.text ?? "";
                if (!btnText && def.textBlockName && def.children) {
                    const tbChild = def.children.find((c) => c.name === def.textBlockName);
                    if (tbChild?.text) {
                        btnText = tbChild.text as string;
                    }
                }
                lines.push(`${pad}const ${v} = BABYLON.GUI.Button.CreateSimpleButton("${sanitizeStringLiteral(def.name ?? "")}", "${sanitizeStringLiteral(btnText)}");`);
                break;
            }
            case "TextBlock":
                lines.push(`${pad}const ${v} = new BABYLON.GUI.TextBlock("${sanitizeStringLiteral(def.name ?? "")}", "${sanitizeStringLiteral(def.text ?? "")}");`);
                break;
            default:
                lines.push(`${pad}// Unknown GUI class: ${def.className}`);
                return;
        }

        // Set properties
        if (def.width !== undefined) {
            lines.push(`${pad}${v}.width = ${JSON.stringify(def.width)};`);
        }
        if (def.height !== undefined) {
            lines.push(`${pad}${v}.height = ${JSON.stringify(def.height)};`);
        }
        if (def.color) {
            lines.push(`${pad}${v}.color = "${sanitizeStringLiteral(def.color)}";`);
        }
        if (def.background) {
            lines.push(`${pad}${v}.background = "${sanitizeStringLiteral(def.background)}";`);
        }
        if (def.fontSize) {
            lines.push(`${pad}${v}.fontSize = ${def.fontSize};`);
        }
        if (def.cornerRadius) {
            lines.push(`${pad}${v}.cornerRadius = ${def.cornerRadius};`);
        }
        if (def.thickness !== undefined) {
            lines.push(`${pad}${v}.thickness = ${def.thickness};`);
        }
        if (def.left) {
            lines.push(`${pad}${v}.left = ${JSON.stringify(def.left)};`);
        }
        if (def.top) {
            lines.push(`${pad}${v}.top = ${JSON.stringify(def.top)};`);
        }
        if (def.horizontalAlignment !== undefined) {
            lines.push(`${pad}${v}.horizontalAlignment = _HA[${def.horizontalAlignment}];`);
        }
        if (def.verticalAlignment !== undefined) {
            lines.push(`${pad}${v}.verticalAlignment = _VA[${def.verticalAlignment}];`);
        }
        if (def.textHorizontalAlignment !== undefined) {
            lines.push(`${pad}${v}.textHorizontalAlignment = _HA[${def.textHorizontalAlignment}];`);
        }

        lines.push(`${pad}${parentVar}.addControl(${v});`);

        // Recurse into children, skipping auto-generated TextBlock for Buttons
        if (def.children) {
            for (const child of def.children) {
                if (def.className === "Button" && child.name === def.textBlockName) {
                    continue;
                }
                emitControl(child, v, indentLevel);
            }
        }

        lines.push(``);
    }

    if (gui.root.children) {
        for (const child of gui.root.children) {
            emitControl(child, "advancedTexture", 0);
        }
    }

    return { code: lines.join("\n"), controlVarMap };
}

// ═══════════════════════════════════════════════════════════════════════════
//  ES6 post-processor
// ═══════════════════════════════════════════════════════════════════════════

const BABYLON_GUI_CLASSES = new Set([
    "AdvancedDynamicTexture",
    "Button",
    "TextBlock",
    "Container",
    "Rectangle",
    "StackPanel",
    "Grid",
    "Image",
    "Slider",
    "InputText",
    "Checkbox",
    "RadioButton",
    "Control",
    "ScrollViewer",
    "Ellipse",
    "Line",
]);

/**
 * Convert UMD-style code (using `BABYLON.*` globals) into ES module code
 * with proper import statements from `@babylonjs/*` packages.
 * @param code - The UMD-style code string to convert
 * @param hasPhysics - Whether the scene uses physics (adds Havok import)
 * @param hasGUI - Whether the scene uses GUI (adds GUI import)
 * @param hasAudio - Whether the scene uses audio (adds Audio V2 import)
 * @param hasFlowGraph - Whether the scene uses Flow Graph (adds Flow Graph import)
 * @param hasNRG - Whether the scene uses Node Render Graph (adds NRG import)
 * @param hasNGE - Whether the scene uses Node Geometry (adds NodeGeometry import)
 * @returns The converted ES6 module code string with import statements
 */
function convertToES6(code: string, hasPhysics: boolean, hasGUI: boolean, hasAudio: boolean, hasFlowGraph: boolean, hasNRG?: boolean, hasNGE?: boolean): string {
    // Helper: collect BABYLON.* references only OUTSIDE of quoted strings.
    // The regex alternates between matching a quoted string (skip) vs BABYLON.X (capture).
    // This prevents collecting/replacing BABYLON references inside JSON string values
    // like "customType":"BABYLON.InputBlock" which NodeMaterial.Parse() needs.
    const stringOrBabylonGUI = /(["'])(?:(?!\1)[^\\]|\\.)*\1|BABYLON\.GUI\.(\w+)/g;
    const stringOrBabylon = /(["'])(?:(?!\1)[^\\]|\\.)*\1|BABYLON\.(?!GUI\.)(\w+)/g;

    // ── 1. Collect all BABYLON.GUI.* references (outside strings) ────────
    const guiRefs = new Set<string>();
    let m: RegExpExecArray | null;
    while ((m = stringOrBabylonGUI.exec(code)) !== null) {
        if (m[2]) {
            guiRefs.add(m[2]);
        } // only the BABYLON.GUI.X capture, skip quoted strings
    }

    // ── 2. Collect all BABYLON.* references (outside strings) ────────────
    const coreRefs = new Set<string>();
    while ((m = stringOrBabylon.exec(code)) !== null) {
        if (m[2]) {
            coreRefs.add(m[2]);
        } // only the BABYLON.X capture, skip quoted strings
    }

    // ── 3. Build imports ─────────────────────────────────────────────────
    const importLines: string[] = [];

    if (coreRefs.size > 0) {
        const sorted = [...coreRefs].sort();
        importLines.push(`import { ${sorted.join(", ")} } from "@babylonjs/core";`);
    }

    if (hasPhysics) {
        importLines.push(`import HavokPhysics from "@babylonjs/havok";`);
    }

    if (guiRefs.size > 0 || hasGUI) {
        const sorted = [...guiRefs].sort();
        if (sorted.length > 0) {
            importLines.push(`import { ${sorted.join(", ")} } from "@babylonjs/gui";`);
        } else {
            importLines.push(`import "@babylonjs/gui";`);
        }
    }

    if (hasAudio) {
        importLines.push(`import "@babylonjs/core/Audio/v2";`);
    }

    if (hasFlowGraph) {
        importLines.push(`import "@babylonjs/core/FlowGraph";`);
    }

    if (hasNRG) {
        importLines.push(`import "@babylonjs/core/FrameGraph";`);
    }

    if (hasNGE) {
        importLines.push(`import "@babylonjs/core/Meshes/Node/nodeGeometry";`);
    }

    // ── 4. Replace BABYLON.GUI.* → just the class name (outside strings) ─
    // Alternates: match a quoted string (return as-is) or BABYLON.GUI.X (strip prefix)
    let result = code.replace(/(["'])(?:(?!\1)[^\\]|\\.)*\1|BABYLON\.GUI\.(\w+)/g, (match, _q, cls) => {
        return cls ? cls : match; // if cls captured, strip prefix; otherwise keep the string literal
    });

    // ── 5. Replace BABYLON.* → just the class name (outside strings) ─────
    result = result.replace(/(["'])(?:(?!\1)[^\\]|\\.)*\1|BABYLON\.(\w+)/g, (match, _q, cls) => {
        return cls ? cls : match;
    });

    // ── 6. Remove the old commented-out import section ──────────────────
    result = result.replace(/\/\/ ─── Imports ───.*?(?=\n(?!\/\/))/s, "");

    // ── 7. Remove the old comment lines about ES modules ────────────────
    result = result.replace(/^\/\/ If using ES modules.*\n/gm, "");
    result = result.replace(/^\/\/ import .*\n/gm, "");

    // ── 8. Prepend import block ─────────────────────────────────────────
    const headerEnd = result.indexOf("*/");
    if (headerEnd !== -1) {
        const insertPos = result.indexOf("\n", headerEnd) + 1;
        result = result.slice(0, insertPos) + "\n" + importLines.join("\n") + "\n" + result.slice(insertPos);
    } else {
        result = importLines.join("\n") + "\n\n" + result;
    }

    // ── 9. Fix `canvas` type annotation for plain JS ────────────────────
    result = result.replace(`as HTMLCanvasElement`, "");

    return result;
}

// ═══════════════════════════════════════════════════════════════════════════
//  Project file generators
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Generate a package.json for an ES6 Babylon.js project.
 * @param sceneName - The scene name used as the package name
 * @param hasPhysics - Whether to include the Havok physics dependency
 * @param hasGUI - Whether to include the GUI dependency
 * @param hasInspector - Whether to include the Inspector dependency
 * @returns The package.json content as a JSON string
 */
function generatePackageJson(sceneName: string, hasPhysics: boolean, hasGUI: boolean, hasInspector: boolean): string {
    const deps: Record<string, string> = {
        "@babylonjs/core": "^7.0.0",
        "@babylonjs/loaders": "^7.0.0",
    };
    if (hasPhysics) {
        deps["@babylonjs/havok"] = "^1.3.0";
    }
    if (hasGUI) {
        deps["@babylonjs/gui"] = "^7.0.0";
    }
    if (hasInspector) {
        deps["@babylonjs/inspector"] = "^7.0.0";
    }

    const pkg = {
        name: varName(sceneName).toLowerCase(),
        version: "1.0.0",
        description: `Babylon.js scene: ${sceneName} — generated by Scene MCP Server`,
        type: "module",
        scripts: {
            dev: "vite",
            build: "vite build",
            preview: "vite preview",
        },
        dependencies: deps,
        devDependencies: {
            vite: "^6.0.0",
            typescript: "^5.5.0",
        },
    };

    return JSON.stringify(pkg, null, 2);
}

/**
 * Generate a tsconfig.json for the project.
 * @returns The tsconfig.json content as a JSON string
 */
function generateTsConfig(): string {
    const config = {
        compilerOptions: {
            target: "ES2022",
            module: "ESNext",
            moduleResolution: "bundler",
            strict: true,
            esModuleInterop: true,
            skipLibCheck: true,
            forceConsistentCasingInFileNames: true,
            outDir: "./dist",
            declaration: false,
            sourceMap: true,
        },
        include: ["src/**/*.ts"],
    };
    return JSON.stringify(config, null, 2);
}

/**
 * Generate a minimal vite.config.ts for the project.
 * @returns The vite.config.ts content as a string
 */
function generateViteConfig(): string {
    return [`import { defineConfig } from "vite";`, ``, `export default defineConfig({`, `    base: "./",`, `    build: {`, `        outDir: "dist",`, `    },`, `});`, ``].join(
        "\n"
    );
}

/**
 * Generate the index.html entry file for the Vite project.
 * @param sceneName - The scene name used as the page title
 * @returns The index.html content as a string
 */
function generateIndexHtml(sceneName: string): string {
    return [
        `<!DOCTYPE html>`,
        `<html lang="en">`,
        `<head>`,
        `    <meta charset="UTF-8" />`,
        `    <meta name="viewport" content="width=device-width, initial-scale=1.0" />`,
        `    <title>${sanitizeStringLiteral(sceneName)}</title>`,
        `    <style>`,
        `        html, body { overflow: hidden; width: 100%; height: 100%; margin: 0; padding: 0; }`,
        `        #renderCanvas { width: 100%; height: 100%; touch-action: none; }`,
        `    </style>`,
        `</head>`,
        `<body>`,
        `    <canvas id="renderCanvas"></canvas>`,
        `    <script type="module" src="./src/index.ts"></script>`,
        `</body>`,
        `</html>`,
    ].join("\n");
}

// ═══════════════════════════════════════════════════════════════════════════
//  Main generator
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Options for controlling the output of the scene code generator.
 */
export interface ICodeGeneratorOptions {
    /** Whether to wrap in an async function or emit top-level statements */
    wrapInFunction?: boolean;
    /** Function name if wrapping */
    functionName?: string;
    /** Whether to include HTML boilerplate for a standalone page */
    includeHtmlBoilerplate?: boolean;
    /** Variable name for the scene */
    sceneVarName?: string;
    /** Whether to include "engine" and "canvas" creation */
    includeEngineSetup?: boolean;
    /** Whether to add a render loop at the end */
    includeRenderLoop?: boolean;
    /**
     * Output format.
     * - "umd" (default): Uses `BABYLON.*` globals, suitable for CDN `<script>` tags.
     * - "es6": Uses ES module imports from `@babylonjs/*` packages.
     */
    format?: "umd" | "es6";
    /**
     * Optional GUI JSON descriptor (from the GUI MCP server).
     * When provided, GUI construction code will be generated.
     */
    guiJson?: unknown;
    /**
     * Optional Node Render Graph JSON descriptor (from the NRG MCP server).
     * When provided, NodeRenderGraph.Parse() + buildAsync() code will be generated.
     */
    nodeRenderGraphJson?: unknown;
    /**
     * Optional list of Node Geometry meshes (from the NGE MCP server).
     * Each entry generates NodeGeometry.Parse() + build() + createMesh() code.
     */
    nodeGeometryMeshes?: Array<{ name: string; ngeJson: unknown }>;
    /**
     * Whether to enable collision callbacks on physics bodies.
     * When true, `body.setCollisionCallbackEnabled(true)` is generated.
     */
    enableCollisionCallbacks?: boolean;
}

// ═══════════════════════════════════════════════════════════════════════════
//  Inspector code generator
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Generates code to show the Babylon.js Inspector v2 on the scene.
 * For UMD format, loads the inspector script from CDN and uses scene.debugLayer.show().
 * For ES6 format, imports from \@babylonjs/inspector and uses scene.debugLayer.show().
 * @param inspector - The inspector configuration
 * @param sceneVar - The variable name for the scene
 * @param format - The output format (umd or es6)
 * @returns The generated code string
 */
function generateInspector(inspector: ISerializedInspector, sceneVar: string, format: "umd" | "es6"): string {
    const lines: string[] = [];
    lines.push(`// ─── Inspector v2 ─────────────────────────────────────────────────────────`);

    const configParts: string[] = [];
    if (inspector.overlay) {
        configParts.push(`overlay: true`);
    }
    if (inspector.initialTab) {
        configParts.push(`initialTab: ${JSON.stringify(inspector.initialTab)}`);
    }
    const configArg = configParts.length > 0 ? `{ ${configParts.join(", ")} }` : "";

    if (format === "es6") {
        // ES6: import is handled by convertToES6 collecting the side-effect import;
        // we just need to add the code to call debugLayer.show().
        lines.push(`// Import "@babylonjs/inspector" to enable scene.debugLayer.show()`);
        lines.push(`await import("@babylonjs/inspector");`);
        lines.push(`${sceneVar}.debugLayer.show(${configArg});`);
    } else {
        // UMD: The script tag is added in the HTML boilerplate; just call the API.
        // If not using HTML boilerplate, dynamically load the script.
        lines.push(`// Dynamically load Inspector v2 from CDN if not already loaded`);
        lines.push(`if (!BABYLON.Inspector) {`);
        lines.push(`    await new Promise((resolve, reject) => {`);
        lines.push(`        const script = document.createElement("script");`);
        lines.push(`        script.src = "https://cdn.babylonjs.com/inspector/babylon.inspector.bundle.js";`);
        lines.push(`        script.onload = resolve;`);
        lines.push(`        script.onerror = reject;`);
        lines.push(`        document.head.appendChild(script);`);
        lines.push(`    });`);
        lines.push(`}`);
        lines.push(`${sceneVar}.debugLayer.show(${configArg});`);
    }

    return lines.join("\n");
}

// ═══════════════════════════════════════════════════════════════════════════
//  Integration glue-code generator
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Generates runtime bridge code that wires subsystems together:
 * - Physics collision → FlowGraph custom events
 * - FlowGraph variables → mesh/material properties
 * - GUI button clicks → FlowGraph custom events
 * - Collision counting → GUI text updates
 * @param integrations - The integration descriptors to generate code for
 * @param scene - The full serialized scene (used to resolve references)
 * @param sceneVar - The variable name for the scene in the generated code
 * @param guiControlVarMap - Optional map of GUI control names to variable names emitted by generateGUI, used to resolve controls for integrations like collision counters and buttons. If a control name is not found in the map, a runtime lookup using getControlByName() will be emitted as a fallback.
 * @returns The generated integration glue-code string
 */
function generateIntegrations(integrations: ISerializedIntegration[], scene: ISerializedScene, sceneVar: string, guiControlVarMap?: Map<string, string>): string {
    if (!integrations || integrations.length === 0) {
        return "";
    }

    const lines: string[] = [];
    lines.push(`// ─── Integrations (runtime bridges) ───────────────────────────────────────`);

    // Determine the FlowGraph coordinator variable name (first one)
    const fgCoordVar = scene.flowGraphs.length > 0 ? `${varName(scene.flowGraphs[0].name)}Coordinator` : null;

    // Helper: resolve a GUI control name to the JS variable name used in generated code.
    // If the name was emitted by generateGUI, use that variable. Otherwise, emit a
    // runtime getControlByName() fallback so the code doesn't crash on name mismatches.
    const _resolvedFallbacks = new Set<string>();
    function resolveGuiVar(controlName: string): string {
        if (guiControlVarMap) {
            const mapped = guiControlVarMap.get(controlName);
            if (mapped) {
                return mapped;
            }
        }
        // Fallback: emit a runtime lookup (once per unique name)
        const v = varName(controlName);
        if (!_resolvedFallbacks.has(controlName)) {
            _resolvedFallbacks.add(controlName);
            lines.push(`const ${v} = advancedTexture.getControlByName("${sanitizeStringLiteral(controlName)}");`);
        }
        return v;
    }

    // ── Collision counter state ───────────────────────────────────────────
    const counterInt = integrations.find((i): i is ICollisionCounterIntegration => i.type === "collisionCounter");
    if (counterInt) {
        lines.push(`let _collisionCount = 0;`);
    }

    // ── Physics collision → FlowGraph events ──────────────────────────────
    const collisions = integrations.filter((i): i is IPhysicsCollisionEventIntegration => i.type === "physicsCollision");
    if (collisions.length > 0) {
        lines.push(`havokPlugin.onCollisionObservable.add((event) => {`);
        lines.push(`    const bodyA = event.collider;`);
        lines.push(`    const bodyB = event.collidedAgainst;`);
        for (const c of collisions) {
            const srcBody = `${varName(c.sourceBody)}PhysicsBody`;
            const tgtBody = `${varName(c.targetBody)}PhysicsBody`;
            lines.push(`    if ((bodyA === ${srcBody} && bodyB === ${tgtBody}) || (bodyB === ${srcBody} && bodyA === ${tgtBody})) {`);
            if (fgCoordVar) {
                lines.push(
                    `        try { ${fgCoordVar}.notifyCustomEvent("${sanitizeStringLiteral(c.eventId)}", {}); } catch(e) { console.error("Collision FlowGraph event error:", e); }`
                );
            }
            if (counterInt) {
                const counterVar = resolveGuiVar(counterInt.textBlockName);
                lines.push(`        _collisionCount++;`);
                lines.push(`        ${counterVar}.text = "${sanitizeStringLiteral(counterInt.prefix)}" + _collisionCount;`);
            }
            lines.push(`    }`);
        }
        lines.push(`});`);
    }

    // ── FlowGraph variable → mesh property sync ──────────────────────────
    const varToProps = integrations.filter((i): i is IVariableToPropertyIntegration => i.type === "variableToProperty");
    if (varToProps.length > 0 && fgCoordVar) {
        // Emit tracking variables for randomized Color3 integrations
        const randomized = varToProps.filter((v) => v.randomize && v.valueType === "Color3");
        for (const v of randomized) {
            const trackVar = `_prev_${varName(v.variableName)}`;
            lines.push(``);
            lines.push(`let ${trackVar} = null; // tracks previous value for randomize`);
        }
        lines.push(``);
        lines.push(`// FlowGraph variable → mesh/material property (checked each frame)`);
        lines.push(`${sceneVar}.onBeforeRenderObservable.add(() => {`);
        lines.push(`    const _fgCtx = ${fgCoordVar}.flowGraphs[0]?.getContext(0);`);
        lines.push(`    if (!_fgCtx) return;`);
        for (const v of varToProps) {
            const meshVar = varName(v.meshName);
            const tmpVar = `_${varName(v.variableName)}`;
            lines.push(`    const ${tmpVar} = _fgCtx.getVariable("${v.variableName}");`);
            if (v.valueType === "Color3") {
                if (v.randomize) {
                    // Randomized: detect when the FlowGraph variable changes, then apply a random color
                    const trackVar = `_prev_${varName(v.variableName)}`;
                    lines.push(`    if (${tmpVar}) {`);
                    lines.push(`        const _cr = ${tmpVar}.r !== undefined ? ${tmpVar}.r : (${tmpVar}.x !== undefined ? ${tmpVar}.x : 0);`);
                    lines.push(`        const _cg = ${tmpVar}.g !== undefined ? ${tmpVar}.g : (${tmpVar}.y !== undefined ? ${tmpVar}.y : 0);`);
                    lines.push(`        const _cb = ${tmpVar}.b !== undefined ? ${tmpVar}.b : (${tmpVar}.z !== undefined ? ${tmpVar}.z : 0);`);
                    lines.push(`        if (!${trackVar} || ${trackVar}.r !== _cr || ${trackVar}.g !== _cg || ${trackVar}.b !== _cb) {`);
                    lines.push(`            ${trackVar} = { r: _cr, g: _cg, b: _cb };`);
                    lines.push(`            ${meshVar}.material.${v.property} = new BABYLON.Color3(Math.random(), Math.random(), Math.random());`);
                    lines.push(`        }`);
                    lines.push(`    }`);
                } else {
                    // Handle Color3 (.r,.g,.b), Vector3 (.x,.y,.z), or raw serialized {className,value}
                    lines.push(`    if (${tmpVar}) {`);
                    lines.push(`        if (${tmpVar}.r !== undefined) ${meshVar}.material.${v.property} = new BABYLON.Color3(${tmpVar}.r, ${tmpVar}.g, ${tmpVar}.b);`);
                    lines.push(`        else if (${tmpVar}.x !== undefined) ${meshVar}.material.${v.property} = new BABYLON.Color3(${tmpVar}.x, ${tmpVar}.y, ${tmpVar}.z);`);
                    lines.push(
                        `        else if (${tmpVar}.value) ${meshVar}.material.${v.property} = new BABYLON.Color3(${tmpVar}.value[0], ${tmpVar}.value[1], ${tmpVar}.value[2]);`
                    );
                    lines.push(`    }`);
                }
            } else if (v.valueType === "Vector3") {
                lines.push(`    if (${tmpVar}) ${meshVar}.${v.property} = ${tmpVar};`);
            } else {
                lines.push(`    if (${tmpVar} !== undefined) ${meshVar}.${v.property} = ${tmpVar};`);
            }
        }
        lines.push(`});`);
    }

    // ── GUI button → FlowGraph event ──────────────────────────────────────
    const buttons = integrations.filter((i): i is IGuiButtonEventIntegration => i.type === "guiButton");
    // Emit a shared pause flag if any button uses toggleLabels (implies pause/resume)
    const pauseBtn = buttons.find((b) => b.toggleLabels && b.toggleLabels.length === 2);
    if (pauseBtn) {
        lines.push(``);
        lines.push(`let _physicsPaused = false;`);
    }
    for (const btn of buttons) {
        const btnVar = resolveGuiVar(btn.buttonName);
        lines.push(``);
        lines.push(`// Button "${btn.buttonName}" → FlowGraph event "${btn.eventId}"`);
        lines.push(`${btnVar}.onPointerUpObservable.add(() => {`);
        if (fgCoordVar) {
            lines.push(`    try { ${fgCoordVar}.notifyCustomEvent("${sanitizeStringLiteral(btn.eventId)}", {}); } catch(e) { console.error("FlowGraph event error:", e); }`);
        }
        if (btn.toggleLabels && btn.toggleLabels.length === 2) {
            lines.push(`    const _tb = ${btnVar}.textBlock;`);
            lines.push(
                `    if (_tb) _tb.text = _tb.text === "${sanitizeStringLiteral(btn.toggleLabels[0])}" ? "${sanitizeStringLiteral(btn.toggleLabels[1])}" : "${sanitizeStringLiteral(btn.toggleLabels[0])}";`
            );
            // Toggle physics simulation (pause / resume)
            lines.push(`    _physicsPaused = !_physicsPaused;`);
            lines.push(`    const _pe = ${sceneVar}.getPhysicsEngine();`);
            lines.push(`    if (_pe) _pe.setTimeStep(_physicsPaused ? 0 : 1 / 60);`);
        }
        lines.push(`});`);
    }

    // ── Physics position reset on button click ────────────────────────────
    const posResets = integrations.filter((i): i is IPhysicsPositionResetIntegration => i.type === "physicsPositionReset");
    for (const pr of posResets) {
        const btnVar = resolveGuiVar(pr.triggerButtonName);
        lines.push(``);
        lines.push(`// Physics position reset on "${pr.triggerButtonName}" click`);
        lines.push(`${btnVar}.onPointerUpObservable.add(() => {`);
        for (const r of pr.resets) {
            const meshVar = varName(r.meshName);
            lines.push(`    ${meshVar}PhysicsBody.disablePreStep = false;`);
            lines.push(`    ${meshVar}.position.copyFromFloats(${r.position.x}, ${r.position.y}, ${r.position.z});`);
            lines.push(`    ${meshVar}PhysicsBody.setLinearVelocity(BABYLON.Vector3.Zero());`);
            lines.push(`    ${meshVar}PhysicsBody.setAngularVelocity(BABYLON.Vector3.Zero());`);
        }
        // Re-enable preStep after one frame so physics takes over again
        lines.push(`    ${sceneVar}.onAfterRenderObservable.addOnce(() => {`);
        for (const r of pr.resets) {
            lines.push(`        ${varName(r.meshName)}PhysicsBody.disablePreStep = true;`);
        }
        lines.push(`    });`);
        // Optionally reset collision counter
        if (pr.resetCollisionCounter && counterInt) {
            const counterVar = resolveGuiVar(counterInt.textBlockName);
            lines.push(`    _collisionCount = 0;`);
            lines.push(`    ${counterVar}.text = "${sanitizeStringLiteral(counterInt.prefix)}0";`);
        }
        lines.push(`});`);
    }

    return lines.join("\n");
}

/**
 * Generates runnable TypeScript/JavaScript code from a serialized scene.
 * @param scene - The serialized scene definition to convert to code
 * @param options - Optional configuration for the generated code
 * @returns The generated code string
 */
export function generateSceneCode(scene: ISerializedScene, options?: ICodeGeneratorOptions): string {
    const opts: Required<ICodeGeneratorOptions> = {
        wrapInFunction: options?.wrapInFunction ?? true,
        functionName: options?.functionName ?? "createScene",
        includeHtmlBoilerplate: options?.includeHtmlBoilerplate ?? false,
        sceneVarName: options?.sceneVarName ?? "scene",
        includeEngineSetup: options?.includeEngineSetup ?? true,
        includeRenderLoop: options?.includeRenderLoop ?? true,
        format: options?.format ?? "umd",
        guiJson: options?.guiJson ?? null,
        nodeRenderGraphJson: options?.nodeRenderGraphJson ?? null,
        nodeGeometryMeshes: options?.nodeGeometryMeshes ?? [],
        enableCollisionCallbacks: options?.enableCollisionCallbacks ?? false,
    };

    const S = opts.sceneVarName;
    const sections: string[] = [];

    // ── Header ────────────────────────────────────────────────────────────
    sections.push(generateHeader(scene));
    sections.push(generateImports(scene));

    // ── Function start ────────────────────────────────────────────────────
    const bodyParts: string[] = [];

    if (opts.includeEngineSetup) {
        bodyParts.push(`const canvas = document.getElementById("renderCanvas") as HTMLCanvasElement;`);
        bodyParts.push(`const engine = new BABYLON.Engine(canvas, true, { stencil: true });`);
        bodyParts.push(``);
    }

    bodyParts.push(`const ${S} = new BABYLON.Scene(engine);`);
    bodyParts.push(``);

    // ── Environment ───────────────────────────────────────────────────────
    bodyParts.push(generateEnvironment(scene.environment, S));

    // ── Physics initialization (before meshes) ───────────────────────────
    const hasPhysics = scene.environment.physicsEnabled || scene.meshes.some((m) => m.physics);
    if (hasPhysics) {
        bodyParts.push(generatePhysicsInit(scene.environment, S));
    }

    // ── Cameras ───────────────────────────────────────────────────────────
    if (scene.cameras.length > 0) {
        bodyParts.push(`// ─── Cameras ──────────────────────────────────────────────────────────────`);
        for (const cam of scene.cameras) {
            bodyParts.push(generateCamera(cam, S));
            bodyParts.push(``);
        }
        // Set active camera
        if (scene.activeCameraId) {
            const activeCam = scene.cameras.find((c) => c.id === scene.activeCameraId);
            if (activeCam) {
                bodyParts.push(`${S}.activeCamera = ${varName(activeCam.name)};`);
                bodyParts.push(``);
            }
        }
    }

    // ── Lights ────────────────────────────────────────────────────────────
    if (scene.lights.length > 0) {
        bodyParts.push(`// ─── Lights ───────────────────────────────────────────────────────────────`);
        for (const light of scene.lights) {
            bodyParts.push(generateLight(light, S));
            bodyParts.push(``);
        }
    }

    // ── Materials ─────────────────────────────────────────────────────────
    if (scene.materials.length > 0) {
        bodyParts.push(`// ─── Materials ────────────────────────────────────────────────────────────`);
        for (const mat of scene.materials) {
            bodyParts.push(generateMaterial(mat, S));
            bodyParts.push(``);
        }
    }

    // ── Transform nodes ───────────────────────────────────────────────────
    if (scene.transformNodes.length > 0) {
        bodyParts.push(`// ─── Transform Nodes ──────────────────────────────────────────────────────`);
        for (const node of scene.transformNodes) {
            bodyParts.push(generateTransformNode(node, S));
            bodyParts.push(``);
        }
    }

    // ── Meshes ────────────────────────────────────────────────────────────
    if (scene.meshes.length > 0) {
        bodyParts.push(`// ─── Meshes ───────────────────────────────────────────────────────────────`);
        for (const mesh of scene.meshes) {
            bodyParts.push(generateMesh(mesh, S));
            bodyParts.push(``);
        }
    }

    // ── Models (async loads) ──────────────────────────────────────────────
    if (scene.models.length > 0) {
        bodyParts.push(`// ─── Models (async) ───────────────────────────────────────────────────────`);
        for (const model of scene.models) {
            bodyParts.push(generateModel(model, S));
            bodyParts.push(``);
        }
    }

    // ── Parent/child relationships ────────────────────────────────────────
    const parentRelationships: string[] = [];
    for (const mesh of scene.meshes) {
        if (mesh.parentId) {
            const parentNode =
                scene.meshes.find((m) => m.id === mesh.parentId || m.name === mesh.parentId) ??
                scene.transformNodes.find((n) => n.id === mesh.parentId || n.name === mesh.parentId);
            if (parentNode) {
                parentRelationships.push(`${varName(mesh.name)}.parent = ${varName(parentNode.name)};`);
            }
        }
    }
    for (const tn of scene.transformNodes) {
        if (tn.parentId) {
            const parentNode =
                scene.meshes.find((m) => m.id === tn.parentId || m.name === tn.parentId) ?? scene.transformNodes.find((n) => n.id === tn.parentId || n.name === tn.parentId);
            if (parentNode) {
                parentRelationships.push(`${varName(tn.name)}.parent = ${varName(parentNode.name)};`);
            }
        }
    }
    for (const model of scene.models) {
        if (model.parentId) {
            const parentNode =
                scene.meshes.find((m) => m.id === model.parentId || m.name === model.parentId) ??
                scene.transformNodes.find((n) => n.id === model.parentId || n.name === model.parentId);
            if (parentNode) {
                parentRelationships.push(`${varName(model.name)}.parent = ${varName(parentNode.name)};`);
            }
        }
    }
    if (parentRelationships.length > 0) {
        bodyParts.push(`// ─── Hierarchy ────────────────────────────────────────────────────────────`);
        bodyParts.push(parentRelationships.join("\n"));
        bodyParts.push(``);
    }

    // ── Material assignments ──────────────────────────────────────────────
    const materialAssignments: string[] = [];
    for (const mesh of scene.meshes) {
        if (mesh.materialId) {
            const mat = scene.materials.find((m) => m.id === mesh.materialId || m.name === mesh.materialId);
            if (mat) {
                materialAssignments.push(`${varName(mesh.name)}.material = ${varName(mat.name)};`);
            }
        }
    }

    // Material overrides for models
    for (const model of scene.models) {
        if (model.materialOverrides) {
            for (const [meshName, matId] of Object.entries(model.materialOverrides)) {
                const mat = scene.materials.find((m) => m.id === matId || m.name === matId);
                if (mat) {
                    materialAssignments.push(`// Material override for model "${model.name}"`);
                    materialAssignments.push(
                        `${varName(model.name)}Result.meshes.find(m => m.name === "${sanitizeStringLiteral(meshName)}")?.forEach?.(m => m.material = ${varName(mat.name)});`
                    );
                }
            }
        }
    }

    if (materialAssignments.length > 0) {
        bodyParts.push(`// ─── Material Assignments ─────────────────────────────────────────────────`);
        bodyParts.push(materialAssignments.join("\n"));
        bodyParts.push(``);
    }

    // ── Shadow casters ────────────────────────────────────────────────────
    const shadowCasters: string[] = [];
    for (const light of scene.lights) {
        if (light.properties.shadowEnabled) {
            const lightVar = varName(light.name);
            for (const mesh of scene.meshes) {
                if (mesh.castsShadows) {
                    shadowCasters.push(`${lightVar}ShadowGen.addShadowCaster(${varName(mesh.name)});`);
                }
            }
        }
    }
    if (shadowCasters.length > 0) {
        bodyParts.push(`// ─── Shadow Casters ───────────────────────────────────────────────────────`);
        bodyParts.push(shadowCasters.join("\n"));
        bodyParts.push(``);
    }

    // ── FollowCamera target linking ───────────────────────────────────────
    for (const cam of scene.cameras) {
        if (cam.type === "FollowCamera" && cam.properties.lockedTarget) {
            const targetName = cam.properties.lockedTarget as string;
            const targetNode = scene.meshes.find((m) => m.id === targetName || m.name === targetName) ?? scene.models.find((m) => m.id === targetName || m.name === targetName);
            if (targetNode) {
                bodyParts.push(`${varName(cam.name)}.lockedTarget = ${varName(targetNode.name)};`);
            }
        }
    }

    // ── Animations ────────────────────────────────────────────────────────
    if (scene.animations.length > 0) {
        bodyParts.push(`// ─── Animations ───────────────────────────────────────────────────────────`);
        for (const anim of scene.animations) {
            bodyParts.push(generateAnimation(anim, S));
            bodyParts.push(``);
        }

        // Attach animations to targets
        bodyParts.push(`// Attach animations to targets`);
        for (const anim of scene.animations) {
            const target =
                scene.meshes.find((m) => m.id === anim.targetId || m.name === anim.targetId) ??
                scene.transformNodes.find((n) => n.id === anim.targetId || n.name === anim.targetId);
            if (target) {
                bodyParts.push(`${varName(target.name)}.animations.push(${varName(anim.name)});`);
            }
        }
        bodyParts.push(``);
    }

    // ── Animation groups ──────────────────────────────────────────────────
    if (scene.animationGroups.length > 0) {
        bodyParts.push(`// ─── Animation Groups ─────────────────────────────────────────────────────`);
        for (const ag of scene.animationGroups) {
            bodyParts.push(generateAnimationGroup(ag, scene, S));
            bodyParts.push(``);
        }
    }

    // ── Physics bodies ────────────────────────────────────────────────────
    const physMeshes = scene.meshes.filter((m) => m.physics);
    if (physMeshes.length > 0) {
        bodyParts.push(`// ─── Physics Bodies ───────────────────────────────────────────────────────`);
        for (const mesh of physMeshes) {
            bodyParts.push(generatePhysicsBody(mesh.name, mesh, opts.enableCollisionCallbacks));
            bodyParts.push(``);
        }
    }

    // ── Physics constraints ───────────────────────────────────────────────
    if ((scene.physicsConstraints ?? []).length > 0) {
        bodyParts.push(`// ─── Physics Constraints ──────────────────────────────────────────────────`);
        for (const constraint of scene.physicsConstraints) {
            bodyParts.push(generatePhysicsConstraint(constraint, scene));
            bodyParts.push(``);
        }
    }

    // ── Sounds (Audio V2) ─────────────────────────────────────────────────
    if ((scene.sounds ?? []).length > 0) {
        bodyParts.push(`// ─── Sounds (Audio V2) ────────────────────────────────────────────────────`);
        for (const snd of scene.sounds) {
            bodyParts.push(generateSound(snd, S));
            bodyParts.push(``);
        }
        // Sound attachments (after meshes exist)
        const attachments = scene.sounds.map((s) => generateSoundAttachment(s, scene)).filter(Boolean);
        if (attachments.length > 0) {
            bodyParts.push(`// Sound → Mesh attachments`);
            bodyParts.push(attachments.join("\n"));
            bodyParts.push(``);
        }
    }

    // ── Particle systems ──────────────────────────────────────────────────
    if ((scene.particleSystems ?? []).length > 0) {
        bodyParts.push(`// ─── Particle Systems ─────────────────────────────────────────────────────`);
        for (const ps of scene.particleSystems) {
            bodyParts.push(generateParticleSystem(ps, S));
            bodyParts.push(``);
        }
    }

    // ── Render pipeline (post-processing) ─────────────────────────────────
    if (scene.renderPipeline) {
        bodyParts.push(generateRenderPipeline(scene.renderPipeline, S));
        bodyParts.push(``);
    }

    // ── Glow layers ───────────────────────────────────────────────────────
    if ((scene.glowLayers ?? []).length > 0) {
        bodyParts.push(`// ─── Glow Layers ──────────────────────────────────────────────────────────`);
        for (const glow of scene.glowLayers) {
            bodyParts.push(generateGlowLayer(glow, scene, S));
            bodyParts.push(``);
        }
    }

    // ── Highlight layers ──────────────────────────────────────────────────
    if ((scene.highlightLayers ?? []).length > 0) {
        bodyParts.push(`// ─── Highlight Layers ─────────────────────────────────────────────────────`);
        for (const hl of scene.highlightLayers) {
            bodyParts.push(generateHighlightLayer(hl, scene, S));
            bodyParts.push(``);
        }
    }

    // ── GUI ───────────────────────────────────────────────────────────────
    const hasGUI = !!opts.guiJson;
    let guiControlVarMap: Map<string, string> | undefined;
    if (hasGUI) {
        const guiResult = generateGUI(opts.guiJson, S);
        bodyParts.push(guiResult.code);
        guiControlVarMap = guiResult.controlVarMap;
        bodyParts.push(``);
    }

    // ── Node Render Graph ─────────────────────────────────────────────────
    const nrgJson = opts.nodeRenderGraphJson;
    if (nrgJson) {
        bodyParts.push(generateNodeRenderGraph(nrgJson, S));
        bodyParts.push(``);
    }

    // ── Node Geometry meshes ──────────────────────────────────────────────
    for (const entry of opts.nodeGeometryMeshes) {
        bodyParts.push(generateNodeGeometryMesh(entry.name, entry.ngeJson, S));
        bodyParts.push(``);
    }

    // ── Inspector v2 ──────────────────────────────────────────────────────
    const hasInspector = !!scene.inspector?.enabled;
    if (hasInspector) {
        bodyParts.push(generateInspector(scene.inspector!, S, opts.format));
        bodyParts.push(``);
    }

    // ── Render loop ───────────────────────────────────────────────────────
    // Start the render loop BEFORE flow graphs so the scene renders while
    // ParseCoordinatorAsync (which internally awaits scene.whenReadyAsync())
    // runs.  PBR shaders may need a render pass to compile, so deferring
    // the loop until after that await can deadlock.
    if (opts.includeRenderLoop) {
        bodyParts.push(`// ─── Render Loop ──────────────────────────────────────────────────────────`);
        bodyParts.push(`engine.runRenderLoop(() => {`);
        bodyParts.push(`    ${S}.render();`);
        bodyParts.push(`});`);
        bodyParts.push(``);
        bodyParts.push(`window.addEventListener("resize", () => {`);
        bodyParts.push(`    engine.resize();`);
        bodyParts.push(`});`);
    } else {
        bodyParts.push(`return ${S};`);
    }

    // ── Flow graphs ───────────────────────────────────────────────────────
    // Placed after the render loop so the engine is actively rendering
    // while ParseCoordinatorAsync awaits scene.whenReadyAsync().
    if (scene.flowGraphs.length > 0) {
        bodyParts.push(``);
        bodyParts.push(`// ─── Flow Graphs (Behaviors) ──────────────────────────────────────────────`);
        for (const fg of scene.flowGraphs) {
            bodyParts.push(generateFlowGraph(fg, S));
            bodyParts.push(``);
        }
    }

    // ── Integrations (runtime bridges) ────────────────────────────────────
    // IMPORTANT: Must come AFTER flow graphs so that the coordinator variable
    // (e.g. gameLogicCoordinator) is already declared and initialized before
    // button/collision handlers that reference it are registered.
    if (scene.integrations && scene.integrations.length > 0) {
        bodyParts.push(generateIntegrations(scene.integrations, scene, S, guiControlVarMap));
        bodyParts.push(``);
    }

    // ── Assemble ──────────────────────────────────────────────────────────
    const body = bodyParts.join("\n");

    if (opts.wrapInFunction) {
        sections.push(`async function ${opts.functionName}() {`);
        sections.push(indent(body, 1));
        sections.push(`}`);
        sections.push(``);
        if (opts.includeRenderLoop) {
            sections.push(`${opts.functionName}().catch(function(e) { console.error("Scene init error:", e); });`);
        }
    } else {
        sections.push(body);
    }

    // ── HTML boilerplate (UMD only) ───────────────────────────────────────
    if (opts.includeHtmlBoilerplate && opts.format !== "es6") {
        const hasAudio = (scene.sounds ?? []).length > 0;
        // Strip TypeScript type assertions for inline <script> (must be valid JS)
        const codeContent = sections.join("\n").replace(/ as \w+/g, "");
        return [
            `<!DOCTYPE html>`,
            `<html>`,
            `<head>`,
            `    <meta charset="UTF-8">`,
            `    <title>${sanitizeStringLiteral(scene.name)}</title>`,
            `    <style>`,
            `        html, body { overflow: hidden; width: 100%; height: 100%; margin: 0; padding: 0; }`,
            `        #renderCanvas { width: 100%; height: 100%; touch-action: none; }`,
            `    </style>`,
            `    <script src="https://cdn.babylonjs.com/babylon.js"></script>`,
            `    <script src="https://cdn.babylonjs.com/loaders/babylonjs.loaders.min.js"></script>`,
            hasPhysics ? `    <script src="https://cdn.babylonjs.com/havok/HavokPhysics_umd.js"></script>` : ``,
            hasGUI ? `    <script src="https://cdn.babylonjs.com/gui/babylon.gui.min.js"></script>` : ``,
            hasInspector ? `    <script src="https://cdn.babylonjs.com/inspector/babylon.inspector.bundle.js"></script>` : ``,
            `</head>`,
            `<body>`,
            `    <canvas id="renderCanvas"></canvas>`,
            `    <script>`,
            indent(codeContent, 2),
            `    </script>`,
            `</body>`,
            `</html>`,
        ]
            .filter(Boolean)
            .join("\n");
    }

    let result = sections.join("\n");

    // ── ES6 conversion ────────────────────────────────────────────────────
    if (opts.format === "es6") {
        const hasAudio = (scene.sounds ?? []).length > 0;
        const hasFlowGraph = scene.flowGraphs.length > 0;
        const hasNRG = !!opts.nodeRenderGraphJson;
        const hasNGE = (opts.nodeGeometryMeshes ?? []).length > 0;
        result = convertToES6(result, hasPhysics, hasGUI, hasAudio, hasFlowGraph, hasNRG, hasNGE);
    }

    return result;
}

/**
 * Generates a complete ES6 project structure from a serialized scene.
 * Returns a map of relative file paths to their content strings.
 *
 * @param scene - The serialized scene definition
 * @param options - Code generation options (format is forced to "es6")
 * @returns Record of relative file path → file content
 */
export function generateProjectFiles(scene: ISerializedScene, options?: ICodeGeneratorOptions): Record<string, string> {
    const hasPhysics = scene.environment.physicsEnabled || scene.meshes.some((m) => m.physics);
    const hasGUI = !!options?.guiJson;
    const hasInspector = !!scene.inspector?.enabled;

    // Generate the main scene code in ES6 format
    const sceneCode = generateSceneCode(scene, {
        ...options,
        format: "es6",
        wrapInFunction: true,
        includeEngineSetup: true,
        includeRenderLoop: true,
        includeHtmlBoilerplate: false,
    });

    const files: Record<string, string> = {
        "package.json": generatePackageJson(scene.name, hasPhysics, hasGUI, hasInspector),
        "tsconfig.json": generateTsConfig(),
        "vite.config.ts": generateViteConfig(),
        "index.html": generateIndexHtml(scene.name),
        "src/index.ts": sceneCode,
    };

    return files;
}

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
    1: "BABYLON.PhysicsMotionType.DYNAMIC",
    2: "BABYLON.PhysicsMotionType.ANIMATED",
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
        lines.push(
            `skyboxMaterial.reflectionTexture = ${sceneVar}.environmentTexture?.clone?.() ?? new BABYLON.CubeTexture("${sanitizeStringLiteral(env.environmentTexture ?? "")}", ${sceneVar});`
        );
        lines.push(`skyboxMaterial.reflectionTexture.coordinatesMode = BABYLON.Texture.SKYBOX_MODE;`);
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
    const plugin = env.physicsPlugin ?? "havok";

    lines.push(`// ─── Physics ──────────────────────────────────────────────────────────────`);
    if (plugin === "havok") {
        lines.push(`const havokInstance = await HavokPhysics();`);
        lines.push(`const havokPlugin = new BABYLON.HavokPlugin(true, havokInstance);`);
        lines.push(`${sceneVar}.enablePhysics(${vec3(env.gravity)}, havokPlugin);`);
    } else {
        lines.push(`// Note: Cannon.js physics plugin — consider migrating to Havok for better performance`);
        lines.push(`const cannonPlugin = new BABYLON.CannonJSPlugin();`);
        lines.push(`${sceneVar}.enablePhysics(${vec3(env.gravity)}, cannonPlugin);`);
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
            lines.push(`const ${v} = await BABYLON.NodeMaterial.Parse(${v}Json, ${sceneVar});`);
            lines.push(`${v}.name = "${sanitizeStringLiteral(mat.name)}";`);
            lines.push(`${v}.build();`);
        } else {
            lines.push(`const ${v} = new BABYLON.NodeMaterial("${sanitizeStringLiteral(mat.name)}", ${sceneVar});`);
            lines.push(`// TODO: Configure NodeMaterial blocks programmatically or load from snippet/JSON`);
        }
    } else {
        // Standard or PBR material
        const className = mat.type === "PBRMaterial" ? "PBRMaterial" : "StandardMaterial";
        lines.push(`const ${v} = new BABYLON.${className}("${sanitizeStringLiteral(mat.name)}", ${sceneVar});`);

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

function generatePhysicsBody(meshName: string, mesh: ISerializedMesh): string {
    if (!mesh.physics) {
        return "";
    }
    const lines: string[] = [];
    const v = varName(meshName);
    const p = mesh.physics;
    const bodyTypeStr = PHYSICS_BODY_TYPE_NAMES[p.bodyType] ?? `${p.bodyType}`;

    lines.push(`// Physics for ${meshName}`);
    lines.push(`const ${v}PhysicsBody = new BABYLON.PhysicsBody(${v}, ${bodyTypeStr}, false, ${v}.getScene());`);

    // Shape
    const shapeClassName = `BABYLON.PhysicsShape${p.shapeType}`;
    lines.push(`const ${v}PhysicsShape = new ${shapeClassName}(${v}, ${v}.getScene());`);

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

    return lines.join("\n");
}

function generateFlowGraph(fg: ISerializedFlowGraphRef, sceneVar: string): string {
    const lines: string[] = [];
    const v = varName(fg.name);

    lines.push(`// Flow Graph: ${fg.name}`);
    lines.push(`const ${v}CoordinatorJson = ${fg.coordinatorJson};`);
    lines.push(`await BABYLON.FlowGraph.ParseCoordinatorAsync(${v}CoordinatorJson, {`);
    lines.push(`    scene: ${sceneVar},`);
    lines.push(`    pathConverter: undefined, // Add a path converter if needed`);
    lines.push(`});`);

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
//  Main generator
// ═══════════════════════════════════════════════════════════════════════════

/**
 *
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
            bodyParts.push(generatePhysicsBody(mesh.name, mesh));
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

    // ── Flow graphs ───────────────────────────────────────────────────────
    if (scene.flowGraphs.length > 0) {
        bodyParts.push(`// ─── Flow Graphs (Behaviors) ──────────────────────────────────────────────`);
        for (const fg of scene.flowGraphs) {
            bodyParts.push(generateFlowGraph(fg, S));
            bodyParts.push(``);
        }
    }

    // ── Render loop ───────────────────────────────────────────────────────
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

    // ── Assemble ──────────────────────────────────────────────────────────
    const body = bodyParts.join("\n");

    if (opts.wrapInFunction) {
        sections.push(`async function ${opts.functionName}() {`);
        sections.push(indent(body, 1));
        sections.push(`}`);
        sections.push(``);
        if (opts.includeRenderLoop) {
            sections.push(`${opts.functionName}();`);
        }
    } else {
        sections.push(body);
    }

    // ── HTML boilerplate ──────────────────────────────────────────────────
    if (opts.includeHtmlBoilerplate) {
        const codeContent = sections.join("\n");
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
            `</head>`,
            `<body>`,
            `    <canvas id="renderCanvas"></canvas>`,
            `    <script type="module">`,
            indent(codeContent, 2),
            `    </script>`,
            `</body>`,
            `</html>`,
        ]
            .filter(Boolean)
            .join("\n");
    }

    return sections.join("\n");
}

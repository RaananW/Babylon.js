#!/usr/bin/env node
/* eslint-disable @typescript-eslint/naming-convention */
/* eslint-disable no-console */
/**
 * Babylon.js 3D Scene MCP Server
 * ───────────────────────────────
 * A Model Context Protocol server that exposes tools for building complete
 * Babylon.js 3D scenes programmatically.  An AI agent (or any MCP client) can:
 *
 *   • Create / manage full 3D scenes
 *   • Add primitive meshes (box, sphere, cylinder, etc.)
 *   • Load external 3D models (glTF/glb)
 *   • Create cameras (ArcRotate, Free, Follow, etc.)
 *   • Create lights (Hemispheric, Point, Directional, Spot)
 *   • Create & assign materials (Standard, PBR, Node Material)
 *   • Import NME JSON as materials (from the NME MCP server)
 *   • Build scene hierarchy (parent/child relationships)
 *   • Define animations & animation groups
 *   • Add physics bodies
 *   • Attach Flow Graph behaviors (from the Flow Graph MCP server)
 *   • Configure environment (skybox, fog, HDR textures)
 *   • Validate and export the complete scene as JSON
 *
 * This server is designed to work alongside the NME MCP server (materials)
 * and Flow Graph MCP server (behaviors) as an orchestration layer.
 *
 * Transport: stdio
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod/v4";

import {
    MeshPrimitives,
    CameraTypes,
    LightTypes,
    MaterialPresets,
    ParticleBlendModes,
    ModelFormats,
    GetMeshPrimitivesSummary,
    GetCameraTypesSummary,
    GetLightTypesSummary,
    GetMaterialPresetsSummary,
    GetAnimatablePropertiesSummary,
    GetParticleEmitterTypesSummary,
    GetPhysicsConstraintTypesSummary,
    GetPostProcessEffectsSummary,
} from "./catalog.js";

import { SceneManager } from "./sceneManager.js";

// ─── Singleton scene manager ──────────────────────────────────────────────
const manager = new SceneManager();

// ─── Zod helpers ──────────────────────────────────────────────────────────
const Vector3Schema = z
    .union([z.object({ x: z.number(), y: z.number(), z: z.number() }), z.array(z.number()).length(3)])
    .optional()
    .describe("A 3D vector as {x,y,z} or [x,y,z]");

const TransformSchema = z
    .object({
        position: Vector3Schema.describe("Position in world space"),
        rotation: Vector3Schema.describe("Rotation in radians (Euler angles)"),
        scaling: Vector3Schema.describe("Scale factor per axis"),
    })
    .partial()
    .optional()
    .describe("Transform with position, rotation, and scaling");

// ─── MCP Server ───────────────────────────────────────────────────────────
const server = new McpServer({
    name: "babylonjs-scene",
    version: "1.0.0",
});

// ═══════════════════════════════════════════════════════════════════════════
//  Resources (read-only reference data)
// ═══════════════════════════════════════════════════════════════════════════

server.resource("scene-overview", "scene://overview", async (uri) => ({
    contents: [
        {
            uri: uri.href,
            mimeType: "text/markdown",
            text: [
                "# Babylon.js 3D Scene MCP Server",
                "",
                "This MCP server lets you build complete 3D scenes. It orchestrates:",
                "- **Scene graph**: meshes, transform nodes, hierarchy",
                "- **Cameras**: ArcRotate, Free, Universal, Follow",
                "- **Lights**: Hemispheric, Point, Directional, Spot",
                "- **Materials**: Standard, PBR, and Node Materials (NME JSON)",
                "- **Models**: Load external glTF/glb models with animations",
                "- **Animations**: Keyframe animations on any property",
                "- **Physics**: Rigid bodies with various shapes",
                "- **Physics Constraints**: Ball joint, hinge, slider, spring, etc.",
                "- **Audio**: Sounds with spatial 3D audio support",
                "- **Particles**: Classic & GPU particle systems with gradients",
                "- **Post-Processing**: Bloom, DOF, FXAA, grain, chromatic aberration",
                "- **Glow Layers**: Per-mesh glow effects with include/exclude",
                "- **Highlight Layers**: Colored outlines and glows on meshes",
                "- **Flow Graphs**: Attach visual scripting behaviors",
                "- **Environment**: Skybox, fog, HDR, clear color",
                "",
                "## Workflow",
                "1. `create_scene` — create a new scene",
                "2. Add cameras, lights, meshes/models",
                "3. Create materials and assign them to meshes",
                "4. Define animations and physics",
                "5. Attach flow graphs for interactivity",
                "6. `validate_scene` to check for issues",
                "7. `export_scene_code` to get runnable TypeScript code (recommended)",
                "8. `export_scene_json` to get the raw scene descriptor JSON (for custom loaders)",
                "",
                "## Integration with other MCP servers",
                "- **NME MCP server**: Export NME JSON → import here via `add_material` with type NodeMaterial",
                "- **Flow Graph MCP server**: Export coordinator JSON → attach here via `attach_flow_graph`",
            ].join("\n"),
        },
    ],
}));

server.resource("mesh-catalog", "scene://mesh-catalog", async (uri) => ({
    contents: [
        {
            uri: uri.href,
            mimeType: "text/markdown",
            text: `# Mesh Primitives\n${GetMeshPrimitivesSummary()}`,
        },
    ],
}));

server.resource("camera-catalog", "scene://camera-catalog", async (uri) => ({
    contents: [
        {
            uri: uri.href,
            mimeType: "text/markdown",
            text: `# Camera Types\n${GetCameraTypesSummary()}`,
        },
    ],
}));

server.resource("light-catalog", "scene://light-catalog", async (uri) => ({
    contents: [
        {
            uri: uri.href,
            mimeType: "text/markdown",
            text: `# Light Types\n${GetLightTypesSummary()}`,
        },
    ],
}));

server.resource("material-catalog", "scene://material-catalog", async (uri) => ({
    contents: [
        {
            uri: uri.href,
            mimeType: "text/markdown",
            text: `# Material Types\n${GetMaterialPresetsSummary()}`,
        },
    ],
}));

server.resource("animation-properties", "scene://animation-properties", async (uri) => ({
    contents: [
        {
            uri: uri.href,
            mimeType: "text/markdown",
            text: `# Animatable Properties\n${GetAnimatablePropertiesSummary()}`,
        },
    ],
}));

server.resource("model-formats", "scene://model-formats", async (uri) => ({
    contents: [
        {
            uri: uri.href,
            mimeType: "text/markdown",
            text: [
                "# Supported 3D Model Formats",
                "",
                ...Object.entries(ModelFormats).map(([name, info]) => `## ${name}\nExtensions: ${info.extensions.join(", ")}\n${info.description}`),
            ].join("\n"),
        },
    ],
}));

// ═══════════════════════════════════════════════════════════════════════════
//  Prompts (reusable prompt templates)
// ═══════════════════════════════════════════════════════════════════════════

server.prompt("create-basic-scene", "Step-by-step instructions for building a basic 3D scene with a camera, light, and mesh", () => ({
    messages: [
        {
            role: "user",
            content: {
                type: "text",
                text: [
                    "Create a basic 3D scene with an orbiting camera, a hemispheric light, and a sphere:",
                    "",
                    "1. create_scene 'BasicScene' with description 'A simple scene with a sphere'",
                    "2. add_camera 'mainCamera' type 'ArcRotateCamera' with properties {alpha: -1.57, beta: 1.2, radius: 5, target: [0,1,0]}, isActive=true",
                    "3. add_light 'ambientLight' type 'HemisphericLight' with properties {direction: [0,1,0], intensity: 0.7}",
                    "4. add_material 'sphereMat' type 'PBRMaterial' with properties {albedoColor: [0.8, 0.2, 0.2], metallic: 0.3, roughness: 0.4}",
                    "5. add_mesh 'mySphere' type 'Sphere' with options {diameter: 2}, transform {position: [0,1,0]}",
                    "6. assign_material meshId='mySphere' materialId='sphereMat'",
                    "7. add_mesh 'ground' type 'Ground' with options {width: 10, height: 10}",
                    "8. set_environment with {environmentTexture: 'https://playground.babylonjs.com/textures/environment.env', skyboxSize: 100}",
                    "9. validate_scene, then export_scene_code",
                ].join("\n"),
            },
        },
    ],
}));

server.prompt("create-character-scene", "Create a scene with a loaded character model, animations, camera following, and NME material", () => ({
    messages: [
        {
            role: "user",
            content: {
                type: "text",
                text: [
                    "Create a scene with a walking character holding a sphere with a custom material.",
                    "This demonstrates integrating models, NME materials, and flow graphs.",
                    "",
                    "## Step 1: Basic scene setup",
                    "1. create_scene 'CharacterScene' description 'Walking character with fire sphere'",
                    "2. add_camera 'followCam' type 'FollowCamera' properties {radius: 8, heightOffset: 3, rotationOffset: 0, cameraAcceleration: 0.05, maxCameraSpeed: 10}, isActive=true",
                    "3. add_light 'sunLight' type 'DirectionalLight' properties {direction: [0.5, -1, 0.5], intensity: 0.8, shadowEnabled: true}",
                    "4. add_light 'ambientLight' type 'HemisphericLight' properties {direction: [0, 1, 0], intensity: 0.4, groundColor: [0.1, 0.1, 0.1]}",
                    "",
                    "## Step 2: Environment",
                    "5. set_environment {environmentTexture: 'https://playground.babylonjs.com/textures/environment.env', skyboxSize: 200, createDefaultGround: true, groundSize: 50}",
                    "",
                    "## Step 3: Load the character model",
                    "6. add_model 'character' url 'https://models.babylonjs.com/Dude/Dude.babylon' with animationGroups: ['Walk', 'Idle']",
                    "",
                    "## Step 4: Create a sphere attached to the character's hand",
                    "7. add_mesh 'fireSphere' type 'Sphere' options {diameter: 0.5}, transform {position: [0.5, 1.5, 0]}",
                    "8. (After model loads, parent the sphere to the character's hand bone)",
                    "",
                    "## Step 5: Create fire material using NME MCP server",
                    "9. Use the NME MCP server to create a fire node material",
                    "10. Export the NME JSON and import it here:",
                    "    add_material 'fireMat' type 'NodeMaterial' nmeJson='<the exported NME JSON>'",
                    "11. assign_material meshId='fireSphere' materialId='fireMat'",
                    "",
                    "## Step 6: Create movement behavior using Flow Graph MCP server",
                    "12. Use the Flow Graph MCP server to create a movement controller",
                    "    - SceneTickEvent → reads keyboard input → updates character position",
                    "    - MeshPickEvent on ground → sets movement target",
                    "13. Export the flow graph JSON and attach it here:",
                    "    attach_flow_graph 'movementController' coordinatorJson='<the exported FG JSON>'",
                    "",
                    "## Step 7: Validate and export",
                    "14. validate_scene",
                    "15. export_scene_code (for runnable TypeScript) or export_scene_json (for raw JSON)",
                ].join("\n"),
            },
        },
    ],
}));

server.prompt("create-physics-playground", "Build an interactive physics scene with falling objects", () => ({
    messages: [
        {
            role: "user",
            content: {
                type: "text",
                text: [
                    "Create a physics playground with stacked boxes and a ball that can knock them down.",
                    "",
                    "1. create_scene 'PhysicsPlayground' description 'Interactive physics demo'",
                    "2. set_environment {physicsEnabled: true, physicsPlugin: 'havok', gravity: [0, -9.81, 0]}",
                    "3. add_camera 'cam' type 'ArcRotateCamera' properties {alpha: -1.57, beta: 1.2, radius: 15, target: [0,3,0]}, isActive=true",
                    "4. add_light 'light' type 'HemisphericLight' properties {direction: [0,1,0], intensity: 1}",
                    "5. add_material 'groundMat' type 'StandardMaterial' properties {diffuseColor: [0.4, 0.6, 0.3]}",
                    "6. add_material 'boxMat' type 'PBRMaterial' properties {albedoColor: [0.8, 0.5, 0.2], roughness: 0.6}",
                    "7. add_material 'ballMat' type 'PBRMaterial' properties {albedoColor: [0.9, 0.1, 0.1], metallic: 0.8, roughness: 0.2}",
                    "8. add_mesh 'ground' type 'Ground' options {width: 20, height: 20}",
                    "9. assign_material 'ground' 'groundMat'",
                    "10. add_physics_body 'ground' bodyType='Static' shapeType='Box'",
                    "11. Create a 3x3 stack of boxes at position (0, 0.5, 0), spacing 1.1 apart",
                    "    (use add_mesh for each box, assign_material, add_physics_body Dynamic)",
                    "12. add_mesh 'ball' type 'Sphere' options {diameter: 1}, transform {position: [-5, 2, 0]}",
                    "13. assign_material 'ball' 'ballMat'",
                    "14. add_physics_body 'ball' bodyType='Dynamic' shapeType='Sphere' options {mass: 5, restitution: 0.5}",
                    "15. Use Flow Graph MCP to create click-to-launch behavior, then attach_flow_graph",
                    "16. validate_scene, export_scene_code",
                ].join("\n"),
            },
        },
    ],
}));

// ═══════════════════════════════════════════════════════════════════════════
//  Tools — Scene lifecycle
// ═══════════════════════════════════════════════════════════════════════════

server.tool(
    "create_scene",
    "Create a new empty 3D scene in memory. This is always the first step. " + "Then add cameras, lights, meshes, materials, models, animations, and flow graphs.",
    {
        name: z.string().describe("Unique name for the scene"),
        description: z.string().optional().describe("A description of what this scene contains"),
    },
    async ({ name, description }) => {
        manager.createScene(name, description);
        return {
            content: [
                {
                    type: "text",
                    text:
                        `Created scene "${name}". Next steps:\n` +
                        `1. Add a camera: add_camera\n` +
                        `2. Add lights: add_light\n` +
                        `3. Add meshes: add_mesh or load models: add_model\n` +
                        `4. Create materials: add_material\n` +
                        `5. Configure environment: set_environment`,
                },
            ],
        };
    }
);

server.tool(
    "delete_scene",
    "Delete a scene from memory.",
    {
        name: z.string().describe("Name of the scene to delete"),
    },
    async ({ name }) => {
        const ok = manager.deleteScene(name);
        return {
            content: [{ type: "text", text: ok ? `Deleted "${name}".` : `Scene "${name}" not found.` }],
        };
    }
);

server.tool("list_scenes", "List all scenes currently in memory.", {}, async () => {
    const names = manager.listScenes();
    return {
        content: [
            {
                type: "text",
                text: names.length > 0 ? `Scenes in memory:\n${names.map((n) => `  • ${n}`).join("\n")}` : "No scenes in memory.",
            },
        ],
    };
});

// ═══════════════════════════════════════════════════════════════════════════
//  Tools — Environment
// ═══════════════════════════════════════════════════════════════════════════

server.tool(
    "set_environment",
    "Configure the scene environment: clear color, fog, skybox, HDR environment texture, " + "physics settings, and default ground.",
    {
        sceneName: z.string().describe("Name of the scene"),
        clearColor: z.unknown().optional().describe("Background color as {r,g,b,a} or [r,g,b,a]"),
        ambientColor: z.unknown().optional().describe("Ambient color as {r,g,b} or [r,g,b]"),
        environmentTexture: z.string().optional().describe("URL of .env or .hdr environment texture"),
        skyboxSize: z.number().optional().describe("Skybox size (0 = no skybox)"),
        fogEnabled: z.boolean().optional().describe("Enable fog"),
        fogMode: z.number().optional().describe("Fog mode: 0=None, 1=Exp, 2=Exp2, 3=Linear"),
        fogColor: z.unknown().optional().describe("Fog color"),
        fogDensity: z.number().optional().describe("Fog density"),
        fogStart: z.number().optional().describe("Fog start distance (linear mode)"),
        fogEnd: z.number().optional().describe("Fog end distance (linear mode)"),
        gravity: z.unknown().optional().describe("Gravity vector as {x,y,z} or [x,y,z]"),
        physicsEnabled: z.boolean().optional().describe("Enable physics simulation"),
        physicsPlugin: z.string().optional().describe("Physics plugin: 'havok' (recommended) or 'cannon'"),
        createDefaultGround: z.boolean().optional().describe("Auto-create a default ground plane"),
        groundSize: z.number().optional().describe("Size of default ground"),
        groundColor: z.unknown().optional().describe("Color of default ground"),
    },
    async (params) => {
        const { sceneName, ...env } = params;
        const result = manager.setEnvironment(sceneName, env as Record<string, unknown>);
        return {
            content: [{ type: "text", text: result === "OK" ? "Environment updated." : `Error: ${result}` }],
            isError: result !== "OK",
        };
    }
);

// ═══════════════════════════════════════════════════════════════════════════
//  Tools — Cameras
// ═══════════════════════════════════════════════════════════════════════════

server.tool(
    "add_camera",
    "Add a camera to the scene. Use 'ArcRotateCamera' for orbit controls, 'FreeCamera' for " + "first-person, 'FollowCamera' for third-person follow.",
    {
        sceneName: z.string().describe("Name of the scene"),
        name: z.string().describe("Name for the camera (e.g. 'mainCamera', 'followCam')"),
        type: z.enum(["ArcRotateCamera", "FreeCamera", "UniversalCamera", "FollowCamera"]).describe("Camera type"),
        properties: z
            .record(z.string(), z.unknown())
            .optional()
            .describe(
                "Camera properties. For ArcRotateCamera: alpha, beta, radius, target (Vector3). " +
                    "For FreeCamera: position (Vector3), target (Vector3), speed. " +
                    "For FollowCamera: radius, heightOffset, rotationOffset, lockedTarget (mesh name)."
            ),
        isActive: z.boolean().default(true).describe("Whether this should be the active camera"),
    },
    async ({ sceneName, name, type, properties, isActive }) => {
        const result = manager.addCamera(sceneName, name, type, properties as Record<string, unknown>, isActive);
        if (typeof result === "string") {
            return { content: [{ type: "text", text: `Error: ${result}` }], isError: true };
        }
        return {
            content: [
                {
                    type: "text",
                    text: `Added camera [${result.id}] "${name}" (${type}).${isActive ? " Set as active camera." : ""}`,
                },
            ],
        };
    }
);

server.tool(
    "set_active_camera",
    "Set which camera is the active (rendering) camera.",
    {
        sceneName: z.string().describe("Name of the scene"),
        cameraId: z.string().describe("Camera ID or name"),
    },
    async ({ sceneName, cameraId }) => {
        const result = manager.setActiveCamera(sceneName, cameraId);
        return {
            content: [{ type: "text", text: result === "OK" ? `Active camera set to "${cameraId}".` : `Error: ${result}` }],
            isError: result !== "OK",
        };
    }
);

server.tool(
    "configure_camera",
    "Update properties on an existing camera.",
    {
        sceneName: z.string().describe("Name of the scene"),
        cameraId: z.string().describe("Camera ID or name"),
        properties: z.record(z.string(), z.unknown()).describe("Properties to update"),
    },
    async ({ sceneName, cameraId, properties }) => {
        const result = manager.configureCameraProperties(sceneName, cameraId, properties as Record<string, unknown>);
        return {
            content: [{ type: "text", text: result === "OK" ? `Camera "${cameraId}" updated.` : `Error: ${result}` }],
            isError: result !== "OK",
        };
    }
);

// ═══════════════════════════════════════════════════════════════════════════
//  Tools — Lights
// ═══════════════════════════════════════════════════════════════════════════

server.tool(
    "add_light",
    "Add a light to the scene.",
    {
        sceneName: z.string().describe("Name of the scene"),
        name: z.string().describe("Name for the light"),
        type: z.enum(["HemisphericLight", "PointLight", "DirectionalLight", "SpotLight"]).describe("Light type"),
        properties: z
            .record(z.string(), z.unknown())
            .optional()
            .describe(
                "Light properties. Common: intensity, diffuse, specular. " +
                    "HemisphericLight: direction, groundColor. PointLight: position, range. " +
                    "DirectionalLight: direction, position, shadowEnabled. SpotLight: position, direction, angle, exponent."
            ),
    },
    async ({ sceneName, name, type, properties }) => {
        const result = manager.addLight(sceneName, name, type, properties as Record<string, unknown>);
        if (typeof result === "string") {
            return { content: [{ type: "text", text: `Error: ${result}` }], isError: true };
        }
        return {
            content: [{ type: "text", text: `Added light [${result.id}] "${name}" (${type}).` }],
        };
    }
);

server.tool(
    "configure_light",
    "Update properties on an existing light.",
    {
        sceneName: z.string().describe("Name of the scene"),
        lightId: z.string().describe("Light ID or name"),
        properties: z.record(z.string(), z.unknown()).describe("Properties to update"),
    },
    async ({ sceneName, lightId, properties }) => {
        const result = manager.configureLightProperties(sceneName, lightId, properties as Record<string, unknown>);
        return {
            content: [{ type: "text", text: result === "OK" ? `Light "${lightId}" updated.` : `Error: ${result}` }],
            isError: result !== "OK",
        };
    }
);

// ═══════════════════════════════════════════════════════════════════════════
//  Tools — Materials
// ═══════════════════════════════════════════════════════════════════════════

server.tool(
    "add_material",
    "Create a material in the scene. Supports StandardMaterial, PBRMaterial, and NodeMaterial (NME JSON). " +
        "For NodeMaterial, pass the exported NME JSON from the NME MCP server.",
    {
        sceneName: z.string().describe("Name of the scene"),
        name: z.string().describe("Name for the material"),
        type: z.enum(["StandardMaterial", "PBRMaterial", "NodeMaterial"]).describe("Material type"),
        properties: z
            .record(z.string(), z.unknown())
            .optional()
            .describe(
                "Material properties. StandardMaterial: diffuseColor, specularColor, alpha, diffuseTexture (url). " +
                    "PBRMaterial: albedoColor, metallic, roughness, albedoTexture (url), environmentTexture (url). " +
                    "NodeMaterial: use nmeJson parameter instead."
            ),
        nmeJson: z.string().optional().describe("For NodeMaterial: the full NME JSON string exported from the NME MCP server"),
        snippetId: z.string().optional().describe("For NodeMaterial: a Babylon.js Snippet Server ID to load from"),
    },
    async ({ sceneName, name, type, properties, nmeJson, snippetId }) => {
        const result = manager.addMaterial(sceneName, name, type, properties as Record<string, unknown>, nmeJson, snippetId);
        if (typeof result === "string") {
            return { content: [{ type: "text", text: `Error: ${result}` }], isError: true };
        }
        const extra = type === "NodeMaterial" ? (nmeJson ? " (NME JSON imported)" : snippetId ? ` (will load snippet ${snippetId})` : "") : "";
        return {
            content: [{ type: "text", text: `Added material [${result.id}] "${name}" (${type})${extra}.` }],
        };
    }
);

server.tool(
    "remove_material",
    "Remove a material from the scene.",
    {
        sceneName: z.string().describe("Name of the scene"),
        materialId: z.string().describe("Material ID or name"),
    },
    async ({ sceneName, materialId }) => {
        const result = manager.removeMaterial(sceneName, materialId);
        return {
            content: [{ type: "text", text: result === "OK" ? `Removed material "${materialId}".` : `Error: ${result}` }],
            isError: result !== "OK",
        };
    }
);

// ═══════════════════════════════════════════════════════════════════════════
//  Tools — Textures
// ═══════════════════════════════════════════════════════════════════════════

server.tool(
    "add_texture",
    "Add a texture to the scene. Textures can be referenced by materials.",
    {
        sceneName: z.string().describe("Name of the scene"),
        name: z.string().describe("Name for the texture"),
        url: z.string().describe("URL or path to the texture file"),
        uScale: z.number().optional().describe("U (horizontal) tiling"),
        vScale: z.number().optional().describe("V (vertical) tiling"),
        hasAlpha: z.boolean().optional().describe("Whether the texture has an alpha channel"),
        level: z.number().optional().describe("Intensity level"),
    },
    async ({ sceneName, name, url, ...options }) => {
        const result = manager.addTexture(sceneName, name, url, options);
        if (typeof result === "string") {
            return { content: [{ type: "text", text: `Error: ${result}` }], isError: true };
        }
        return {
            content: [{ type: "text", text: `Added texture [${result.id}] "${name}" (${url}).` }],
        };
    }
);

// ═══════════════════════════════════════════════════════════════════════════
//  Tools — Meshes
// ═══════════════════════════════════════════════════════════════════════════

server.tool(
    "add_mesh",
    "Add a primitive mesh to the scene: Box, Sphere, Cylinder, Plane, Ground, Torus, Capsule, etc.",
    {
        sceneName: z.string().describe("Name of the scene"),
        name: z.string().describe("Name for the mesh"),
        type: z.enum(["Box", "Sphere", "Cylinder", "Plane", "Ground", "Torus", "TorusKnot", "Disc", "Capsule", "IcoSphere"]).describe("Primitive mesh type"),
        options: z.record(z.string(), z.unknown()).optional().describe("Primitive creation options (e.g. {diameter: 2} for Sphere, {width: 5, height: 5} for Ground)"),
        transform: TransformSchema,
        parentId: z.string().optional().describe("Parent node ID or name for hierarchy"),
        materialId: z.string().optional().describe("Material ID or name to assign"),
    },
    async ({ sceneName, name, type, options, transform, parentId, materialId }) => {
        const result = manager.addMesh(sceneName, name, type, options as Record<string, unknown>, transform as Record<string, unknown> | undefined, parentId, materialId);
        if (typeof result === "string") {
            return { content: [{ type: "text", text: `Error: ${result}` }], isError: true };
        }
        return {
            content: [
                {
                    type: "text",
                    text: `Added mesh [${result.id}] "${name}" (${type}).${materialId ? ` Material: ${materialId}.` : ""}`,
                },
            ],
        };
    }
);

server.tool(
    "remove_mesh",
    "Remove a mesh from the scene.",
    {
        sceneName: z.string().describe("Name of the scene"),
        meshId: z.string().describe("Mesh ID or name"),
    },
    async ({ sceneName, meshId }) => {
        const result = manager.removeMesh(sceneName, meshId);
        return {
            content: [{ type: "text", text: result === "OK" ? `Removed mesh "${meshId}".` : `Error: ${result}` }],
            isError: result !== "OK",
        };
    }
);

server.tool(
    "set_mesh_properties",
    "Update properties on a mesh: visibility, pickability, shadow settings, tags, metadata.",
    {
        sceneName: z.string().describe("Name of the scene"),
        meshId: z.string().describe("Mesh ID or name"),
        isVisible: z.boolean().optional().describe("Whether the mesh is visible"),
        isPickable: z.boolean().optional().describe("Whether the mesh is pickable by ray-casting"),
        receiveShadows: z.boolean().optional().describe("Whether the mesh receives shadows"),
        castsShadows: z.boolean().optional().describe("Whether the mesh is included in shadow generators"),
        tags: z.array(z.string()).optional().describe("Tags for querying/filtering"),
        metadata: z.record(z.string(), z.unknown()).optional().describe("Custom metadata"),
    },
    async ({ sceneName, meshId, ...props }) => {
        const result = manager.setMeshProperties(sceneName, meshId, props as Record<string, unknown>);
        return {
            content: [{ type: "text", text: result === "OK" ? `Mesh "${meshId}" updated.` : `Error: ${result}` }],
            isError: result !== "OK",
        };
    }
);

// ═══════════════════════════════════════════════════════════════════════════
//  Tools — Transform & Hierarchy
// ═══════════════════════════════════════════════════════════════════════════

server.tool(
    "add_transform_node",
    "Add an empty transform node (grouping node) to the scene. Useful for creating " + "hierarchies — parent meshes to this node to move them as a group.",
    {
        sceneName: z.string().describe("Name of the scene"),
        name: z.string().describe("Name for the transform node"),
        transform: TransformSchema,
        parentId: z.string().optional().describe("Parent node ID or name"),
    },
    async ({ sceneName, name, transform, parentId }) => {
        const result = manager.addTransformNode(sceneName, name, transform as Record<string, unknown> | undefined, parentId);
        if (typeof result === "string") {
            return { content: [{ type: "text", text: `Error: ${result}` }], isError: true };
        }
        return {
            content: [{ type: "text", text: `Added transform node [${result.id}] "${name}".` }],
        };
    }
);

server.tool(
    "set_transform",
    "Set the position, rotation, and/or scaling of any node (mesh, transform node, camera, light).",
    {
        sceneName: z.string().describe("Name of the scene"),
        nodeId: z.string().describe("Node ID or name"),
        position: Vector3Schema.describe("New position as {x,y,z} or [x,y,z]"),
        rotation: Vector3Schema.describe("New rotation in radians as {x,y,z} or [x,y,z]"),
        scaling: Vector3Schema.describe("New scaling as {x,y,z} or [x,y,z]"),
    },
    async ({ sceneName, nodeId, position, rotation, scaling }) => {
        const result = manager.setTransform(sceneName, nodeId, { position, rotation, scaling } as Record<string, unknown>);
        return {
            content: [{ type: "text", text: result === "OK" ? `Transform of "${nodeId}" updated.` : `Error: ${result}` }],
            isError: result !== "OK",
        };
    }
);

server.tool(
    "set_parent",
    "Set a node's parent (for scene hierarchy). Pass null to un-parent.",
    {
        sceneName: z.string().describe("Name of the scene"),
        childId: z.string().describe("ID or name of the child node"),
        parentId: z.string().nullable().describe("ID or name of the parent node, or null to un-parent"),
    },
    async ({ sceneName, childId, parentId }) => {
        const result = manager.setParent(sceneName, childId, parentId);
        return {
            content: [
                {
                    type: "text",
                    text: result === "OK" ? (parentId ? `Set "${childId}" parent to "${parentId}".` : `Un-parented "${childId}".`) : `Error: ${result}`,
                },
            ],
            isError: result !== "OK",
        };
    }
);

server.tool(
    "assign_material",
    "Assign a material to a mesh.",
    {
        sceneName: z.string().describe("Name of the scene"),
        meshId: z.string().describe("Mesh ID or name"),
        materialId: z.string().describe("Material ID or name to assign"),
    },
    async ({ sceneName, meshId, materialId }) => {
        const result = manager.assignMaterial(sceneName, meshId, materialId);
        return {
            content: [{ type: "text", text: result === "OK" ? `Assigned material "${materialId}" to mesh "${meshId}".` : `Error: ${result}` }],
            isError: result !== "OK",
        };
    }
);

// ═══════════════════════════════════════════════════════════════════════════
//  Tools — Model loading
// ═══════════════════════════════════════════════════════════════════════════

server.tool(
    "add_model",
    "Add an external 3D model (glTF/glb) to the scene. The model will be loaded at runtime " +
        "from the given URL. You can specify expected animation groups and material overrides.",
    {
        sceneName: z.string().describe("Name of the scene"),
        name: z.string().describe("Name for this model reference"),
        url: z.string().describe("URL or path to the model file (.glb, .gltf, .babylon, .obj, etc.)"),
        transform: TransformSchema,
        parentId: z.string().optional().describe("Parent node ID for the imported root"),
        animationGroups: z.array(z.string()).optional().describe("Expected animation group names in the model (e.g. ['Walk', 'Idle', 'Run'])"),
        materialOverrides: z.record(z.string(), z.string()).optional().describe("Map of mesh name → material ID to override materials on imported meshes"),
        pluginExtension: z.string().optional().describe("Force a specific loader plugin (e.g. '.gltf', '.obj')"),
    },
    async ({ sceneName, name, url, transform, parentId, animationGroups, materialOverrides, pluginExtension }) => {
        const result = manager.addModel(sceneName, name, url, transform as Record<string, unknown> | undefined, parentId, { animationGroups, materialOverrides, pluginExtension });
        if (typeof result === "string") {
            return { content: [{ type: "text", text: `Error: ${result}` }], isError: true };
        }
        const anims = animationGroups?.length ? ` Expected animations: ${animationGroups.join(", ")}.` : "";
        return {
            content: [{ type: "text", text: `Added model [${result.id}] "${name}" from ${url}.${anims}` }],
        };
    }
);

server.tool(
    "remove_model",
    "Remove a model reference from the scene.",
    {
        sceneName: z.string().describe("Name of the scene"),
        modelId: z.string().describe("Model ID or name"),
    },
    async ({ sceneName, modelId }) => {
        const result = manager.removeModel(sceneName, modelId);
        return {
            content: [{ type: "text", text: result === "OK" ? `Removed model "${modelId}".` : `Error: ${result}` }],
            isError: result !== "OK",
        };
    }
);

// ═══════════════════════════════════════════════════════════════════════════
//  Tools — Animations
// ═══════════════════════════════════════════════════════════════════════════

server.tool(
    "add_animation",
    "Define a keyframe animation on a scene node's property (position, rotation, scaling, visibility, etc.).",
    {
        sceneName: z.string().describe("Name of the scene"),
        name: z.string().describe("Name for the animation"),
        targetId: z.string().describe("ID or name of the node to animate"),
        property: z
            .string()
            .describe("Property to animate (e.g. 'position', 'rotation.y', 'scaling', 'visibility', 'material.alpha'). " + "Use list_animatable_properties to see all options."),
        fps: z.number().default(60).describe("Frames per second"),
        keys: z
            .array(
                z.object({
                    frame: z.number().describe("Frame number"),
                    value: z.unknown().describe("Value at this frame (number, {x,y,z}, {r,g,b}, etc.)"),
                    inTangent: z.unknown().optional().describe("In-tangent for cubic interpolation"),
                    outTangent: z.unknown().optional().describe("Out-tangent for cubic interpolation"),
                })
            )
            .describe("Array of keyframes"),
        loopMode: z
            .union([z.enum(["Relative", "Cycle", "Constant", "Yoyo"]), z.number()])
            .default("Cycle")
            .describe("Loop behavior: Cycle (repeat), Yoyo (ping-pong), Constant (clamp), Relative"),
        easingFunction: z.string().optional().describe("Easing: 'SineEase', 'QuadraticEase', 'CubicEase', 'CircleEase', 'ElasticEase', 'BounceEase', 'BackEase'"),
        easingMode: z.number().optional().describe("0=EaseIn, 1=EaseOut, 2=EaseInOut"),
    },
    async ({ sceneName, name, targetId, property, fps, keys, loopMode, easingFunction, easingMode }) => {
        const result = manager.addAnimation(sceneName, name, targetId, property, fps, keys, loopMode, easingFunction, easingMode);
        if (typeof result === "string") {
            return { content: [{ type: "text", text: `Error: ${result}` }], isError: true };
        }
        return {
            content: [
                {
                    type: "text",
                    text: `Added animation [${result.id}] "${name}" → ${targetId}.${property} (${keys.length} keys, ${fps}fps).`,
                },
            ],
        };
    }
);

server.tool(
    "create_animation_group",
    "Group multiple animations together to play/stop/control them as a unit.",
    {
        sceneName: z.string().describe("Name of the scene"),
        name: z.string().describe("Name for the animation group"),
        animationIds: z.array(z.string()).describe("IDs of animations to include"),
        autoStart: z.boolean().optional().describe("Whether to start playing automatically"),
        isLooping: z.boolean().optional().describe("Whether to loop"),
        speedRatio: z.number().optional().describe("Playback speed (1 = normal, 2 = double, 0.5 = half)"),
        from: z.number().optional().describe("Start frame override"),
        to: z.number().optional().describe("End frame override"),
    },
    async ({ sceneName, name, animationIds, autoStart, isLooping, speedRatio, from, to }) => {
        const result = manager.createAnimationGroup(sceneName, name, animationIds, { autoStart, isLooping, speedRatio, from, to });
        if (typeof result === "string") {
            return { content: [{ type: "text", text: `Error: ${result}` }], isError: true };
        }
        return {
            content: [
                {
                    type: "text",
                    text: `Created animation group [${result.id}] "${name}" with ${animationIds.length} animation(s).`,
                },
            ],
        };
    }
);

server.tool("list_animatable_properties", "List all commonly animatable properties on Babylon.js scene nodes.", {}, async () => ({
    content: [{ type: "text", text: `Animatable properties:\n${GetAnimatablePropertiesSummary()}` }],
}));

// ═══════════════════════════════════════════════════════════════════════════
//  Tools — Physics
// ═══════════════════════════════════════════════════════════════════════════

server.tool(
    "add_physics_body",
    "Add a physics body to a mesh. Requires physics to be enabled in environment settings.",
    {
        sceneName: z.string().describe("Name of the scene"),
        meshId: z.string().describe("Mesh ID or name"),
        bodyType: z
            .union([z.enum(["Static", "Dynamic", "Animated"]), z.number()])
            .describe("Body type: Static (immovable), Dynamic (fully simulated), Animated (driven by animation)"),
        shapeType: z.enum(["Box", "Sphere", "Capsule", "Cylinder", "ConvexHull", "Mesh", "Container"]).describe("Collision shape type"),
        mass: z.number().optional().describe("Mass (kg). Use 0 for static bodies."),
        friction: z.number().optional().describe("Friction coefficient (0-1)"),
        restitution: z.number().optional().describe("Bounciness (0-1)"),
        linearDamping: z.number().optional().describe("Linear damping (0-1)"),
        angularDamping: z.number().optional().describe("Angular damping (0-1)"),
    },
    async ({ sceneName, meshId, bodyType, shapeType, mass, friction, restitution, linearDamping, angularDamping }) => {
        const result = manager.addPhysicsBody(sceneName, meshId, bodyType, shapeType, {
            mass,
            friction,
            restitution,
            linearDamping,
            angularDamping,
        });
        return {
            content: [
                {
                    type: "text",
                    text: result === "OK" ? `Added physics body to "${meshId}" (${shapeType}, ${bodyType}).` : `Error: ${result}`,
                },
            ],
            isError: result !== "OK",
        };
    }
);

// ═══════════════════════════════════════════════════════════════════════════
//  Tools — Flow Graph integration
// ═══════════════════════════════════════════════════════════════════════════

server.tool(
    "attach_flow_graph",
    "Attach a Flow Graph (exported from the Flow Graph MCP server) to the scene for interactive behavior. " +
        "The coordinator JSON is the output of export_graph_json from the Flow Graph MCP server.",
    {
        sceneName: z.string().describe("Name of the scene"),
        name: z.string().describe("Name for this flow graph attachment"),
        coordinatorJson: z.string().describe("The complete Flow Graph coordinator JSON string"),
        scopeNodeIds: z.array(z.string()).optional().describe("Optional: limit this flow graph to specific node IDs"),
    },
    async ({ sceneName, name, coordinatorJson, scopeNodeIds }) => {
        const result = manager.attachFlowGraph(sceneName, name, coordinatorJson, scopeNodeIds);
        if (typeof result === "string") {
            return { content: [{ type: "text", text: `Error: ${result}` }], isError: true };
        }
        return {
            content: [
                {
                    type: "text",
                    text: `Attached flow graph [${result.id}] "${name}".${scopeNodeIds?.length ? ` Scoped to: ${scopeNodeIds.join(", ")}` : ""}`,
                },
            ],
        };
    }
);

server.tool(
    "remove_flow_graph",
    "Remove a flow graph attachment from the scene.",
    {
        sceneName: z.string().describe("Name of the scene"),
        flowGraphId: z.string().describe("Flow graph ID or name"),
    },
    async ({ sceneName, flowGraphId }) => {
        const result = manager.removeFlowGraph(sceneName, flowGraphId);
        return {
            content: [{ type: "text", text: result === "OK" ? `Removed flow graph "${flowGraphId}".` : `Error: ${result}` }],
            isError: result !== "OK",
        };
    }
);

// ═══════════════════════════════════════════════════════════════════════════
//  Tools — Audio (Sound V2)
// ═══════════════════════════════════════════════════════════════════════════

server.tool(
    "add_sound",
    "Add a sound to the scene. Supports both preloaded and streaming audio. " + "Spatial audio can be enabled for 3D positional sound attached to a mesh.",
    {
        sceneName: z.string().describe("Name of the scene"),
        name: z.string().describe("Name for the sound"),
        url: z.string().describe("URL to the audio file"),
        soundType: z.enum(["static", "streaming"]).default("static").describe("Sound type: 'static' loads fully before playing; 'streaming' plays while downloading"),
        autoplay: z.boolean().optional().describe("Start playing immediately"),
        loop: z.boolean().optional().describe("Loop playback"),
        volume: z.number().optional().describe("Volume level (0-1)"),
        playbackRate: z.number().optional().describe("Playback speed (1 = normal)"),
        spatialEnabled: z.boolean().optional().describe("Enable 3D spatial audio"),
        spatialDistanceModel: z.enum(["linear", "inverse", "exponential"]).optional().describe("Distance attenuation model"),
        spatialMaxDistance: z.number().optional().describe("Max distance for sound falloff"),
        spatialMinDistance: z.number().optional().describe("Distance at which sound is full volume"),
        spatialRolloffFactor: z.number().optional().describe("How quickly sound attenuates with distance"),
        attachedMeshId: z.string().optional().describe("Mesh to attach spatial audio to"),
    },
    async ({ sceneName, name, url, soundType, ...opts }) => {
        const result = manager.addSound(sceneName, name, url, soundType, opts);
        if (typeof result === "string") {
            return { content: [{ type: "text", text: `Error: ${result}` }], isError: true };
        }
        return { content: [{ type: "text", text: `Added ${soundType} sound [${result.id}] "${name}".` }] };
    }
);

server.tool(
    "remove_sound",
    "Remove a sound from the scene.",
    {
        sceneName: z.string().describe("Name of the scene"),
        soundId: z.string().describe("Sound ID or name"),
    },
    async ({ sceneName, soundId }) => {
        const result = manager.removeSound(sceneName, soundId);
        return {
            content: [{ type: "text", text: result === "OK" ? `Removed sound "${soundId}".` : `Error: ${result}` }],
            isError: result !== "OK",
        };
    }
);

server.tool(
    "configure_sound",
    "Update properties of an existing sound (volume, loop, spatial settings, etc.).",
    {
        sceneName: z.string().describe("Name of the scene"),
        soundId: z.string().describe("Sound ID or name"),
        properties: z
            .object({
                volume: z.number().optional(),
                loop: z.boolean().optional(),
                autoplay: z.boolean().optional(),
                playbackRate: z.number().optional(),
                spatialEnabled: z.boolean().optional(),
                spatialDistanceModel: z.enum(["linear", "inverse", "exponential"]).optional(),
                spatialMaxDistance: z.number().optional(),
                spatialMinDistance: z.number().optional(),
                spatialRolloffFactor: z.number().optional(),
            })
            .describe("Properties to update"),
    },
    async ({ sceneName, soundId, properties }) => {
        const result = manager.configureSoundProperties(sceneName, soundId, properties);
        return {
            content: [{ type: "text", text: result === "OK" ? `Updated sound "${soundId}".` : `Error: ${result}` }],
            isError: result !== "OK",
        };
    }
);

server.tool(
    "attach_sound_to_mesh",
    "Attach a spatial sound to a mesh so it plays at the mesh's 3D position.",
    {
        sceneName: z.string().describe("Name of the scene"),
        soundId: z.string().describe("Sound ID or name"),
        meshId: z.string().describe("Mesh ID or name to attach sound to"),
    },
    async ({ sceneName, soundId, meshId }) => {
        const result = manager.attachSoundToMesh(sceneName, soundId, meshId);
        return {
            content: [{ type: "text", text: result === "OK" ? `Attached sound "${soundId}" to mesh "${meshId}".` : `Error: ${result}` }],
            isError: result !== "OK",
        };
    }
);

// ═══════════════════════════════════════════════════════════════════════════
//  Tools — Particle Systems
// ═══════════════════════════════════════════════════════════════════════════

server.tool(
    "add_particle_system",
    "Add a particle system to the scene. Can emit from a mesh or a position. " + "Supports classic CPU particles and GPU particles for higher counts.",
    {
        sceneName: z.string().describe("Name of the scene"),
        name: z.string().describe("Name for the particle system"),
        capacity: z.number().default(1000).describe("Maximum number of particles"),
        emitter: z
            .union([z.string().describe("Mesh ID to emit from"), z.object({ x: z.number(), y: z.number(), z: z.number() }).describe("World position")])
            .describe("Emitter: mesh ID or a position vector"),
        isGpu: z.boolean().default(false).describe("Use GPU particle system for higher performance"),
        emitterType: z.enum(["Box", "Sphere", "Cone", "Cylinder", "Hemisphere", "Point"]).optional().describe("Emitter shape type"),
        emitterOptions: z.record(z.string(), z.unknown()).optional().describe("Emitter-specific options (radius, angle, height, etc.)"),
        emitRate: z.number().optional().describe("Particles emitted per second"),
        minLifeTime: z.number().optional().describe("Minimum particle lifetime in seconds"),
        maxLifeTime: z.number().optional().describe("Maximum particle lifetime in seconds"),
        minSize: z.number().optional().describe("Minimum particle size"),
        maxSize: z.number().optional().describe("Maximum particle size"),
        blendMode: z.enum(["ONEONE", "STANDARD", "ADD", "MULTIPLY"]).optional().describe("Blend mode"),
        particleTexture: z.string().optional().describe("URL of the particle texture"),
        color1: z
            .object({ r: z.number(), g: z.number(), b: z.number(), a: z.number().default(1) })
            .optional()
            .describe("Start color"),
        color2: z
            .object({ r: z.number(), g: z.number(), b: z.number(), a: z.number().default(1) })
            .optional()
            .describe("End color"),
        gravity: Vector3Schema.describe("Gravity vector affecting particles"),
    },
    async ({
        sceneName,
        name,
        capacity,
        emitter,
        isGpu,
        emitterType,
        emitterOptions,
        emitRate,
        minLifeTime,
        maxLifeTime,
        minSize,
        maxSize,
        blendMode,
        particleTexture,
        color1,
        color2,
        gravity,
    }) => {
        const result = manager.addParticleSystem(sceneName, name, capacity, emitter as string | { x: number; y: number; z: number }, {
            isGpu,
            emitterType,
            emitterOptions: emitterOptions as Record<string, unknown>,
            emitRate,
            minLifeTime,
            maxLifeTime,
            minSize,
            maxSize,
            blendMode: blendMode ? ParticleBlendModes[blendMode] : undefined,
            particleTexture,
            color1: color1 as { r: number; g: number; b: number; a: number } | undefined,
            color2: color2 as { r: number; g: number; b: number; a: number } | undefined,
            gravity: gravity as { x: number; y: number; z: number } | undefined,
        });
        if (typeof result === "string") {
            return { content: [{ type: "text", text: `Error: ${result}` }], isError: true };
        }
        const gpu = isGpu ? " [GPU]" : "";
        return { content: [{ type: "text", text: `Added particle system [${result.id}] "${name}" cap=${capacity}${gpu}.` }] };
    }
);

server.tool(
    "remove_particle_system",
    "Remove a particle system from the scene.",
    {
        sceneName: z.string().describe("Name of the scene"),
        particleSystemId: z.string().describe("Particle system ID or name"),
    },
    async ({ sceneName, particleSystemId }) => {
        const result = manager.removeParticleSystem(sceneName, particleSystemId);
        return {
            content: [{ type: "text", text: result === "OK" ? `Removed particle system "${particleSystemId}".` : `Error: ${result}` }],
            isError: result !== "OK",
        };
    }
);

server.tool(
    "configure_particle_system",
    "Update properties of an existing particle system (emit rate, sizes, colors, etc.).",
    {
        sceneName: z.string().describe("Name of the scene"),
        particleSystemId: z.string().describe("Particle system ID or name"),
        properties: z
            .object({
                emitRate: z.number().optional(),
                minLifeTime: z.number().optional(),
                maxLifeTime: z.number().optional(),
                minSize: z.number().optional(),
                maxSize: z.number().optional(),
                blendMode: z.number().optional(),
                particleTexture: z.string().optional(),
                color1: z.object({ r: z.number(), g: z.number(), b: z.number(), a: z.number().default(1) }).optional(),
                color2: z.object({ r: z.number(), g: z.number(), b: z.number(), a: z.number().default(1) }).optional(),
                gravity: z.object({ x: z.number(), y: z.number(), z: z.number() }).optional(),
            })
            .describe("Properties to update on the particle system"),
    },
    async ({ sceneName, particleSystemId, properties }) => {
        const result = manager.configureParticleSystem(sceneName, particleSystemId, properties);
        return {
            content: [{ type: "text", text: result === "OK" ? `Updated particle system "${particleSystemId}".` : `Error: ${result}` }],
            isError: result !== "OK",
        };
    }
);

server.tool(
    "add_particle_gradient",
    "Add a color or factor gradient to a particle system for animated properties over lifetime.",
    {
        sceneName: z.string().describe("Name of the scene"),
        particleSystemId: z.string().describe("Particle system ID or name"),
        gradientType: z.enum(["color", "size", "velocity"]).describe("Type of gradient to add"),
        gradient: z.number().min(0).max(1).describe("Gradient position (0=birth, 1=death)"),
        value: z
            .union([
                z.number().describe("Factor value (for size, velocity, alpha, drag, emitRate)"),
                z.object({ r: z.number(), g: z.number(), b: z.number(), a: z.number().optional() }).describe("Color value"),
            ])
            .describe("Value at this gradient position"),
    },
    async ({ sceneName, particleSystemId, gradientType, gradient, value }) => {
        const result = manager.addParticleGradient(sceneName, particleSystemId, gradientType, gradient, value as number | { r: number; g: number; b: number; a?: number });
        return {
            content: [{ type: "text", text: result === "OK" ? `Added ${gradientType} gradient at ${gradient} to "${particleSystemId}".` : `Error: ${result}` }],
            isError: result !== "OK",
        };
    }
);

// ═══════════════════════════════════════════════════════════════════════════
//  Tools — Physics Constraints
// ═══════════════════════════════════════════════════════════════════════════

server.tool(
    "add_physics_constraint",
    "Add a physics constraint (joint) between two meshes that have physics bodies. " + "Supports ball-and-socket, hinge, slider, distance, lock, prismatic, and spring joints.",
    {
        sceneName: z.string().describe("Name of the scene"),
        name: z.string().describe("Name for the constraint"),
        constraintType: z.enum(["BallAndSocket", "Distance", "Hinge", "Slider", "Lock", "Prismatic", "Spring"]).describe("Type of constraint/joint"),
        parentMeshId: z.string().describe("ID of the parent/anchor mesh (must have physics body)"),
        childMeshId: z.string().describe("ID of the child mesh (must have physics body)"),
        pivotA: Vector3Schema.describe("Pivot point on parent mesh (local space)"),
        pivotB: Vector3Schema.describe("Pivot point on child mesh (local space)"),
        axisA: Vector3Schema.describe("Constraint axis on parent mesh"),
        axisB: Vector3Schema.describe("Constraint axis on child mesh"),
        maxDistance: z.number().optional().describe("Max distance (for Distance constraint)"),
        minLimit: z.number().optional().describe("Minimum limit (angle for Hinge, distance for Slider)"),
        maxLimit: z.number().optional().describe("Maximum limit (angle for Hinge, distance for Slider)"),
        stiffness: z.number().optional().describe("Spring stiffness (for Spring constraint)"),
        damping: z.number().optional().describe("Spring damping (for Spring constraint)"),
    },
    async ({ sceneName, name, constraintType, parentMeshId, childMeshId, pivotA, pivotB, axisA, axisB, ...opts }) => {
        const result = manager.addPhysicsConstraint(sceneName, name, constraintType, parentMeshId, childMeshId, {
            pivotA: pivotA as { x: number; y: number; z: number } | undefined,
            pivotB: pivotB as { x: number; y: number; z: number } | undefined,
            axisA: axisA as { x: number; y: number; z: number } | undefined,
            axisB: axisB as { x: number; y: number; z: number } | undefined,
            ...opts,
        });
        if (typeof result === "string") {
            return { content: [{ type: "text", text: `Error: ${result}` }], isError: true };
        }
        return { content: [{ type: "text", text: `Added ${constraintType} constraint [${result.id}] "${name}" between "${parentMeshId}" and "${childMeshId}".` }] };
    }
);

server.tool(
    "remove_physics_constraint",
    "Remove a physics constraint from the scene.",
    {
        sceneName: z.string().describe("Name of the scene"),
        constraintId: z.string().describe("Constraint ID or name"),
    },
    async ({ sceneName, constraintId }) => {
        const result = manager.removePhysicsConstraint(sceneName, constraintId);
        return {
            content: [{ type: "text", text: result === "OK" ? `Removed constraint "${constraintId}".` : `Error: ${result}` }],
            isError: result !== "OK",
        };
    }
);

// ═══════════════════════════════════════════════════════════════════════════
//  Tools — Post-Processing (Render Pipeline)
// ═══════════════════════════════════════════════════════════════════════════

server.tool(
    "configure_render_pipeline",
    "Configure the DefaultRenderingPipeline with post-processing effects: " + "bloom, depth-of-field, FXAA, sharpen, chromatic aberration, and grain.",
    {
        sceneName: z.string().describe("Name of the scene"),
        bloomEnabled: z.boolean().optional().describe("Enable bloom/glow effect"),
        bloomKernel: z.number().optional().describe("Bloom kernel size (default: 64)"),
        bloomWeight: z.number().optional().describe("Bloom intensity weight (default: 0.15)"),
        bloomThreshold: z.number().optional().describe("Brightness threshold for bloom (default: 0.9)"),
        bloomScale: z.number().optional().describe("Bloom scale factor (default: 0.5)"),
        depthOfFieldEnabled: z.boolean().optional().describe("Enable depth-of-field effect"),
        fxaaEnabled: z.boolean().optional().describe("Enable fast approximate anti-aliasing"),
        sharpenEnabled: z.boolean().optional().describe("Enable sharpen post-process"),
        chromaticAberrationEnabled: z.boolean().optional().describe("Enable chromatic aberration effect"),
        grainEnabled: z.boolean().optional().describe("Enable film grain effect"),
        imageProcessingEnabled: z.boolean().optional().describe("Enable image processing (tone mapping, exposure)"),
    },
    async ({ sceneName, ...props }) => {
        const result = manager.configureRenderPipeline(sceneName, props);
        if (typeof result === "string") {
            return { content: [{ type: "text", text: `Error: ${result}` }], isError: true };
        }
        const enabled = [
            props.bloomEnabled && "bloom",
            props.depthOfFieldEnabled && "DOF",
            props.fxaaEnabled && "FXAA",
            props.sharpenEnabled && "sharpen",
            props.chromaticAberrationEnabled && "chromatic",
            props.grainEnabled && "grain",
        ].filter(Boolean);
        return {
            content: [{ type: "text", text: `Render pipeline configured.${enabled.length > 0 ? ` Effects: ${enabled.join(", ")}` : ""}` }],
        };
    }
);

// ═══════════════════════════════════════════════════════════════════════════
//  Tools — Glow Layer
// ═══════════════════════════════════════════════════════════════════════════

server.tool(
    "add_glow_layer",
    "Add a glow layer to the scene that makes emissive parts of meshes glow. " + "You can include/exclude specific meshes from the glow effect.",
    {
        sceneName: z.string().describe("Name of the scene"),
        name: z.string().describe("Name for the glow layer"),
        intensity: z.number().optional().describe("Glow intensity (default: 1)"),
        blurKernelSize: z.number().optional().describe("Blur kernel size in pixels (default: 32)"),
    },
    async ({ sceneName, name, intensity, blurKernelSize }) => {
        const result = manager.addGlowLayer(sceneName, name, { intensity, blurKernelSize });
        if (typeof result === "string") {
            return { content: [{ type: "text", text: `Error: ${result}` }], isError: true };
        }
        return { content: [{ type: "text", text: `Added glow layer [${result.id}] "${name}".` }] };
    }
);

server.tool(
    "add_mesh_to_glow_layer",
    "Include or exclude a mesh from a glow layer's effect.",
    {
        sceneName: z.string().describe("Name of the scene"),
        glowLayerId: z.string().describe("Glow layer ID or name"),
        meshId: z.string().describe("Mesh ID or name"),
        mode: z.enum(["include", "exclude"]).default("include").describe("Whether to include or exclude the mesh"),
    },
    async ({ sceneName, glowLayerId, meshId, mode }) => {
        const result = manager.addMeshToGlowLayer(sceneName, glowLayerId, meshId, mode);
        return {
            content: [
                { type: "text", text: result === "OK" ? `${mode === "include" ? "Included" : "Excluded"} mesh "${meshId}" in glow layer "${glowLayerId}".` : `Error: ${result}` },
            ],
            isError: result !== "OK",
        };
    }
);

server.tool(
    "remove_glow_layer",
    "Remove a glow layer from the scene.",
    {
        sceneName: z.string().describe("Name of the scene"),
        glowLayerId: z.string().describe("Glow layer ID or name"),
    },
    async ({ sceneName, glowLayerId }) => {
        const result = manager.removeGlowLayer(sceneName, glowLayerId);
        return {
            content: [{ type: "text", text: result === "OK" ? `Removed glow layer "${glowLayerId}".` : `Error: ${result}` }],
            isError: result !== "OK",
        };
    }
);

// ═══════════════════════════════════════════════════════════════════════════
//  Tools — Highlight Layer
// ═══════════════════════════════════════════════════════════════════════════

server.tool(
    "add_highlight_layer",
    "Add a highlight layer to the scene for colored outlines and glows on specific meshes.",
    {
        sceneName: z.string().describe("Name of the scene"),
        name: z.string().describe("Name for the highlight layer"),
        isStroke: z.boolean().optional().describe("Use stroke mode (outline) instead of glow"),
        blurHorizontalSize: z.number().optional().describe("Horizontal blur size"),
        blurVerticalSize: z.number().optional().describe("Vertical blur size"),
    },
    async ({ sceneName, name, isStroke, blurHorizontalSize, blurVerticalSize }) => {
        const result = manager.addHighlightLayer(sceneName, name, { isStroke, blurHorizontalSize, blurVerticalSize });
        if (typeof result === "string") {
            return { content: [{ type: "text", text: `Error: ${result}` }], isError: true };
        }
        return { content: [{ type: "text", text: `Added highlight layer [${result.id}] "${name}"${isStroke ? " [stroke mode]" : ""}.` }] };
    }
);

server.tool(
    "add_mesh_to_highlight_layer",
    "Add a mesh to a highlight layer with a specific highlight color.",
    {
        sceneName: z.string().describe("Name of the scene"),
        highlightLayerId: z.string().describe("Highlight layer ID or name"),
        meshId: z.string().describe("Mesh ID or name to highlight"),
        color: z.object({ r: z.number(), g: z.number(), b: z.number() }).describe("Highlight color as {r, g, b} (0-1 range)"),
        glowEmissiveOnly: z.boolean().optional().describe("Only glow emissive parts of the mesh"),
    },
    async ({ sceneName, highlightLayerId, meshId, color, glowEmissiveOnly }) => {
        const result = manager.addMeshToHighlightLayer(sceneName, highlightLayerId, meshId, color, glowEmissiveOnly);
        return {
            content: [{ type: "text", text: result === "OK" ? `Added mesh "${meshId}" to highlight layer "${highlightLayerId}".` : `Error: ${result}` }],
            isError: result !== "OK",
        };
    }
);

server.tool(
    "remove_mesh_from_highlight_layer",
    "Remove a mesh from a highlight layer.",
    {
        sceneName: z.string().describe("Name of the scene"),
        highlightLayerId: z.string().describe("Highlight layer ID or name"),
        meshId: z.string().describe("Mesh ID or name to remove from highlighting"),
    },
    async ({ sceneName, highlightLayerId, meshId }) => {
        const result = manager.removeMeshFromHighlightLayer(sceneName, highlightLayerId, meshId);
        return {
            content: [{ type: "text", text: result === "OK" ? `Removed mesh "${meshId}" from highlight layer "${highlightLayerId}".` : `Error: ${result}` }],
            isError: result !== "OK",
        };
    }
);

server.tool(
    "remove_highlight_layer",
    "Remove a highlight layer from the scene.",
    {
        sceneName: z.string().describe("Name of the scene"),
        highlightLayerId: z.string().describe("Highlight layer ID or name"),
    },
    async ({ sceneName, highlightLayerId }) => {
        const result = manager.removeHighlightLayer(sceneName, highlightLayerId);
        return {
            content: [{ type: "text", text: result === "OK" ? `Removed highlight layer "${highlightLayerId}".` : `Error: ${result}` }],
            isError: result !== "OK",
        };
    }
);

// ═══════════════════════════════════════════════════════════════════════════
//  Tools — Query & Describe
// ═══════════════════════════════════════════════════════════════════════════

server.tool(
    "describe_scene",
    "Get a human-readable description of the entire scene state — all cameras, lights, meshes, " + "materials, models, animations, flow graphs, and environment settings.",
    {
        sceneName: z.string().describe("Name of the scene"),
    },
    async ({ sceneName }) => {
        const desc = manager.describeScene(sceneName);
        return { content: [{ type: "text", text: desc }] };
    }
);

server.tool(
    "describe_node",
    "Get detailed information about a specific node (mesh, transform node, etc.) including " + "transform, material, physics, and hierarchy info.",
    {
        sceneName: z.string().describe("Name of the scene"),
        nodeId: z.string().describe("Node ID or name"),
    },
    async ({ sceneName, nodeId }) => {
        const desc = manager.describeNode(sceneName, nodeId);
        return { content: [{ type: "text", text: desc }] };
    }
);

server.tool(
    "list_mesh_types",
    "List all available primitive mesh types and their creation options.",
    {
        type: z.string().optional().describe("Specific mesh type to get detailed info for"),
    },
    async ({ type }) => {
        if (type) {
            const info = MeshPrimitives[type];
            if (!info) {
                return { content: [{ type: "text", text: `Unknown mesh type "${type}".` }], isError: true };
            }
            const opts = Object.entries(info.options)
                .map(([k, v]) => `  • ${k} (${v.type}${v.default !== undefined ? `, default: ${v.default}` : ""}): ${v.description}`)
                .join("\n");
            return { content: [{ type: "text", text: `## ${type}\n${info.description}\n\n### Options:\n${opts}` }] };
        }
        return { content: [{ type: "text", text: `## Mesh Primitives\n${GetMeshPrimitivesSummary()}` }] };
    }
);

server.tool(
    "list_camera_types",
    "List all available camera types and their properties.",
    {
        type: z.string().optional().describe("Specific camera type to get detailed info for"),
    },
    async ({ type }) => {
        if (type) {
            const info = CameraTypes[type];
            if (!info) {
                return { content: [{ type: "text", text: `Unknown camera type "${type}".` }], isError: true };
            }
            const opts = Object.entries(info.options)
                .map(([k, v]) => `  • ${k} (${v.type}${v.default !== undefined ? `, default: ${JSON.stringify(v.default)}` : ""}): ${v.description}`)
                .join("\n");
            return { content: [{ type: "text", text: `## ${type}\n${info.description}\n\n### Properties:\n${opts}` }] };
        }
        return { content: [{ type: "text", text: `## Camera Types\n${GetCameraTypesSummary()}` }] };
    }
);

server.tool(
    "list_light_types",
    "List all available light types and their properties.",
    {
        type: z.string().optional().describe("Specific light type to get detailed info for"),
    },
    async ({ type }) => {
        if (type) {
            const info = LightTypes[type];
            if (!info) {
                return { content: [{ type: "text", text: `Unknown light type "${type}".` }], isError: true };
            }
            const opts = Object.entries(info.options)
                .map(([k, v]) => `  • ${k} (${v.type}${v.default !== undefined ? `, default: ${JSON.stringify(v.default)}` : ""}): ${v.description}`)
                .join("\n");
            return { content: [{ type: "text", text: `## ${type}\n${info.description}\n\n### Properties:\n${opts}` }] };
        }
        return { content: [{ type: "text", text: `## Light Types\n${GetLightTypesSummary()}` }] };
    }
);

server.tool(
    "list_material_types",
    "List all available material types and their properties.",
    {
        type: z.string().optional().describe("Specific material type to get detailed info for"),
    },
    async ({ type }) => {
        if (type) {
            const info = MaterialPresets[type];
            if (!info) {
                return { content: [{ type: "text", text: `Unknown material type "${type}".` }], isError: true };
            }
            const opts = Object.entries(info.options)
                .map(([k, v]) => `  • ${k} (${v.type}${v.default !== undefined ? `, default: ${JSON.stringify(v.default)}` : ""}): ${v.description}`)
                .join("\n");
            return { content: [{ type: "text", text: `## ${type}\n${info.description}\n\n### Properties:\n${opts}` }] };
        }
        return { content: [{ type: "text", text: `## Material Types\n${GetMaterialPresetsSummary()}` }] };
    }
);

server.tool("list_particle_emitter_types", "List all available particle emitter shapes (Box, Sphere, Cone, etc.) and their options.", {}, async () => {
    return { content: [{ type: "text", text: `## Particle Emitter Types\n${GetParticleEmitterTypesSummary()}` }] };
});

server.tool("list_physics_constraint_types", "List all available physics constraint/joint types (BallAndSocket, Hinge, Slider, etc.).", {}, async () => {
    return { content: [{ type: "text", text: `## Physics Constraint Types\n${GetPhysicsConstraintTypesSummary()}` }] };
});

server.tool("list_post_process_effects", "List all available post-processing effects and their configuration properties.", {}, async () => {
    return { content: [{ type: "text", text: `## Post-Process Effects\n${GetPostProcessEffectsSummary()}` }] };
});

// ═══════════════════════════════════════════════════════════════════════════
//  Tools — Validation
// ═══════════════════════════════════════════════════════════════════════════

server.tool(
    "validate_scene",
    "Run validation checks on the scene: missing cameras, broken material references, " + "orphaned parents, animation target issues, etc.",
    {
        sceneName: z.string().describe("Name of the scene to validate"),
    },
    async ({ sceneName }) => {
        const issues = manager.validateScene(sceneName);
        return {
            content: [{ type: "text", text: issues.join("\n") }],
            isError: issues.some((i) => i.startsWith("ERROR")),
        };
    }
);

// ═══════════════════════════════════════════════════════════════════════════
//  Tools — Export / Import
// ═══════════════════════════════════════════════════════════════════════════

server.tool(
    "export_scene_code",
    "Export the scene as runnable TypeScript/JavaScript code that uses the Babylon.js API. " +
        "This is the RECOMMENDED export format because it supports ALL features including " +
        "FlowGraph behaviors and NME materials (which the .babylon JSON format cannot represent together). " +
        "The generated code is immediately runnable in a Babylon.js project.",
    {
        sceneName: z.string().describe("Name of the scene to export"),
        wrapInFunction: z.boolean().default(true).describe("Wrap all code in an async createScene() function"),
        functionName: z.string().default("createScene").describe("Name of the wrapper function"),
        includeHtmlBoilerplate: z.boolean().default(false).describe("Include full HTML page boilerplate (canvas, script tags, CDN links) for a standalone page"),
        includeEngineSetup: z.boolean().default(true).describe("Include canvas and Engine creation code"),
        includeRenderLoop: z.boolean().default(true).describe("Include the render loop and resize handler"),
    },
    async ({ sceneName, wrapInFunction, functionName, includeHtmlBoilerplate, includeEngineSetup, includeRenderLoop }) => {
        const code = manager.exportCode(sceneName, {
            wrapInFunction,
            functionName,
            includeHtmlBoilerplate,
            includeEngineSetup,
            includeRenderLoop,
        });
        if (!code) {
            return { content: [{ type: "text", text: `Scene "${sceneName}" not found.` }], isError: true };
        }
        return { content: [{ type: "text", text: code }] };
    }
);

server.tool(
    "export_scene_json",
    "Export the scene as a raw JSON descriptor (the internal scene format). " +
        "Note: For most use cases, prefer export_scene_code which generates runnable Babylon.js code. " +
        "Use this JSON export if you have a custom loader or need to re-import the scene later.",
    {
        sceneName: z.string().describe("Name of the scene to export"),
    },
    async ({ sceneName }) => {
        const json = manager.exportJSON(sceneName);
        if (!json) {
            return { content: [{ type: "text", text: `Scene "${sceneName}" not found.` }], isError: true };
        }
        return { content: [{ type: "text", text: json }] };
    }
);

server.tool(
    "import_scene_json",
    "Import a scene descriptor JSON into memory for editing.",
    {
        sceneName: z.string().describe("Name to give the imported scene"),
        json: z.string().describe("The scene descriptor JSON string"),
    },
    async ({ sceneName, json }) => {
        const result = manager.importJSON(sceneName, json);
        if (result !== "OK") {
            return { content: [{ type: "text", text: `Error: ${result}` }], isError: true };
        }
        const desc = manager.describeScene(sceneName);
        return { content: [{ type: "text", text: `Imported successfully.\n\n${desc}` }] };
    }
);

// ═══════════════════════════════════════════════════════════════════════════
//  Tools — Batch operations
// ═══════════════════════════════════════════════════════════════════════════

server.tool(
    "add_meshes_batch",
    "Add multiple meshes at once. More efficient than calling add_mesh repeatedly.",
    {
        sceneName: z.string().describe("Name of the scene"),
        meshes: z
            .array(
                z.object({
                    name: z.string(),
                    type: z.string(),
                    options: z.record(z.string(), z.unknown()).optional(),
                    transform: TransformSchema,
                    parentId: z.string().optional(),
                    materialId: z.string().optional(),
                })
            )
            .describe("Array of meshes to add"),
    },
    async ({ sceneName, meshes }) => {
        const results: string[] = [];
        for (const m of meshes) {
            const result = manager.addMesh(
                sceneName,
                m.name,
                m.type,
                m.options as Record<string, unknown>,
                m.transform as Record<string, unknown> | undefined,
                m.parentId,
                m.materialId
            );
            if (typeof result === "string") {
                results.push(`Error adding "${m.name}": ${result}`);
            } else {
                results.push(`[${result.id}] "${m.name}" (${m.type})`);
            }
        }
        return { content: [{ type: "text", text: `Added meshes:\n${results.join("\n")}` }] };
    }
);

server.tool(
    "setup_scene_batch",
    "Set up a complete scene in one call: camera, lights, environment, and optionally meshes. " + "Great for quickly bootstrapping a scene.",
    {
        sceneName: z.string().describe("Name for the new scene"),
        description: z.string().optional().describe("Scene description"),
        camera: z
            .object({
                name: z.string().default("mainCamera"),
                type: z.string().default("ArcRotateCamera"),
                properties: z.record(z.string(), z.unknown()).optional(),
            })
            .optional()
            .describe("Camera configuration"),
        lights: z
            .array(
                z.object({
                    name: z.string(),
                    type: z.string(),
                    properties: z.record(z.string(), z.unknown()).optional(),
                })
            )
            .optional()
            .describe("Array of lights to add"),
        environment: z.record(z.string(), z.unknown()).optional().describe("Environment settings"),
    },
    async ({ sceneName, description, camera, lights, environment }) => {
        // Create scene
        manager.createScene(sceneName, description);
        const results: string[] = [`Created scene "${sceneName}".`];

        // Add camera
        if (camera) {
            const camResult = manager.addCamera(sceneName, camera.name, camera.type, camera.properties as Record<string, unknown>, true);
            if (typeof camResult === "string") {
                results.push(`Camera error: ${camResult}`);
            } else {
                results.push(`Added camera [${camResult.id}] "${camera.name}" (${camera.type}).`);
            }
        }

        // Add lights
        if (lights) {
            for (const l of lights) {
                const lightResult = manager.addLight(sceneName, l.name, l.type, l.properties as Record<string, unknown>);
                if (typeof lightResult === "string") {
                    results.push(`Light error: ${lightResult}`);
                } else {
                    results.push(`Added light [${lightResult.id}] "${l.name}" (${l.type}).`);
                }
            }
        }

        // Set environment
        if (environment) {
            const envResult = manager.setEnvironment(sceneName, environment as Record<string, unknown>);
            if (envResult === "OK") {
                results.push("Environment configured.");
            } else {
                results.push(`Environment error: ${envResult}`);
            }
        }

        return { content: [{ type: "text", text: results.join("\n") }] };
    }
);

// ═══════════════════════════════════════════════════════════════════════════
//  Start the server
// ═══════════════════════════════════════════════════════════════════════════

async function Main() {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error("Babylon.js 3D Scene MCP Server running on stdio");
}

try {
    await Main();
} catch (err) {
    console.error("Fatal error:", err);
    process.exit(1);
}

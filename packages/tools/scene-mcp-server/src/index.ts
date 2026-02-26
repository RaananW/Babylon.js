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
import { startPreview, stopPreview, isPreviewRunning, getPreviewUrl, getPreviewSceneName, setPreviewScene } from "./previewServer.js";

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

server.registerResource("scene-overview", "scene://overview", {}, async (uri) => ({
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
                "- **Inspector v2**: Enable the Babylon.js scene debugger/inspector",
                "- **Environment**: Skybox, fog, HDR, clear color",
                "",
                "## Workflow",
                "1. `create_scene` — create a new scene",
                "2. Add cameras, lights, meshes/models",
                "3. Create materials and assign them to meshes",
                "4. Define animations and physics",
                "5. Attach flow graphs for interactivity",
                "6. Attach GUI via `attach_gui` (from the GUI MCP server's export_gui_json)",
                "7. `validate_scene` to check for issues",
                "8. `start_preview` to launch a live preview server — open the URL in a browser to see the scene instantly",
                "9. `export_scene_code` to get runnable TypeScript code (recommended) — GUI is auto-included",
                "10. `export_scene_json` to get the raw scene descriptor JSON (for custom loaders)",
                "",
                "## Live Preview",
                "Use `start_preview` to host the scene on a local HTTP server. The preview always reflects the",
                "latest scene state — just refresh the browser after making changes. No need to write files to disk.",
                "",
                "## Integration with other MCP servers",
                "- **NME MCP server**: Export NME JSON → import here via `add_material` with type NodeMaterial",
                "- **Flow Graph MCP server**: Export coordinator JSON → attach here via `attach_flow_graph`",
                "- **GUI MCP server**: Export GUI JSON → attach here via `attach_gui` (auto-included in code exports)",
                "- **NRG MCP server** (babylonjs-nrg): Build a custom render pipeline → export JSON → attach here via `attach_node_render_graph`",
                "- **NGE MCP server** (babylonjs-nge): Design procedural geometry → export JSON → add as a mesh via `add_node_geometry_mesh`",
            ].join("\n"),
        },
    ],
}));

server.registerResource("mesh-catalog", "scene://mesh-catalog", {}, async (uri) => ({
    contents: [
        {
            uri: uri.href,
            mimeType: "text/markdown",
            text: `# Mesh Primitives\n${GetMeshPrimitivesSummary()}`,
        },
    ],
}));

server.registerResource("camera-catalog", "scene://camera-catalog", {}, async (uri) => ({
    contents: [
        {
            uri: uri.href,
            mimeType: "text/markdown",
            text: `# Camera Types\n${GetCameraTypesSummary()}`,
        },
    ],
}));

server.registerResource("light-catalog", "scene://light-catalog", {}, async (uri) => ({
    contents: [
        {
            uri: uri.href,
            mimeType: "text/markdown",
            text: `# Light Types\n${GetLightTypesSummary()}`,
        },
    ],
}));

server.registerResource("material-catalog", "scene://material-catalog", {}, async (uri) => ({
    contents: [
        {
            uri: uri.href,
            mimeType: "text/markdown",
            text: `# Material Types\n${GetMaterialPresetsSummary()}`,
        },
    ],
}));

server.registerResource("animation-properties", "scene://animation-properties", {}, async (uri) => ({
    contents: [
        {
            uri: uri.href,
            mimeType: "text/markdown",
            text: `# Animatable Properties\n${GetAnimatablePropertiesSummary()}`,
        },
    ],
}));

server.registerResource("model-formats", "scene://model-formats", {}, async (uri) => ({
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

server.registerPrompt("create-basic-scene", { description: "Step-by-step instructions for building a basic 3D scene with a camera, light, and mesh" }, () => ({
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

server.registerPrompt("create-character-scene", { description: "Create a scene with a loaded character model, animations, camera following, and NME material" }, () => ({
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

server.registerPrompt("create-physics-playground", { description: "Build an interactive physics scene with falling objects" }, () => ({
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

server.registerTool(
    "create_scene",
    {
        description: "Create a new empty 3D scene in memory. This is always the first step. " + "Then add cameras, lights, meshes, materials, models, animations, and flow graphs.",
        inputSchema: {
            name: z.string().describe("Unique name for the scene"),
            description: z.string().optional().describe("A description of what this scene contains"),
        },
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

server.registerTool(
    "delete_scene",
    {
        description: "Delete a scene from memory.",
        inputSchema: {
            name: z.string().describe("Name of the scene to delete"),
        },
    },
    async ({ name }) => {
        const ok = manager.deleteScene(name);
        return {
            content: [{ type: "text", text: ok ? `Deleted "${name}".` : `Scene "${name}" not found.` }],
        };
    }
);

server.registerTool("list_scenes", { description: "List all scenes currently in memory." }, async () => {
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

server.registerTool(
    "set_environment",
    {
        description: "Configure the scene environment: clear color, fog, skybox, HDR environment texture, " + "physics settings, and default ground.",
        inputSchema: {
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

server.registerTool(
    "add_camera",
    {
        description: "Add a camera to the scene. Use 'ArcRotateCamera' for orbit controls, 'FreeCamera' for " + "first-person, 'FollowCamera' for third-person follow.",
        inputSchema: {
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

server.registerTool(
    "set_active_camera",
    {
        description: "Set which camera is the active (rendering) camera.",
        inputSchema: {
            sceneName: z.string().describe("Name of the scene"),
            cameraId: z.string().describe("Camera ID or name"),
        },
    },
    async ({ sceneName, cameraId }) => {
        const result = manager.setActiveCamera(sceneName, cameraId);
        return {
            content: [{ type: "text", text: result === "OK" ? `Active camera set to "${cameraId}".` : `Error: ${result}` }],
            isError: result !== "OK",
        };
    }
);

server.registerTool(
    "configure_camera",
    {
        description: "Update properties on an existing camera.",
        inputSchema: {
            sceneName: z.string().describe("Name of the scene"),
            cameraId: z.string().describe("Camera ID or name"),
            properties: z.record(z.string(), z.unknown()).describe("Properties to update"),
        },
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

server.registerTool(
    "add_light",
    {
        description: "Add a light to the scene.",
        inputSchema: {
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

server.registerTool(
    "configure_light",
    {
        description: "Update properties on an existing light.",
        inputSchema: {
            sceneName: z.string().describe("Name of the scene"),
            lightId: z.string().describe("Light ID or name"),
            properties: z.record(z.string(), z.unknown()).describe("Properties to update"),
        },
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

server.registerTool(
    "add_material",
    {
        description:
            "Create a material in the scene. Supports StandardMaterial, PBRMaterial, and NodeMaterial (NME JSON). " +
            "For NodeMaterial, pass the exported NME JSON from the NME MCP server.",
        inputSchema: {
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
    },
    async ({ sceneName, name, type, properties, nmeJson, snippetId }) => {
        const result = manager.addMaterial(sceneName, name, type, properties as Record<string, unknown>, nmeJson, snippetId);
        if (typeof result === "string") {
            return { content: [{ type: "text", text: `Error: ${result}` }], isError: true };
        }
        const extra = type === "NodeMaterial" ? (nmeJson ? " (NME JSON imported)" : snippetId ? ` (will load snippet ${snippetId})` : "") : "";
        // Warn when Standard/PBR material has no distinguishing color property
        let warning = "";
        if (type === "StandardMaterial" || type === "PBRMaterial") {
            const props = properties as Record<string, unknown> | undefined;
            const colorKeys =
                type === "StandardMaterial" ? ["diffuseColor", "specularColor", "emissiveColor", "diffuseTexture"] : ["albedoColor", "albedoTexture", "emissiveColor"];
            const hasColor = props && colorKeys.some((k) => k in props);
            if (!hasColor) {
                const primaryKey = type === "StandardMaterial" ? "diffuseColor" : "albedoColor";
                warning =
                    `\n⚠ Note: No ${primaryKey} or texture specified — the material will be default white. ` + `Pass properties: { ${primaryKey}: [r, g, b] } to set a color.`;
            }
            // Show stored properties for visibility
            if (props && Object.keys(props).length > 0) {
                const summary = Object.entries(props)
                    .map(([k, v]) => `${k}: ${JSON.stringify(v)}`)
                    .join(", ");
                warning += `\nStored properties: { ${summary} }`;
            }
        }
        return {
            content: [{ type: "text", text: `Added material [${result.id}] "${name}" (${type})${extra}.${warning}` }],
        };
    }
);

server.registerTool(
    "remove_material",
    {
        description: "Remove a material from the scene.",
        inputSchema: {
            sceneName: z.string().describe("Name of the scene"),
            materialId: z.string().describe("Material ID or name"),
        },
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

server.registerTool(
    "add_texture",
    {
        description: "Add a texture to the scene. Textures can be referenced by materials.",
        inputSchema: {
            sceneName: z.string().describe("Name of the scene"),
            name: z.string().describe("Name for the texture"),
            url: z.string().describe("URL or path to the texture file"),
            uScale: z.number().optional().describe("U (horizontal) tiling"),
            vScale: z.number().optional().describe("V (vertical) tiling"),
            hasAlpha: z.boolean().optional().describe("Whether the texture has an alpha channel"),
            level: z.number().optional().describe("Intensity level"),
        },
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

server.registerTool(
    "add_mesh",
    {
        description: "Add a primitive mesh to the scene: Box, Sphere, Cylinder, Plane, Ground, Torus, Capsule, etc.",
        inputSchema: {
            sceneName: z.string().describe("Name of the scene"),
            name: z.string().describe("Name for the mesh"),
            type: z.enum(["Box", "Sphere", "Cylinder", "Plane", "Ground", "Torus", "TorusKnot", "Disc", "Capsule", "IcoSphere"]).describe("Primitive mesh type"),
            options: z.record(z.string(), z.unknown()).optional().describe("Primitive creation options (e.g. {diameter: 2} for Sphere, {width: 5, height: 5} for Ground)"),
            transform: TransformSchema,
            parentId: z.string().optional().describe("Parent node ID or name for hierarchy"),
            materialId: z.string().optional().describe("Material ID or name to assign"),
        },
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

server.registerTool(
    "remove_mesh",
    {
        description: "Remove a mesh from the scene.",
        inputSchema: {
            sceneName: z.string().describe("Name of the scene"),
            meshId: z.string().describe("Mesh ID or name"),
        },
    },
    async ({ sceneName, meshId }) => {
        const result = manager.removeMesh(sceneName, meshId);
        return {
            content: [{ type: "text", text: result === "OK" ? `Removed mesh "${meshId}".` : `Error: ${result}` }],
            isError: result !== "OK",
        };
    }
);

server.registerTool(
    "set_mesh_properties",
    {
        description: "Update properties on a mesh: visibility, pickability, shadow settings, tags, metadata.",
        inputSchema: {
            sceneName: z.string().describe("Name of the scene"),
            meshId: z.string().describe("Mesh ID or name"),
            isVisible: z.boolean().optional().describe("Whether the mesh is visible"),
            isPickable: z.boolean().optional().describe("Whether the mesh is pickable by ray-casting"),
            receiveShadows: z.boolean().optional().describe("Whether the mesh receives shadows"),
            castsShadows: z.boolean().optional().describe("Whether the mesh is included in shadow generators"),
            tags: z.array(z.string()).optional().describe("Tags for querying/filtering"),
            metadata: z.record(z.string(), z.unknown()).optional().describe("Custom metadata"),
        },
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

server.registerTool(
    "add_transform_node",
    {
        description: "Add an empty transform node (grouping node) to the scene. Useful for creating " + "hierarchies — parent meshes to this node to move them as a group.",
        inputSchema: {
            sceneName: z.string().describe("Name of the scene"),
            name: z.string().describe("Name for the transform node"),
            transform: TransformSchema,
            parentId: z.string().optional().describe("Parent node ID or name"),
        },
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

server.registerTool(
    "set_transform",
    {
        description: "Set the position, rotation, and/or scaling of any node (mesh, transform node, camera, light).",
        inputSchema: {
            sceneName: z.string().describe("Name of the scene"),
            nodeId: z.string().describe("Node ID or name"),
            position: Vector3Schema.describe("New position as {x,y,z} or [x,y,z]"),
            rotation: Vector3Schema.describe("New rotation in radians as {x,y,z} or [x,y,z]"),
            scaling: Vector3Schema.describe("New scaling as {x,y,z} or [x,y,z]"),
        },
    },
    async ({ sceneName, nodeId, position, rotation, scaling }) => {
        const result = manager.setTransform(sceneName, nodeId, { position, rotation, scaling } as Record<string, unknown>);
        return {
            content: [{ type: "text", text: result === "OK" ? `Transform of "${nodeId}" updated.` : `Error: ${result}` }],
            isError: result !== "OK",
        };
    }
);

server.registerTool(
    "set_parent",
    {
        description: "Set a node's parent (for scene hierarchy). Pass null to un-parent.",
        inputSchema: {
            sceneName: z.string().describe("Name of the scene"),
            childId: z.string().describe("ID or name of the child node"),
            parentId: z.string().nullable().describe("ID or name of the parent node, or null to un-parent"),
        },
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

server.registerTool(
    "assign_material",
    {
        description: "Assign a material to a mesh.",
        inputSchema: {
            sceneName: z.string().describe("Name of the scene"),
            meshId: z.string().describe("Mesh ID or name"),
            materialId: z.string().describe("Material ID or name to assign"),
        },
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

server.registerTool(
    "add_model",
    {
        description:
            "Add an external 3D model (glTF/glb) to the scene. The model will be loaded at runtime " +
            "from the given URL. You can specify expected animation groups and material overrides.",
        inputSchema: {
            sceneName: z.string().describe("Name of the scene"),
            name: z.string().describe("Name for this model reference"),
            url: z.string().describe("URL or path to the model file (.glb, .gltf, .babylon, .obj, etc.)"),
            transform: TransformSchema,
            parentId: z.string().optional().describe("Parent node ID for the imported root"),
            animationGroups: z.array(z.string()).optional().describe("Expected animation group names in the model (e.g. ['Walk', 'Idle', 'Run'])"),
            materialOverrides: z.record(z.string(), z.string()).optional().describe("Map of mesh name → material ID to override materials on imported meshes"),
            pluginExtension: z.string().optional().describe("Force a specific loader plugin (e.g. '.gltf', '.obj')"),
        },
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

server.registerTool(
    "remove_model",
    {
        description: "Remove a model reference from the scene.",
        inputSchema: {
            sceneName: z.string().describe("Name of the scene"),
            modelId: z.string().describe("Model ID or name"),
        },
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

server.registerTool(
    "add_animation",
    {
        description: "Define a keyframe animation on a scene node's property (position, rotation, scaling, visibility, etc.).",
        inputSchema: {
            sceneName: z.string().describe("Name of the scene"),
            name: z.string().describe("Name for the animation"),
            targetId: z.string().describe("ID or name of the node to animate"),
            property: z
                .string()
                .describe(
                    "Property to animate (e.g. 'position', 'rotation.y', 'scaling', 'visibility', 'material.alpha'). " + "Use list_animatable_properties to see all options."
                ),
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

server.registerTool(
    "create_animation_group",
    {
        description: "Group multiple animations together to play/stop/control them as a unit.",
        inputSchema: {
            sceneName: z.string().describe("Name of the scene"),
            name: z.string().describe("Name for the animation group"),
            animationIds: z.array(z.string()).describe("IDs of animations to include"),
            autoStart: z.boolean().optional().describe("Whether to start playing automatically"),
            isLooping: z.boolean().optional().describe("Whether to loop"),
            speedRatio: z.number().optional().describe("Playback speed (1 = normal, 2 = double, 0.5 = half)"),
            from: z.number().optional().describe("Start frame override"),
            to: z.number().optional().describe("End frame override"),
        },
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

server.registerTool("list_animatable_properties", { description: "List all commonly animatable properties on Babylon.js scene nodes." }, async () => ({
    content: [{ type: "text", text: `Animatable properties:\n${GetAnimatablePropertiesSummary()}` }],
}));

// ═══════════════════════════════════════════════════════════════════════════
//  Tools — Physics
// ═══════════════════════════════════════════════════════════════════════════

server.registerTool(
    "add_physics_body",
    {
        description: "Add a physics body to a mesh. Requires physics to be enabled in environment settings.",
        inputSchema: {
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

server.registerTool(
    "attach_flow_graph",
    {
        description:
            "Attach a Flow Graph (exported from the Flow Graph MCP server) to the scene for interactive behavior. " +
            "The coordinator JSON is the output of export_graph_json from the Flow Graph MCP server.",
        inputSchema: {
            sceneName: z.string().describe("Name of the scene"),
            name: z.string().describe("Name for this flow graph attachment"),
            coordinatorJson: z.string().describe("The complete Flow Graph coordinator JSON string"),
            scopeNodeIds: z.array(z.string()).optional().describe("Optional: limit this flow graph to specific node IDs"),
        },
    },
    async ({ sceneName, name, coordinatorJson, scopeNodeIds }) => {
        const result = manager.attachFlowGraph(sceneName, name, coordinatorJson, scopeNodeIds);
        if (typeof result === "string") {
            return { content: [{ type: "text", text: `Error: ${result}` }], isError: true };
        }
        let msg = `Attached flow graph [${result.id}] "${name}".${scopeNodeIds?.length ? ` Scoped to: ${scopeNodeIds.join(", ")}` : ""}`;
        if (result.warnings && result.warnings.length > 0) {
            msg += `\n⚠ ${result.warnings.join("\n⚠ ")}`;
        }
        return { content: [{ type: "text", text: msg }] };
    }
);

server.registerTool(
    "remove_flow_graph",
    {
        description: "Remove a flow graph attachment from the scene.",
        inputSchema: {
            sceneName: z.string().describe("Name of the scene"),
            flowGraphId: z.string().describe("Flow graph ID or name"),
        },
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

server.registerTool(
    "add_sound",
    {
        description: "Add a sound to the scene. Supports both preloaded and streaming audio. " + "Spatial audio can be enabled for 3D positional sound attached to a mesh.",
        inputSchema: {
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
    },
    async ({ sceneName, name, url, soundType, ...opts }) => {
        const result = manager.addSound(sceneName, name, url, soundType, opts);
        if (typeof result === "string") {
            return { content: [{ type: "text", text: `Error: ${result}` }], isError: true };
        }
        return { content: [{ type: "text", text: `Added ${soundType} sound [${result.id}] "${name}".` }] };
    }
);

server.registerTool(
    "remove_sound",
    {
        description: "Remove a sound from the scene.",
        inputSchema: {
            sceneName: z.string().describe("Name of the scene"),
            soundId: z.string().describe("Sound ID or name"),
        },
    },
    async ({ sceneName, soundId }) => {
        const result = manager.removeSound(sceneName, soundId);
        return {
            content: [{ type: "text", text: result === "OK" ? `Removed sound "${soundId}".` : `Error: ${result}` }],
            isError: result !== "OK",
        };
    }
);

server.registerTool(
    "configure_sound",
    {
        description: "Update properties of an existing sound (volume, loop, spatial settings, etc.).",
        inputSchema: {
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
    },
    async ({ sceneName, soundId, properties }) => {
        const result = manager.configureSoundProperties(sceneName, soundId, properties);
        return {
            content: [{ type: "text", text: result === "OK" ? `Updated sound "${soundId}".` : `Error: ${result}` }],
            isError: result !== "OK",
        };
    }
);

server.registerTool(
    "attach_sound_to_mesh",
    {
        description: "Attach a spatial sound to a mesh so it plays at the mesh's 3D position.",
        inputSchema: {
            sceneName: z.string().describe("Name of the scene"),
            soundId: z.string().describe("Sound ID or name"),
            meshId: z.string().describe("Mesh ID or name to attach sound to"),
        },
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

server.registerTool(
    "add_particle_system",
    {
        description: "Add a particle system to the scene. Can emit from a mesh or a position. " + "Supports classic CPU particles and GPU particles for higher counts.",
        inputSchema: {
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

server.registerTool(
    "remove_particle_system",
    {
        description: "Remove a particle system from the scene.",
        inputSchema: {
            sceneName: z.string().describe("Name of the scene"),
            particleSystemId: z.string().describe("Particle system ID or name"),
        },
    },
    async ({ sceneName, particleSystemId }) => {
        const result = manager.removeParticleSystem(sceneName, particleSystemId);
        return {
            content: [{ type: "text", text: result === "OK" ? `Removed particle system "${particleSystemId}".` : `Error: ${result}` }],
            isError: result !== "OK",
        };
    }
);

server.registerTool(
    "configure_particle_system",
    {
        description: "Update properties of an existing particle system (emit rate, sizes, colors, etc.).",
        inputSchema: {
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
    },
    async ({ sceneName, particleSystemId, properties }) => {
        const result = manager.configureParticleSystem(sceneName, particleSystemId, properties);
        return {
            content: [{ type: "text", text: result === "OK" ? `Updated particle system "${particleSystemId}".` : `Error: ${result}` }],
            isError: result !== "OK",
        };
    }
);

server.registerTool(
    "add_particle_gradient",
    {
        description: "Add a color or factor gradient to a particle system for animated properties over lifetime.",
        inputSchema: {
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

server.registerTool(
    "add_physics_constraint",
    {
        description:
            "Add a physics constraint (joint) between two meshes that have physics bodies. " +
            "Supports ball-and-socket, hinge, slider, distance, lock, prismatic, and spring joints.",
        inputSchema: {
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

server.registerTool(
    "remove_physics_constraint",
    {
        description: "Remove a physics constraint from the scene.",
        inputSchema: {
            sceneName: z.string().describe("Name of the scene"),
            constraintId: z.string().describe("Constraint ID or name"),
        },
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

server.registerTool(
    "configure_render_pipeline",
    {
        description: "Configure the DefaultRenderingPipeline with post-processing effects: " + "bloom, depth-of-field, FXAA, sharpen, chromatic aberration, and grain.",
        inputSchema: {
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

server.registerTool(
    "add_glow_layer",
    {
        description: "Add a glow layer to the scene that makes emissive parts of meshes glow. " + "You can include/exclude specific meshes from the glow effect.",
        inputSchema: {
            sceneName: z.string().describe("Name of the scene"),
            name: z.string().describe("Name for the glow layer"),
            intensity: z.number().optional().describe("Glow intensity (default: 1)"),
            blurKernelSize: z.number().optional().describe("Blur kernel size in pixels (default: 32)"),
        },
    },
    async ({ sceneName, name, intensity, blurKernelSize }) => {
        const result = manager.addGlowLayer(sceneName, name, { intensity, blurKernelSize });
        if (typeof result === "string") {
            return { content: [{ type: "text", text: `Error: ${result}` }], isError: true };
        }
        return { content: [{ type: "text", text: `Added glow layer [${result.id}] "${name}".` }] };
    }
);

server.registerTool(
    "add_mesh_to_glow_layer",
    {
        description: "Include or exclude a mesh from a glow layer's effect.",
        inputSchema: {
            sceneName: z.string().describe("Name of the scene"),
            glowLayerId: z.string().describe("Glow layer ID or name"),
            meshId: z.string().describe("Mesh ID or name"),
            mode: z.enum(["include", "exclude"]).default("include").describe("Whether to include or exclude the mesh"),
        },
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

server.registerTool(
    "remove_glow_layer",
    {
        description: "Remove a glow layer from the scene.",
        inputSchema: {
            sceneName: z.string().describe("Name of the scene"),
            glowLayerId: z.string().describe("Glow layer ID or name"),
        },
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

server.registerTool(
    "add_highlight_layer",
    {
        description: "Add a highlight layer to the scene for colored outlines and glows on specific meshes.",
        inputSchema: {
            sceneName: z.string().describe("Name of the scene"),
            name: z.string().describe("Name for the highlight layer"),
            isStroke: z.boolean().optional().describe("Use stroke mode (outline) instead of glow"),
            blurHorizontalSize: z.number().optional().describe("Horizontal blur size"),
            blurVerticalSize: z.number().optional().describe("Vertical blur size"),
        },
    },
    async ({ sceneName, name, isStroke, blurHorizontalSize, blurVerticalSize }) => {
        const result = manager.addHighlightLayer(sceneName, name, { isStroke, blurHorizontalSize, blurVerticalSize });
        if (typeof result === "string") {
            return { content: [{ type: "text", text: `Error: ${result}` }], isError: true };
        }
        return { content: [{ type: "text", text: `Added highlight layer [${result.id}] "${name}"${isStroke ? " [stroke mode]" : ""}.` }] };
    }
);

server.registerTool(
    "add_mesh_to_highlight_layer",
    {
        description: "Add a mesh to a highlight layer with a specific highlight color.",
        inputSchema: {
            sceneName: z.string().describe("Name of the scene"),
            highlightLayerId: z.string().describe("Highlight layer ID or name"),
            meshId: z.string().describe("Mesh ID or name to highlight"),
            color: z.object({ r: z.number(), g: z.number(), b: z.number() }).describe("Highlight color as {r, g, b} (0-1 range)"),
            glowEmissiveOnly: z.boolean().optional().describe("Only glow emissive parts of the mesh"),
        },
    },
    async ({ sceneName, highlightLayerId, meshId, color, glowEmissiveOnly }) => {
        const result = manager.addMeshToHighlightLayer(sceneName, highlightLayerId, meshId, color, glowEmissiveOnly);
        return {
            content: [{ type: "text", text: result === "OK" ? `Added mesh "${meshId}" to highlight layer "${highlightLayerId}".` : `Error: ${result}` }],
            isError: result !== "OK",
        };
    }
);

server.registerTool(
    "remove_mesh_from_highlight_layer",
    {
        description: "Remove a mesh from a highlight layer.",
        inputSchema: {
            sceneName: z.string().describe("Name of the scene"),
            highlightLayerId: z.string().describe("Highlight layer ID or name"),
            meshId: z.string().describe("Mesh ID or name to remove from highlighting"),
        },
    },
    async ({ sceneName, highlightLayerId, meshId }) => {
        const result = manager.removeMeshFromHighlightLayer(sceneName, highlightLayerId, meshId);
        return {
            content: [{ type: "text", text: result === "OK" ? `Removed mesh "${meshId}" from highlight layer "${highlightLayerId}".` : `Error: ${result}` }],
            isError: result !== "OK",
        };
    }
);

server.registerTool(
    "remove_highlight_layer",
    {
        description: "Remove a highlight layer from the scene.",
        inputSchema: {
            sceneName: z.string().describe("Name of the scene"),
            highlightLayerId: z.string().describe("Highlight layer ID or name"),
        },
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

server.registerTool(
    "describe_scene",
    {
        description:
            "Get a human-readable description of the entire scene state — all cameras, lights, meshes, " + "materials, models, animations, flow graphs, and environment settings.",
        inputSchema: {
            sceneName: z.string().describe("Name of the scene"),
        },
    },
    async ({ sceneName }) => {
        const desc = manager.describeScene(sceneName);
        return { content: [{ type: "text", text: desc }] };
    }
);

server.registerTool(
    "describe_node",
    {
        description: "Get detailed information about a specific node (mesh, transform node, etc.) including " + "transform, material, physics, and hierarchy info.",
        inputSchema: {
            sceneName: z.string().describe("Name of the scene"),
            nodeId: z.string().describe("Node ID or name"),
        },
    },
    async ({ sceneName, nodeId }) => {
        const desc = manager.describeNode(sceneName, nodeId);
        return { content: [{ type: "text", text: desc }] };
    }
);

server.registerTool(
    "list_mesh_types",
    {
        description: "List all available primitive mesh types and their creation options.",
        inputSchema: {
            type: z.string().optional().describe("Specific mesh type to get detailed info for"),
        },
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

server.registerTool(
    "list_camera_types",
    {
        description: "List all available camera types and their properties.",
        inputSchema: {
            type: z.string().optional().describe("Specific camera type to get detailed info for"),
        },
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

server.registerTool(
    "list_light_types",
    {
        description: "List all available light types and their properties.",
        inputSchema: {
            type: z.string().optional().describe("Specific light type to get detailed info for"),
        },
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

server.registerTool(
    "list_material_types",
    {
        description: "List all available material types and their properties.",
        inputSchema: {
            type: z.string().optional().describe("Specific material type to get detailed info for"),
        },
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

server.registerTool("list_particle_emitter_types", { description: "List all available particle emitter shapes (Box, Sphere, Cone, etc.) and their options." }, async () => {
    return { content: [{ type: "text", text: `## Particle Emitter Types\n${GetParticleEmitterTypesSummary()}` }] };
});

server.registerTool("list_physics_constraint_types", { description: "List all available physics constraint/joint types (BallAndSocket, Hinge, Slider, etc.)." }, async () => {
    return { content: [{ type: "text", text: `## Physics Constraint Types\n${GetPhysicsConstraintTypesSummary()}` }] };
});

server.registerTool("list_post_process_effects", { description: "List all available post-processing effects and their configuration properties." }, async () => {
    return { content: [{ type: "text", text: `## Post-Process Effects\n${GetPostProcessEffectsSummary()}` }] };
});

// ═══════════════════════════════════════════════════════════════════════════
//  Tools — Validation
// ═══════════════════════════════════════════════════════════════════════════

server.registerTool(
    "validate_scene",
    {
        description: "Run validation checks on the scene: missing cameras, broken material references, " + "orphaned parents, animation target issues, etc.",
        inputSchema: {
            sceneName: z.string().describe("Name of the scene to validate"),
        },
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
//  Tools — Inspector
// ═══════════════════════════════════════════════════════════════════════════

server.registerTool(
    "enable_inspector",
    {
        description:
            "Enable or disable the Babylon.js Inspector v2 on the scene. " +
            "When enabled, the Inspector will be loaded and shown when the scene runs, " +
            "providing a full scene debugger with scene explorer, property editor, " +
            "debug tools, statistics, and more. " +
            "For UMD output, the inspector script is loaded from CDN. " +
            "For ES6 output, it is imported from @babylonjs/inspector.",
        inputSchema: {
            sceneName: z.string().describe("Name of the scene"),
            enabled: z.boolean().default(true).describe("Whether to enable the inspector (true) or disable it (false)"),
            overlay: z.boolean().default(false).describe("Whether to use overlay mode (floats on top of scene instead of side-by-side). Default is side-by-side (embedded) mode."),
            initialTab: z.string().optional().describe("Initial tab to open when the inspector is shown (e.g. 'scene', 'properties', 'debug', 'stats', 'tools', 'settings')"),
        },
    },
    async ({ sceneName, enabled, overlay, initialTab }) => {
        const result = manager.enableInspector(sceneName, enabled, { overlay, initialTab });
        if (result !== "OK") {
            return { content: [{ type: "text", text: `Error: ${result}` }], isError: true };
        }
        return {
            content: [
                {
                    type: "text",
                    text: enabled
                        ? `Inspector v2 enabled on scene "${sceneName}".${overlay ? " (overlay mode)" : " (embedded mode)"}${initialTab ? ` Initial tab: ${initialTab}.` : ""}`
                        : `Inspector disabled on scene "${sceneName}".`,
                },
            ],
        };
    }
);

// ═══════════════════════════════════════════════════════════════════════════
//  Tools — GUI attachment
// ═══════════════════════════════════════════════════════════════════════════

server.registerTool(
    "attach_gui",
    {
        description:
            "Attach a GUI descriptor (from the GUI MCP server's export_gui_json) to the scene. " +
            "This stores the GUI as part of the scene state so that export tools automatically " +
            "include it. The scene becomes the single source of truth for all subsystems " +
            "(meshes, materials, physics, FlowGraph, AND GUI).",
        inputSchema: {
            sceneName: z.string().describe("Name of the scene to attach the GUI to"),
            guiJson: z.string().describe("The GUI descriptor JSON string (from the GUI MCP server's export_gui_json)"),
        },
    },
    async ({ sceneName, guiJson }) => {
        let parsed: unknown;
        try {
            parsed = JSON.parse(guiJson);
        } catch {
            return { content: [{ type: "text", text: `Invalid GUI JSON: parse error.` }], isError: true };
        }
        const result = manager.attachGUI(sceneName, parsed);
        if (result !== "OK") {
            return { content: [{ type: "text", text: `Error: ${result}` }], isError: true };
        }
        return {
            content: [{ type: "text", text: `GUI attached to scene "${sceneName}". It will be automatically included in all code exports.` }],
        };
    }
);

server.registerTool(
    "detach_gui",
    {
        description: "Remove the attached GUI from the scene.",
        inputSchema: {
            sceneName: z.string().describe("Name of the scene"),
        },
    },
    async ({ sceneName }) => {
        const result = manager.detachGUI(sceneName);
        return {
            content: [{ type: "text", text: result === "OK" ? `GUI detached from scene "${sceneName}".` : `Error: ${result}` }],
            isError: result !== "OK",
        };
    }
);

server.registerTool(
    "describe_gui",
    {
        description: "Describe the GUI currently attached to the scene (control tree, names, types).",
        inputSchema: {
            sceneName: z.string().describe("Name of the scene"),
        },
    },
    async ({ sceneName }) => {
        const desc = manager.describeGUI(sceneName);
        return { content: [{ type: "text", text: desc }] };
    }
);

// ═══════════════════════════════════════════════════════════════════════════
//  Tools — Node Render Graph
// ═══════════════════════════════════════════════════════════════════════════

server.registerTool(
    "attach_node_render_graph",
    {
        description:
            "Attach a Node Render Graph JSON (from the NRG MCP server's export_graph_json) to the scene. " +
            "Once attached, the exported code will call NodeRenderGraph.ParseAsync() + buildAsync() to apply the " +
            "custom render pipeline. Only one render graph can be attached at a time; re-calling this " +
            "tool replaces the previous one.",
        inputSchema: {
            sceneName: z.string().describe("Name of the scene to attach the render graph to"),
            nrgJson: z.string().describe("The NRG JSON string (from the NRG MCP server's export_graph_json tool)"),
        },
    },
    async ({ sceneName, nrgJson }) => {
        let parsed: unknown;
        try {
            parsed = JSON.parse(nrgJson);
        } catch {
            return { content: [{ type: "text", text: "Invalid NRG JSON: parse error." }], isError: true };
        }
        const result = manager.attachNodeRenderGraph(sceneName, parsed);
        if (result !== "OK") {
            return { content: [{ type: "text", text: `Error: ${result}` }], isError: true };
        }
        return {
            content: [
                {
                    type: "text",
                    text: `Node Render Graph attached to scene "${sceneName}". It will be included in all code exports automatically.`,
                },
            ],
        };
    }
);

server.registerTool(
    "detach_node_render_graph",
    {
        description: "Remove the attached Node Render Graph from the scene, restoring the default render pipeline.",
        inputSchema: {
            sceneName: z.string().describe("Name of the scene"),
        },
    },
    async ({ sceneName }) => {
        const result = manager.detachNodeRenderGraph(sceneName);
        return {
            content: [{ type: "text", text: result === "OK" ? `Node Render Graph detached from scene "${sceneName}".` : `Error: ${result}` }],
            isError: result !== "OK",
        };
    }
);

// ═══════════════════════════════════════════════════════════════════════════
//  Tools — Node Geometry
// ═══════════════════════════════════════════════════════════════════════════

server.registerTool(
    "add_node_geometry_mesh",
    {
        description:
            "Add a procedural mesh to the scene using a Node Geometry JSON (from the NGE MCP server's export_geometry_json). " +
            "The exported code will call NodeGeometry.Parse() + build() + createMesh() to create the mesh at runtime. " +
            "If a mesh with the same name already exists on this scene, it is replaced.",
        inputSchema: {
            sceneName: z.string().describe("Name of the scene to add the mesh to"),
            meshName: z.string().describe("Name to give the created mesh"),
            ngeJson: z.string().describe("The NGE JSON string (from the NGE MCP server's export_geometry_json tool)"),
        },
    },
    async ({ sceneName, meshName, ngeJson }) => {
        let parsed: unknown;
        try {
            parsed = JSON.parse(ngeJson);
        } catch {
            return { content: [{ type: "text", text: "Invalid NGE JSON: parse error." }], isError: true };
        }
        const result = manager.addNodeGeometryMesh(sceneName, meshName, parsed);
        if (result !== "OK") {
            return { content: [{ type: "text", text: `Error: ${result}` }], isError: true };
        }
        return {
            content: [
                {
                    type: "text",
                    text: `Node Geometry mesh "${meshName}" added to scene "${sceneName}". It will be included in all code exports automatically.`,
                },
            ],
        };
    }
);

server.registerTool(
    "remove_node_geometry_mesh",
    {
        description: "Remove a Node Geometry mesh that was previously added via add_node_geometry_mesh.",
        inputSchema: {
            sceneName: z.string().describe("Name of the scene"),
            meshName: z.string().describe("Name of the mesh to remove"),
        },
    },
    async ({ sceneName, meshName }) => {
        const result = manager.removeNodeGeometryMesh(sceneName, meshName);
        return {
            content: [{ type: "text", text: result === "OK" ? `Node Geometry mesh "${meshName}" removed from scene "${sceneName}".` : `Error: ${result}` }],
            isError: result !== "OK",
        };
    }
);

// ═══════════════════════════════════════════════════════════════════════════
//  Tools — Integrations (runtime bridges)
// ═══════════════════════════════════════════════════════════════════════════

const PhysicsCollisionSchema = z.object({
    type: z.literal("physicsCollision"),
    sourceBody: z.string().describe("Mesh name whose physics body is one of the collision pair"),
    targetBody: z.string().describe("Mesh name whose physics body is the other collision partner"),
    eventId: z.string().describe("FlowGraph custom event ID to dispatch on collision"),
});

const VariableToPropertySchema = z.object({
    type: z.literal("variableToProperty"),
    variableName: z.string().describe("FlowGraph variable name (set by SetVariable block)"),
    meshName: z.string().describe("Mesh name to update"),
    property: z.string().describe('Property path on the material, e.g. "albedoColor"'),
    valueType: z.enum(["Color3", "Vector3", "number", "boolean"]).describe("How to interpret the value"),
});

const GuiButtonSchema = z.object({
    type: z.literal("guiButton"),
    buttonName: z.string().describe("GUI button control name"),
    eventId: z.string().describe("FlowGraph custom event ID to dispatch"),
    toggleLabels: z.tuple([z.string(), z.string()]).optional().describe("If provided, button text toggles between these two labels"),
});

const CollisionCounterSchema = z.object({
    type: z.literal("collisionCounter"),
    textBlockName: z.string().describe("GUI TextBlock name to update"),
    prefix: z.string().describe('Text prefix, e.g. "Collisions: "'),
});

const IntegrationSchema = z.discriminatedUnion("type", [PhysicsCollisionSchema, VariableToPropertySchema, GuiButtonSchema, CollisionCounterSchema]);

server.registerTool(
    "add_integration",
    {
        description:
            "Add a runtime integration that bridges subsystems together. Integrations generate " +
            "glue code that connects physics, FlowGraph, materials, and GUI at runtime.\n\n" +
            "Supported integration types:\n" +
            "- **physicsCollision**: When two physics bodies collide, dispatch a FlowGraph custom event\n" +
            "- **variableToProperty**: Each frame, sync a FlowGraph variable to a mesh material property\n" +
            "- **guiButton**: When a GUI button is clicked, dispatch a FlowGraph custom event (with optional toggle labels)\n" +
            "- **collisionCounter**: Display a running collision count in a GUI TextBlock",
        inputSchema: {
            sceneName: z.string().describe("Name of the scene"),
            integration: IntegrationSchema.describe("The integration descriptor to add"),
        },
    },
    async ({ sceneName, integration }) => {
        const result = manager.addIntegration(sceneName, integration);
        if (result !== "OK") {
            return { content: [{ type: "text", text: `Error: ${result}` }], isError: true };
        }
        return {
            content: [{ type: "text", text: `Added ${integration.type} integration to "${sceneName}".` }],
        };
    }
);

server.registerTool(
    "add_integrations_batch",
    {
        description: "Add multiple integrations at once. More efficient than calling add_integration repeatedly.",
        inputSchema: {
            sceneName: z.string().describe("Name of the scene"),
            integrations: z.array(IntegrationSchema).describe("Array of integration descriptors to add"),
        },
    },
    async ({ sceneName, integrations }) => {
        const results: string[] = [];
        for (const integ of integrations) {
            const result = manager.addIntegration(sceneName, integ);
            if (result !== "OK") {
                results.push(`Error (${integ.type}): ${result}`);
            } else {
                results.push(`Added ${integ.type}`);
            }
        }
        return { content: [{ type: "text", text: `Integrations:\n${results.join("\n")}` }] };
    }
);

server.registerTool(
    "remove_integration",
    {
        description: "Remove an integration by its index (use list_integrations to see indices).",
        inputSchema: {
            sceneName: z.string().describe("Name of the scene"),
            index: z.number().int().min(0).describe("Index of the integration to remove"),
        },
    },
    async ({ sceneName, index }) => {
        const result = manager.removeIntegration(sceneName, index);
        if (result !== "OK") {
            return { content: [{ type: "text", text: `Error: ${result}` }], isError: true };
        }
        return { content: [{ type: "text", text: `Removed integration at index ${index}.` }] };
    }
);

server.registerTool(
    "list_integrations",
    {
        description: "List all integrations configured on a scene.",
        inputSchema: {
            sceneName: z.string().describe("Name of the scene"),
        },
    },
    async ({ sceneName }) => {
        const result = manager.listIntegrations(sceneName);
        return { content: [{ type: "text", text: result }] };
    }
);

// ═══════════════════════════════════════════════════════════════════════════
//  Tools — Export / Import
// ═══════════════════════════════════════════════════════════════════════════

server.registerTool(
    "export_scene_code",
    {
        description:
            "Export the scene as runnable TypeScript/JavaScript code that uses the Babylon.js API. " +
            "This is the RECOMMENDED export format because it supports ALL features including " +
            "FlowGraph behaviors, NME materials, and GUI (which the .babylon JSON format cannot represent together). " +
            "If a GUI was attached via attach_gui, it is automatically included — no need to pass guiJson. " +
            "The generated code is immediately runnable in a Babylon.js project. " +
            "Use format='es6' to get ES module code with proper import statements instead of UMD/CDN globals.",
        inputSchema: {
            sceneName: z.string().describe("Name of the scene to export"),
            wrapInFunction: z.boolean().default(true).describe("Wrap all code in an async createScene() function"),
            functionName: z.string().default("createScene").describe("Name of the wrapper function"),
            includeHtmlBoilerplate: z
                .boolean()
                .default(false)
                .describe("Include full HTML page boilerplate (canvas, script tags, CDN links) for a standalone page. Only applies to UMD format."),
            includeEngineSetup: z.boolean().default(true).describe("Include canvas and Engine creation code"),
            includeRenderLoop: z.boolean().default(true).describe("Include the render loop and resize handler"),
            format: z.enum(["umd", "es6"]).default("umd").describe("Output format: 'umd' for CDN/global BABYLON.* style, 'es6' for ES module imports from @babylonjs/*"),
            guiJson: z.string().optional().describe("Optional GUI JSON override. If omitted, the GUI attached via attach_gui is used automatically."),
            enableCollisionCallbacks: z.boolean().default(false).describe("Enable collision callbacks on all physics bodies (needed for collision-driven behaviors)"),
        },
    },
    async ({ sceneName, wrapInFunction, functionName, includeHtmlBoilerplate, includeEngineSetup, includeRenderLoop, format, guiJson, enableCollisionCallbacks }) => {
        let parsedGuiJson: unknown;
        if (guiJson) {
            try {
                parsedGuiJson = JSON.parse(guiJson);
            } catch {
                return { content: [{ type: "text", text: `Invalid GUI JSON: ${(guiJson as string).slice(0, 100)}...` }], isError: true };
            }
        }
        const code = manager.exportCode(sceneName, {
            wrapInFunction,
            functionName,
            includeHtmlBoilerplate,
            includeEngineSetup,
            includeRenderLoop,
            format,
            guiJson: parsedGuiJson,
            enableCollisionCallbacks,
        });
        if (!code) {
            return { content: [{ type: "text", text: `Scene "${sceneName}" not found.` }], isError: true };
        }
        return { content: [{ type: "text", text: code }] };
    }
);

server.registerTool(
    "export_scene_project",
    {
        description:
            "Export the scene as a complete ES6 project with package.json, tsconfig.json, vite.config.ts, " +
            "index.html, and src/index.ts. Ready to run with 'npm install && npm run dev'. " +
            "If a GUI was attached via attach_gui, it is automatically included. " +
            "This generates a full Vite-based TypeScript project using @babylonjs/* ES module imports.",
        inputSchema: {
            sceneName: z.string().describe("Name of the scene to export"),
            guiJson: z.string().optional().describe("Optional GUI JSON override. If omitted, the GUI attached via attach_gui is used automatically."),
            enableCollisionCallbacks: z.boolean().default(false).describe("Enable collision callbacks on all physics bodies"),
        },
    },
    async ({ sceneName, guiJson, enableCollisionCallbacks }) => {
        let parsedGuiJson: unknown;
        if (guiJson) {
            try {
                parsedGuiJson = JSON.parse(guiJson);
            } catch {
                return { content: [{ type: "text", text: `Invalid GUI JSON: ${(guiJson as string).slice(0, 100)}...` }], isError: true };
            }
        }
        const files = manager.exportProject(sceneName, {
            format: "es6",
            guiJson: parsedGuiJson,
            enableCollisionCallbacks,
        });
        if (!files) {
            return { content: [{ type: "text", text: `Scene "${sceneName}" not found.` }], isError: true };
        }
        const fileParts = Object.entries(files).map(([path, content]) => ({
            type: "text" as const,
            text: `--- ${path} ---\n${content}`,
        }));
        return {
            content: [{ type: "text", text: `Generated ${Object.keys(files).length} project files:` }, ...fileParts],
        };
    }
);

server.registerTool(
    "export_scene_json",
    {
        description:
            "Export the scene as a raw JSON descriptor (the internal scene format). " +
            "Note: For most use cases, prefer export_scene_code which generates runnable Babylon.js code. " +
            "Use this JSON export if you have a custom loader or need to re-import the scene later.",
        inputSchema: {
            sceneName: z.string().describe("Name of the scene to export"),
        },
    },
    async ({ sceneName }) => {
        const json = manager.exportJSON(sceneName);
        if (!json) {
            return { content: [{ type: "text", text: `Scene "${sceneName}" not found.` }], isError: true };
        }
        return { content: [{ type: "text", text: json }] };
    }
);

server.registerTool(
    "import_scene_json",
    {
        description: "Import a scene descriptor JSON into memory for editing.",
        inputSchema: {
            sceneName: z.string().describe("Name to give the imported scene"),
            json: z.string().describe("The scene descriptor JSON string"),
        },
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

server.registerTool(
    "add_meshes_batch",
    {
        description: "Add multiple meshes at once. More efficient than calling add_mesh repeatedly.",
        inputSchema: {
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

server.registerTool(
    "setup_scene_batch",
    {
        description: "Set up a complete scene in one call: camera, lights, environment, and optionally meshes. " + "Great for quickly bootstrapping a scene.",
        inputSchema: {
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
//  Tools — Live Preview Server
// ═══════════════════════════════════════════════════════════════════════════

server.registerTool(
    "start_preview",
    {
        description:
            "Start a built-in HTTP server that serves a live preview of the scene. " +
            "The preview always reflects the LATEST scene state — every browser refresh shows the most recent changes. " +
            "No need to write files to disk. The MCP server itself hosts the scene while you develop. " +
            "Returns the URL to open in a browser. If a preview is already running, it restarts with the new settings.",
        inputSchema: {
            sceneName: z.string().describe("Name of the scene to preview"),
            port: z.number().int().min(1024).max(65535).default(8765).describe("Port to serve on (default: 8765)"),
        },
    },
    async ({ sceneName, port }) => {
        const scene = manager.getScene(sceneName);
        if (!scene) {
            return { content: [{ type: "text", text: `Scene "${sceneName}" not found.` }], isError: true };
        }
        try {
            const url = await startPreview(manager, sceneName, port);
            return {
                content: [
                    {
                        type: "text",
                        text: [
                            `Preview server started!`,
                            ``,
                            `  Scene:  ${sceneName}`,
                            `  URL:    ${url}`,
                            ``,
                            `Open ${url} in a browser to see the scene.`,
                            `The preview auto-updates on every browser refresh — no restart needed when you modify the scene.`,
                            ``,
                            `Other routes:`,
                            `  ${url}/scenes        — list all available scenes`,
                            `  ${url}/scene/<name>  — preview a specific scene`,
                            `  ${url}/api/scene.json — raw scene JSON`,
                            `  ${url}/api/code       — generated JavaScript code`,
                        ].join("\n"),
                    },
                ],
            };
        } catch (err) {
            return { content: [{ type: "text", text: `Failed to start preview: ${err instanceof Error ? err.message : String(err)}` }], isError: true };
        }
    }
);

server.registerTool("stop_preview", { description: "Stop the built-in preview server." }, async () => {
    if (!isPreviewRunning()) {
        return { content: [{ type: "text", text: "No preview server is running." }] };
    }
    await stopPreview();
    return { content: [{ type: "text", text: "Preview server stopped." }] };
});

server.registerTool("get_preview_url", { description: "Get the URL of the currently running preview server, if any." }, async () => {
    if (!isPreviewRunning()) {
        return { content: [{ type: "text", text: "No preview server is running. Use start_preview to launch one." }] };
    }
    const url = getPreviewUrl()!;
    const scene = getPreviewSceneName()!;
    return {
        content: [
            {
                type: "text",
                text: `Preview running at ${url} (scene: "${scene}").\nRefresh the browser to see the latest changes.`,
            },
        ],
    };
});

server.registerTool(
    "set_preview_scene",
    {
        description: "Change which scene the preview server is showing, without restarting it. " + "Useful when you have multiple scenes and want to switch the live preview.",
        inputSchema: {
            sceneName: z.string().describe("Name of the scene to switch to"),
        },
    },
    async ({ sceneName }) => {
        if (!isPreviewRunning()) {
            return { content: [{ type: "text", text: "No preview server is running. Use start_preview first." }], isError: true };
        }
        const scene = manager.getScene(sceneName);
        if (!scene) {
            return { content: [{ type: "text", text: `Scene "${sceneName}" not found.` }], isError: true };
        }
        setPreviewScene(sceneName);
        return {
            content: [
                {
                    type: "text",
                    text: `Preview switched to scene "${sceneName}".\nRefresh the browser at ${getPreviewUrl()} to see it.`,
                },
            ],
        };
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

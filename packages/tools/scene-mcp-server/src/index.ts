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
 *   • Import NME JSON as materials (from the Node Material MCP server)
 *   • Build scene hierarchy (parent/child relationships)
 *   • Define animations & animation groups
 *   • Add physics bodies
 *   • Attach Flow Graph behaviors (from the Flow Graph MCP server)
 *   • Configure environment (skybox, fog, HDR textures)
 *   • Validate and export the complete scene as JSON
 *
 * This server is designed to work alongside the Node Material MCP server (materials)
 * and Flow Graph MCP server (behaviors) as an orchestration layer.
 *
 * Transport: stdio
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod/v4";
import { writeFileSync, readFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";

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

const PhysicsSchema = z
    .object({
        bodyType: z
            .union([z.enum(["Static", "Dynamic", "Animated"]), z.number()])
            .describe("Body type: Static (immovable), Dynamic (fully simulated), Animated (driven by animation)"),
        shapeType: z.enum(["Box", "Sphere", "Capsule", "Cylinder", "ConvexHull", "Mesh", "Container"]).describe("Collision shape type"),
        mass: z.number().optional().describe("Mass (kg). Use 0 for static bodies."),
        friction: z.number().optional().describe("Friction coefficient (0-1)"),
        restitution: z.number().optional().describe("Bounciness (0-1)"),
        linearDamping: z.number().optional().describe("Linear damping (0-1)"),
        angularDamping: z.number().optional().describe("Angular damping (0-1)"),
        isTrigger: z.boolean().optional().describe("Whether this shape is a trigger/sensor (detects overlap but no physical response)"),
    })
    .optional()
    .describe("Inline physics body. If provided, a physics body is automatically added to this mesh after creation.");

// ─── MCP Server ───────────────────────────────────────────────────────────
const server = new McpServer(
    {
        name: "babylonjs-scene",
        version: "1.0.0",
    },
    {
        instructions: [
            "You build complete Babylon.js 3D scenes. Workflow: create_scene → add camera (set isActive) → add lights → add meshes/models → create & assign materials → validate_scene → start_preview or export_scene_code.",
            "For shadows: use DirectionalLight/SpotLight with shadowEnabled, set castsShadows on casters and receiveShadows on receivers.",
            "For materials from the Node Material MCP, geometry from the Node Geometry MCP, render pipelines from the Node Render Graph MCP, behaviors from the Flow Graph MCP, or UI from the GUI MCP: prefer file-based handoff (outputFile on the producer, *File param here) to keep large JSON out of the context window.",
            "Always validate before exporting. Use start_preview to see results in a browser.",
        ].join(" "),
    }
);

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
                "- **Node Material MCP server**: Export NME JSON → import here via `add_material` with type NodeMaterial",
                "- **Flow Graph MCP server**: Export coordinator JSON → attach here via `attach_flow_graph`",
                "- **GUI MCP server**: Export GUI JSON → attach here via `attach_gui` (auto-included in code exports)",
                "- **Node Render Graph MCP server** (babylonjs-node-render-graph): Build a custom render pipeline → export JSON → attach here via `attach_node_render_graph`",
                "- **Node Geometry MCP server** (babylonjs-node-geometry): Design procedural geometry → export JSON → add as a mesh via `add_node_geometry_mesh`",
                "",
                "### File-based handoff (recommended for large payloads)",
                "To avoid passing large JSON through the conversation context, use file-based handoff:",
                "1. On the producing server, call the export tool with `outputFile` to write JSON to disk",
                "2. On this server, call the import/attach tool with the corresponding `*File` parameter (e.g. `nmeJsonFile`, `coordinatorJsonFile`, `guiJsonFile`, `nrgJsonFile`, `ngeJsonFile`)",
                "Only the file path passes through the conversation — the JSON never enters the context window.",
                "",
                "## Shadows Best Practices",
                "To get working, high-quality shadows in a scene:",
                "",
                "### 1. Light setup (DirectionalLight or SpotLight)",
                "- Set `shadowEnabled: true` in the light properties",
                "- Set `shadowMapSize: 2048` (or 1024 for performance) for resolution",
                "- For DirectionalLight: set `shadowFrustumSize` to match your ground size (e.g. 20 for a 20x20 ground)",
                "- Optionally set `shadowDarkness` (0 = fully dark, 1 = invisible; 0.3 is a good default)",
                "",
                "### 2. Mesh shadow roles",
                "- On meshes that CAST shadows: `set_mesh_properties` with `castsShadows: true`",
                "- On meshes that RECEIVE shadows (e.g. ground): `set_mesh_properties` with `receiveShadows: true`",
                "- A mesh can both cast and receive shadows",
                "",
                "### 3. Automatic quality settings (handled by the code generator)",
                "The following are applied automatically — no manual configuration needed:",
                "- PCF filtering (smooth shadow edges)",
                "- `forceBackFacesOnly = true` (prevents self-shadowing on curved geometry)",
                "- `autoCalcShadowZBounds = true` for DirectionalLight (proper depth range)",
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
                    "## Step 5: Create fire material using Node Material MCP server",
                    "9. Use the Node Material MCP server to create a fire node material",
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

server.registerPrompt("create-shadow-scene", { description: "Create a scene with proper shadow setup — directional light, shadow casters, and receivers" }, () => ({
    messages: [
        {
            role: "user",
            content: {
                type: "text",
                text: [
                    "Create a scene with proper real-time shadows. Follow these steps exactly:",
                    "",
                    "## Step 1: Scene + Camera",
                    "1. create_scene 'ShadowScene' description 'Scene with shadows'",
                    "2. add_camera 'cam' type 'ArcRotateCamera' properties {alpha: -1.5, beta: 1.0, radius: 12, target: [0, 1.5, 0]}, isActive=true",
                    "",
                    "## Step 2: Lights (shadow-casting + ambient fill)",
                    "3. add_light 'sun' type 'DirectionalLight' properties {direction: [-1, -2, 1], intensity: 1.2, shadowEnabled: true}",
                    "4. configure_light 'sun' properties {shadowMapSize: 2048, shadowFrustumSize: 20, shadowDarkness: 0.3}",
                    "   - shadowMapSize: resolution (1024 or 2048)",
                    "   - shadowFrustumSize: match your ground dimensions (e.g. 20 for a 20×20 ground)",
                    "   - shadowDarkness: 0 = black, 1 = invisible (0.3 is a good default)",
                    "5. add_light 'ambient' type 'HemisphericLight' properties {intensity: 0.4}",
                    "   (ambient fill prevents pitch-black non-shadowed areas)",
                    "",
                    "## Step 3: Materials",
                    "6. add_material 'objectMat' type 'PBRMaterial' properties {albedoColor: [0.8, 0.2, 0.1], metallic: 0.3, roughness: 0.4}",
                    "7. add_material 'groundMat' type 'PBRMaterial' properties {albedoColor: [0.6, 0.6, 0.6], metallic: 0, roughness: 0.9}",
                    "",
                    "## Step 4: Meshes with shadow roles",
                    "8. add_mesh 'myObject' type 'Sphere' options {diameter: 2}, transform {position: [0, 2, 0]}",
                    "9. set_mesh_properties meshId='myObject' castsShadows=true   ← CASTS shadows",
                    "10. assign_material meshId='myObject' materialId='objectMat'",
                    "11. add_mesh 'ground' type 'Ground' options {width: 20, height: 20}",
                    "12. set_mesh_properties meshId='ground' receiveShadows=true   ← RECEIVES shadows",
                    "13. assign_material meshId='ground' materialId='groundMat'",
                    "",
                    "## Step 5: Preview",
                    "14. start_preview",
                    "",
                    "## Key points:",
                    "- castsShadows (double 's') on objects, receiveShadows on ground",
                    "- shadowFrustumSize should match ground size to avoid clipping",
                    "- PCF filtering and forceBackFacesOnly are applied automatically by the code generator",
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

server.registerPrompt("create-particle-scene", { description: "Create a scene with a fire-like particle system using gradients and emitter shapes" }, () => ({
    messages: [
        {
            role: "user",
            content: {
                type: "text",
                text: [
                    "Create a scene with a fire particle effect rising from a sphere.",
                    "",
                    "## Step 1: Scene setup",
                    "1. create_scene 'ParticleScene' description 'Fire particle effect'",
                    "2. add_camera 'cam' type 'ArcRotateCamera' properties {alpha: -1.57, beta: 1.2, radius: 8, target: [0,1,0]}, isActive=true",
                    "3. add_light 'light' type 'HemisphericLight' properties {direction: [0,1,0], intensity: 0.5}",
                    "",
                    "## Step 2: Emitter mesh",
                    "4. add_mesh 'emitter' type 'Sphere' options {diameter: 0.5}, transform {position: [0,0,0]}",
                    "5. set_mesh_properties meshId='emitter' visibility=0 (invisible emitter)",
                    "",
                    "## Step 3: Particle system",
                    "6. add_particle_system 'fire' capacity=2000 emitter='emitter' emitterType='Cone' emitterOptions={radius:0.3, angle:0.5} emitRate=200 minLifeTime=0.3 maxLifeTime=1.5 minSize=0.2 maxSize=0.8 blendMode='ADD' particleTexture='https://playground.babylonjs.com/textures/flare.png' gravity={x:0,y:2,z:0}",
                    "",
                    "## Step 4: Color gradients (birth → death)",
                    "7. add_particle_gradient particleSystemId='fire' gradientType='color' gradient=0 value={r:1,g:0.8,b:0,a:1}",
                    "8. add_particle_gradient particleSystemId='fire' gradientType='color' gradient=0.5 value={r:1,g:0.3,b:0,a:0.8}",
                    "9. add_particle_gradient particleSystemId='fire' gradientType='color' gradient=1 value={r:0.2,g:0,b:0,a:0}",
                    "",
                    "## Step 5: Size gradient (grow then shrink)",
                    "10. add_particle_gradient particleSystemId='fire' gradientType='size' gradient=0 value=0.3",
                    "11. add_particle_gradient particleSystemId='fire' gradientType='size' gradient=0.5 value=0.8",
                    "12. add_particle_gradient particleSystemId='fire' gradientType='size' gradient=1 value=0.1",
                    "",
                    "## Step 6: Glow layer for the fire",
                    "13. add_glow_layer 'fireGlow' intensity=0.8 blurKernelSize=32",
                    "",
                    "14. validate_scene, start_preview",
                ].join("\n"),
            },
        },
    ],
}));

server.registerPrompt("create-animated-scene", { description: "Create a scene with keyframe animations and an animation group" }, () => ({
    messages: [
        {
            role: "user",
            content: {
                type: "text",
                text: [
                    "Create a scene with a bouncing box and a rotating light.",
                    "",
                    "## Step 1: Scene setup",
                    "1. create_scene 'AnimatedScene' description 'Bouncing box with rotating light'",
                    "2. add_camera 'cam' type 'ArcRotateCamera' properties {alpha: -1.57, beta: 1.0, radius: 10, target: [0,1,0]}, isActive=true",
                    "3. add_light 'ambient' type 'HemisphericLight' properties {direction: [0,1,0], intensity: 0.3}",
                    "4. add_light 'pointLight' type 'PointLight' properties {intensity: 1, diffuse: [1,0.8,0.5]}, transform {position: [3,3,0]}",
                    "",
                    "## Step 2: Meshes",
                    "5. add_mesh 'ground' type 'Ground' options {width: 10, height: 10}",
                    "6. add_mesh 'box' type 'Box' transform {position: [0,1,0]}",
                    "7. add_material 'boxMat' type 'PBRMaterial' properties {albedoColor: [0.2, 0.5, 0.9], metallic: 0.5, roughness: 0.3}",
                    "8. assign_material meshId='box' materialId='boxMat'",
                    "",
                    "## Step 3: Bounce animation (position.y with easing)",
                    "9. add_animation name='bounce' targetId='box' property='position.y' fps=60 loopMode='Cycle' easingFunction='BounceEase' easingMode=1 keys=[",
                    "     {frame: 0, value: 3},",
                    "     {frame: 30, value: 0.5},",
                    "     {frame: 60, value: 3}",
                    "   ]",
                    "",
                    "## Step 4: Light orbit animation (rotation around Y axis)",
                    "10. add_animation name='lightOrbit' targetId='pointLight' property='position' fps=60 loopMode='Cycle' keys=[",
                    "      {frame: 0, value: {x:3, y:3, z:0}},",
                    "      {frame: 30, value: {x:0, y:3, z:3}},",
                    "      {frame: 60, value: {x:-3, y:3, z:0}},",
                    "      {frame: 90, value: {x:0, y:3, z:-3}},",
                    "      {frame: 120, value: {x:3, y:3, z:0}}",
                    "    ]",
                    "",
                    "## Step 5: Group them",
                    "11. create_animation_group name='sceneAnims' animationIds=['bounce','lightOrbit'] autoStart=true isLooping=true",
                    "",
                    "12. validate_scene, start_preview",
                ].join("\n"),
            },
        },
    ],
}));

server.registerPrompt("create-audio-scene", { description: "Create a scene with background music and spatial 3D audio attached to a mesh" }, () => ({
    messages: [
        {
            role: "user",
            content: {
                type: "text",
                text: [
                    "Create a scene with background music and a spatial sound source.",
                    "",
                    "## Step 1: Scene setup",
                    "1. create_scene 'AudioScene' description 'Scene with spatial audio'",
                    "2. add_camera 'cam' type 'ArcRotateCamera' properties {alpha: -1.57, beta: 1.2, radius: 10, target: [0,1,0]}, isActive=true",
                    "3. add_light 'light' type 'HemisphericLight' properties {direction: [0,1,0], intensity: 0.7}",
                    "4. add_mesh 'ground' type 'Ground' options {width: 20, height: 20}",
                    "",
                    "## Step 2: Sound-emitting mesh",
                    "5. add_mesh 'speaker' type 'Sphere' options {diameter: 1}, transform {position: [3,1,0]}",
                    "6. add_material 'speakerMat' type 'PBRMaterial' properties {albedoColor: [0.1,0.8,0.2], emissiveColor: [0,0.3,0], metallic: 0.8}",
                    "7. assign_material meshId='speaker' materialId='speakerMat'",
                    "",
                    "## Step 3: Background music (non-spatial, loops)",
                    "8. add_sound 'bgMusic' url='YOUR_MUSIC_URL.mp3' soundType='streaming' autoplay=true loop=true volume=0.3",
                    "",
                    "## Step 4: Spatial sound attached to the speaker mesh",
                    "9. add_sound 'spatialFx' url='YOUR_SOUND_URL.mp3' soundType='static' autoplay=true loop=true volume=0.8 spatialEnabled=true spatialMaxDistance=30 spatialMinDistance=1 spatialRolloffFactor=1.5 attachedMeshId='speaker'",
                    "   The sound volume will change as the camera orbits closer/farther from the speaker mesh.",
                    "",
                    "10. validate_scene, start_preview",
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

server.registerTool("clear_all", { description: "Remove all scenes from memory, resetting the server to a clean state." }, async () => {
    const names = manager.listScenes();
    manager.clearAll();
    return {
        content: [{ type: "text", text: names.length > 0 ? `Cleared ${names.length} scene(s): ${names.join(", ")}` : "Nothing to clear — memory was already empty." }],
    };
});

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
            gravity: z.unknown().optional().describe("Gravity vector as {x,y,z} or [x,y,z]. Setting gravity automatically enables physics if not already enabled."),
            physicsEnabled: z.boolean().optional().describe("Enable physics simulation"),
            physicsPlugin: z.string().optional().describe("Physics plugin: 'havok' (recommended) or 'cannon'"),
            physicsEngine: z.string().optional().describe("Alias for physicsPlugin — e.g. 'HavokPlugin' or 'havok'. Also auto-enables physics."),
            createDefaultGround: z.boolean().optional().describe("Auto-create a default ground plane"),
            groundSize: z.number().optional().describe("Size of default ground"),
            groundColor: z.unknown().optional().describe("Color of default ground"),
        },
    },
    async (params) => {
        const { sceneName, physicsEngine, ...env } = params;

        // physicsEngine alias → resolve to physicsPlugin + physicsEnabled
        if (physicsEngine !== undefined && env.physicsPlugin === undefined) {
            // Normalize: "HavokPlugin" / "HavokPhysics" / "Havok" / "havok" → "havok"
            const normalized = physicsEngine.toLowerCase().replace("plugin", "").replace("physics", "");
            env.physicsPlugin = normalized || "havok";
        }
        if (physicsEngine !== undefined && env.physicsEnabled === undefined) {
            env.physicsEnabled = true;
        }

        // Auto-enable physics when gravity is set
        if (env.gravity !== undefined && env.physicsEnabled === undefined) {
            env.physicsEnabled = true;
            if (env.physicsPlugin === undefined) {
                env.physicsPlugin = "havok";
            }
        }

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
            type: z.string().optional().describe("Camera type: ArcRotateCamera, FreeCamera, UniversalCamera, FollowCamera"),
            cameraType: z.string().optional().describe("Alias for type — camera type name"),
            properties: z.record(z.string(), z.unknown()).optional().describe("Camera properties object. You can also use the top-level convenience aliases below instead."),
            options: z.record(z.string(), z.unknown()).optional().describe("Alias for properties — camera properties object"),
            // Convenience aliases — merged into properties (top-level wins)
            alpha: z.number().optional().describe("ArcRotateCamera: horizontal rotation angle in radians (e.g. -Math.PI/2)"),
            beta: z.number().optional().describe("ArcRotateCamera: vertical rotation angle in radians (e.g. Math.PI/3)"),
            radius: z.number().optional().describe("ArcRotateCamera / FollowCamera: distance from target"),
            target: z.unknown().optional().describe("Camera target as {x,y,z} or [x,y,z] — the point the camera looks at"),
            position: z.unknown().optional().describe("Camera position as {x,y,z} or [x,y,z] — for FreeCamera/UniversalCamera"),
            speed: z.number().optional().describe("Camera movement speed"),
            heightOffset: z.number().optional().describe("FollowCamera: height offset above the target"),
            rotationOffset: z.number().optional().describe("FollowCamera: rotation offset in degrees"),
            lockedTarget: z.string().optional().describe("FollowCamera: name of the mesh to follow"),
            minZ: z.number().optional().describe("Near clipping plane distance"),
            maxZ: z.number().optional().describe("Far clipping plane distance"),
            fov: z.number().optional().describe("Field of view in radians"),
            isActive: z.boolean().default(true).describe("Whether this should be the active camera"),
        },
    },
    async ({
        sceneName,
        name,
        type: rawType,
        cameraType,
        properties,
        options: optionsAlias,
        alpha,
        beta,
        radius,
        target,
        position,
        speed,
        heightOffset,
        rotationOffset,
        lockedTarget,
        minZ,
        maxZ,
        fov,
        isActive,
    }) => {
        // Gap 26: resolve cameraType alias
        const resolvedRawType = rawType ?? cameraType;
        if (!resolvedRawType) {
            return { content: [{ type: "text", text: "Error: Either type or cameraType must be provided." }], isError: true };
        }
        // Validate camera type
        const validCameraTypes = ["ArcRotateCamera", "FreeCamera", "UniversalCamera", "FollowCamera"];
        const cameraTypeMap: Record<string, string> = {};
        for (const t of validCameraTypes) {
            cameraTypeMap[t.toLowerCase()] = t;
        }
        const resolvedType = cameraTypeMap[resolvedRawType.toLowerCase()];
        if (!resolvedType) {
            return { content: [{ type: "text", text: `Error: Invalid camera type "${resolvedRawType}". Valid types: ${validCameraTypes.join(", ")}` }], isError: true };
        }
        // Merge convenience aliases into properties (top-level wins)
        const mergedProps: Record<string, unknown> = { ...((optionsAlias as Record<string, unknown>) || {}), ...((properties as Record<string, unknown>) || {}) };
        if (alpha !== undefined) {
            mergedProps.alpha = alpha;
        }
        if (beta !== undefined) {
            mergedProps.beta = beta;
        }
        if (radius !== undefined) {
            mergedProps.radius = radius;
        }
        if (target !== undefined) {
            mergedProps.target = target;
        }
        if (position !== undefined) {
            mergedProps.position = position;
        }
        if (speed !== undefined) {
            mergedProps.speed = speed;
        }
        if (heightOffset !== undefined) {
            mergedProps.heightOffset = heightOffset;
        }
        if (rotationOffset !== undefined) {
            mergedProps.rotationOffset = rotationOffset;
        }
        if (lockedTarget !== undefined) {
            mergedProps.lockedTarget = lockedTarget;
        }
        if (minZ !== undefined) {
            mergedProps.minZ = minZ;
        }
        if (maxZ !== undefined) {
            mergedProps.maxZ = maxZ;
        }
        if (fov !== undefined) {
            mergedProps.fov = fov;
        }

        const result = manager.addCamera(sceneName, name, resolvedType, Object.keys(mergedProps).length > 0 ? mergedProps : undefined, isActive);
        if (typeof result === "string") {
            return { content: [{ type: "text", text: `Error: ${result}` }], isError: true };
        }
        return {
            content: [
                {
                    type: "text",
                    text: `Added camera [${result.id}] "${name}" (${resolvedType}).${isActive ? " Set as active camera." : ""}`,
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
        description:
            "Update properties on an existing camera. The 'properties' object accepts any camera property by name.\n" +
            "Common properties by camera type:\n" +
            "- ArcRotateCamera: target ({x,y,z}), alpha, beta, radius, lowerRadiusLimit, upperRadiusLimit, lowerBetaLimit, upperBetaLimit, wheelPrecision, panningSensibility\n" +
            "- FreeCamera: position ({x,y,z}), rotation ({x,y,z}), speed, fov\n" +
            "- All cameras: minZ, maxZ, fov, fovMode (0=vertical, 1=horizontal), speed",
        inputSchema: {
            sceneName: z.string().describe("Name of the scene"),
            cameraId: z.string().describe("Camera ID or name"),
            properties: z
                .record(z.string(), z.unknown())
                .describe("Properties to update — keys are Babylon.js camera property names, values are the new values. See description for common properties."),
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
        description:
            "Add a light to the scene. For shadows: set shadowEnabled=true, then use configure_light to set shadowMapSize (2048 recommended) and shadowFrustumSize (match ground size for DirectionalLight). Don't forget to mark meshes with castsShadows/receiveShadows via set_mesh_properties.",
        inputSchema: {
            sceneName: z.string().describe("Name of the scene"),
            name: z.string().describe("Name for the light"),
            type: z.enum(["HemisphericLight", "PointLight", "DirectionalLight", "SpotLight"]).optional().describe("Light type"),
            lightType: z.enum(["HemisphericLight", "PointLight", "DirectionalLight", "SpotLight"]).optional().describe("Alias for type — Light type"),
            properties: z.record(z.string(), z.unknown()).optional().describe("Light properties object. You can also use the top-level convenience aliases below instead."),
            options: z.record(z.string(), z.unknown()).optional().describe("Alias for properties — light properties object"),
            // Convenience aliases — merged into properties (top-level wins)
            direction: z.unknown().optional().describe("Light direction as {x,y,z} or [x,y,z] — required for Hemispheric/Directional/Spot"),
            position: z.unknown().optional().describe("Light position as {x,y,z} or [x,y,z] — for Point/Directional/Spot"),
            intensity: z.number().optional().describe("Light intensity (default 1.0)"),
            diffuse: z.unknown().optional().describe("Diffuse color as {r,g,b} or [r,g,b]"),
            specular: z.unknown().optional().describe("Specular color as {r,g,b} or [r,g,b]"),
            groundColor: z.unknown().optional().describe("HemisphericLight: ground color as {r,g,b} or [r,g,b]"),
            range: z.number().optional().describe("PointLight: light range"),
            angle: z.number().optional().describe("SpotLight: cone angle in radians"),
            exponent: z.number().optional().describe("SpotLight: light decay exponent"),
            shadowEnabled: z.boolean().optional().describe("Enable shadow generation for this light"),
        },
    },
    async ({
        sceneName,
        name,
        type,
        lightType,
        properties,
        options: optionsAlias,
        direction,
        position,
        intensity,
        diffuse,
        specular,
        groundColor,
        range,
        angle,
        exponent,
        shadowEnabled,
    }) => {
        // Gap 45 fix: resolve lightType alias
        const resolvedType = type ?? lightType;
        if (!resolvedType) {
            return { content: [{ type: "text", text: "Error: Either 'type' or 'lightType' must be provided." }], isError: true };
        }
        // Merge convenience aliases into properties (top-level wins)
        const mergedProps: Record<string, unknown> = { ...((optionsAlias as Record<string, unknown>) || {}), ...((properties as Record<string, unknown>) || {}) };
        if (direction !== undefined) {
            mergedProps.direction = direction;
        }
        if (position !== undefined) {
            mergedProps.position = position;
        }
        if (intensity !== undefined) {
            mergedProps.intensity = intensity;
        }
        if (diffuse !== undefined) {
            mergedProps.diffuse = diffuse;
        }
        if (specular !== undefined) {
            mergedProps.specular = specular;
        }
        if (groundColor !== undefined) {
            mergedProps.groundColor = groundColor;
        }
        if (range !== undefined) {
            mergedProps.range = range;
        }
        if (angle !== undefined) {
            mergedProps.angle = angle;
        }
        if (exponent !== undefined) {
            mergedProps.exponent = exponent;
        }
        if (shadowEnabled !== undefined) {
            mergedProps.shadowEnabled = shadowEnabled;
        }

        const result = manager.addLight(sceneName, name, resolvedType, Object.keys(mergedProps).length > 0 ? mergedProps : undefined);
        if (typeof result === "string") {
            return { content: [{ type: "text", text: `Error: ${result}` }], isError: true };
        }
        return {
            content: [{ type: "text", text: `Added light [${result.id}] "${name}" (${resolvedType}).` }],
        };
    }
);

server.registerTool(
    "configure_light",
    {
        description:
            "Update properties on an existing light. Accepts both the 'properties' bag and top-level convenience aliases.\n" +
            "Common properties by light type:\n" +
            "- HemisphericLight: direction, intensity, diffuse, specular, groundColor\n" +
            "- PointLight: position, intensity, diffuse, specular, range\n" +
            "- DirectionalLight: direction, position, intensity, diffuse, specular, shadowEnabled\n" +
            "- SpotLight: direction, position, angle, exponent, intensity, diffuse, specular, range, shadowEnabled\n" +
            "\nShadow properties (in the properties bag): shadowEnabled, shadowMapSize (2048 recommended), " +
            "shadowFrustumSize (match ground size for DirectionalLight), shadowDarkness (0–1, e.g. 0.3), " +
            "shadowBias, shadowNormalBias, shadowFilter ('pcf'|'contactHardening'|'blurExponential'), " +
            "shadowForceBackFacesOnly (default true — prevents self-shadow on curved meshes).",
        inputSchema: {
            sceneName: z.string().describe("Name of the scene"),
            lightId: z.string().optional().describe("Light ID or name"),
            name: z.string().optional().describe("Alias for lightId — light name or ID"),
            properties: z.record(z.string(), z.unknown()).optional().describe("Properties to update (all configurable props nested here)"),
            // Gap 23 — convenience aliases for common light properties (merged into properties)
            direction: z.unknown().optional().describe("Shorthand for properties.direction — as {x,y,z} or [x,y,z]"),
            intensity: z.number().optional().describe("Shorthand for properties.intensity"),
            diffuse: z.unknown().optional().describe("Shorthand for properties.diffuse — as {r,g,b} or [r,g,b]"),
            specular: z.unknown().optional().describe("Shorthand for properties.specular — as {r,g,b} or [r,g,b]"),
            groundColor: z.unknown().optional().describe("Shorthand for properties.groundColor (HemisphericLight) — as {r,g,b} or [r,g,b]"),
            range: z.number().optional().describe("Shorthand for properties.range"),
            shadowEnabled: z.boolean().optional().describe("Shorthand for properties.shadowEnabled"),
        },
    },
    async ({ sceneName, lightId, name: nameAlias, properties, direction, intensity, diffuse, specular, groundColor, range, shadowEnabled }) => {
        const resolvedLightId = lightId ?? nameAlias;
        if (!resolvedLightId) {
            return { content: [{ type: "text", text: "Error: Either lightId or name must be provided." }], isError: true };
        }
        // Gap 23: Merge convenience aliases into properties
        const mergedProps: Record<string, unknown> = { ...((properties as Record<string, unknown>) || {}) };
        if (direction !== undefined) {
            mergedProps.direction = direction;
        }
        if (intensity !== undefined) {
            mergedProps.intensity = intensity;
        }
        if (diffuse !== undefined) {
            mergedProps.diffuse = diffuse;
        }
        if (specular !== undefined) {
            mergedProps.specular = specular;
        }
        if (groundColor !== undefined) {
            mergedProps.groundColor = groundColor;
        }
        if (range !== undefined) {
            mergedProps.range = range;
        }
        if (shadowEnabled !== undefined) {
            mergedProps.shadowEnabled = shadowEnabled;
        }

        const result = manager.configureLightProperties(sceneName, resolvedLightId, mergedProps as Record<string, unknown>);
        return {
            content: [{ type: "text", text: result === "OK" ? `Light "${resolvedLightId}" updated.` : `Error: ${result}` }],
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
            "For NodeMaterial, pass the exported NME JSON from the Node Material MCP server (inline or via file path). " +
            "Common material properties (albedoColor, diffuseColor, metallic, roughness, etc.) can be passed at top level as shortcuts for properties.{key}.",
        inputSchema: {
            sceneName: z.string().describe("Name of the scene"),
            name: z.string().describe("Name for the material"),
            type: z
                .string()
                .describe(
                    "Material type: 'StandardMaterial' (or 'Standard'), 'PBRMaterial' (or 'PBR'), 'NodeMaterial' (or 'Node'). " + "Short aliases are accepted and auto-resolved."
                ),
            properties: z
                .record(z.string(), z.unknown())
                .optional()
                .describe(
                    "Material properties. StandardMaterial: diffuseColor, specularColor, alpha, diffuseTexture (url). " +
                        "PBRMaterial: albedoColor, metallic, roughness, albedoTexture (url), environmentTexture (url). " +
                        "NodeMaterial: use nmeJson parameter instead."
                ),
            // Convenience aliases — common material properties at top level
            albedoColor: z
                .union([z.object({ r: z.number(), g: z.number(), b: z.number() }), z.array(z.number()).length(3)])
                .optional()
                .describe("Shorthand for properties.albedoColor (PBRMaterial) — as {r,g,b} or [r,g,b]"),
            diffuseColor: z
                .union([z.object({ r: z.number(), g: z.number(), b: z.number() }), z.array(z.number()).length(3)])
                .optional()
                .describe("Shorthand for properties.diffuseColor (StandardMaterial) — as {r,g,b} or [r,g,b]"),
            specularColor: z
                .union([z.object({ r: z.number(), g: z.number(), b: z.number() }), z.array(z.number()).length(3)])
                .optional()
                .describe("Shorthand for properties.specularColor (StandardMaterial) — as {r,g,b} or [r,g,b]"),
            emissiveColor: z
                .union([z.object({ r: z.number(), g: z.number(), b: z.number() }), z.array(z.number()).length(3)])
                .optional()
                .describe("Shorthand for properties.emissiveColor — as {r,g,b} or [r,g,b]"),
            metallic: z.number().optional().describe("Shorthand for properties.metallic (PBRMaterial) — 0 to 1"),
            roughness: z.number().optional().describe("Shorthand for properties.roughness (PBRMaterial) — 0 to 1"),
            alpha: z.number().optional().describe("Shorthand for properties.alpha — 0 (transparent) to 1 (opaque)"),
            nmeJson: z.string().optional().describe("For NodeMaterial: the full NME JSON string exported from the Node Material MCP server"),
            nmeJsonFile: z
                .string()
                .optional()
                .describe("For NodeMaterial: absolute path to a file containing the NME JSON (alternative to inline nmeJson — avoids large payloads in context)"),
            snippetId: z.string().optional().describe("For NodeMaterial: a Babylon.js Snippet Server ID to load from"),
        },
    },
    async ({
        sceneName,
        name,
        type: rawType,
        properties,
        albedoColor,
        diffuseColor,
        specularColor,
        emissiveColor,
        metallic,
        roughness,
        alpha,
        nmeJson,
        nmeJsonFile,
        snippetId,
    }) => {
        // Gap 15 — resolve short material type aliases
        const materialTypeAliases: Record<string, string> = {
            pbr: "PBRMaterial",
            standard: "StandardMaterial",
            node: "NodeMaterial",
            pbrmaterial: "PBRMaterial",
            standardmaterial: "StandardMaterial",
            nodematerial: "NodeMaterial",
        };
        const type = materialTypeAliases[rawType.toLowerCase()] ?? rawType;
        const validTypes = ["StandardMaterial", "PBRMaterial", "NodeMaterial"];
        if (!validTypes.includes(type)) {
            return {
                content: [{ type: "text", text: `Error: Unknown material type "${rawType}". Valid types: ${validTypes.join(", ")} (aliases: PBR, Standard, Node)` }],
                isError: true,
            };
        }
        // Merge top-level convenience material properties into the properties object
        const mergedProperties: Record<string, unknown> = { ...((properties as Record<string, unknown>) || {}) };
        if (albedoColor !== undefined && !("albedoColor" in mergedProperties)) {
            mergedProperties.albedoColor = albedoColor;
        }
        if (diffuseColor !== undefined && !("diffuseColor" in mergedProperties)) {
            mergedProperties.diffuseColor = diffuseColor;
        }
        if (specularColor !== undefined && !("specularColor" in mergedProperties)) {
            mergedProperties.specularColor = specularColor;
        }
        if (emissiveColor !== undefined && !("emissiveColor" in mergedProperties)) {
            mergedProperties.emissiveColor = emissiveColor;
        }
        if (metallic !== undefined && !("metallic" in mergedProperties)) {
            mergedProperties.metallic = metallic;
        }
        if (roughness !== undefined && !("roughness" in mergedProperties)) {
            mergedProperties.roughness = roughness;
        }
        if (alpha !== undefined && !("alpha" in mergedProperties)) {
            mergedProperties.alpha = alpha;
        }
        const resolvedProperties = Object.keys(mergedProperties).length > 0 ? mergedProperties : (properties as Record<string, unknown>);

        let resolvedNmeJson = nmeJson;
        if (!resolvedNmeJson && nmeJsonFile) {
            try {
                resolvedNmeJson = readFileSync(nmeJsonFile, "utf-8");
            } catch (e) {
                return { content: [{ type: "text", text: `Error reading NME JSON file: ${(e as Error).message}` }], isError: true };
            }
        }
        // Validate that NodeMaterial has at least one source for its definition
        if (type === "NodeMaterial" && !resolvedNmeJson && !snippetId) {
            return {
                content: [
                    {
                        type: "text",
                        text:
                            `Error: NodeMaterial requires at least one of: nmeJson (inline JSON string), nmeJsonFile (path to exported NME JSON file), or snippetId. ` +
                            `Use the Node Material MCP server's export_material_json tool to export the material to a file, then pass the file path via nmeJsonFile.`,
                    },
                ],
                isError: true,
            };
        }
        // Validate that NME JSON is actually valid JSON
        if (type === "NodeMaterial" && resolvedNmeJson) {
            try {
                JSON.parse(resolvedNmeJson);
            } catch {
                return {
                    content: [
                        {
                            type: "text",
                            text: `Error: nmeJson must be a valid JSON string. The provided value is not valid JSON. Use the Node Material MCP server's export_material_json tool to get properly formatted JSON.`,
                        },
                    ],
                    isError: true,
                };
            }
        }
        const result = manager.addMaterial(sceneName, name, type, resolvedProperties as Record<string, unknown>, resolvedNmeJson, snippetId);
        if (typeof result === "string") {
            return { content: [{ type: "text", text: `Error: ${result}` }], isError: true };
        }
        const extra = type === "NodeMaterial" ? (resolvedNmeJson ? " (NME JSON imported)" : snippetId ? ` (will load snippet ${snippetId})` : "") : "";
        // Warn when Standard/PBR material has no distinguishing color property
        let warning = "";
        if (type === "StandardMaterial" || type === "PBRMaterial") {
            const props = resolvedProperties as Record<string, unknown> | undefined;
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

server.registerTool(
    "configure_material",
    {
        description:
            "Update properties on an existing material (color, roughness, metallic, etc.). " +
            "Common properties can be passed at top level as convenience or inside properties object.",
        inputSchema: {
            sceneName: z.string().describe("Name of the scene"),
            materialId: z.string().optional().describe("Material ID or name"),
            materialName: z.string().optional().describe("Alias for materialId — material name"),
            properties: z.record(z.string(), z.unknown()).optional().describe("Material properties to update: albedoColor, metallic, roughness, diffuseColor, etc."),
            // Convenience aliases — same as add_material
            albedoColor: z
                .union([z.object({ r: z.number(), g: z.number(), b: z.number() }), z.array(z.number()).length(3)])
                .optional()
                .describe("Shorthand for properties.albedoColor (PBRMaterial)"),
            diffuseColor: z
                .union([z.object({ r: z.number(), g: z.number(), b: z.number() }), z.array(z.number()).length(3)])
                .optional()
                .describe("Shorthand for properties.diffuseColor (StandardMaterial)"),
            specularColor: z
                .union([z.object({ r: z.number(), g: z.number(), b: z.number() }), z.array(z.number()).length(3)])
                .optional()
                .describe("Shorthand for properties.specularColor"),
            emissiveColor: z
                .union([z.object({ r: z.number(), g: z.number(), b: z.number() }), z.array(z.number()).length(3)])
                .optional()
                .describe("Shorthand for properties.emissiveColor"),
            metallic: z.number().optional().describe("Shorthand for properties.metallic — 0 to 1"),
            roughness: z.number().optional().describe("Shorthand for properties.roughness — 0 to 1"),
            alpha: z.number().optional().describe("Shorthand for properties.alpha — 0 to 1"),
        },
    },
    async ({ sceneName, materialId, materialName, properties, albedoColor, diffuseColor, specularColor, emissiveColor, metallic, roughness, alpha }) => {
        // Gap 46 fix: resolve materialName alias
        const resolvedMaterialId = materialId ?? materialName;
        if (!resolvedMaterialId) {
            return { content: [{ type: "text", text: "Error: Either 'materialId' or 'materialName' must be provided." }], isError: true };
        }
        const mergedProperties: Record<string, unknown> = { ...((properties as Record<string, unknown>) || {}) };
        if (albedoColor !== undefined && !("albedoColor" in mergedProperties)) {
            mergedProperties.albedoColor = albedoColor;
        }
        if (diffuseColor !== undefined && !("diffuseColor" in mergedProperties)) {
            mergedProperties.diffuseColor = diffuseColor;
        }
        if (specularColor !== undefined && !("specularColor" in mergedProperties)) {
            mergedProperties.specularColor = specularColor;
        }
        if (emissiveColor !== undefined && !("emissiveColor" in mergedProperties)) {
            mergedProperties.emissiveColor = emissiveColor;
        }
        if (metallic !== undefined && !("metallic" in mergedProperties)) {
            mergedProperties.metallic = metallic;
        }
        if (roughness !== undefined && !("roughness" in mergedProperties)) {
            mergedProperties.roughness = roughness;
        }
        if (alpha !== undefined && !("alpha" in mergedProperties)) {
            mergedProperties.alpha = alpha;
        }

        if (Object.keys(mergedProperties).length === 0) {
            return { content: [{ type: "text", text: "Error: No properties provided to update." }], isError: true };
        }
        const result = manager.configureMaterialProperties(sceneName, resolvedMaterialId, mergedProperties);
        if (result !== "OK") {
            return { content: [{ type: "text", text: `Error: ${result}` }], isError: true };
        }
        const summary = Object.entries(mergedProperties)
            .map(([k, v]) => `${k}: ${JSON.stringify(v)}`)
            .join(", ");
        return { content: [{ type: "text", text: `Material "${resolvedMaterialId}" updated: { ${summary} }` }] };
    }
);

// ═══════════════════════════════════════════════════════════════════════════
//  Tools — Textures
// ═══════════════════════════════════════════════════════════════════════════

server.registerTool(
    "add_texture",
    {
        description:
            "Add a texture to the scene. After adding, assign it to a material using configure_material " +
            "(e.g. configure_material with properties: { diffuseTexture: 'textureName' } for StandardMaterial, " +
            "or { albedoTexture: 'textureName' } for PBRMaterial). " +
            "The texture is NOT automatically linked to any material.",
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
        description:
            "Add a primitive mesh to the scene: Box, Sphere, Cylinder, Plane, Ground, Torus, Capsule, etc. " +
            "IMPORTANT: Primitive creation options (diameter, width, height, segments, etc.) are set at creation time and CANNOT be changed afterward. " +
            "To resize a primitive, you must remove_mesh and add_mesh again with new options. " +
            "The 'options' parameter accepts the same keys as the Babylon.js MeshBuilder (e.g. {diameter: 2} for Sphere, {width: 5, height: 3, depth: 1} for Box, {width: 10, height: 10} for Ground).",
        inputSchema: {
            sceneName: z.string().describe("Name of the scene"),
            name: z.string().describe("Name for the mesh"),
            type: z.enum(["Box", "Sphere", "Cylinder", "Plane", "Ground", "Torus", "TorusKnot", "Disc", "Capsule", "IcoSphere"]).describe("Primitive mesh type"),
            options: z.record(z.string(), z.unknown()).optional().describe("Primitive creation options (e.g. {diameter: 2} for Sphere, {width: 5, height: 5} for Ground)"),
            transform: TransformSchema,
            // Convenience aliases — position/rotation/scaling at top level are merged into transform
            position: Vector3Schema.describe("Shorthand for transform.position — a 3D vector as {x,y,z} or [x,y,z]"),
            rotation: Vector3Schema.describe("Shorthand for transform.rotation — a 3D vector as {x,y,z} or [x,y,z]"),
            scaling: Vector3Schema.describe("Shorthand for transform.scaling — a 3D vector as {x,y,z} or [x,y,z]"),
            parentId: z.string().optional().describe("Parent node ID or name for hierarchy"),
            materialId: z.string().optional().describe("Material ID or name to assign"),
            material: z.string().optional().describe("Alias for materialId — material ID or name to assign"),
            physics: PhysicsSchema,
        },
    },
    async ({ sceneName, name, type, options, transform, position, rotation, scaling, parentId, materialId, material, physics }) => {
        // Merge convenience top-level position/rotation/scaling into transform (top-level wins)
        const mergedTransform: Record<string, unknown> = { ...((transform as Record<string, unknown>) || {}) };
        if (position !== undefined) {
            mergedTransform.position = position;
        }
        if (rotation !== undefined) {
            mergedTransform.rotation = rotation;
        }
        if (scaling !== undefined) {
            mergedTransform.scaling = scaling;
        }
        const resolvedMaterialId = materialId || material;

        const result = manager.addMesh(
            sceneName,
            name,
            type,
            options as Record<string, unknown>,
            Object.keys(mergedTransform).length > 0 ? mergedTransform : undefined,
            parentId,
            resolvedMaterialId
        );
        if (typeof result === "string") {
            return { content: [{ type: "text", text: `Error: ${result}` }], isError: true };
        }

        // Inline physics body
        let physicsMsg = "";
        if (physics) {
            // Normalize bodyType (case-insensitive string → number, same as add_physics_body standalone)
            let resolvedInlineBodyType: string | number = physics.bodyType;
            if (typeof resolvedInlineBodyType === "string") {
                const btMap: Record<string, number> = { static: 0, animated: 1, dynamic: 2 };
                const mapped = btMap[resolvedInlineBodyType.toLowerCase()];
                if (mapped !== undefined) {
                    resolvedInlineBodyType = mapped;
                }
            }
            const pResult = manager.addPhysicsBody(sceneName, result.id, resolvedInlineBodyType, physics.shapeType, {
                mass: physics.mass,
                friction: physics.friction,
                restitution: physics.restitution,
                linearDamping: physics.linearDamping,
                angularDamping: physics.angularDamping,
                isTrigger: physics.isTrigger,
            });
            if (pResult === "OK") {
                physicsMsg = ` Physics: ${physics.shapeType} (${physics.bodyType}).`;
            } else {
                physicsMsg = ` Physics error: ${pResult}`;
            }
        }

        return {
            content: [
                {
                    type: "text",
                    text: `Added mesh [${result.id}] "${name}" (${type}).${resolvedMaterialId ? ` Material: ${resolvedMaterialId}.` : ""}${physicsMsg}`,
                },
            ],
        };
    }
);

server.registerTool(
    "remove_mesh",
    {
        description:
            "Remove a mesh (and its physics body, if any) from the scene. " +
            "This disposes the mesh — it cannot be undone. " +
            "To change a primitive's geometry (size, segments), remove it and re-add with add_mesh. " +
            "If the mesh has children, they are NOT removed — they become root-level nodes.",
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
        description:
            "Update DISPLAY properties on a mesh: visibility, pickability, shadow settings, tags, metadata. " +
            "This does NOT change the mesh's geometry or size — primitive dimensions (width, height, diameter) are fixed at creation time. " +
            "To resize, use remove_mesh + add_mesh. To move/rotate/scale, use set_transform.\n" +
            "For shadows: set castsShadows=true on meshes that should cast shadows (e.g. objects), " +
            "and receiveShadows=true on meshes that should receive them (e.g. ground). Both can be true on the same mesh.",
        inputSchema: {
            sceneName: z.string().describe("Name of the scene"),
            meshId: z.string().describe("Mesh ID or name"),
            isVisible: z.boolean().optional().describe("Whether the mesh is visible"),
            visible: z.boolean().optional().describe("Alias for isVisible"),
            isPickable: z.boolean().optional().describe("Whether the mesh is pickable by ray-casting"),
            receiveShadows: z.boolean().optional().describe("Whether the mesh receives shadows"),
            castsShadows: z.boolean().optional().describe("Whether the mesh is included in shadow generators"),
            tags: z.array(z.string()).optional().describe("Tags for querying/filtering"),
            metadata: z.record(z.string(), z.unknown()).optional().describe("Custom metadata"),
        },
    },
    async ({ sceneName, meshId, visible, ...props }) => {
        // Gap 54: accept `visible` as alias for `isVisible`
        if (visible !== undefined && props.isVisible === undefined) {
            props.isVisible = visible;
        }
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
            // Convenience aliases
            position: Vector3Schema.describe("Shorthand for transform.position"),
            rotation: Vector3Schema.describe("Shorthand for transform.rotation"),
            scaling: Vector3Schema.describe("Shorthand for transform.scaling"),
            parentId: z.string().optional().describe("Parent node ID or name"),
        },
    },
    async ({ sceneName, name, transform, position, rotation, scaling, parentId }) => {
        const mergedTransform: Record<string, unknown> = { ...((transform as Record<string, unknown>) || {}) };
        if (position !== undefined) {
            mergedTransform.position = position;
        }
        if (rotation !== undefined) {
            mergedTransform.rotation = rotation;
        }
        if (scaling !== undefined) {
            mergedTransform.scaling = scaling;
        }
        const result = manager.addTransformNode(sceneName, name, Object.keys(mergedTransform).length > 0 ? mergedTransform : undefined, parentId);
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
            nodeId: z.string().optional().describe("Node ID or name"),
            meshId: z.string().optional().describe("Alias for nodeId — mesh name or ID"),
            meshName: z.string().optional().describe("Alias for nodeId — mesh name"),
            name: z.string().optional().describe("Alias for nodeId — node name"),
            position: Vector3Schema.describe("New position as {x,y,z} or [x,y,z]"),
            rotation: Vector3Schema.describe("New rotation in radians as {x,y,z} or [x,y,z]"),
            rotationQuaternion: z
                .union([z.object({ x: z.number(), y: z.number(), z: z.number(), w: z.number() }), z.tuple([z.number(), z.number(), z.number(), z.number()])])
                .optional()
                .describe("Rotation quaternion as {x,y,z,w} or [x,y,z,w]. Takes priority over Euler rotation (required for physics bodies)."),
            scaling: Vector3Schema.describe("New scaling as {x,y,z} or [x,y,z]"),
        },
    },
    async ({ sceneName, nodeId, meshId, meshName, name: nameAlias, position, rotation, rotationQuaternion, scaling }) => {
        // Gap 47 fix: also accept meshName
        const resolvedNodeId = nodeId ?? meshId ?? meshName ?? nameAlias;
        if (!resolvedNodeId) {
            return { content: [{ type: "text", text: "Error: Either nodeId, meshId, or name must be provided." }], isError: true };
        }
        const result = manager.setTransform(sceneName, resolvedNodeId, { position, rotation, rotationQuaternion, scaling } as Record<string, unknown>);
        return {
            content: [{ type: "text", text: result === "OK" ? `Transform of "${resolvedNodeId}" updated.` : `Error: ${result}` }],
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
            // Convenience aliases
            position: Vector3Schema.describe("Shorthand for transform.position"),
            rotation: Vector3Schema.describe("Shorthand for transform.rotation"),
            scaling: Vector3Schema.describe("Shorthand for transform.scaling"),
            parentId: z.string().optional().describe("Parent node ID for the imported root"),
            animationGroups: z.array(z.string()).optional().describe("Expected animation group names in the model (e.g. ['Walk', 'Idle', 'Run'])"),
            materialOverrides: z.record(z.string(), z.string()).optional().describe("Map of mesh name → material ID to override materials on imported meshes"),
            pluginExtension: z.string().optional().describe("Force a specific loader plugin (e.g. '.gltf', '.obj')"),
        },
    },
    async ({ sceneName, name, url, transform, position, rotation, scaling, parentId, animationGroups, materialOverrides, pluginExtension }) => {
        const mergedTransform: Record<string, unknown> = { ...((transform as Record<string, unknown>) || {}) };
        if (position !== undefined) {
            mergedTransform.position = position;
        }
        if (rotation !== undefined) {
            mergedTransform.rotation = rotation;
        }
        if (scaling !== undefined) {
            mergedTransform.scaling = scaling;
        }
        const result = manager.addModel(sceneName, name, url, Object.keys(mergedTransform).length > 0 ? mergedTransform : undefined, parentId, {
            animationGroups,
            materialOverrides,
            pluginExtension,
        });
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
        description:
            "Add a physics body to a mesh so it participates in physics simulation. " +
            "PREREQUISITES: Physics must be enabled first via set_environment with physics: { enabled: true, engine: 'havok', gravity: {x:0,y:-9.81,z:0} }. " +
            "Each mesh can have at most ONE physics body — calling this on a mesh that already has one will error. " +
            "Use remove_physics_body first if you need to replace it.\n" +
            "Body types: Static (immovable floors/walls, mass ignored), Dynamic (fully simulated, affected by gravity/forces), Animated (keyframe-driven, pushes dynamic bodies).\n" +
            "Shape types: Box/Sphere/Capsule/Cylinder are fast approximations. ConvexHull wraps the mesh tightly but is more expensive. Mesh uses exact triangles (static only). " +
            "TIP: For Torus meshes, ConvexHull fills the hole — there is no hollow torus collider. Use a Container shape with child shapes for complex hollow colliders.",
        inputSchema: {
            sceneName: z.string().describe("Name of the scene"),
            meshId: z.string().optional().describe("Mesh ID or name"),
            meshName: z.string().optional().describe("Alias for meshId — mesh name"),
            name: z.string().optional().describe("Alias for meshId — mesh name"),
            bodyType: z
                .union([z.string(), z.number()])
                .optional()
                .describe("Body type: Static (immovable), Dynamic (fully simulated), Animated (driven by animation). Case-insensitive."),
            type: z.union([z.string(), z.number()]).optional().describe("Alias for bodyType"),
            shapeType: z.string().optional().describe("Collision shape type: Box, Sphere, Capsule, Cylinder, ConvexHull, Mesh, Container (case-insensitive)"),
            shape: z.string().optional().describe("Alias for shapeType"),
            mass: z.number().optional().describe("Mass (kg). Use 0 for static bodies."),
            friction: z.number().optional().describe("Friction coefficient (0-1)"),
            restitution: z.number().optional().describe("Bounciness (0-1)"),
            linearDamping: z.number().optional().describe("Linear damping (0-1)"),
            angularDamping: z.number().optional().describe("Angular damping (0-1)"),
            isTrigger: z.boolean().optional().describe("Whether this shape is a trigger/sensor (detects overlap but no physical response)"),
        },
    },
    async ({
        sceneName,
        meshId,
        meshName,
        name: nameAlias,
        bodyType,
        type: typeAlias,
        shapeType,
        shape,
        mass,
        friction,
        restitution,
        linearDamping,
        angularDamping,
        isTrigger,
    }) => {
        // Gap 48 fix: resolve aliases
        const resolvedMeshId = meshId ?? meshName ?? nameAlias;
        if (!resolvedMeshId) {
            return { content: [{ type: "text", text: "Error: Either 'meshId', 'meshName', or 'name' must be provided." }], isError: true };
        }
        const resolvedBodyTypeRaw = bodyType ?? typeAlias;
        if (resolvedBodyTypeRaw === undefined) {
            return { content: [{ type: "text", text: "Error: Either 'bodyType' or 'type' must be provided." }], isError: true };
        }
        const resolvedShapeTypeRaw = shapeType ?? shape;
        if (!resolvedShapeTypeRaw) {
            return { content: [{ type: "text", text: "Error: Either 'shapeType' or 'shape' must be provided." }], isError: true };
        }
        // Gap 21 fix: Normalize bodyType — accept case-insensitive strings and map to numbers
        let resolvedBodyType: string | number = resolvedBodyTypeRaw;
        if (typeof resolvedBodyType === "string") {
            const bodyTypeMap: Record<string, number> = { static: 0, animated: 1, dynamic: 2 };
            const mapped = bodyTypeMap[resolvedBodyType.toLowerCase()];
            if (mapped !== undefined) {
                resolvedBodyType = mapped;
            }
        }
        // Gap 21 fix: Normalize shapeType — accept case-insensitive strings and map to PascalCase
        const shapeTypeMap: Record<string, string> = {
            box: "Box",
            sphere: "Sphere",
            capsule: "Capsule",
            cylinder: "Cylinder",
            convexhull: "ConvexHull",
            mesh: "Mesh",
            container: "Container",
        };
        const resolvedShapeType = shapeTypeMap[resolvedShapeTypeRaw.toLowerCase()] ?? resolvedShapeTypeRaw;

        const result = manager.addPhysicsBody(sceneName, resolvedMeshId, resolvedBodyType, resolvedShapeType, {
            mass,
            friction,
            restitution,
            linearDamping,
            angularDamping,
            isTrigger,
        });
        return {
            content: [
                {
                    type: "text",
                    text: result === "OK" ? `Added physics body to "${resolvedMeshId}" (${resolvedShapeType}, ${resolvedBodyType}).` : `Error: ${result}`,
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
            "The coordinator JSON is the output of export_graph_json from the Flow Graph MCP server. " +
            "Provide either the inline coordinatorJson string OR a coordinatorJsonFile path (not both).",
        inputSchema: {
            sceneName: z.string().describe("Name of the scene"),
            name: z.string().optional().describe("Name for this flow graph attachment (defaults to 'flowGraph')"),
            coordinatorJson: z.string().optional().describe("The complete Flow Graph coordinator JSON string"),
            coordinatorJsonFile: z.string().optional().describe("Absolute path to a file containing the Flow Graph coordinator JSON (alternative to inline coordinatorJson)"),
            flowGraphJsonFile: z.string().optional().describe("Alias for coordinatorJsonFile — path to the Flow Graph JSON file"),
            flowGraphJson: z.string().optional().describe("Alias for coordinatorJson — the Flow Graph JSON string"),
            scopeNodeIds: z.array(z.string()).optional().describe("Optional: limit this flow graph to specific node IDs"),
        },
    },
    async ({ sceneName, name, coordinatorJson, coordinatorJsonFile, flowGraphJsonFile, flowGraphJson, scopeNodeIds }) => {
        const resolvedName = name ?? "flowGraph";
        let resolvedJson = coordinatorJson ?? flowGraphJson;
        const resolvedFile = coordinatorJsonFile ?? flowGraphJsonFile;
        if (!resolvedJson && resolvedFile) {
            try {
                resolvedJson = readFileSync(resolvedFile, "utf-8");
            } catch (e) {
                return { content: [{ type: "text", text: `Error reading file: ${(e as Error).message}` }], isError: true };
            }
        }
        if (!resolvedJson) {
            return { content: [{ type: "text", text: "Either coordinatorJson or coordinatorJsonFile must be provided." }], isError: true };
        }
        // Validate that resolvedJson is valid JSON before passing to scene manager
        try {
            JSON.parse(resolvedJson);
        } catch {
            return {
                content: [
                    {
                        type: "text",
                        text:
                            `Error: coordinatorJson must be a valid JSON string. Received a non-JSON value: "${resolvedJson.substring(0, 100)}...". ` +
                            `Use the flow graph MCP server's export_graph_json tool to get the full coordinator JSON, then pass that JSON string here.`,
                    },
                ],
                isError: true,
            };
        }
        const result = manager.attachFlowGraph(sceneName, resolvedName, resolvedJson, scopeNodeIds);
        if (typeof result === "string") {
            return { content: [{ type: "text", text: `Error: ${result}` }], isError: true };
        }
        let msg = `Attached flow graph [${result.id}] "${resolvedName}".${scopeNodeIds?.length ? ` Scoped to: ${scopeNodeIds.join(", ")}` : ""}`;
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
    "remove_physics_body",
    {
        description:
            "Remove the physics body from a mesh, leaving the mesh intact. " +
            "Use this when you want to make a mesh non-physical (e.g., a trigger zone that shouldn't block other objects).",
        inputSchema: {
            sceneName: z.string().describe("Name of the scene"),
            meshId: z.string().describe("Mesh ID or name"),
        },
    },
    async ({ sceneName, meshId }) => {
        const result = manager.removePhysicsBody(sceneName, meshId);
        return {
            content: [{ type: "text", text: result === "OK" ? `Removed physics body from "${meshId}".` : `Error: ${result}` }],
            isError: result !== "OK",
        };
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
            "(meshes, materials, physics, FlowGraph, AND GUI). " +
            "Provide either the inline guiJson string OR a guiJsonFile path (not both).",
        inputSchema: {
            sceneName: z.string().describe("Name of the scene to attach the GUI to"),
            guiJson: z.string().optional().describe("The GUI descriptor JSON string (from the GUI MCP server's export_gui_json)"),
            guiJsonFile: z.string().optional().describe("Absolute path to a file containing the GUI JSON (alternative to inline guiJson)"),
        },
    },
    async ({ sceneName, guiJson, guiJsonFile }) => {
        let jsonStr = guiJson;
        if (!jsonStr && guiJsonFile) {
            try {
                jsonStr = readFileSync(guiJsonFile, "utf-8");
            } catch (e) {
                return { content: [{ type: "text", text: `Error reading file: ${(e as Error).message}` }], isError: true };
            }
        }
        if (!jsonStr) {
            return { content: [{ type: "text", text: "Either guiJson or guiJsonFile must be provided." }], isError: true };
        }
        let parsed: unknown;
        try {
            parsed = JSON.parse(jsonStr);
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
            "Attach a Node Render Graph JSON (from the Node Render Graph MCP server's export_graph_json) to the scene. " +
            "Once attached, the exported code will call NodeRenderGraph.ParseAsync() + buildAsync() to apply the " +
            "custom render pipeline. Only one render graph can be attached at a time; re-calling this " +
            "tool replaces the previous one. " +
            "Provide either the inline nrgJson string OR a nrgJsonFile path (not both).",
        inputSchema: {
            sceneName: z.string().describe("Name of the scene to attach the render graph to"),
            nrgJson: z.string().optional().describe("The NRG JSON string (from the Node Render Graph MCP server's export_graph_json tool)"),
            nrgJsonFile: z.string().optional().describe("Absolute path to a file containing the NRG JSON (alternative to inline nrgJson)"),
        },
    },
    async ({ sceneName, nrgJson, nrgJsonFile }) => {
        let jsonStr = nrgJson;
        if (!jsonStr && nrgJsonFile) {
            try {
                jsonStr = readFileSync(nrgJsonFile, "utf-8");
            } catch (e) {
                return { content: [{ type: "text", text: `Error reading file: ${(e as Error).message}` }], isError: true };
            }
        }
        if (!jsonStr) {
            return { content: [{ type: "text", text: "Either nrgJson or nrgJsonFile must be provided." }], isError: true };
        }
        let parsed: unknown;
        try {
            parsed = JSON.parse(jsonStr);
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
            "Add a procedural mesh to the scene using a Node Geometry JSON (from the Node Geometry MCP server's export_geometry_json). " +
            "The exported code will call NodeGeometry.Parse() + build() + createMesh() to create the mesh at runtime. " +
            "If a mesh with the same name already exists on this scene, it is replaced. " +
            "Provide either the inline ngeJson string OR a ngeJsonFile path (not both).",
        inputSchema: {
            sceneName: z.string().describe("Name of the scene to add the mesh to"),
            meshName: z.string().describe("Name to give the created mesh"),
            ngeJson: z.string().optional().describe("The NGE JSON string (from the Node Geometry MCP server's export_geometry_json tool)"),
            ngeJsonFile: z.string().optional().describe("Absolute path to a file containing the NGE JSON (alternative to inline ngeJson)"),
        },
    },
    async ({ sceneName, meshName, ngeJson, ngeJsonFile }) => {
        let jsonStr = ngeJson;
        if (!jsonStr && ngeJsonFile) {
            try {
                jsonStr = readFileSync(ngeJsonFile, "utf-8");
            } catch (e) {
                return { content: [{ type: "text", text: `Error reading file: ${(e as Error).message}` }], isError: true };
            }
        }
        if (!jsonStr) {
            return { content: [{ type: "text", text: "Either ngeJson or ngeJsonFile must be provided." }], isError: true };
        }
        let parsed: unknown;
        try {
            parsed = JSON.parse(jsonStr);
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

// Gap 30: Accept aliases for collisionCounter
const EventCounterSchema = z.object({
    type: z.literal("eventCounter"),
    textBlockName: z.string().describe("GUI TextBlock name to update"),
    prefix: z.string().describe('Text prefix, e.g. "Score: "'),
});

const ScoreDisplaySchema = z.object({
    type: z.literal("scoreDisplay"),
    textBlockName: z.string().describe("GUI TextBlock name to update"),
    prefix: z.string().describe('Text prefix, e.g. "Score: "'),
});

const PhysicsImpulseSchema = z.object({
    type: z.literal("physicsImpulse"),
    triggerButtonName: z.string().describe("GUI button control name that triggers the throw"),
    meshName: z.string().describe("Mesh name to throw (must have a dynamic physics body)"),
    strength: z.number().describe("Impulse strength (force magnitude)"),
});

const IntegrationSchema = z.discriminatedUnion("type", [
    PhysicsCollisionSchema,
    VariableToPropertySchema,
    GuiButtonSchema,
    CollisionCounterSchema,
    EventCounterSchema,
    ScoreDisplaySchema,
    PhysicsImpulseSchema,
]);

server.registerTool(
    "add_integration",
    {
        description:
            "Add a runtime integration that bridges subsystems together. Integrations generate " +
            "glue code that connects physics, FlowGraph, materials, and GUI at runtime.\n\n" +
            "PREREQUISITES: The referenced meshes, GUI controls, and FlowGraph variables must already exist before adding integrations.\n\n" +
            "Supported integration types:\n" +
            "- **physicsCollision**: When two physics bodies collide, dispatch a FlowGraph custom event. Both meshes must have physics bodies. Provide: meshA, meshB (mesh names), eventName (FlowGraph custom event name).\n" +
            "- **variableToProperty**: Each frame, sync a FlowGraph variable to a mesh material property. Provide: variableName, meshName, propertyPath.\n" +
            "- **guiButton**: When a GUI button is clicked, dispatch a FlowGraph custom event (with optional toggle labels). Provide: buttonName, eventName.\n" +
            "- **collisionCounter** (aliases: **eventCounter**, **scoreDisplay**): Display a running collision count in a GUI TextBlock. Provide: textBlockName, prefix.\n" +
            "- **physicsImpulse**: Apply an impulse to a mesh when a GUI button is clicked. The mesh must have a Dynamic physics body. Provide: triggerButtonName, meshName, strength.",
        inputSchema: {
            sceneName: z.string().describe("Name of the scene"),
            integration: IntegrationSchema.describe("The integration descriptor to add"),
        },
    },
    async ({ sceneName, integration }) => {
        // Gap 30: Normalize integration type aliases to canonical names
        const typeAliases: Record<string, string> = { eventCounter: "collisionCounter", scoreDisplay: "collisionCounter" };
        const normalized = { ...integration };
        if (typeAliases[(normalized as Record<string, unknown>).type as string]) {
            (normalized as Record<string, unknown>).type = typeAliases[(normalized as Record<string, unknown>).type as string];
        }
        const result = manager.addIntegration(sceneName, normalized as Parameters<typeof manager.addIntegration>[1]);
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
        description:
            "Add multiple integrations at once. More efficient than calling add_integration repeatedly. " +
            "Supported types: physicsCollision, variableToProperty, guiButton, collisionCounter (aliases: eventCounter, scoreDisplay), physicsImpulse. " +
            "See add_integration for details on each type.",
        inputSchema: {
            sceneName: z.string().describe("Name of the scene"),
            integrations: z.array(IntegrationSchema).describe("Array of integration descriptors to add"),
        },
    },
    async ({ sceneName, integrations }) => {
        // Gap 30: Normalize integration type aliases
        const typeAliases: Record<string, string> = { eventCounter: "collisionCounter", scoreDisplay: "collisionCounter" };
        const results: string[] = [];
        for (const integ of integrations) {
            const normalized = { ...integ };
            if (typeAliases[(normalized as Record<string, unknown>).type as string]) {
                (normalized as Record<string, unknown>).type = typeAliases[(normalized as Record<string, unknown>).type as string];
            }
            const result = manager.addIntegration(sceneName, normalized as Parameters<typeof manager.addIntegration>[1]);
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
            "Use format='es6' to get ES module code with proper import statements instead of UMD/CDN globals. " +
            "When outputFile is provided, the code is written to disk and only the file path is returned.",
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
            format: z
                .enum(["umd", "es6", "playground"])
                .default("umd")
                .describe(
                    "Output format: 'umd' for CDN/global BABYLON.* style, 'es6' for ES module imports from @babylonjs/*, " +
                        "'playground' for Babylon.js Playground format (export const createScene, no engine setup or render loop)"
                ),
            guiJson: z.string().optional().describe("Optional GUI JSON override. If omitted, the GUI attached via attach_gui is used automatically."),
            enableCollisionCallbacks: z.boolean().default(false).describe("Enable collision callbacks on all physics bodies (needed for collision-driven behaviors)"),
            outputFile: z
                .string()
                .optional()
                .describe("Optional absolute file path. When provided, the code is written to this file and the path is returned instead of the full code."),
        },
    },
    async ({ sceneName, wrapInFunction, functionName, includeHtmlBoilerplate, includeEngineSetup, includeRenderLoop, format, guiJson, enableCollisionCallbacks, outputFile }) => {
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
        if (outputFile) {
            try {
                mkdirSync(dirname(outputFile), { recursive: true });
                writeFileSync(outputFile, code, "utf-8");
                return { content: [{ type: "text", text: `Scene code written to: ${outputFile}` }] };
            } catch (e) {
                return { content: [{ type: "text", text: `Error writing file: ${(e as Error).message}` }], isError: true };
            }
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
            "This generates a full Vite-based TypeScript project using @babylonjs/* ES module imports. " +
            "When outputDir is provided, files are written to that directory on disk.",
        inputSchema: {
            sceneName: z.string().describe("Name of the scene to export"),
            guiJson: z.string().optional().describe("Optional GUI JSON override. If omitted, the GUI attached via attach_gui is used automatically."),
            enableCollisionCallbacks: z.boolean().default(false).describe("Enable collision callbacks on all physics bodies"),
            outputDir: z
                .string()
                .optional()
                .describe("Optional absolute directory path. When provided, all project files are written to this directory and a summary is returned instead of file contents."),
        },
    },
    async ({ sceneName, guiJson, enableCollisionCallbacks, outputDir }) => {
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
        if (outputDir) {
            try {
                for (const [filePath, content] of Object.entries(files)) {
                    const fullPath = join(outputDir, filePath);
                    mkdirSync(dirname(fullPath), { recursive: true });
                    writeFileSync(fullPath, content, "utf-8");
                }
                const fileList = Object.keys(files)
                    .map((f) => `  • ${f}`)
                    .join("\n");
                return { content: [{ type: "text", text: `Wrote ${Object.keys(files).length} project files to ${outputDir}:\n${fileList}` }] };
            } catch (e) {
                return { content: [{ type: "text", text: `Error writing project files: ${(e as Error).message}` }], isError: true };
            }
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
            "Use this JSON export if you have a custom loader or need to re-import the scene later. " +
            "When outputFile is provided, the JSON is written to disk and only the file path is returned.",
        inputSchema: {
            sceneName: z.string().describe("Name of the scene to export"),
            outputFile: z
                .string()
                .optional()
                .describe("Optional absolute file path. When provided, the JSON is written to this file and the path is returned instead of the full JSON."),
        },
    },
    async ({ sceneName, outputFile }) => {
        const json = manager.exportJSON(sceneName);
        if (!json) {
            return { content: [{ type: "text", text: `Scene "${sceneName}" not found.` }], isError: true };
        }
        if (outputFile) {
            try {
                mkdirSync(dirname(outputFile), { recursive: true });
                writeFileSync(outputFile, json, "utf-8");
                return { content: [{ type: "text", text: `Scene JSON written to: ${outputFile}` }] };
            } catch (e) {
                return { content: [{ type: "text", text: `Error writing file: ${(e as Error).message}` }], isError: true };
            }
        }
        return { content: [{ type: "text", text: json }] };
    }
);

server.registerTool(
    "import_scene_json",
    {
        description: "Import a scene descriptor JSON into memory for editing. " + "Provide either the inline json string OR a jsonFile path (not both).",
        inputSchema: {
            sceneName: z.string().describe("Name to give the imported scene"),
            json: z.string().optional().describe("The scene descriptor JSON string"),
            jsonFile: z.string().optional().describe("Absolute path to a file containing the scene descriptor JSON (alternative to inline json)"),
        },
    },
    async ({ sceneName, json, jsonFile }) => {
        let jsonStr = json;
        if (!jsonStr && jsonFile) {
            try {
                jsonStr = readFileSync(jsonFile, "utf-8");
            } catch (e) {
                return { content: [{ type: "text", text: `Error reading file: ${(e as Error).message}` }], isError: true };
            }
        }
        if (!jsonStr) {
            return { content: [{ type: "text", text: "Either json or jsonFile must be provided." }], isError: true };
        }
        const result = manager.importJSON(sceneName, jsonStr);
        if (result !== "OK") {
            return { content: [{ type: "text", text: `Error: ${result}` }], isError: true };
        }
        const desc = manager.describeScene(sceneName);
        return { content: [{ type: "text", text: `Imported successfully.\n\n${desc}` }] };
    }
);

server.registerTool(
    "export_snippet",
    {
        description:
            "Export a code snippet for specific objects or feature categories from a scene. " +
            "Unlike export_scene_code (which generates a complete scene from scratch), this generates " +
            "PARTIAL code designed to be added to an EXISTING Babylon.js scene. " +
            "The snippet does NOT include engine/canvas/scene creation, render loops, or HTML boilerplate. " +
            "It includes a comment header listing the variables that must already exist in the user's code. " +
            "Use this when the user already has a scene and wants to add specific features like shadows, " +
            "physics, animations, post-processing, glow/highlight layers, etc. " +
            "You can select objects by ID, by feature category, or both.",
        inputSchema: {
            sceneName: z.string().describe("Name of the scene to export from"),
            objectIds: z.array(z.string()).optional().describe("Specific object IDs to include (meshes, lights, materials, etc.). Dependencies are resolved automatically."),
            categories: z
                .array(z.enum(["shadows", "physics", "animations", "particles", "postProcessing", "glow", "highlights", "sounds", "materials", "meshes", "lights"]))
                .optional()
                .describe("Feature categories to include. Each pulls in all relevant objects for that feature."),
            format: z.enum(["umd", "es6"]).default("umd").describe("Output format: 'umd' for BABYLON.* globals, 'es6' for @babylonjs/* imports"),
            sceneVarName: z.string().default("scene").describe("Variable name of the existing scene object in the user's code"),
        },
    },
    async ({ sceneName, objectIds, categories, format, sceneVarName }) => {
        if (!objectIds?.length && !categories?.length) {
            return { content: [{ type: "text", text: "At least one of objectIds or categories must be provided." }], isError: true };
        }
        const snippet = manager.exportSnippet(sceneName, {
            objectIds,
            categories,
            format,
            sceneVarName,
        });
        if (!snippet) {
            return { content: [{ type: "text", text: `Scene "${sceneName}" not found.` }], isError: true };
        }
        return { content: [{ type: "text", text: snippet }] };
    }
);

// ═══════════════════════════════════════════════════════════════════════════
//  Tools — Batch operations
// ═══════════════════════════════════════════════════════════════════════════

server.registerTool(
    "add_meshes_batch",
    {
        description:
            "Add multiple meshes at once. More efficient than calling add_mesh repeatedly. " +
            "Same rules as add_mesh apply: primitive options (size, diameter, segments) are immutable after creation. " +
            "Each mesh entry supports the same parameters as add_mesh (name, type, options, transform, physics, materialId).",
        inputSchema: {
            sceneName: z.string().describe("Name of the scene"),
            meshes: z
                .array(
                    z.object({
                        name: z.string(),
                        type: z.string(),
                        options: z.record(z.string(), z.unknown()).optional(),
                        transform: TransformSchema,
                        // Convenience aliases
                        position: Vector3Schema.describe("Shorthand for transform.position"),
                        rotation: Vector3Schema.describe("Shorthand for transform.rotation"),
                        scaling: Vector3Schema.describe("Shorthand for transform.scaling"),
                        parentId: z.string().optional(),
                        materialId: z.string().optional(),
                        material: z.string().optional().describe("Alias for materialId"),
                        physics: PhysicsSchema,
                    })
                )
                .describe("Array of meshes to add"),
        },
    },
    async ({ sceneName, meshes }) => {
        const results: string[] = [];
        for (const m of meshes) {
            // Merge convenience aliases
            const mergedTransform: Record<string, unknown> = { ...((m.transform as Record<string, unknown>) || {}) };
            if (m.position !== undefined) {
                mergedTransform.position = m.position;
            }
            if (m.rotation !== undefined) {
                mergedTransform.rotation = m.rotation;
            }
            if (m.scaling !== undefined) {
                mergedTransform.scaling = m.scaling;
            }
            const resolvedMaterialId = m.materialId || m.material;

            const result = manager.addMesh(
                sceneName,
                m.name,
                m.type,
                m.options as Record<string, unknown>,
                Object.keys(mergedTransform).length > 0 ? mergedTransform : undefined,
                m.parentId,
                resolvedMaterialId
            );
            if (typeof result === "string") {
                results.push(`Error adding "${m.name}": ${result}`);
            } else {
                let line = `[${result.id}] "${m.name}" (${m.type})`;
                // Inline physics body
                if (m.physics) {
                    const pResult = manager.addPhysicsBody(sceneName, result.id, m.physics.bodyType, m.physics.shapeType, {
                        mass: m.physics.mass,
                        friction: m.physics.friction,
                        restitution: m.physics.restitution,
                        linearDamping: m.physics.linearDamping,
                        angularDamping: m.physics.angularDamping,
                        isTrigger: m.physics.isTrigger,
                    });
                    line += pResult === "OK" ? ` + physics (${m.physics.shapeType})` : ` [physics error: ${pResult}]`;
                }
                results.push(line);
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

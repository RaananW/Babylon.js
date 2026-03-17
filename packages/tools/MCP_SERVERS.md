# Babylon.js MCP Servers — Implementation Tracker

> This file tracks the status of all Babylon.js MCP servers.
> Update the status column as work progresses.

## Status Legend

| Symbol | Meaning                 |
| ------ | ----------------------- |
| ✅     | Implemented and working |
| 🚧     | In progress             |
| ❌     | Not started             |

## MCP Servers

| #   | Server                | Directory                       | Status | Description                                                                                                                                                                                                                                     |
| --- | --------------------- | ------------------------------- | ------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | **Node Material**     | `nme-mcp-server/`               | ✅     | Create and edit Node Materials via the node graph. Export NME JSON for use in the Scene MCP.                                                                                                                                                    |
| 2   | **Flow Graph**        | `flow-graph-mcp-server/`        | ✅     | Build visual scripting Flow Graphs. Export coordinator JSON for use in the Scene MCP.                                                                                                                                                           |
| 3   | **Scene**             | `scene-mcp-server/`             | ✅     | Orchestrator — full 3D scene assembly: meshes, cameras, lights, materials, models, animations, physics (bodies + constraints), audio, particles, post-processing, glow/highlight layers, flow graphs. Exports runnable TypeScript code or JSON. |
| 4   | **Node Geometry**     | `nge-mcp-server/`               | ✅     | Create procedural geometry via the Node Geometry graph system. 17 tools. Mirrors Node Material pattern — add geometry nodes, connect ports, set parameters, validate, export NGE JSON.                                                          |
| 5   | **Node Render Graph** | `node-render-graph-mcp-server/` | ✅     | Build custom render pipelines via the Node Render Graph. 17 tools. Add Input/Output/renderer/post-process/layer blocks, wire ports, set properties, validate, export NRG JSON. Scene MCP consumes output via `attach_node_render_graph`.        |
| 6   | **Node Particles**    | `node-particle-mcp-server/`     | ❌     | Create GPU particle systems via the Node Particle graph editor.                                                                                                                                                                                 |
| 7   | **GUI**               | `gui-mcp-server/`               | ✅     | Build 2D UI layouts using the Babylon.js GUI system (AdvancedDynamicTexture, controls, layout). 22 tools. Standalone — not part of the Scene MCP.                                                                                               |
| 8   | **Smart Filters**     | `smart-filters-mcp-server/`     | ❌     | Create post-processing smart filter graphs for the Smart Filters system.                                                                                                                                                                        |
| 9   | **glTF**              | `gltf-mcp-server/`              | ❌     | Read, analyze, and modify glTF/glb assets using Babylon.js loaders and serializers. Inspect structure, edit nodes/meshes/materials/animations, add or modify extensions, validate, and re-export.                                               |
| 10  | **Playground**        | `playground-mcp-server/`        | ✅     | AI-driven code editing for Babylon.js Playgrounds. Create, read, modify, and push playground code. Live session bridge via SSE for real-time sync with the Playground editor.                                                                   |

## Architecture

```
┌──────────────────────────────────────────────────────┐
│                   Scene MCP (orchestrator)           │
│  meshes, cameras, lights, physics, audio, particles, │
│  post-process, glow, highlight, environment          │
│                                                      │
│  Consumes output from:                               │
│    ├── Node Material MCP ───→ NME JSON (materials)     │
│    ├── Flow Graph MCP ─────→ Coordinator JSON (logic)│
│    ├── Node Geometry MCP ───→ NGE JSON (geometry)     │
│    ├── Node Render Graph ──→ NRG JSON (render pipe)  │
│    ├── Node Particles ─────→ JSON (GPU particles)    │
│    └── GUI MCP ────────────→ GUI JSON (2D UI overlay)│
│                                                      │
│  Standalone (no Scene integration):                  │
│    ├── Smart Filters MCP (post-process filters)      │
│    └── glTF MCP (read/analyze/modify glTF assets)    │
└──────────────────────────────────────────────────────┘
```

### Cross-Server Data Transfer

Each producing MCP server (NME, NGE, NRG, Flow Graph, GUI) generates JSON that the Scene MCP consumes. By default the JSON is returned inline through the LLM conversation — but for complex graphs this can be 10–50 KB+ of tokens that the LLM passes through without adding value.

#### File-Based Handoff (implemented)

All export tools accept an optional **`outputFile`** parameter. All import/attach tools accept a corresponding **`*File`** parameter (e.g. `nmeJsonFile`, `coordinatorJsonFile`, `guiJsonFile`, `nrgJsonFile`, `ngeJsonFile`, `jsonFile`).

```
┌──────────────┐     file path only     ┌──────────────┐
│ Node Material  │ ── outputFile ──────→  │  Scene MCP   │
│ MCP            │    /tmp/bjs/mat.json   │  add_material│
│  material_   │                        │  (nmeJsonFile)│
│  json        │                        │              │
└──────────────┘                        └──────────────┘
       │  writes JSON to disk                  │ reads JSON from disk
       ▼                                       ▼
  /tmp/bjs/mat.json ──────────────────────────────
```

**Workflow:**

1. Producing server: call export tool with `outputFile: "/tmp/babylon-mcp/myMaterial.json"`
2. The tool writes JSON to disk and returns only the file path (tiny token footprint)
3. Scene MCP: call import/attach tool with `nmeJsonFile: "/tmp/babylon-mcp/myMaterial.json"`
4. The tool reads JSON from disk — it never enters the LLM context window

**Applies to all handoff points:**

| From               | Export tool w/ `outputFile` | Scene MCP tool w/ `*File` param             |
| ------------------ | --------------------------- | ------------------------------------------- |
| NME → Scene        | `export_material_json`      | `add_material` (`nmeJsonFile`)              |
| Flow Graph → Scene | `export_graph_json`         | `attach_flow_graph` (`coordinatorJsonFile`) |
| GUI → Scene        | `export_gui_json`           | `attach_gui` (`guiJsonFile`)                |
| NRG → Scene        | `export_graph_json`         | `attach_node_render_graph` (`nrgJsonFile`)  |
| NGE → Scene        | `export_geometry_json`      | `add_node_geometry_mesh` (`ngeJsonFile`)    |

Each server's own `import_*_json` tool also accepts `jsonFile` as an alternative to inline `json`.

#### Future: Single Composite Process with Shared Memory (Option 3C)

> **Status**: Considered for future — not yet implemented.

Instead of separate server processes exchanging JSON (even via files), all MCP servers could be merged into a **single Node.js process** with all tools under namespaced prefixes (`nme_*`, `scene_*`, `gui_*`, etc.). Internal state would live in a shared `Map`:

```typescript
// Shared across all sub-servers in the same process
const sharedStore = new Map<string, unknown>();

// NME export tool
const key = `nme:${materialName}:${Date.now()}`;
sharedStore.set(key, graphData); // No JSON.stringify!
return { ref: key };

// Scene add_material tool
if (nmeRef) {
    const graphData = sharedStore.get(nmeRef); // No JSON.parse!
    scene.materials.push({ ...mat, graphData });
}
```

**Pros:**

- Zero serialization overhead, zero file I/O, zero tokens consumed, zero latency
- Simplifies deployment — single server binary
- Natural namespacing via existing tool prefixes

**Cons / Concerns:**

- **Tool count explosion** — merging ~120+ tools into one server catalog may overwhelm some MCP clients or models. Context window pressure from tool descriptions alone becomes a concern.
- Loses clean separation of independent servers — harder to develop/test in isolation.
- Requires significant refactoring of server initialization code.

The tool-count concern is the primary blocker. If MCP clients gain support for tool pagination, lazy tool loading, or hierarchical tool namespaces, this approach becomes more viable.

#### Future: MCP Server-to-Server Communication (Option 5)

> **Status**: Awaiting MCP protocol evolution — ideal long-term solution.

The MCP specification is evolving toward enabling **agentic compositions** where servers can invoke tools on other servers directly:

- **Server-to-server tool invocation** — the Scene MCP could call `nme.export_material_json()` directly without the LLM mediating
- **Streamable HTTP transport** — better suited for large payloads than stdio
- **Composite servers** — a single MCP endpoint that multiplexes independent sub-servers internally, with the protocol handling tool namespace isolation

When this lands, the workflow becomes:

```
LLM: "attach this material to the scene"
  → Scene MCP (server-to-server): calls Node Material MCP's export_material_json
  → Scene MCP: receives JSON directly, stores it internally
  → Scene MCP: returns confirmation to LLM
```

The LLM never sees the JSON at all. This is the **best possible solution** because:

- Zero token overhead (the LLM orchestrates but doesn't relay data)
- Each server stays independent (no 3C tool-count problem)
- No file system involvement
- Works across machines / network boundaries

**This is the recommended long-term direction.** File-based handoff (above) serves as the practical solution until the protocol supports this.

## Implementation Notes

### Implemented

- **Node Material MCP**: Full node graph builder — add blocks, connect ports, set properties, validate, export JSON. The Scene MCP can import NME JSON via `add_material` with `type: NodeMaterial`.
- **Flow Graph MCP**: Event nodes, logic nodes, variable management. The Scene MCP consumes coordinator JSON via `attach_flow_graph`.
- **Scene MCP**: 60+ tools covering scene lifecycle, environment, cameras, lights, materials, textures, meshes, transform nodes, hierarchy, models, animations, animation groups, physics bodies, physics constraints, audio (V2), classic/GPU particles, render pipeline (bloom, DOF, FXAA, etc.), glow layers, highlight layers, flow graph attachment, node render graph attachment, query/describe, validation, import/export (JSON + runnable code).
- **Node Render Graph MCP** (`babylonjs-node-render-graph`): 17 tools for building custom render pipelines via the NRGE block graph. Blocks include: InputBlock (texture, camera, objectList, shadowLight, …), OutputBlock, ClearBlock, CopyTextureBlock, ObjectRendererBlock, GeometryRendererBlock, ShadowGeneratorBlock, CsmShadowGeneratorBlock, CullObjectsBlock, 15+ post-process blocks (Bloom, Blur, FXAA, Sharpen, ChromaticAberration, Grain, BlackAndWhite, Tonemap, DOF, SSR, SSAO2, TAA, MotionBlur, ImageProcessing, ColorCorrection, …), GlowLayerBlock, HighlightLayerBlock, SelectionOutlineLayerBlock, and 6 utility blocks. Exports NRGE-compatible JSON; Scene MCP consumes it via `attach_node_render_graph`.

### To Implement

- **Node Geometry MCP**: Should mirror the Node Material MCP pattern — add geometry nodes, connect ports, set parameters, validate, export NGE JSON. The Scene MCP would consume NG JSON to create procedural meshes.
- **Node Particles MCP**: Node-graph builder for GPU particle systems. Output consumed by Scene MCP as an alternative to the classic particle system tools.
- **GUI MCP**: _(see below)_
- **Smart Filters MCP**: Smart filter graph builder — block catalog, connection system, export filter JSON.

### Implemented — GUI MCP

- **22 tools**: create/delete/list GUIs, add/remove/reparent controls, set properties, Grid row/column management (add/set/remove + batch setup_grid), describe GUI/control, validate, export/import JSON, batch add controls, list/get control type info.
- **3 resources**: control-catalog, base-properties, enums.
- **3 prompts**: create-hud, create-menu, create-dialog.
- **Control catalog**: Container, Rectangle, Ellipse, StackPanel, Grid, ScrollViewer, TextBlock, InputText, InputPassword, InputTextArea, Button, FocusableButton, ToggleButton, Checkbox, RadioButton, ColorPicker, Slider, ImageBasedSlider, Image, Line, DisplayGrid, VirtualKeyboard.
- **Export format**: Native `AdvancedDynamicTexture.parseSerializedObject()` JSON (`{ root: { ... }, width, height }`).
- **GUI MCP**: Standalone server for 2D GUI layout. Should support creating AdvancedDynamicTexture, adding controls (Button, TextBlock, Slider, Image, StackPanel, Grid, etc.), setting properties, layout, and export. The Scene MCP can reference GUI output for fullscreen or texture-based GUI.
- **Smart Filters MCP**: Node-graph builder for real-time post-processing filter chains. Standalone, does not feed into Scene MCP.

### To Implement — glTF MCP

A standalone MCP server for reading, analyzing, and modifying glTF/glb assets using Babylon.js's loader (`@babylonjs/loaders`) and serializer (`@babylonjs/serializers`) infrastructure.

**Core capabilities:**

1. **Load & Parse** — Load `.gltf` (JSON + separate bins/textures) and `.glb` (binary container) files. Expose the parsed structure as an in-memory document.
2. **Inspect / Analyze**
    - List and describe scenes, nodes, meshes, accessors, buffer views, materials, textures, images, samplers, animations, skins, cameras.
    - Summarize hierarchy (node tree), polygon counts, bounding boxes, material assignments.
    - List active extensions and extras at every level.
3. **Edit / Modify**
    - Rename nodes, meshes, materials, animations.
    - Set material properties (PBR metallic-roughness values, alpha mode, double-sided, etc.).
    - Transform nodes (translation, rotation, scale).
    - Add, replace, or remove textures/images.
    - Add or remove nodes and re-parent hierarchy.
    - Merge meshes, split primitives.
    - Add or remove animation channels/samplers.
4. **Extensions**
    - List supported extensions (`extensionsUsed`, `extensionsRequired`).
    - Add, modify, or remove extension data on any glTF object (root, node, mesh, material, texture, etc.).
    - First-class support for common extensions: `KHR_materials_unlit`, `KHR_draco_mesh_compression`, `KHR_texture_basisu`, `KHR_lights_punctual`, `KHR_materials_variants`, `KHR_materials_transmission`, `KHR_materials_volume`, `KHR_materials_ior`, `KHR_materials_clearcoat`, `KHR_materials_sheen`, `KHR_materials_specular`, `KHR_materials_emissive_strength`, `KHR_materials_iridescence`, `KHR_materials_anisotropy`, `MSFT_lod`, `EXT_meshopt_compression`, etc.
5. **Validate** — Run glTF validation (schema + semantic checks), report errors and warnings.
6. **Export / Serialize** — Re-export the modified asset as `.gltf` (with separate resources) or `.glb` using Babylon.js serializers. Round-trip fidelity is a goal.

**Planned tool categories:**

| Category         | Example tools                                                                             |
| ---------------- | ----------------------------------------------------------------------------------------- |
| Lifecycle        | `load_gltf`, `create_gltf`, `list_gltfs`, `delete_gltf`                                   |
| Inspect          | `describe_gltf`, `describe_node`, `describe_mesh`, `describe_material`, `list_extensions` |
| Edit – Nodes     | `add_node`, `remove_node`, `set_node_transform`, `reparent_node`, `rename_node`           |
| Edit – Meshes    | `add_mesh`, `remove_mesh`, `merge_meshes`, `describe_mesh_primitives`                     |
| Edit – Materials | `add_material`, `remove_material`, `set_material_properties`, `assign_material`           |
| Edit – Textures  | `add_texture`, `remove_texture`, `replace_image`, `set_sampler`                           |
| Edit – Animation | `add_animation`, `remove_animation`, `describe_animation`, `set_animation_properties`     |
| Extensions       | `add_extension`, `remove_extension`, `set_extension_data`, `list_supported_extensions`    |
| Validate         | `validate_gltf`                                                                           |
| Export           | `export_gltf`, `export_glb`                                                               |

**Design notes:**

- Uses a headless Babylon.js `NullEngine` to load glTF via `SceneLoader` and the full extension pipeline, giving access to parsed Babylon objects rather than raw JSON manipulation.
- Serializes back to glTF using `GLTF2Export` from `@babylonjs/serializers`.
- Designed as standalone — does not feed into Scene MCP, but can complement it (e.g., prepare a glTF asset, then reference the exported file in Scene MCP's `add_model`).
- Multiple documents can be open simultaneously (keyed by ID), similar to other MCP servers.
- Should surface diagnostics from the Babylon.js loader (missing textures, unsupported extensions, etc.).

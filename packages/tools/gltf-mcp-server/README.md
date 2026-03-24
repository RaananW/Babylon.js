# @tools/gltf-mcp-server

MCP server for glTF 2.0 asset authoring, inspection, validation, and live preview in Babylon.js.

## Overview

This server provides a comprehensive tool surface for working with glTF/GLB assets entirely in memory. It supports loading, creating, inspecting, editing, validating, previewing, and exporting glTF documents through the Model Context Protocol (MCP).

The server operates **entirely on raw glTF JSON** — no Babylon.js engine, scene, or loader runs server-side. All edits are direct mutations on the `IGLTF` document object (from `glTF2Interface`). The only Babylon.js dependency is in the optional built-in viewer page, which loads Babylon from CDN in the browser for rendering.

**Binary name:** `babylonjs-gltf`

## Build & Run

```bash
# Build
npm run build -w @tools/gltf-mcp-server

# Run
npm start -w @tools/gltf-mcp-server

# Or directly
npx babylonjs-gltf
```

## Tool Categories

### 1. Lifecycle (6 tools)

- `create_gltf` — Create a minimal valid glTF 2.0 document
- `load_gltf` — Load from inline JSON or file path
- `list_gltfs` — List all documents in memory
- `delete_gltf` — Remove a document from memory
- `clone_gltf` — Deep-clone a document under a new name

### 2. Inspection & Data Access (19 tools)

- `describe_gltf` — Full document summary: metadata, counts, extensions, warnings
- `describe_scene`, `describe_node`, `describe_mesh`, `describe_material`, `describe_animation`, `describe_skin`, `describe_texture`, `describe_image`, `describe_accessor`, `describe_sampler` — Detailed per-object descriptions
- `read_accessor_data` — Decode binary accessor data into a flat float array (handles stride, normalization, and component type conversion using Babylon.js core buffer utilities)
- `list_scenes`, `list_nodes`, `list_meshes`, `list_materials`, `list_animations`, `list_textures`, `list_extensions` — Listing/summary tools

### 3. Node & Scene Editing (11 tools)

- `add_scene`, `rename_scene`, `set_active_scene`
- `add_node`, `rename_node`, `add_child_node`
- `set_node_transform` (TRS), `set_node_matrix` (4×4), `clear_node_transform`
- `reparent_node` (with cycle detection)
- `remove_node`

### 4. Mesh & Primitive Editing (7 tools)

- `add_mesh`, `remove_mesh`
- `assign_mesh_to_node`, `unassign_mesh_from_node`
- `describe_mesh_primitives`
- `set_primitive_material`, `remove_primitive_material`

### 5. Material Editing (9 tools)

- `add_material`, `remove_material`, `rename_material`
- `set_material_pbr` (baseColorFactor, metallicFactor, roughnessFactor, textures)
- `set_material_alpha_mode` (OPAQUE/MASK/BLEND)
- `set_material_double_sided`
- `set_material_emissive`
- `assign_material_to_mesh_primitive`

### 6. Texture/Image/Sampler (7 tools)

- `add_image_reference`, `remove_image`
- `add_texture`, `remove_texture`, `set_texture_sampler`
- `add_sampler`, `remove_sampler`

### 7. Animation & Skin (5 tools)

- `list_animation_channels`, `describe_animation_channel`
- `rename_animation`, `remove_animation`
- `remove_skin`

### 8. Extension Handling (8 tools)

- `get_extension_data`, `set_extension_data`, `remove_extension_data`
- `add_extension_to_used`, `add_extension_to_required`
- `remove_extension_from_used`, `remove_extension_from_required`

Extension data supports targets: root, scene, node, mesh, material, texture, image, animation.

### 9. Validation (1 tool)

- `validate_gltf` — Checks broken indices, invalid hierarchy, orphaned references, extension consistency, TRS/matrix conflicts, duplicate names

### 10. Import/Export (6 tools)

- `export_gltf_json` — Export as JSON (inline or to file)
- `import_gltf_json` — Import from JSON (inline or file)
- `import_glb` — Import a binary `.glb` file from disk
- `export_glb` — Export as binary GLB (with proper BIN chunk for buffers/images)
- `save_to_file` — Save as .gltf or .glb based on extension
- `compact_indices` — Renumber all indices after removing elements to close gaps

When loading `.gltf` files from disk, external buffers (`.bin`) and images (`.png`, `.jpg`) are automatically resolved and embedded as base64 data URIs, so the document is fully self-contained in memory.

### 11. Search/Discovery (4 tools)

- `find_nodes`, `find_materials`, `find_meshes` — Name search (substring or exact)
- `find_extensions` — Search used extensions

### 12. Live Preview (4 tools)

- `start_preview` — Start a local HTTP server with a built-in 3D viewer
- `stop_preview` — Stop the preview server
- `get_preview_url` — Get the current viewer and Sandbox URLs
- `set_preview_scene` — Switch which document is being previewed

The preview server at `http://localhost:8766/` serves a self-contained viewer page that loads Babylon.js from CDN and fetches the model from the same server (same-origin). It also provides direct GLB/JSON download endpoints and an "Open in Sandbox" link. The model is re-exported on every request, so refreshing the page always shows the latest state.

**Total: 88 tools**

## Example Workflows

### Create and export a scene

```
1. create_gltf(name: "MyScene")
2. add_node(name: "MyScene", nodeName: "Cube")
3. add_mesh(name: "MyScene", meshName: "CubeMesh")
4. assign_mesh_to_node(name: "MyScene", nodeIndex: 0, meshIndex: 0)
5. add_material(name: "MyScene", materialName: "BlueMetal")
6. set_material_pbr(name: "MyScene", materialIndex: 0, baseColorFactor: [0.2, 0.4, 0.8, 1], metallicFactor: 0.9, roughnessFactor: 0.3)
7. set_primitive_material(name: "MyScene", meshIndex: 0, primitiveIndex: 0, materialIndex: 0)
8. set_node_transform(name: "MyScene", nodeIndex: 0, translation: [0, 1, 0])
9. validate_gltf(name: "MyScene")
10. export_gltf_json(name: "MyScene", outputFile: "/path/to/scene.gltf")
```

### Load, edit, and preview an existing model

```
1. load_gltf(name: "Helmet", jsonFile: "/path/to/FlightHelmet.gltf")
   — External .bin and image files are auto-resolved
2. list_materials(name: "Helmet")
3. set_material_pbr(name: "Helmet", materialIndex: 0, baseColorFactor: [0.1, 0.95, 0.1, 1])
4. start_preview(name: "Helmet")
   — Opens built-in viewer at http://localhost:8766/
5. set_material_emissive(name: "Helmet", materialIndex: 2, emissiveFactor: [1, 0, 0])
   — Refresh the viewer to see changes
6. export_glb(name: "Helmet", outputFile: "/path/to/modified.glb")
```

## Limitations & Follow-Up Items

- **Binary buffer reading**: Buffer data can be read via `read_accessor_data` (positions, normals, UVs, indices, animation keyframes, etc.) but writing/creating new accessor data is not yet supported. Meshes added via `add_mesh` have empty attribute maps.
- **Animation authoring**: Animation channels/samplers can be inspected and their keyframe data read via `read_accessor_data`, but creating new animation data is not yet supported.
- **Skin authoring**: Skins can be inspected and removed but not created from scratch.

## Architecture

- `src/gltfManager.ts` — Core in-memory document manager (~2200 lines). Stores `IGLTF` documents in a `Map`, provides all CRUD operations, handles external buffer/image resolution on load, and assembles GLB binary output.
- `src/previewServer.ts` — Singleton HTTP server for live preview. Serves a built-in Babylon.js viewer page, GLB/JSON model endpoints, and a Sandbox redirect URL. Handles cache busting and session cleanup.
- `src/index.ts` — MCP server entrypoint. Registers 87 tools, wires up transport lifecycle handlers (cleanup on close/exit).
- `test/unit/gltfManager.test.ts` — Unit tests for the document manager
- `test/unit/previewServer.test.ts` — Unit tests for the preview server

### Key Design Decisions

- **Minimal engine dependency**: The server never instantiates a Babylon `Engine`, `Scene`, or `SceneSerializer`. All operations are pure JSON manipulation on `IGLTF` objects. The only import from `@dev/core` is the `bufferUtils` module (and its lightweight dependencies `Constants` and `Logger`), which provides binary accessor data decoding — type-aware TypedArray construction, byte stride handling, and normalization. Rollup tree-shakes the rest of core out of the bundle.
- **ESM module**: Uses dynamic `await import("node:fs")` / `await import("node:path")` for file operations (no `require()`).
- **External buffer resolution**: When loading a `.gltf` from disk, all referenced `.bin` buffers and image files are read and converted to `data:` URIs so the document is fully self-contained.
- **GLB export**: Manually assembles the GLB binary (12-byte header + JSON chunk + BIN chunk with 4-byte alignment padding). Decodes data-URI buffers into raw bytes for the BIN chunk.
- **Preview architecture**: The viewer page loads Babylon.js + glTF loader from CDN, fetches `/model.glb` from the same local server (same-origin, no CORS issues). A refresh button and "Open in Sandbox" link are embedded in the page.

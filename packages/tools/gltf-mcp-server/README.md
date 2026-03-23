# @tools/gltf-mcp-server

MCP server for glTF 2.0 asset authoring, inspection, validation, and export in Babylon.js.

## Overview

This server provides a comprehensive tool surface for working with glTF/GLB assets entirely in memory. It supports loading, creating, inspecting, editing, validating, and exporting glTF documents through the Model Context Protocol (MCP).

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

### 2. Inspection (18 tools)

- `describe_gltf` — Full document summary: metadata, counts, extensions, warnings
- `describe_scene`, `describe_node`, `describe_mesh`, `describe_material`, `describe_animation`, `describe_skin`, `describe_texture`, `describe_image`, `describe_accessor`, `describe_sampler` — Detailed per-object descriptions
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

### 10. Import/Export (5 tools)

- `export_gltf_json` — Export as JSON (inline or to file)
- `import_gltf_json` — Import from JSON (inline or file)
- `export_glb` — Export as binary GLB file
- `save_to_file` — Save as .gltf or .glb based on extension

### 11. Search/Discovery (4 tools)

- `find_nodes`, `find_materials`, `find_meshes` — Name search (substring or exact)
- `find_extensions` — Search used extensions

**Total: 81 tools**

## Example Workflow

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

## Limitations & Follow-Up Items

- **Binary buffer data**: The server manages glTF JSON structure but does not create accessor/buffer data for geometry vertices. Meshes added via `add_mesh` have empty attribute maps. Full geometry authoring requires importing existing accessor data.
- **GLB import**: Loading .glb files (binary import) is not yet supported. GLB export works for JSON-only content.
- **Animation authoring**: Animation channels/samplers can be inspected and removed, but creating new animation data (keyframes, accessors) is not yet supported.
- **Skin authoring**: Skins can be inspected and removed but not created from scratch.
- **Buffer-backed images**: Only URI-backed image references are supported for now.
- **Index compaction**: Removing objects nullifies their array slot to preserve referential integrity. A future `compact_indices` tool could renumber all references.

## Architecture

- `src/gltfTypes.ts` — Minimal glTF 2.0 type definitions
- `src/gltfManager.ts` — Core in-memory document manager with all operations
- `src/index.ts` — MCP server entrypoint with tool/resource/prompt registration
- `test/unit/gltfManager.test.ts` — Unit tests for the manager

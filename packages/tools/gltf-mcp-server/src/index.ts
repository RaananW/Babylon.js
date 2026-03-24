#!/usr/bin/env node

/**
 * Babylon.js glTF MCP Server
 *
 * Provides a rich MCP tool surface for loading, inspecting, editing,
 * validating, and exporting glTF 2.0 assets in memory.
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod/v4";
import {
    CreateTextResponse,
    CreateErrorResponse,
    CreateJsonExportResponse,
    CreateJsonImportSummaryResponse,
    CreateOutputFileSchema,
    CreateInlineJsonSchema,
    CreateJsonFileSchema,
    WriteTextFileEnsuringDirectory,
} from "@tools/mcp-server-core";

import { GltfManager } from "./gltfManager.js";
import { startPreview, stopPreview, isPreviewRunning, getPreviewServerUrl, getSandboxUrl, getPreviewDocName, setPreviewDocument } from "./previewServer.js";

/* ------------------------------------------------------------------ */
/*  Singleton manager                                                  */
/* ------------------------------------------------------------------ */

const Manager = new GltfManager();

/* ------------------------------------------------------------------ */
/*  Server setup                                                       */
/* ------------------------------------------------------------------ */

const Server = new McpServer(
    { name: "babylonjs-gltf", version: "1.0.0" },
    {
        instructions: [
            "You build and edit glTF 2.0 assets in memory.",
            "Workflow: create_gltf or load_gltf → inspect with describe/list tools → edit nodes, meshes, materials, textures → validate_gltf → export_gltf_json or export_glb.",
            "All documents are identified by a unique name string.",
            "Node/mesh/material indices are 0-based and match the glTF arrays.",
            "Use set_extension_data for arbitrary extension payloads on any target type.",
            "Always validate before exporting to catch broken references.",
        ].join(" "),
    }
);

/* ------------------------------------------------------------------ */
/*  Shared schemas                                                     */
/* ------------------------------------------------------------------ */

const NameSchema = z.string().describe("Name of the glTF document in memory.");
const NodeIndexSchema = z.number().describe("0-based node index.");
const MeshIndexSchema = z.number().describe("0-based mesh index.");
const MaterialIndexSchema = z.number().describe("0-based material index.");
const TextureIndexSchema = z.number().describe("0-based texture index.");
const ImageIndexSchema = z.number().describe("0-based image index.");
const SamplerIndexSchema = z.number().describe("0-based sampler index.");
const SceneIndexSchema = z.number().describe("0-based scene index.");
const AnimIndexSchema = z.number().describe("0-based animation index.");
const SkinIndexSchema = z.number().describe("0-based skin index.");
const AccessorIndexSchema = z.number().describe("0-based accessor index.");
const ExtensionTargetSchema = z.enum(["root", "scene", "node", "mesh", "material", "texture", "image", "animation"]).describe("Extension target type.");

/* ================================================================== */
/*  1. Lifecycle tools                                                 */
/* ================================================================== */

Server.registerTool(
    "create_gltf",
    {
        description: "Create a new minimal valid glTF 2.0 document in memory.",
        inputSchema: { name: NameSchema },
    },
    async ({ name }) => CreateTextResponse(Manager.createGltf(name))
);

Server.registerTool(
    "load_gltf",
    {
        description: "Load a glTF JSON document into memory from inline JSON or a file path.",
        inputSchema: {
            name: NameSchema,
            json: CreateInlineJsonSchema(z, "Inline glTF JSON text."),
            jsonFile: CreateJsonFileSchema(z, "Absolute path to a .gltf JSON file."),
        },
    },
    async ({ name, json, jsonFile }) => {
        const result = CreateJsonImportSummaryResponse({
            json,
            jsonFile,
            fileDescription: "glTF file",
            importJson: (text) => {
                Manager.loadGltf(name, text);
                return name;
            },
            createSuccessText: () => Manager.describeGltf(name),
        });

        // If loaded from a file, resolve external buffer/image URIs
        if (jsonFile && !result.content[0]?.text?.startsWith("Error")) {
            const { dirname } = await import("node:path");
            await Manager.resolveExternalBuffers(name, dirname(jsonFile));
        }

        return result;
    }
);

Server.registerTool(
    "list_gltfs",
    {
        description: "List all glTF documents currently in memory.",
        inputSchema: {},
    },
    async () => CreateTextResponse(Manager.listGltfs())
);

Server.registerTool(
    "delete_gltf",
    {
        description: "Delete a glTF document from memory.",
        inputSchema: { name: NameSchema },
    },
    async ({ name }) => {
        const result = Manager.deleteGltf(name);
        return result.startsWith("Error") ? CreateErrorResponse(result) : CreateTextResponse(result);
    }
);

Server.registerTool(
    "clone_gltf",
    {
        description: "Deep-clone a glTF document under a new name.",
        inputSchema: {
            sourceName: z.string().describe("Name of the document to clone."),
            newName: z.string().describe("Name for the cloned document."),
        },
    },
    async ({ sourceName, newName }) => {
        const result = Manager.cloneGltf(sourceName, newName);
        return result.startsWith("Error") ? CreateErrorResponse(result) : CreateTextResponse(result);
    }
);

/* ================================================================== */
/*  2. Inspection tools                                                */
/* ================================================================== */

Server.registerTool(
    "describe_gltf",
    {
        description: "Summarize a glTF document: asset metadata, counts, extensions, and structural warnings.",
        inputSchema: { name: NameSchema },
    },
    async ({ name }) => {
        const result = Manager.describeGltf(name);
        return result.startsWith("Error") ? CreateErrorResponse(result) : CreateTextResponse(result);
    }
);

Server.registerTool(
    "describe_scene",
    {
        description: "Describe a scene by index: root nodes, active status, extensions.",
        inputSchema: { name: NameSchema, sceneIndex: SceneIndexSchema },
    },
    async ({ name, sceneIndex }) => {
        const result = Manager.describeScene(name, sceneIndex);
        return result.startsWith("Error") ? CreateErrorResponse(result) : CreateTextResponse(result);
    }
);

Server.registerTool(
    "describe_node",
    {
        description: "Describe a node: parent, children, mesh, transform, extensions.",
        inputSchema: { name: NameSchema, nodeIndex: NodeIndexSchema },
    },
    async ({ name, nodeIndex }) => {
        const result = Manager.describeNode(name, nodeIndex);
        return result.startsWith("Error") ? CreateErrorResponse(result) : CreateTextResponse(result);
    }
);

Server.registerTool(
    "describe_mesh",
    {
        description: "Describe a mesh: primitives, attributes, material assignments.",
        inputSchema: { name: NameSchema, meshIndex: MeshIndexSchema },
    },
    async ({ name, meshIndex }) => {
        const result = Manager.describeMesh(name, meshIndex);
        return result.startsWith("Error") ? CreateErrorResponse(result) : CreateTextResponse(result);
    }
);

Server.registerTool(
    "describe_material",
    {
        description: "Describe a material: PBR properties, textures, alpha mode, extensions.",
        inputSchema: { name: NameSchema, materialIndex: MaterialIndexSchema },
    },
    async ({ name, materialIndex }) => {
        const result = Manager.describeMaterial(name, materialIndex);
        return result.startsWith("Error") ? CreateErrorResponse(result) : CreateTextResponse(result);
    }
);

Server.registerTool(
    "describe_animation",
    {
        description: "Describe an animation: channels, samplers, target nodes and paths.",
        inputSchema: { name: NameSchema, animationIndex: AnimIndexSchema },
    },
    async ({ name, animationIndex }) => {
        const result = Manager.describeAnimation(name, animationIndex);
        return result.startsWith("Error") ? CreateErrorResponse(result) : CreateTextResponse(result);
    }
);

Server.registerTool(
    "describe_skin",
    {
        description: "Describe a skin: joints, skeleton root, inverse bind matrices.",
        inputSchema: { name: NameSchema, skinIndex: SkinIndexSchema },
    },
    async ({ name, skinIndex }) => {
        const result = Manager.describeSkin(name, skinIndex);
        return result.startsWith("Error") ? CreateErrorResponse(result) : CreateTextResponse(result);
    }
);

Server.registerTool(
    "describe_texture",
    {
        description: "Describe a texture: source image, sampler, image details.",
        inputSchema: { name: NameSchema, textureIndex: TextureIndexSchema },
    },
    async ({ name, textureIndex }) => {
        const result = Manager.describeTexture(name, textureIndex);
        return result.startsWith("Error") ? CreateErrorResponse(result) : CreateTextResponse(result);
    }
);

Server.registerTool(
    "describe_image",
    {
        description: "Describe an image: URI, MIME type, buffer view reference.",
        inputSchema: { name: NameSchema, imageIndex: ImageIndexSchema },
    },
    async ({ name, imageIndex }) => {
        const result = Manager.describeImage(name, imageIndex);
        return result.startsWith("Error") ? CreateErrorResponse(result) : CreateTextResponse(result);
    }
);

Server.registerTool(
    "describe_accessor",
    {
        description: "Describe an accessor: type, component type, count, min/max.",
        inputSchema: { name: NameSchema, accessorIndex: AccessorIndexSchema },
    },
    async ({ name, accessorIndex }) => {
        const result = Manager.describeAccessor(name, accessorIndex);
        return result.startsWith("Error") ? CreateErrorResponse(result) : CreateTextResponse(result);
    }
);

Server.registerTool(
    "describe_sampler",
    {
        description: "Describe a sampler: mag/min filter, wrap modes.",
        inputSchema: { name: NameSchema, samplerIndex: SamplerIndexSchema },
    },
    async ({ name, samplerIndex }) => {
        const result = Manager.describeSampler(name, samplerIndex);
        return result.startsWith("Error") ? CreateErrorResponse(result) : CreateTextResponse(result);
    }
);

/* ---------------------- List tools ------------------------------ */

Server.registerTool(
    "list_scenes",
    {
        description: "List all scenes with names, node counts, and active status.",
        inputSchema: { name: NameSchema },
    },
    async ({ name }) => {
        const result = Manager.listScenes(name);
        return result.startsWith("Error") ? CreateErrorResponse(result) : CreateTextResponse(result);
    }
);

Server.registerTool(
    "list_nodes",
    {
        description: "List all nodes with names, mesh references, and children.",
        inputSchema: { name: NameSchema },
    },
    async ({ name }) => {
        const result = Manager.listNodes(name);
        return result.startsWith("Error") ? CreateErrorResponse(result) : CreateTextResponse(result);
    }
);

Server.registerTool(
    "list_meshes",
    {
        description: "List all meshes with names and primitive counts.",
        inputSchema: { name: NameSchema },
    },
    async ({ name }) => {
        const result = Manager.listMeshes(name);
        return result.startsWith("Error") ? CreateErrorResponse(result) : CreateTextResponse(result);
    }
);

Server.registerTool(
    "list_materials",
    {
        description: "List all materials with names and key PBR properties.",
        inputSchema: { name: NameSchema },
    },
    async ({ name }) => {
        const result = Manager.listMaterials(name);
        return result.startsWith("Error") ? CreateErrorResponse(result) : CreateTextResponse(result);
    }
);

Server.registerTool(
    "list_animations",
    {
        description: "List all animations with names, channel counts, and sampler counts.",
        inputSchema: { name: NameSchema },
    },
    async ({ name }) => {
        const result = Manager.listAnimations(name);
        return result.startsWith("Error") ? CreateErrorResponse(result) : CreateTextResponse(result);
    }
);

Server.registerTool(
    "list_textures",
    {
        description: "List all textures with source image and sampler references.",
        inputSchema: { name: NameSchema },
    },
    async ({ name }) => {
        const result = Manager.listTextures(name);
        return result.startsWith("Error") ? CreateErrorResponse(result) : CreateTextResponse(result);
    }
);

Server.registerTool(
    "list_extensions",
    {
        description: "List extensionsUsed and extensionsRequired for a document.",
        inputSchema: { name: NameSchema },
    },
    async ({ name }) => {
        const result = Manager.listExtensions(name);
        return result.startsWith("Error") ? CreateErrorResponse(result) : CreateTextResponse(result);
    }
);

/* ================================================================== */
/*  3. Node and scene editing tools                                    */
/* ================================================================== */

Server.registerTool(
    "add_scene",
    {
        description: "Add a new empty scene to the document.",
        inputSchema: {
            name: NameSchema,
            sceneName: z.string().optional().describe("Name for the new scene."),
        },
    },
    async ({ name, sceneName }) => {
        const result = Manager.addScene(name, sceneName);
        return result.startsWith("Error") ? CreateErrorResponse(result) : CreateTextResponse(result);
    }
);

Server.registerTool(
    "rename_scene",
    {
        description: "Rename a scene by index.",
        inputSchema: { name: NameSchema, sceneIndex: SceneIndexSchema, newName: z.string().describe("New scene name.") },
    },
    async ({ name, sceneIndex, newName }) => {
        const result = Manager.renameScene(name, sceneIndex, newName);
        return result.startsWith("Error") ? CreateErrorResponse(result) : CreateTextResponse(result);
    }
);

Server.registerTool(
    "set_active_scene",
    {
        description: "Set the active (default) scene index.",
        inputSchema: { name: NameSchema, sceneIndex: SceneIndexSchema },
    },
    async ({ name, sceneIndex }) => {
        const result = Manager.setActiveScene(name, sceneIndex);
        return result.startsWith("Error") ? CreateErrorResponse(result) : CreateTextResponse(result);
    }
);

Server.registerTool(
    "add_node",
    {
        description: "Add a new node. Optionally parent it under another node or add to a scene root.",
        inputSchema: {
            name: NameSchema,
            nodeName: z.string().optional().describe("Name for the new node."),
            parentNodeIndex: z.number().optional().describe("Parent node index. If omitted, node is added to the scene root."),
            sceneIndex: z.number().optional().describe("Scene to add the root node to (default: active scene)."),
        },
    },
    async ({ name, nodeName, parentNodeIndex, sceneIndex }) => {
        const result = Manager.addNode(name, nodeName, parentNodeIndex, sceneIndex);
        return result.startsWith("Error") ? CreateErrorResponse(result) : CreateTextResponse(result);
    }
);

Server.registerTool(
    "rename_node",
    {
        description: "Rename a node by index.",
        inputSchema: { name: NameSchema, nodeIndex: NodeIndexSchema, newName: z.string().describe("New node name.") },
    },
    async ({ name, nodeIndex, newName }) => {
        const result = Manager.renameNode(name, nodeIndex, newName);
        return result.startsWith("Error") ? CreateErrorResponse(result) : CreateTextResponse(result);
    }
);

Server.registerTool(
    "set_node_transform",
    {
        description: "Set TRS transform on a node. Clears matrix if present.",
        inputSchema: {
            name: NameSchema,
            nodeIndex: NodeIndexSchema,
            translation: z.tuple([z.number(), z.number(), z.number()]).optional().describe("[x, y, z] translation."),
            rotation: z.tuple([z.number(), z.number(), z.number(), z.number()]).optional().describe("[x, y, z, w] rotation quaternion."),
            scale: z.tuple([z.number(), z.number(), z.number()]).optional().describe("[x, y, z] scale."),
        },
    },
    async ({ name, nodeIndex, translation, rotation, scale }) => {
        const result = Manager.setNodeTransform(name, nodeIndex, translation, rotation, scale);
        return result.startsWith("Error") ? CreateErrorResponse(result) : CreateTextResponse(result);
    }
);

Server.registerTool(
    "set_node_matrix",
    {
        description: "Set a 4x4 column-major matrix on a node. Clears TRS if present.",
        inputSchema: {
            name: NameSchema,
            nodeIndex: NodeIndexSchema,
            matrix: z.array(z.number()).length(16).describe("16-element column-major matrix."),
        },
    },
    async ({ name, nodeIndex, matrix }) => {
        const result = Manager.setNodeMatrix(name, nodeIndex, matrix);
        return result.startsWith("Error") ? CreateErrorResponse(result) : CreateTextResponse(result);
    }
);

Server.registerTool(
    "clear_node_transform",
    {
        description: "Remove all transform properties (TRS and matrix) from a node.",
        inputSchema: { name: NameSchema, nodeIndex: NodeIndexSchema },
    },
    async ({ name, nodeIndex }) => {
        const result = Manager.clearNodeTransform(name, nodeIndex);
        return result.startsWith("Error") ? CreateErrorResponse(result) : CreateTextResponse(result);
    }
);

Server.registerTool(
    "reparent_node",
    {
        description: "Move a node under a new parent node, or to the scene root. Prevents cycles.",
        inputSchema: {
            name: NameSchema,
            nodeIndex: NodeIndexSchema,
            newParentIndex: z.number().optional().describe("New parent node index. Omit to move to scene root."),
            sceneIndex: z.number().optional().describe("Scene root to use if moving to scene root (default: active scene)."),
        },
    },
    async ({ name, nodeIndex, newParentIndex, sceneIndex }) => {
        const result = Manager.reparentNode(name, nodeIndex, newParentIndex, sceneIndex);
        return result.startsWith("Error") ? CreateErrorResponse(result) : CreateTextResponse(result);
    }
);

Server.registerTool(
    "remove_node",
    {
        description: "Remove a node (nullifies slot to preserve indices).",
        inputSchema: { name: NameSchema, nodeIndex: NodeIndexSchema },
    },
    async ({ name, nodeIndex }) => {
        const result = Manager.removeNode(name, nodeIndex);
        return result.startsWith("Error") ? CreateErrorResponse(result) : CreateTextResponse(result);
    }
);

Server.registerTool(
    "add_child_node",
    {
        description: "Add a new child node under a given parent node.",
        inputSchema: {
            name: NameSchema,
            parentIndex: z.number().describe("Parent node index."),
            childName: z.string().optional().describe("Name for the new child node."),
        },
    },
    async ({ name, parentIndex, childName }) => {
        const result = Manager.addChildNode(name, parentIndex, childName);
        return result.startsWith("Error") ? CreateErrorResponse(result) : CreateTextResponse(result);
    }
);

/* ================================================================== */
/*  4. Mesh and primitive editing tools                                */
/* ================================================================== */

Server.registerTool(
    "add_mesh",
    {
        description: "Add a new mesh with one empty primitive.",
        inputSchema: {
            name: NameSchema,
            meshName: z.string().optional().describe("Name for the new mesh."),
        },
    },
    async ({ name, meshName }) => {
        const result = Manager.addMesh(name, meshName);
        return result.startsWith("Error") ? CreateErrorResponse(result) : CreateTextResponse(result);
    }
);

Server.registerTool(
    "remove_mesh",
    {
        description: "Remove a mesh and clear node references to it.",
        inputSchema: { name: NameSchema, meshIndex: MeshIndexSchema },
    },
    async ({ name, meshIndex }) => {
        const result = Manager.removeMesh(name, meshIndex);
        return result.startsWith("Error") ? CreateErrorResponse(result) : CreateTextResponse(result);
    }
);

Server.registerTool(
    "assign_mesh_to_node",
    {
        description: "Assign a mesh to a node.",
        inputSchema: { name: NameSchema, nodeIndex: NodeIndexSchema, meshIndex: MeshIndexSchema },
    },
    async ({ name, nodeIndex, meshIndex }) => {
        const result = Manager.assignMeshToNode(name, nodeIndex, meshIndex);
        return result.startsWith("Error") ? CreateErrorResponse(result) : CreateTextResponse(result);
    }
);

Server.registerTool(
    "unassign_mesh_from_node",
    {
        description: "Remove the mesh assignment from a node.",
        inputSchema: { name: NameSchema, nodeIndex: NodeIndexSchema },
    },
    async ({ name, nodeIndex }) => {
        const result = Manager.unassignMeshFromNode(name, nodeIndex);
        return result.startsWith("Error") ? CreateErrorResponse(result) : CreateTextResponse(result);
    }
);

Server.registerTool(
    "describe_mesh_primitives",
    {
        description: "Describe primitives of a mesh: attributes, material, mode.",
        inputSchema: { name: NameSchema, meshIndex: MeshIndexSchema },
    },
    async ({ name, meshIndex }) => {
        const result = Manager.describeMeshPrimitives(name, meshIndex);
        return result.startsWith("Error") ? CreateErrorResponse(result) : CreateTextResponse(result);
    }
);

Server.registerTool(
    "set_primitive_material",
    {
        description: "Set the material on a specific mesh primitive.",
        inputSchema: {
            name: NameSchema,
            meshIndex: MeshIndexSchema,
            primitiveIndex: z.number().describe("0-based primitive index within the mesh."),
            materialIndex: MaterialIndexSchema,
        },
    },
    async ({ name, meshIndex, primitiveIndex, materialIndex }) => {
        const result = Manager.setPrimitiveMaterial(name, meshIndex, primitiveIndex, materialIndex);
        return result.startsWith("Error") ? CreateErrorResponse(result) : CreateTextResponse(result);
    }
);

Server.registerTool(
    "remove_primitive_material",
    {
        description: "Remove the material assignment from a mesh primitive.",
        inputSchema: {
            name: NameSchema,
            meshIndex: MeshIndexSchema,
            primitiveIndex: z.number().describe("0-based primitive index within the mesh."),
        },
    },
    async ({ name, meshIndex, primitiveIndex }) => {
        const result = Manager.removePrimitiveMaterial(name, meshIndex, primitiveIndex);
        return result.startsWith("Error") ? CreateErrorResponse(result) : CreateTextResponse(result);
    }
);

/* ================================================================== */
/*  5. Material editing tools                                          */
/* ================================================================== */

Server.registerTool(
    "add_material",
    {
        description: "Add a new PBR material with default metallic-roughness properties.",
        inputSchema: {
            name: NameSchema,
            materialName: z.string().optional().describe("Name for the new material."),
        },
    },
    async ({ name, materialName }) => {
        const result = Manager.addMaterial(name, materialName);
        return result.startsWith("Error") ? CreateErrorResponse(result) : CreateTextResponse(result);
    }
);

Server.registerTool(
    "remove_material",
    {
        description: "Remove a material and clear primitive references to it.",
        inputSchema: { name: NameSchema, materialIndex: MaterialIndexSchema },
    },
    async ({ name, materialIndex }) => {
        const result = Manager.removeMaterial(name, materialIndex);
        return result.startsWith("Error") ? CreateErrorResponse(result) : CreateTextResponse(result);
    }
);

Server.registerTool(
    "rename_material",
    {
        description: "Rename a material by index.",
        inputSchema: { name: NameSchema, materialIndex: MaterialIndexSchema, newName: z.string().describe("New material name.") },
    },
    async ({ name, materialIndex, newName }) => {
        const result = Manager.renameMaterial(name, materialIndex, newName);
        return result.startsWith("Error") ? CreateErrorResponse(result) : CreateTextResponse(result);
    }
);

Server.registerTool(
    "set_material_pbr",
    {
        description: "Set PBR metallic-roughness properties on a material.",
        inputSchema: {
            name: NameSchema,
            materialIndex: MaterialIndexSchema,
            baseColorFactor: z.tuple([z.number(), z.number(), z.number(), z.number()]).optional().describe("[r, g, b, a] base color factor."),
            metallicFactor: z.number().optional().describe("Metallic factor (0-1)."),
            roughnessFactor: z.number().optional().describe("Roughness factor (0-1)."),
            baseColorTexture: z.number().optional().describe("Texture index for base color."),
            metallicRoughnessTexture: z.number().optional().describe("Texture index for metallic-roughness."),
        },
    },
    async ({ name, materialIndex, baseColorFactor, metallicFactor, roughnessFactor, baseColorTexture, metallicRoughnessTexture }) => {
        const result = Manager.setMaterialPbr(name, materialIndex, baseColorFactor, metallicFactor, roughnessFactor, baseColorTexture, metallicRoughnessTexture);
        return result.startsWith("Error") ? CreateErrorResponse(result) : CreateTextResponse(result);
    }
);

Server.registerTool(
    "set_material_alpha_mode",
    {
        description: "Set alpha mode (OPAQUE, MASK, BLEND) and optional cutoff on a material.",
        inputSchema: {
            name: NameSchema,
            materialIndex: MaterialIndexSchema,
            alphaMode: z.enum(["OPAQUE", "MASK", "BLEND"]).describe("Alpha mode."),
            alphaCutoff: z.number().optional().describe("Alpha cutoff (only meaningful for MASK)."),
        },
    },
    async ({ name, materialIndex, alphaMode, alphaCutoff }) => {
        const result = Manager.setMaterialAlphaMode(name, materialIndex, alphaMode, alphaCutoff);
        return result.startsWith("Error") ? CreateErrorResponse(result) : CreateTextResponse(result);
    }
);

Server.registerTool(
    "set_material_double_sided",
    {
        description: "Set whether a material is double-sided.",
        inputSchema: { name: NameSchema, materialIndex: MaterialIndexSchema, doubleSided: z.boolean().describe("Whether the material is double-sided.") },
    },
    async ({ name, materialIndex, doubleSided }) => {
        const result = Manager.setMaterialDoubleSided(name, materialIndex, doubleSided);
        return result.startsWith("Error") ? CreateErrorResponse(result) : CreateTextResponse(result);
    }
);

Server.registerTool(
    "set_material_emissive",
    {
        description: "Set emissive factor and/or emissive texture on a material.",
        inputSchema: {
            name: NameSchema,
            materialIndex: MaterialIndexSchema,
            emissiveFactor: z.tuple([z.number(), z.number(), z.number()]).optional().describe("[r, g, b] emissive factor."),
            emissiveTexture: z.number().optional().describe("Texture index for emissive."),
        },
    },
    async ({ name, materialIndex, emissiveFactor, emissiveTexture }) => {
        const result = Manager.setMaterialEmissive(name, materialIndex, emissiveFactor, emissiveTexture);
        return result.startsWith("Error") ? CreateErrorResponse(result) : CreateTextResponse(result);
    }
);

Server.registerTool(
    "assign_material_to_mesh_primitive",
    {
        description: "Assign a material to a specific mesh primitive (alias for set_primitive_material).",
        inputSchema: {
            name: NameSchema,
            meshIndex: MeshIndexSchema,
            primitiveIndex: z.number().describe("0-based primitive index."),
            materialIndex: MaterialIndexSchema,
        },
    },
    async ({ name, meshIndex, primitiveIndex, materialIndex }) => {
        const result = Manager.assignMaterialToMeshPrimitive(name, meshIndex, primitiveIndex, materialIndex);
        return result.startsWith("Error") ? CreateErrorResponse(result) : CreateTextResponse(result);
    }
);

/* ================================================================== */
/*  6. Texture / image / sampler tools                                 */
/* ================================================================== */

Server.registerTool(
    "add_image_reference",
    {
        description: "Add a URI-backed image reference.",
        inputSchema: {
            name: NameSchema,
            uri: z.string().describe("Image URI (relative path or data URI)."),
            imageName: z.string().optional().describe("Name for the image."),
            mimeType: z.string().optional().describe("MIME type (e.g. image/png)."),
        },
    },
    async ({ name, uri, imageName, mimeType }) => {
        const result = Manager.addImageReference(name, uri, imageName, mimeType);
        return result.startsWith("Error") ? CreateErrorResponse(result) : CreateTextResponse(result);
    }
);

Server.registerTool(
    "remove_image",
    {
        description: "Remove an image and clear texture source references.",
        inputSchema: { name: NameSchema, imageIndex: ImageIndexSchema },
    },
    async ({ name, imageIndex }) => {
        const result = Manager.removeImage(name, imageIndex);
        return result.startsWith("Error") ? CreateErrorResponse(result) : CreateTextResponse(result);
    }
);

Server.registerTool(
    "add_texture",
    {
        description: "Add a texture with optional source image and sampler references.",
        inputSchema: {
            name: NameSchema,
            sourceImage: z.number().optional().describe("Image index for this texture."),
            sampler: z.number().optional().describe("Sampler index for this texture."),
            textureName: z.string().optional().describe("Name for the texture."),
        },
    },
    async ({ name, sourceImage, sampler, textureName }) => {
        const result = Manager.addTexture(name, sourceImage, sampler, textureName);
        return result.startsWith("Error") ? CreateErrorResponse(result) : CreateTextResponse(result);
    }
);

Server.registerTool(
    "remove_texture",
    {
        description: "Remove a texture by index.",
        inputSchema: { name: NameSchema, textureIndex: TextureIndexSchema },
    },
    async ({ name, textureIndex }) => {
        const result = Manager.removeTexture(name, textureIndex);
        return result.startsWith("Error") ? CreateErrorResponse(result) : CreateTextResponse(result);
    }
);

Server.registerTool(
    "set_texture_sampler",
    {
        description: "Set the sampler on a texture.",
        inputSchema: { name: NameSchema, textureIndex: TextureIndexSchema, samplerIndex: SamplerIndexSchema },
    },
    async ({ name, textureIndex, samplerIndex }) => {
        const result = Manager.setTextureSampler(name, textureIndex, samplerIndex);
        return result.startsWith("Error") ? CreateErrorResponse(result) : CreateTextResponse(result);
    }
);

Server.registerTool(
    "add_sampler",
    {
        description: "Add a texture sampler with optional filter and wrap settings.",
        inputSchema: {
            name: NameSchema,
            magFilter: z.number().optional().describe("Magnification filter (9728=NEAREST, 9729=LINEAR)."),
            minFilter: z.number().optional().describe("Minification filter."),
            wrapS: z.number().optional().describe("S wrapping mode (10497=REPEAT, 33071=CLAMP_TO_EDGE, 33648=MIRRORED_REPEAT)."),
            wrapT: z.number().optional().describe("T wrapping mode."),
            samplerName: z.string().optional().describe("Name for the sampler."),
        },
    },
    async ({ name, magFilter, minFilter, wrapS, wrapT, samplerName }) => {
        const result = Manager.addSampler(name, magFilter, minFilter, wrapS, wrapT, samplerName);
        return result.startsWith("Error") ? CreateErrorResponse(result) : CreateTextResponse(result);
    }
);

Server.registerTool(
    "remove_sampler",
    {
        description: "Remove a sampler and clear texture references.",
        inputSchema: { name: NameSchema, samplerIndex: SamplerIndexSchema },
    },
    async ({ name, samplerIndex }) => {
        const result = Manager.removeSampler(name, samplerIndex);
        return result.startsWith("Error") ? CreateErrorResponse(result) : CreateTextResponse(result);
    }
);

/* ================================================================== */
/*  7. Animation and skin tools                                        */
/* ================================================================== */

Server.registerTool(
    "list_animation_channels",
    {
        description: "List all channels of an animation.",
        inputSchema: { name: NameSchema, animationIndex: AnimIndexSchema },
    },
    async ({ name, animationIndex }) => {
        const result = Manager.listAnimationChannels(name, animationIndex);
        return result.startsWith("Error") ? CreateErrorResponse(result) : CreateTextResponse(result);
    }
);

Server.registerTool(
    "describe_animation_channel",
    {
        description: "Describe a specific animation channel: target, sampler, interpolation.",
        inputSchema: {
            name: NameSchema,
            animationIndex: AnimIndexSchema,
            channelIndex: z.number().describe("0-based channel index."),
        },
    },
    async ({ name, animationIndex, channelIndex }) => {
        const result = Manager.describeAnimationChannel(name, animationIndex, channelIndex);
        return result.startsWith("Error") ? CreateErrorResponse(result) : CreateTextResponse(result);
    }
);

Server.registerTool(
    "rename_animation",
    {
        description: "Rename an animation by index.",
        inputSchema: { name: NameSchema, animationIndex: AnimIndexSchema, newName: z.string().describe("New animation name.") },
    },
    async ({ name, animationIndex, newName }) => {
        const result = Manager.renameAnimation(name, animationIndex, newName);
        return result.startsWith("Error") ? CreateErrorResponse(result) : CreateTextResponse(result);
    }
);

Server.registerTool(
    "remove_animation",
    {
        description: "Remove an animation by index.",
        inputSchema: { name: NameSchema, animationIndex: AnimIndexSchema },
    },
    async ({ name, animationIndex }) => {
        const result = Manager.removeAnimation(name, animationIndex);
        return result.startsWith("Error") ? CreateErrorResponse(result) : CreateTextResponse(result);
    }
);

Server.registerTool(
    "remove_skin",
    {
        description: "Remove a skin and clear node references.",
        inputSchema: { name: NameSchema, skinIndex: SkinIndexSchema },
    },
    async ({ name, skinIndex }) => {
        const result = Manager.removeSkin(name, skinIndex);
        return result.startsWith("Error") ? CreateErrorResponse(result) : CreateTextResponse(result);
    }
);

/* ================================================================== */
/*  8. Extension handling tools                                        */
/* ================================================================== */

Server.registerTool(
    "get_extension_data",
    {
        description: "Get extension data from a target (root, scene, node, mesh, material, texture, image, animation).",
        inputSchema: {
            name: NameSchema,
            extensionName: z.string().describe("Extension name (e.g. KHR_materials_unlit)."),
            targetType: ExtensionTargetSchema,
            targetIndex: z.number().optional().describe("Index of target object (not needed for root)."),
        },
    },
    async ({ name, extensionName, targetType, targetIndex }) => {
        const result = Manager.getExtensionData(name, extensionName, targetType, targetIndex);
        return result.startsWith("Error") || result.startsWith("No extension") ? CreateErrorResponse(result) : CreateTextResponse(result);
    }
);

Server.registerTool(
    "set_extension_data",
    {
        description: "Set extension data on a target. Creates the extensions object if needed.",
        inputSchema: {
            name: NameSchema,
            extensionName: z.string().describe("Extension name."),
            data: z.any().describe("Extension data (JSON object)."),
            targetType: ExtensionTargetSchema,
            targetIndex: z.number().optional().describe("Index of target object (not needed for root)."),
        },
    },
    async ({ name, extensionName, data, targetType, targetIndex }) => {
        const result = Manager.setExtensionData(name, extensionName, data, targetType, targetIndex);
        return result.startsWith("Error") ? CreateErrorResponse(result) : CreateTextResponse(result);
    }
);

Server.registerTool(
    "remove_extension_data",
    {
        description: "Remove extension data from a target.",
        inputSchema: {
            name: NameSchema,
            extensionName: z.string().describe("Extension name."),
            targetType: ExtensionTargetSchema,
            targetIndex: z.number().optional().describe("Index of target object (not needed for root)."),
        },
    },
    async ({ name, extensionName, targetType, targetIndex }) => {
        const result = Manager.removeExtensionData(name, extensionName, targetType, targetIndex);
        return result.startsWith("Error") || result.startsWith("No extension") ? CreateErrorResponse(result) : CreateTextResponse(result);
    }
);

Server.registerTool(
    "add_extension_to_used",
    {
        description: "Add an extension name to extensionsUsed.",
        inputSchema: { name: NameSchema, extensionName: z.string().describe("Extension name.") },
    },
    async ({ name, extensionName }) => {
        const result = Manager.addExtensionToUsed(name, extensionName);
        return result.startsWith("Error") ? CreateErrorResponse(result) : CreateTextResponse(result);
    }
);

Server.registerTool(
    "add_extension_to_required",
    {
        description: "Add an extension to extensionsRequired (and extensionsUsed).",
        inputSchema: { name: NameSchema, extensionName: z.string().describe("Extension name.") },
    },
    async ({ name, extensionName }) => {
        const result = Manager.addExtensionToRequired(name, extensionName);
        return result.startsWith("Error") ? CreateErrorResponse(result) : CreateTextResponse(result);
    }
);

Server.registerTool(
    "remove_extension_from_used",
    {
        description: "Remove an extension from extensionsUsed (and extensionsRequired).",
        inputSchema: { name: NameSchema, extensionName: z.string().describe("Extension name.") },
    },
    async ({ name, extensionName }) => {
        const result = Manager.removeExtensionFromUsed(name, extensionName);
        return result.startsWith("Error") ? CreateErrorResponse(result) : CreateTextResponse(result);
    }
);

Server.registerTool(
    "remove_extension_from_required",
    {
        description: "Remove an extension from extensionsRequired only.",
        inputSchema: { name: NameSchema, extensionName: z.string().describe("Extension name.") },
    },
    async ({ name, extensionName }) => {
        const result = Manager.removeExtensionFromRequired(name, extensionName);
        return result.startsWith("Error") ? CreateErrorResponse(result) : CreateTextResponse(result);
    }
);

/* ================================================================== */
/*  9. Validation tools                                                */
/* ================================================================== */

Server.registerTool(
    "validate_gltf",
    {
        description: "Validate a glTF document for broken references, invalid hierarchy, extension consistency, and structural issues.",
        inputSchema: { name: NameSchema },
    },
    async ({ name }) => {
        const issues = Manager.validateGltf(name);
        if (issues.length === 1 && issues[0].severity === "error" && issues[0].message.startsWith("Error:")) {
            return CreateErrorResponse(issues[0].message);
        }
        return CreateTextResponse(Manager.summarizeIssues(issues));
    }
);

/* ================================================================== */
/*  10. Import/Export tools                                             */
/* ================================================================== */

Server.registerTool(
    "export_gltf_json",
    {
        description: "Export a glTF document as JSON text, or write it to a file.",
        inputSchema: {
            name: NameSchema,
            outputFile: CreateOutputFileSchema(z),
        },
    },
    async ({ name, outputFile }) => {
        return CreateJsonExportResponse({
            jsonText: Manager.exportJson(name),
            outputFile,
            missingMessage: `No glTF document named "${name}".`,
            fileLabel: "glTF JSON",
        });
    }
);

Server.registerTool(
    "import_gltf_json",
    {
        description: "Import a glTF document from inline JSON or a JSON file.",
        inputSchema: {
            name: NameSchema,
            json: CreateInlineJsonSchema(z, "Inline glTF JSON text."),
            jsonFile: CreateJsonFileSchema(z, "Absolute path to a .gltf JSON file."),
        },
    },
    async ({ name, json, jsonFile }) => {
        const result = CreateJsonImportSummaryResponse({
            json,
            jsonFile,
            fileDescription: "glTF file",
            importJson: (text) => {
                const r = Manager.loadGltf(name, text);
                if (r.startsWith("Error")) {
                    throw new Error(r);
                }
                return name;
            },
            createSuccessText: () => `Imported.\n\n${Manager.describeGltf(name)}`,
        });

        // If loaded from a file, resolve external buffer/image URIs
        if (jsonFile && !result.content[0]?.text?.startsWith("Error")) {
            const { dirname } = await import("node:path");
            await Manager.resolveExternalBuffers(name, dirname(jsonFile));
        }

        return result;
    }
);

Server.registerTool(
    "export_glb",
    {
        description: "Export a glTF document as a binary .glb file. Supports JSON-only content (no embedded binary buffers).",
        inputSchema: {
            name: NameSchema,
            outputFile: z.string().describe("Absolute file path for the .glb output."),
        },
    },
    async ({ name, outputFile }) => {
        const glb = Manager.exportGlb(name);
        if (!glb) {
            return CreateErrorResponse(`No glTF document named "${name}".`);
        }
        try {
            const { mkdirSync, writeFileSync } = await import("node:fs");
            const { dirname } = await import("node:path");
            mkdirSync(dirname(outputFile), { recursive: true });
            writeFileSync(outputFile, glb);
            return CreateTextResponse(`GLB written to: ${outputFile} (${glb.length} bytes)`);
        } catch (error) {
            return CreateErrorResponse(`Error writing GLB: ${(error as Error).message}`);
        }
    }
);

Server.registerTool(
    "import_glb",
    {
        description: "Import a binary .glb file from disk into memory as a glTF document.",
        inputSchema: {
            name: NameSchema,
            filePath: z.string().describe("Absolute path to the .glb file to import."),
        },
    },
    async ({ name, filePath }) => {
        try {
            const { readFileSync } = await import("node:fs");
            const buffer = readFileSync(filePath);
            const result = Manager.importGlb(name, buffer);
            if (result.startsWith("Error")) {
                return CreateErrorResponse(result);
            }
            return CreateTextResponse(result);
        } catch (error) {
            return CreateErrorResponse(`Error reading GLB file: ${(error as Error).message}`);
        }
    }
);

Server.registerTool(
    "compact_indices",
    {
        description: "Remove null slots from document arrays and remap all cross-references. Use after removing nodes, meshes, materials, etc. to reclaim clean 0-based indices.",
        inputSchema: { name: NameSchema },
    },
    async ({ name }) => {
        const result = Manager.compactIndices(name);
        if (result.startsWith("Error")) {
            return CreateErrorResponse(result);
        }
        return CreateTextResponse(result);
    }
);

Server.registerTool(
    "save_to_file",
    {
        description: "Save a glTF document to a .gltf JSON file or .glb binary file based on the file extension.",
        inputSchema: {
            name: NameSchema,
            filePath: z.string().describe("Absolute path to write the file to. Use .gltf for JSON, .glb for binary."),
        },
    },
    async ({ name, filePath }) => {
        if (filePath.endsWith(".glb")) {
            const glb = Manager.exportGlb(name);
            if (!glb) {
                return CreateErrorResponse(`No glTF document named "${name}".`);
            }
            try {
                const { mkdirSync, writeFileSync } = await import("node:fs");
                const { dirname } = await import("node:path");
                mkdirSync(dirname(filePath), { recursive: true });
                writeFileSync(filePath, glb);
                return CreateTextResponse(`GLB saved to: ${filePath} (${glb.length} bytes)`);
            } catch (error) {
                return CreateErrorResponse(`Error writing file: ${(error as Error).message}`);
            }
        }
        const json = Manager.exportJson(name);
        if (!json) {
            return CreateErrorResponse(`No glTF document named "${name}".`);
        }
        try {
            WriteTextFileEnsuringDirectory(filePath, json);
            return CreateTextResponse(`glTF JSON saved to: ${filePath}`);
        } catch (error) {
            return CreateErrorResponse(`Error writing file: ${(error as Error).message}`);
        }
    }
);

/* ================================================================== */
/*  10b. Preview tools                                                 */
/* ================================================================== */

Server.registerTool(
    "start_preview",
    {
        description:
            "Start a local preview server and return a Babylon.js Sandbox URL to view the glTF document in a browser. " +
            "The server re-exports the document on every request, so the preview always reflects the latest state. " +
            "Refresh the page after making edits to see changes. Open the server root URL for a built-in viewer, or use the Sandbox URL directly.",
        inputSchema: {
            name: NameSchema,
            port: z.number().int().min(1024).max(65535).optional().describe("Port for the local server (default: 8766)."),
        },
    },
    async ({ name, port }) => {
        try {
            const sandboxUrl = await startPreview(Manager, name, port ?? 8766);
            const serverUrl = getPreviewServerUrl();
            return CreateTextResponse(
                [
                    `Preview server started!`,
                    ``,
                    `  Document:   ${name}`,
                    `  Viewer:     ${serverUrl}/`,
                    `  Sandbox:    ${sandboxUrl}`,
                    ``,
                    `Open the Viewer URL for a built-in 3D viewer (recommended).`,
                    `The model is served live — refresh the page after edits.`,
                    ``,
                    `Direct links:`,
                    `  GLB:  ${serverUrl}/model.glb`,
                    `  JSON: ${serverUrl}/model.gltf`,
                    `  Info: ${serverUrl}/api/info`,
                ].join("\n")
            );
        } catch (error) {
            return CreateErrorResponse(`Failed to start preview: ${(error as Error).message}`);
        }
    }
);

Server.registerTool(
    "stop_preview",
    {
        description: "Stop the running glTF preview server.",
        inputSchema: {},
    },
    async () => {
        if (!isPreviewRunning()) {
            return CreateTextResponse("No preview server is running.");
        }
        await stopPreview();
        return CreateTextResponse("Preview server stopped.");
    }
);

Server.registerTool(
    "get_preview_url",
    {
        description: "Get the current preview server URL and Sandbox link.",
        inputSchema: {},
    },
    async () => {
        if (!isPreviewRunning()) {
            return CreateTextResponse("No preview server is running. Use start_preview to start one.");
        }
        const serverUrl = getPreviewServerUrl();
        const sandboxUrl = getSandboxUrl();
        const docName = getPreviewDocName();
        return CreateTextResponse([`Document: ${docName}`, `Viewer:   ${serverUrl}/`, `Sandbox:  ${sandboxUrl}`].join("\n"));
    }
);

Server.registerTool(
    "set_preview_scene",
    {
        description: "Switch which glTF document the preview server is serving (without restarting).",
        inputSchema: {
            name: NameSchema,
        },
    },
    async ({ name }) => {
        if (!isPreviewRunning()) {
            return CreateErrorResponse("No preview server is running. Use start_preview first.");
        }
        setPreviewDocument(name);
        return CreateTextResponse(`Preview now serving "${name}". Refresh the Sandbox page to see it.`);
    }
);

/* ================================================================== */
/*  11. Search/discovery tools                                         */
/* ================================================================== */

Server.registerTool(
    "find_nodes",
    {
        description: "Search for nodes by name (substring or exact match).",
        inputSchema: {
            name: NameSchema,
            query: z.string().describe("Name search query."),
            exact: z.boolean().optional().describe("If true, match name exactly (case-insensitive). Default: substring match."),
        },
    },
    async ({ name, query, exact }) => {
        const result = Manager.findNodes(name, query, exact);
        return result.startsWith("Error") ? CreateErrorResponse(result) : CreateTextResponse(result);
    }
);

Server.registerTool(
    "find_materials",
    {
        description: "Search for materials by name (substring or exact match).",
        inputSchema: {
            name: NameSchema,
            query: z.string().describe("Name search query."),
            exact: z.boolean().optional().describe("If true, match name exactly (case-insensitive). Default: substring match."),
        },
    },
    async ({ name, query, exact }) => {
        const result = Manager.findMaterials(name, query, exact);
        return result.startsWith("Error") ? CreateErrorResponse(result) : CreateTextResponse(result);
    }
);

Server.registerTool(
    "find_meshes",
    {
        description: "Search for meshes by name (substring or exact match).",
        inputSchema: {
            name: NameSchema,
            query: z.string().describe("Name search query."),
            exact: z.boolean().optional().describe("If true, match name exactly (case-insensitive). Default: substring match."),
        },
    },
    async ({ name, query, exact }) => {
        const result = Manager.findMeshes(name, query, exact);
        return result.startsWith("Error") ? CreateErrorResponse(result) : CreateTextResponse(result);
    }
);

Server.registerTool(
    "find_extensions",
    {
        description: "Search for extensions referenced anywhere in the document.",
        inputSchema: {
            name: NameSchema,
            query: z.string().describe("Extension name search query (substring)."),
        },
    },
    async ({ name, query }) => {
        const result = Manager.findExtensions(name, query);
        return result.startsWith("Error") ? CreateErrorResponse(result) : CreateTextResponse(result);
    }
);

/* ================================================================== */
/*  Resources                                                          */
/* ================================================================== */

Server.registerResource("gltf-concepts", "gltf://concepts", { description: "Overview of glTF 2.0 concepts and structure." }, async (uri) => ({
    contents: [
        {
            uri: uri.href,
            mimeType: "text/markdown",
            text: [
                "# glTF 2.0 Concepts",
                "",
                "## Document Structure",
                "A glTF document has: asset metadata, scenes, nodes (scene graph), meshes (geometry), materials (PBR), textures, images, samplers, accessors, buffer views, buffers, animations, skins, cameras.",
                "",
                "## Key Relationships",
                "- Scenes contain root node indices",
                "- Nodes can have children (forming a hierarchy), a mesh, a skin, a camera, and a TRS/matrix transform",
                "- Meshes have primitives, each with attributes (accessors), optional indices, and optional material",
                "- Materials use PBR metallic-roughness workflow with texture references",
                "- Textures reference an image source and a sampler",
                "- Animations have channels (targeting node properties) and samplers (keyframe data via accessors)",
                "",
                "## Extensions",
                "- extensionsUsed: extensions used anywhere in the document",
                "- extensionsRequired: extensions that must be supported to load the document",
                "- Extension data can be attached to most objects via an extensions property",
                "",
                "## Common Extensions",
                "- KHR_materials_unlit: unlit material",
                "- KHR_materials_clearcoat: clearcoat layer",
                "- KHR_materials_transmission: transmission/transparency",
                "- KHR_materials_emissive_strength: HDR emissive",
                "- KHR_texture_transform: UV transform",
                "- KHR_draco_mesh_compression: Draco compression",
                "- KHR_mesh_quantization: quantized attributes",
                "- KHR_lights_punctual: point/spot/directional lights",
                "- MSFT_lod: level of detail",
            ].join("\n"),
        },
    ],
}));

/* ================================================================== */
/*  Prompts                                                            */
/* ================================================================== */

Server.registerPrompt("create-scene-with-materials", { description: "Create a glTF scene with nodes and PBR materials step by step." }, () => ({
    messages: [
        {
            role: "user",
            content: {
                type: "text",
                text: [
                    "Create a glTF document. Add a scene, then add several nodes.',",
                    "Add meshes and assign them to nodes.",
                    "Create PBR materials with different base colors and roughness values.',",
                    "Assign materials to mesh primitives.",
                    "Validate the result and export as JSON.",
                ].join("\n"),
            },
        },
    ],
}));

Server.registerPrompt("inspect-and-optimize", { description: "Load, inspect, and optimize an existing glTF asset." }, () => ({
    messages: [
        {
            role: "user",
            content: {
                type: "text",
                text: [
                    "Load a glTF file, inspect its structure.",
                    "List all nodes, meshes, and materials.",
                    "Check for unused materials or broken references.",
                    "Validate the document and report issues.",
                ].join("\n"),
            },
        },
    ],
}));

/* ================================================================== */
/*  Start                                                              */
/* ================================================================== */

async function Cleanup() {
    if (isPreviewRunning()) {
        await stopPreview();
    }
}

async function Main() {
    const transport = new StdioServerTransport();

    // Stop the preview server when the transport closes (session ends)
    transport.onclose = () => {
        void Cleanup();
    };

    // Stop the preview server on process signals (restart / kill)
    process.on("SIGINT", () => void Cleanup().then(() => process.exit(0)));
    process.on("SIGTERM", () => void Cleanup().then(() => process.exit(0)));
    process.on("beforeExit", () => void Cleanup());

    await Server.connect(transport);
    // eslint-disable-next-line no-console
    console.error("babylonjs-gltf MCP server running on stdio");
}

try {
    await Main();
} catch (err) {
    // eslint-disable-next-line no-console
    console.error("Fatal error:", err);
    process.exit(1);
}

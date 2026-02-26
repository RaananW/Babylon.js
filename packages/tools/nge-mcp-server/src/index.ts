#!/usr/bin/env node
/* eslint-disable @typescript-eslint/naming-convention */
/* eslint-disable no-console */
/**
 * NGE MCP Server
 * ──────────────
 * A Model Context Protocol server that exposes tools for building Babylon.js
 * Node Geometries programmatically.  An AI agent (or any MCP client) can:
 *
 *   • Create / manage geometry graphs
 *   • Add blocks from the full NGE block catalog
 *   • Connect blocks together
 *   • Set block properties (constant values, contextual sources, etc.)
 *   • Validate the graph
 *   • Export the final geometry JSON (loadable by NGE / NodeGeometry.parseSerializedObject)
 *   • Import existing NGE JSON for editing
 *   • Query block type info and the catalog
 *
 * Transport: stdio  (the standard MCP transport for local tool servers)
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod/v4";
import { writeFileSync, readFileSync, mkdirSync } from "node:fs";
import { dirname } from "node:path";

import { BlockRegistry, GetBlockCatalogSummary, GetBlockTypeDetails } from "./blockRegistry.js";
import { GeometryGraphManager } from "./geometryGraph.js";

// ─── Singleton graph manager ──────────────────────────────────────────────
const manager = new GeometryGraphManager();

// ─── MCP Server ───────────────────────────────────────────────────────────
const server = new McpServer({
    name: "babylonjs-nge",
    version: "1.0.0",
});

// ═══════════════════════════════════════════════════════════════════════════
//  Resources (read-only reference data)
// ═══════════════════════════════════════════════════════════════════════════

server.registerResource("block-catalog", "nge://block-catalog", {}, async (uri) => ({
    contents: [
        {
            uri: uri.href,
            mimeType: "text/markdown",
            text: `# NGE Block Catalog\n${GetBlockCatalogSummary()}`,
        },
    ],
}));

server.registerResource("enums", "nge://enums", {}, async (uri) => ({
    contents: [
        {
            uri: uri.href,
            mimeType: "text/markdown",
            text: [
                "# NGE Enumerations Reference",
                "",
                "## NodeGeometryBlockConnectionPointTypes",
                "Int (0x0001), Float (0x0002), Vector2 (0x0004), Vector3 (0x0008), Vector4 (0x0010), " +
                    "Matrix (0x0020), Geometry (0x0040), Texture (0x0080), AutoDetect (0x0400), BasedOnInput (0x0800), Undefined (0x1000)",
                "",
                "## NodeGeometryContextualSources (for GeometryInputBlock)",
                "None (0), Positions (1), Normals (2), Tangents (3), UV (4), UV2 (5), UV3 (6), UV4 (7), " +
                    "UV5 (8), UV6 (9), Colors (10), VertexID (11), FaceID (12), GeometryID (13), " +
                    "CollectionID (14), LoopID (15), InstanceID (16), LatticeID (17), LatticeControl (18)",
                "",
                "## MathBlockOperations (for MathBlock)",
                "Add (0), Subtract (1), Multiply (2), Divide (3), Max (4), Min (5)",
                "",
                "## GeometryTrigonometryBlockOperations (for GeometryTrigonometryBlock)",
                "Cos (0), Sin (1), Abs (2), Exp (3), Round (4), Floor (5), Ceiling (6), " +
                    "Sqrt (7), Log (8), Tan (9), ArcTan (10), ArcCos (11), ArcSin (12), Sign (13), " +
                    "Negate (14), OneMinus (15), Reciprocal (16), ToDegrees (17), ToRadians (18), Fract (19), Exp2 (20)",
                "",
                "## ConditionBlockTests (for ConditionBlock)",
                "Equal (0), NotEqual (1), LessThan (2), GreaterThan (3), LessOrEqual (4), GreaterOrEqual (5), Xor (6), Or (7), And (8)",
                "",
                "## BooleanGeometryOperations (for BooleanGeometryBlock)",
                "Intersect (0), Subtract (1), Union (2)",
                "",
                "## RandomBlockLocks (for RandomBlock)",
                "None (0), LoopID (1), InstanceID (2), Once (3)",
                "",
                "## Aggregations (for AggregatorBlock) — property name: aggregation",
                "Max (0), Min (1), Sum (2). Default: Sum",
                "",
                "## GeometryEaseBlockTypes (for GeometryEaseBlock) — property name: type",
                "EaseInSine (0), EaseOutSine (1), EaseInOutSine (2), EaseInQuad (3), EaseOutQuad (4), ...",
                "",
                "## MappingTypes (for MappingBlock) — property name: mapping",
                "Spherical (0), Cylindrical (1), Cubic (2)",
            ].join("\n"),
        },
    ],
}));

server.registerResource("concepts", "nge://concepts", {}, async (uri) => ({
    contents: [
        {
            uri: uri.href,
            mimeType: "text/markdown",
            text: [
                "# Node Geometry Concepts",
                "",
                "## What is a Node Geometry?",
                "A Node Geometry is a visual, graph-based procedural geometry builder in Babylon.js.",
                "Instead of creating meshes from code, you connect typed blocks that represent geometry",
                "operations. The graph evaluates at runtime to produce mesh vertex data.",
                "",
                "## Graph Structure — One Required Output",
                "Every Node Geometry graph MUST have exactly one output block:",
                "  • **GeometryOutputBlock** — receives the final Geometry output",
                "Without this block, the geometry cannot be built.",
                "",
                "## GeometryInputBlock — Contextual Sources & Constants",
                "GeometryInputBlock is the source of all external data entering the graph. It has two modes:",
                "",
                "### Mode 1: Contextual Source",
                "Reads per-vertex/per-face data from the geometry being processed.",
                "  • Set `contextualValue` to one of: Positions, Normals, Tangents, UV, UV2, UV3, UV4, UV5, UV6,",
                "    Colors, VertexID, FaceID, GeometryID, CollectionID, LoopID, InstanceID, LatticeID, LatticeControl",
                "  • The `type` is automatically derived from the contextual source:",
                "    - Positions/Normals/Tangents/LatticeControl → Vector3",
                "    - UV/UV2/UV3/UV4/UV5/UV6 → Vector2",
                "    - Colors → Vector4",
                "    - VertexID/FaceID/GeometryID/CollectionID/LoopID/InstanceID/LatticeID → Int",
                "",
                "### Mode 2: Constant Value",
                "Provides a fixed value of a specific type.",
                "  • Set `type` to: Int, Float, Vector2, Vector3, Vector4, Matrix",
                "  • Set `value` to the constant (number, or {x,y}, {x,y,z}, {x,y,z,w}, or flat array)",
                "",
                "## Source Blocks — Built-in Primitives",
                "These blocks generate mesh geometry directly without needing inputs:",
                "  • BoxBlock, SphereBlock, CylinderBlock, PlaneBlock, TorusBlock, DiscBlock",
                "  • CapsuleBlock, IcoSphereBlock, GridBlock, NullBlock, MeshBlock, PointListBlock",
                "All dimension inputs (size, width, height, diameter, segments, subdivisions, etc.) are OPTIONAL INPUT",
                "PORTS with sensible defaults. To override them, add a GeometryInputBlock (type Float or Int) with",
                "the desired constant value and connect it to that port:",
                "  Example: connect GeometryInputBlock(Float, value=10) → PlaneBlock.size",
                "  Example: connect GeometryInputBlock(Float, value=0.5) → SphereBlock.diameter",
                "You do NOT need to add inputs for dimensions you want to keep at their defaults.",
                "",
                "## The Simplest Geometry Graph",
                "```",
                "BoxBlock.geometry → GeometryOutputBlock.geometry",
                "```",
                "That's it — one source block connected to the output. This generates a default box.",
                "",
                "## Transforming Geometry",
                "Use GeometryTransformBlock to translate, rotate, or scale geometry.",
                "It accepts geometry on 'value' and has built-in translation/rotation/scaling inputs:",
                "```",
                "BoxBlock.geometry → GeometryTransformBlock.value",
                "GeometryInputBlock(Vector3, value={x:0,y:2,z:0}) → GeometryTransformBlock.translation",
                "GeometryTransformBlock.output → GeometryOutputBlock.geometry",
                "```",
                "Alternatively, wire a TranslationBlock (or RotationXBlock/ScalingBlock) to the 'matrix' input",
                "for more complex multi-step transforms:",
                "```",
                "GeometryInputBlock(Vector3, {x:0,y:2,z:0}) → TranslationBlock.translation",
                "TranslationBlock.matrix → GeometryTransformBlock.matrix",
                "```",
                "",
                "## Merging Geometries",
                "Use MergeGeometryBlock to combine multiple geometries:",
                "```",
                "BoxBlock.geometry → MergeGeometryBlock.geometry0",
                "SphereBlock.geometry → MergeGeometryBlock.geometry1",
                "MergeGeometryBlock.output → GeometryOutputBlock.geometry",
                "```",
                "",
                "## Boolean Operations",
                "Use BooleanGeometryBlock for CSG operations (Intersect, Subtract, Union):",
                "```",
                "BoxBlock.geometry → BooleanGeometryBlock.geometry0",
                "SphereBlock.geometry → BooleanGeometryBlock.geometry1",
                "BooleanGeometryBlock.output → GeometryOutputBlock.geometry",
                "```",
                "",
                "## Instancing / Scattering",
                "Create copies of geometry arranged in patterns:",
                "  • InstantiateLinearBlock — line of copies along a direction",
                "  • InstantiateRadialBlock — copies arranged in a circle",
                "  • InstantiateOnFacesBlock — scatter copies on faces of source geometry",
                "  • InstantiateOnVerticesBlock — place copies at vertices of source geometry",
                "  • InstantiateOnVolumeBlock — scatter copies inside a volume",
                "",
                "## Per-Vertex Modification",
                "Use Set blocks (evaluateContext=true, the default) to modify vertices individually:",
                "```",
                "BoxBlock.geometry → SetPositionsBlock.geometry",
                "GeometryInputBlock(contextualValue:'Positions') → MathBlock.left   (positions, Vector3)",
                "NoiseBlock.output → VectorConverterBlock['x '] → VectorConverterBlock.xyz → MathBlock.right",
                "MathBlock.output → SetPositionsBlock.positions",
                "SetPositionsBlock.output → GeometryOutputBlock.geometry",
                "```",
                "Notes:",
                "  • SetPositionsBlock.positions is a REQUIRED input (must be connected).",
                "  • NoiseBlock outputs a Float; use VectorConverterBlock to lift it to Vector3.",
                "  • The MathBlock operation should be set to Add (0) via properties: { operation: 0 }.",
                "",
                "## VectorConverterBlock — Important: Trailing-Space Input Names",
                "VectorConverterBlock input port names have a TRAILING SPACE to disambiguate from outputs:",
                "  Inputs:  'xyzw ' (Vector4), 'xyz ' (Vector3), 'xy ' (Vector2), 'zw ' (Vector2),",
                "           'x ' (Float), 'y ' (Float), 'z ' (Float), 'w ' (Float)",
                "  Outputs: 'xyzw'   (Vector4), 'xyz'   (Vector3), 'xy'   (Vector2), 'zw'   (Vector2),",
                "           'x'    (Float),   'y'    (Float),   'z'    (Float),   'w'    (Float)",
                "When calling connect_blocks to a VectorConverterBlock INPUT, you MUST include the trailing space:",
                "  connect_blocks(sourceId, 'output', vectorConverterId, 'x ')   ← note the space",
                "  connect_blocks(vectorConverterId, 'xyz', targetId, ...)        ← outputs have no space",
                "",
                "## IntFloatConverterBlock — Same Trailing-Space Pattern",
                "Inputs:  'float ' (Float), 'int ' (Int)",
                "Outputs: 'float'  (Float), 'int'  (Int)",
                "",
                "## Common Mistakes",
                "1. Forgetting GeometryOutputBlock → geometry cannot be built",
                "2. Creating GeometryInputBlock without contextualValue or value → no data provided",
                "3. Setting evaluateContext=false on Set blocks when per-vertex behaviour is needed",
                "4. Not connecting the geometry flow — every path must link back to GeometryOutputBlock",
                "5. Omitting trailing space on VectorConverterBlock / IntFloatConverterBlock inputs",
                "6. Leaving SetPositionsBlock.positions unconnected (required, not optional)",
            ].join("\n"),
        },
    ],
}));

// ═══════════════════════════════════════════════════════════════════════════
//  Prompts (reusable prompt templates)
// ═══════════════════════════════════════════════════════════════════════════

server.registerPrompt("create-box-geometry", { description: "Step-by-step instructions for building a simple box geometry" }, () => ({
    messages: [
        {
            role: "user",
            content: {
                type: "text",
                text: [
                    "Create a simple box geometry. Steps:",
                    "1. create_geometry with name 'MyBox'",
                    "2. Add BoxBlock named 'box'",
                    "3. Add GeometryOutputBlock named 'output'",
                    "4. Connect box.geometry → output.geometry",
                    "5. validate_geometry, then export_geometry_json",
                ].join("\n"),
            },
        },
    ],
}));

server.registerPrompt("create-scattered-instances", { description: "Step-by-step instructions for scattering instances of a geometry on the faces of another" }, () => ({
    messages: [
        {
            role: "user",
            content: {
                type: "text",
                text: [
                    "Create a geometry that scatters small spheres on the faces of a plane.",
                    "NOTE: PlaneBlock and SphereBlock inputs (size, diameter) are INPUT PORTS, not scalar properties.",
                    "To set them, add a GeometryInputBlock (type Float) with the desired value and connect it.",
                    "",
                    "Steps:",
                    "1. create_geometry with name 'ScatteredSpheres'",
                    "2. Add PlaneBlock named 'basePlane'",
                    "3. Add GeometryInputBlock named 'planeSize' with type 'Float', value 10",
                    "4. Connect planeSize.output → basePlane.size",
                    "5. Add SphereBlock named 'smallSphere'",
                    "6. Add GeometryInputBlock named 'sphereDiam' with type 'Float', value 0.2",
                    "7. Connect sphereDiam.output → smallSphere.diameter",
                    "8. Add GeometryInputBlock named 'count' with type 'Int', value 100",
                    "9. Add InstantiateOnFacesBlock named 'scatter'",
                    "10. Connect basePlane.geometry → scatter.geometry",
                    "11. Connect smallSphere.geometry → scatter.instance",
                    "12. Connect count.output → scatter.count",
                    "13. Add GeometryOutputBlock named 'output'",
                    "14. Connect scatter.output → output.geometry",
                    "15. validate_geometry, then export_geometry_json",
                ].join("\n"),
            },
        },
    ],
}));

// ═══════════════════════════════════════════════════════════════════════════
//  Tools
// ═══════════════════════════════════════════════════════════════════════════

// ── Geometry lifecycle ─────────────────────────────────────────────────

server.registerTool(
    "create_geometry",
    {
        description: "Create a new empty Node Geometry graph in memory. This is always the first step.",
        inputSchema: {
            name: z.string().describe("Unique name for the geometry (e.g. 'MyTerrain', 'TreeGenerator')"),
            comment: z.string().optional().describe("An optional description of what this geometry does"),
        },
    },
    async ({ name, comment }) => {
        manager.createGeometry(name, comment);
        return {
            content: [
                {
                    type: "text",
                    text: `Created geometry "${name}". Now add blocks with add_block, connect them with connect_blocks, then export with export_geometry_json.`,
                },
            ],
        };
    }
);

server.registerTool(
    "delete_geometry",
    {
        description: "Delete a geometry graph from memory.",
        inputSchema: {
            name: z.string().describe("Name of the geometry to delete"),
        },
    },
    async ({ name }) => {
        const ok = manager.deleteGeometry(name);
        return {
            content: [{ type: "text", text: ok ? `Deleted "${name}".` : `Geometry "${name}" not found.` }],
        };
    }
);

server.registerTool("list_geometries", { description: "List all geometry graphs currently in memory." }, async () => {
    const names = manager.listGeometries();
    return {
        content: [
            {
                type: "text",
                text: names.length > 0 ? `Geometries in memory:\n${names.map((n) => `  • ${n}`).join("\n")}` : "No geometries in memory.",
            },
        ],
    };
});

// ── Block operations ────────────────────────────────────────────────────

server.registerTool(
    "add_block",
    {
        description: "Add a new block to a geometry graph. Returns the block's id for use in connect_blocks.",
        inputSchema: {
            geometryName: z.string().describe("Name of the geometry to add the block to"),
            blockType: z
                .string()
                .describe(
                    "The block type from the registry (e.g. 'BoxBlock', 'GeometryInputBlock', 'MergeGeometryBlock', " +
                        "'SetPositionsBlock', 'InstantiateOnFacesBlock', etc.). Use list_block_types to see all."
                ),
            name: z.string().optional().describe("Human-friendly name for this block instance (e.g. 'myBox', 'positions')"),
            properties: z
                .record(z.string(), z.unknown())
                .optional()
                .describe(
                    "Key-value properties to set on the block. For GeometryInputBlock: type (Int/Float/Vector2/Vector3/Vector4/Matrix), " +
                        "contextualValue (None/Positions/Normals/UV/VertexID/FaceID/etc.), value (the constant value), min/max (number). " +
                        "For MathBlock: operation (MathBlockOperations: 0=Add/1=Subtract/2=Multiply/3=Divide/4=Max/5=Min). " +
                        "For BooleanGeometryBlock: operation (BooleanGeometryOperations: 0=Intersect/1=Subtract/2=Union). " +
                        "For GeometryTrigonometryBlock: operation (GeometryTrigonometryBlockOperations: 0=Cos/1=Sin/2=Abs/3=Exp/4=Round.../19=Fract/20=Exp2). " +
                        "For ConditionBlock: test (ConditionBlockTests: 0=Equal/1=NotEqual/2=LessThan...). " +
                        "Many blocks support evaluateContext (boolean) for per-vertex evaluation."
                ),
        },
    },
    async ({ geometryName, blockType, name, properties }) => {
        const result = manager.addBlock(geometryName, blockType, name, properties as Record<string, unknown>);
        if (typeof result === "string") {
            return { content: [{ type: "text", text: `Error: ${result}` }], isError: true };
        }
        const lines = [`Added block [${result.block.id}] "${result.block.name}" (${blockType}). Use this id (${result.block.id}) to connect it.`];
        if (result.warnings) {
            lines.push("", "Warnings:", ...result.warnings);
        }
        return {
            content: [
                {
                    type: "text",
                    text: lines.join("\n"),
                },
            ],
        };
    }
);

server.registerTool(
    "add_blocks_batch",
    {
        description: "Add multiple blocks at once. More efficient than calling add_block repeatedly. Returns all created block ids.",
        inputSchema: {
            geometryName: z.string().describe("Name of the geometry"),
            blocks: z
                .array(
                    z.object({
                        blockType: z.string().describe("Block type name"),
                        blockName: z.string().optional().describe("Instance name for the block"),
                        name: z.string().optional().describe("Instance name (alias for blockName)"),
                        properties: z.record(z.string(), z.unknown()).optional().describe("Block properties"),
                    })
                )
                .describe("Array of blocks to add"),
        },
    },
    async ({ geometryName, blocks }) => {
        const results: string[] = [];
        for (const blockDef of blocks) {
            const bName = blockDef.blockName ?? blockDef.name;
            const result = manager.addBlock(geometryName, blockDef.blockType, bName, blockDef.properties as Record<string, unknown>);
            if (typeof result === "string") {
                results.push(`Error adding ${blockDef.blockType}: ${result}`);
            } else {
                let line = `[${result.block.id}] ${result.block.name} (${blockDef.blockType})`;
                if (result.warnings) {
                    line += `\n  ⚠ ${result.warnings.join("\n  ⚠ ")}`;
                }
                results.push(line);
            }
        }
        return { content: [{ type: "text", text: `Added blocks:\n${results.join("\n")}` }] };
    }
);

server.registerTool(
    "remove_block",
    {
        description: "Remove a block from a geometry graph. Also removes any connections to/from it.",
        inputSchema: {
            geometryName: z.string().describe("Name of the geometry"),
            blockId: z.number().describe("The block id to remove"),
        },
    },
    async ({ geometryName, blockId }) => {
        const result = manager.removeBlock(geometryName, blockId);
        return {
            content: [{ type: "text", text: result === "OK" ? `Removed block ${blockId}.` : `Error: ${result}` }],
            isError: result !== "OK",
        };
    }
);

server.registerTool(
    "set_block_properties",
    {
        description: "Set or update properties on an existing block (e.g. change a GeometryInputBlock value, set a MathBlock operation, toggle evaluateContext).",
        inputSchema: {
            geometryName: z.string().describe("Name of the geometry"),
            blockId: z.number().describe("The block id to modify"),
            properties: z.record(z.string(), z.unknown()).describe("Key-value properties to set. Same keys as add_block's properties parameter."),
        },
    },
    async ({ geometryName, blockId, properties }) => {
        const result = manager.setBlockProperties(geometryName, blockId, properties as Record<string, unknown>);
        return {
            content: [{ type: "text", text: result === "OK" ? `Updated block ${blockId}.` : `Error: ${result}` }],
            isError: result !== "OK",
        };
    }
);

// ── Connections ──────────────────────────────────────────────────────────

server.registerTool(
    "connect_blocks",
    {
        description: "Connect an output of one block to an input of another block. Data flows from source output → target input.",
        inputSchema: {
            geometryName: z.string().describe("Name of the geometry"),
            sourceBlockId: z.number().describe("Block id to connect FROM (the one with the output)"),
            outputName: z.string().describe("Name of the output on the source block (e.g. 'output', 'geometry', 'matrix')"),
            targetBlockId: z.number().describe("Block id to connect TO (the one with the input)"),
            inputName: z.string().describe("Name of the input on the target block (e.g. 'geometry', 'value', 'positions')"),
        },
    },
    async ({ geometryName, sourceBlockId, outputName, targetBlockId, inputName }) => {
        const result = manager.connectBlocks(geometryName, sourceBlockId, outputName, targetBlockId, inputName);
        return {
            content: [
                {
                    type: "text",
                    text: result === "OK" ? `Connected [${sourceBlockId}].${outputName} → [${targetBlockId}].${inputName}` : `Error: ${result}`,
                },
            ],
            isError: result !== "OK",
        };
    }
);

server.registerTool(
    "connect_blocks_batch",
    {
        description: "Connect multiple block pairs at once. More efficient than calling connect_blocks repeatedly.",
        inputSchema: {
            geometryName: z.string().describe("Name of the geometry"),
            connections: z
                .array(
                    z.object({
                        sourceBlockId: z.number(),
                        outputName: z.string(),
                        targetBlockId: z.number(),
                        inputName: z.string(),
                    })
                )
                .describe("Array of connections to make"),
        },
    },
    async ({ geometryName, connections }) => {
        const results: string[] = [];
        for (const conn of connections) {
            const result = manager.connectBlocks(geometryName, conn.sourceBlockId, conn.outputName, conn.targetBlockId, conn.inputName);
            if (result === "OK") {
                results.push(`[${conn.sourceBlockId}].${conn.outputName} → [${conn.targetBlockId}].${conn.inputName}`);
            } else {
                results.push(`Error: ${result}`);
            }
        }
        return { content: [{ type: "text", text: `Connections:\n${results.join("\n")}` }] };
    }
);

server.registerTool(
    "disconnect_input",
    {
        description: "Disconnect an input on a block (remove an existing connection).",
        inputSchema: {
            geometryName: z.string().describe("Name of the geometry"),
            blockId: z.number().describe("The block id whose input to disconnect"),
            inputName: z.string().describe("Name of the input to disconnect"),
        },
    },
    async ({ geometryName, blockId, inputName }) => {
        const result = manager.disconnectInput(geometryName, blockId, inputName);
        return {
            content: [{ type: "text", text: result === "OK" ? `Disconnected [${blockId}].${inputName}` : `Error: ${result}` }],
            isError: result !== "OK",
        };
    }
);

// ── Query tools ─────────────────────────────────────────────────────────

server.registerTool(
    "describe_geometry",
    {
        description: "Get a human-readable description of the current state of a geometry graph, " + "including all blocks and their connections.",
        inputSchema: {
            geometryName: z.string().describe("Name of the geometry to describe"),
        },
    },
    async ({ geometryName }) => {
        const desc = manager.describeGeometry(geometryName);
        return { content: [{ type: "text", text: desc }] };
    }
);

server.registerTool(
    "describe_block",
    {
        description: "Get detailed information about a specific block instance in a geometry, including its connections and properties.",
        inputSchema: {
            geometryName: z.string().describe("Name of the geometry"),
            blockId: z.number().describe("The block id to describe"),
        },
    },
    async ({ geometryName, blockId }) => {
        const desc = manager.describeBlock(geometryName, blockId);
        return { content: [{ type: "text", text: desc }] };
    }
);

server.registerTool(
    "list_block_types",
    {
        description: "List all available NGE block types, grouped by category. Use this to discover which blocks you can add.",
        inputSchema: {
            category: z
                .string()
                .optional()
                .describe(
                    "Optionally filter by category (Source, Geometry, Set, Instance, Math, Vector, Color, Matrix, Converter, Texture, Utility, Teleport, Input, Output, Mapping)"
                ),
        },
    },
    async ({ category }) => {
        if (category) {
            const matching = Object.entries(BlockRegistry)
                .filter(([, info]) => info.category.toLowerCase() === category.toLowerCase())
                .map(([key, info]) => `  ${key}: ${info.description.split(".")[0]}`)
                .join("\n");
            return {
                content: [
                    {
                        type: "text",
                        text: matching.length > 0 ? `## ${category} Blocks\n${matching}` : `No blocks found in category "${category}".`,
                    },
                ],
            };
        }
        return { content: [{ type: "text", text: GetBlockCatalogSummary() }] };
    }
);

server.registerTool(
    "get_block_type_info",
    {
        description: "Get detailed info about a specific block type — its inputs, outputs, properties, and description.",
        inputSchema: {
            blockType: z.string().describe("The block type name (e.g. 'BoxBlock', 'GeometryInputBlock', 'InstantiateOnFacesBlock')"),
        },
    },
    async ({ blockType }) => {
        const info = GetBlockTypeDetails(blockType);
        if (!info) {
            return {
                content: [{ type: "text", text: `Block type "${blockType}" not found. Use list_block_types to see available types.` }],
                isError: true,
            };
        }

        const lines: string[] = [];
        lines.push(`## ${blockType}`);
        lines.push(`Category: ${info.category}`);
        lines.push(`Description: ${info.description}`);

        lines.push("\n### Inputs:");
        if (info.inputs.length === 0) {
            lines.push("  (none)");
        }
        for (const inp of info.inputs) {
            const opt = inp.isOptional ? " (optional)" : " (required)";
            lines.push(`  • ${inp.name}: ${inp.type}${opt}`);
        }

        lines.push("\n### Outputs:");
        if (info.outputs.length === 0) {
            lines.push("  (none)");
        }
        for (const out of info.outputs) {
            lines.push(`  • ${out.name}: ${out.type}`);
        }

        if (info.properties) {
            lines.push("\n### Configurable Properties:");
            for (const [k, v] of Object.entries(info.properties)) {
                lines.push(`  • ${k}: ${v}`);
            }
        }

        return { content: [{ type: "text", text: lines.join("\n") }] };
    }
);

// ── Validation ──────────────────────────────────────────────────────────

server.registerTool(
    "validate_geometry",
    {
        description: "Run validation checks on a geometry graph. Reports missing output block, unconnected required inputs, and broken references.",
        inputSchema: {
            geometryName: z.string().describe("Name of the geometry to validate"),
        },
    },
    async ({ geometryName }) => {
        const issues = manager.validateGeometry(geometryName);
        return {
            content: [{ type: "text", text: issues.join("\n") }],
            isError: issues.some((i) => i.startsWith("ERROR")),
        };
    }
);

// ── Export / Import ─────────────────────────────────────────────────────

server.registerTool(
    "export_geometry_json",
    {
        description:
            "Export the geometry graph as NGE-compatible JSON. This JSON can be loaded in the Babylon.js Node Geometry Editor " +
            "or via NodeGeometry.Parse() at runtime. " +
            "When outputFile is provided, the JSON is written to disk and only the file path is returned " +
            "(avoids large JSON payloads in the conversation context).",
        inputSchema: {
            geometryName: z.string().describe("Name of the geometry to export"),
            outputFile: z
                .string()
                .optional()
                .describe("Optional absolute file path. When provided, the JSON is written to this file and the path is returned instead of the full JSON."),
        },
    },
    async ({ geometryName, outputFile }) => {
        const json = manager.exportJSON(geometryName);
        if (!json) {
            return { content: [{ type: "text", text: `Geometry "${geometryName}" not found.` }], isError: true };
        }
        if (outputFile) {
            try {
                mkdirSync(dirname(outputFile), { recursive: true });
                writeFileSync(outputFile, json, "utf-8");
                return { content: [{ type: "text", text: `NGE JSON written to: ${outputFile}` }] };
            } catch (e) {
                return { content: [{ type: "text", text: `Error writing file: ${(e as Error).message}` }], isError: true };
            }
        }
        return { content: [{ type: "text", text: json }] };
    }
);

server.registerTool(
    "import_geometry_json",
    {
        description:
            "Import an existing NGE JSON into memory for editing. You can then modify blocks, connections, etc. " +
            "Provide either the inline json string OR a jsonFile path (not both).",
        inputSchema: {
            geometryName: z.string().describe("Name to give the imported geometry"),
            json: z.string().optional().describe("The NGE JSON string to import"),
            jsonFile: z.string().optional().describe("Absolute path to a file containing the NGE JSON to import (alternative to inline json)"),
        },
    },
    async ({ geometryName, json, jsonFile }) => {
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
        const result = manager.importJSON(geometryName, jsonStr);
        if (result !== "OK") {
            return { content: [{ type: "text", text: `Error: ${result}` }], isError: true };
        }
        const desc = manager.describeGeometry(geometryName);
        return { content: [{ type: "text", text: `Imported successfully.\n\n${desc}` }] };
    }
);

// ── Snippet / URL helpers ───────────────────────────────────────────────

server.registerTool(
    "get_snippet_url",
    {
        description: "Generate a URL that opens the geometry in the online Babylon.js Node Geometry Editor. " + "The JSON is encoded in the URL fragment.",
        inputSchema: {
            geometryName: z.string().describe("Name of the geometry"),
        },
    },
    async ({ geometryName }) => {
        const json = manager.exportJSON(geometryName);
        if (!json) {
            return { content: [{ type: "text", text: `Geometry "${geometryName}" not found.` }], isError: true };
        }
        const encoded = Buffer.from(json).toString("base64");
        const url = `https://nge.babylonjs.com/#${encoded}`;
        return {
            content: [
                {
                    type: "text",
                    text: `Open this geometry in the NGE editor:\n${url}\n\nNote: For very large geometries, use the snippet server instead.`,
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
    console.error("Babylon.js Node Geometry Editor MCP Server running on stdio");
}

try {
    await Main();
} catch (err) {
    console.error("Fatal error:", err);
    process.exit(1);
}

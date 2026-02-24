#!/usr/bin/env node
/* eslint-disable @typescript-eslint/naming-convention */
/* eslint-disable no-console */
/**
 * NME MCP Server
 * ──────────────
 * A Model Context Protocol server that exposes tools for building Babylon.js
 * Node Materials programmatically.  An AI agent (or any MCP client) can:
 *
 *   • Create / manage material graphs
 *   • Add blocks from the full NME block catalog
 *   • Connect blocks together
 *   • Set block properties (uniform values, system values, etc.)
 *   • Validate the graph
 *   • Export the final material JSON (loadable by NME / NodeMaterial.parseSerializedObject)
 *   • Import existing NME JSON for editing
 *   • Query block type info and the catalog
 *
 * Transport: stdio  (the standard MCP transport for local tool servers)
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod/v4";

import { BlockRegistry, GetBlockCatalogSummary, GetBlockTypeDetails } from "./blockRegistry.js";
import { MaterialGraphManager } from "./materialGraph.js";

// ─── Singleton graph manager ──────────────────────────────────────────────
const manager = new MaterialGraphManager();

// ─── MCP Server ───────────────────────────────────────────────────────────
const server = new McpServer({
    name: "babylonjs-nme",
    version: "1.0.0",
});

// ═══════════════════════════════════════════════════════════════════════════
//  Resources (read-only reference data)
// ═══════════════════════════════════════════════════════════════════════════

server.resource("block-catalog", "nme://block-catalog", async (uri) => ({
    contents: [
        {
            uri: uri.href,
            mimeType: "text/markdown",
            text: `# NME Block Catalog\n${GetBlockCatalogSummary()}`,
        },
    ],
}));

server.resource("enums", "nme://enums", async (uri) => ({
    contents: [
        {
            uri: uri.href,
            mimeType: "text/markdown",
            text: [
                "# NME Enumerations Reference",
                "",
                "## NodeMaterialModes",
                "Material (0), PostProcess (1), Particle (2), ProceduralTexture (3), GaussianSplatting (4), SFE (5)",
                "",
                "## NodeMaterialBlockConnectionPointTypes",
                "Float (1), Int (2), Vector2 (4), Vector3 (8), Vector4 (16), Color3 (32), Color4 (64), Matrix (128), Object (256), AutoDetect (1073741824)",
                "",
                "## NodeMaterialSystemValues (for InputBlock)",
                "World (1), View (2), Projection (3), ViewProjection (4), WorldView (5), WorldViewProjection (6), CameraPosition (7), FogColor (8), DeltaTime (9), CameraParameters (10), MaterialAlpha (11)",
                "",
                "## Common Attributes (for InputBlock)",
                "position, normal, tangent, uv, uv2, uv3, uv4, uv5, uv6, color, matricesIndices, matricesWeights",
                "",
                "## TrigonometryBlockOperations",
                "Cos, Sin, Abs, Exp, Exp2, Round, Floor, Ceiling, Sqrt, Log, Tan, ArcTan, ArcCos, ArcSin, Fract, Sign, Radians, Degrees",
                "",
                "## ConditionalBlockConditions",
                "Equal, NotEqual, LessThan, GreaterThan, LessOrEqual, GreaterOrEqual, Xor, Or, And",
            ].join("\n"),
        },
    ],
}));

// ═══════════════════════════════════════════════════════════════════════════
//  Prompts (reusable prompt templates)
// ═══════════════════════════════════════════════════════════════════════════

server.prompt("create-pbr-material", "Step-by-step instructions for building a basic PBR material", () => ({
    messages: [
        {
            role: "user",
            content: {
                type: "text",
                text: [
                    "Create a basic PBR metallic-roughness material. Steps:",
                    "1. create_material with name 'MyPBR', mode 'Material'",
                    "2. Add InputBlock for 'position' attribute (type Vector3, attributeName 'position')",
                    "3. Add InputBlock for 'normal' attribute (type Vector3, attributeName 'normal')",
                    "4. Add InputBlock for 'worldViewProjection' system value (type Matrix, systemValue 'WorldViewProjection')",
                    "5. Add InputBlock for 'world' system value (type Matrix, systemValue 'World')",
                    "6. Add InputBlock for 'view' system value (type Matrix, systemValue 'View')",
                    "7. Add InputBlock for 'cameraPosition' system value (type Vector3, systemValue 'CameraPosition')",
                    "8. Add TransformBlock named 'worldPos' — connect world → transform, position → vector",
                    "9. Add TransformBlock named 'clipPos' — connect worldViewProjection → transform, position → vector",
                    "10. Add VertexOutputBlock — connect clipPos.output → vector",
                    "11. Add PBRMetallicRoughnessBlock — connect worldPos output → worldPosition, normal → worldNormal, etc.",
                    "12. Add InputBlock for baseColor (type Color3, value {r:0.8, g:0.2, b:0.2})",
                    "13. Add InputBlock for metallic (type Float, value 0.0)",
                    "14. Add InputBlock for roughness (type Float, value 0.5)",
                    "15. Connect baseColor, metallic, roughness to the PBR block",
                    "16. Add FragmentOutputBlock — connect PBR.lighting → rgb",
                    "17. validate_material, then export_material_json",
                ].join("\n"),
            },
        },
    ],
}));

server.prompt("create-simple-color-material", "Create the simplest possible unlit colored material", () => ({
    messages: [
        {
            role: "user",
            content: {
                type: "text",
                text: [
                    "Create the simplest unlit material that outputs a solid color. Steps:",
                    "1. create_material 'SimpleColor'",
                    "2. Add InputBlock type Vector3, attributeName 'position', name 'position'",
                    "3. Add InputBlock type Matrix, systemValue 'WorldViewProjection', name 'wvp'",
                    "4. Add TransformBlock name 'transform' — connect wvp→transform, position→vector",
                    "5. Add VertexOutputBlock — connect transform.output→vector",
                    "6. Add InputBlock type Color3, value {r:1, g:0, b:0}, name 'color'",
                    "7. Add FragmentOutputBlock — connect color.output→rgb",
                    "8. validate_material, then export_material_json",
                ].join("\n"),
            },
        },
    ],
}));

// ═══════════════════════════════════════════════════════════════════════════
//  Tools
// ═══════════════════════════════════════════════════════════════════════════

// ── Material lifecycle ─────────────────────────────────────────────────

server.tool(
    "create_material",
    "Create a new empty Node Material graph in memory. This is always the first step.",
    {
        name: z.string().describe("Unique name for the material (e.g. 'MyPBR', 'GlowEffect')"),
        mode: z
            .enum(["Material", "PostProcess", "Particle", "ProceduralTexture", "GaussianSplatting", "SFE"])
            .default("Material")
            .describe("The material mode. Use 'Material' for standard mesh materials."),
        comment: z.string().optional().describe("An optional description of what this material does"),
    },
    async ({ name, mode, comment }) => {
        manager.createMaterial(name, mode, comment);
        return {
            content: [
                {
                    type: "text",
                    text: `Created material "${name}" (mode: ${mode}). Now add blocks with add_block, connect them with connect_blocks, then export with export_material_json.`,
                },
            ],
        };
    }
);

server.tool(
    "delete_material",
    "Delete a material graph from memory.",
    {
        name: z.string().describe("Name of the material to delete"),
    },
    async ({ name }) => {
        const ok = manager.deleteMaterial(name);
        return {
            content: [{ type: "text", text: ok ? `Deleted "${name}".` : `Material "${name}" not found.` }],
        };
    }
);

server.tool("list_materials", "List all material graphs currently in memory.", {}, async () => {
    const names = manager.listMaterials();
    return {
        content: [
            {
                type: "text",
                text: names.length > 0 ? `Materials in memory:\n${names.map((n) => `  • ${n}`).join("\n")}` : "No materials in memory.",
            },
        ],
    };
});

// ── Block operations ────────────────────────────────────────────────────

server.tool(
    "add_block",
    "Add a new block to a material graph. Returns the block's id for use in connect_blocks.",
    {
        materialName: z.string().describe("Name of the material to add the block to"),
        blockType: z
            .string()
            .describe(
                "The block type from the registry (e.g. 'InputBlock', 'MultiplyBlock', 'PBRMetallicRoughnessBlock', 'TransformBlock', etc.). Use list_block_types to see all."
            ),
        name: z.string().optional().describe("Human-friendly name for this block instance (e.g. 'myColor', 'worldMatrix')"),
        properties: z
            .record(z.string(), z.unknown())
            .optional()
            .describe(
                "Key-value properties to set on the block. For InputBlock: type (Float/Vector2/Vector3/Vector4/Color3/Color4/Matrix), " +
                    "value (the constant value), systemValue (World/View/Projection/etc.), attributeName (position/normal/uv/etc.), " +
                    "isConstant (boolean), animationType (None/Time), min/max (number). " +
                    "For TrigonometryBlock: operation (Cos/Sin/Abs/etc.). " +
                    "For ConditionalBlock: condition (Equal/LessThan/etc.)."
            ),
    },
    async ({ materialName, blockType, name, properties }) => {
        const result = manager.addBlock(materialName, blockType, name, properties as Record<string, unknown>);
        if (typeof result === "string") {
            return { content: [{ type: "text", text: `Error: ${result}` }], isError: true };
        }
        return {
            content: [
                {
                    type: "text",
                    text: `Added block [${result.id}] "${result.name}" (${blockType}). Use this id (${result.id}) to connect it.`,
                },
            ],
        };
    }
);

server.tool(
    "remove_block",
    "Remove a block from a material graph. Also removes any connections to/from it.",
    {
        materialName: z.string().describe("Name of the material"),
        blockId: z.number().describe("The block id to remove"),
    },
    async ({ materialName, blockId }) => {
        const result = manager.removeBlock(materialName, blockId);
        return {
            content: [{ type: "text", text: result === "OK" ? `Removed block ${blockId}.` : `Error: ${result}` }],
            isError: result !== "OK",
        };
    }
);

server.tool(
    "set_block_properties",
    "Set or update properties on an existing block (e.g. change an InputBlock value, set a TrigonometryBlock operation).",
    {
        materialName: z.string().describe("Name of the material"),
        blockId: z.number().describe("The block id to modify"),
        properties: z.record(z.string(), z.unknown()).describe("Key-value properties to set. Same keys as add_block's properties parameter."),
    },
    async ({ materialName, blockId, properties }) => {
        const result = manager.setBlockProperties(materialName, blockId, properties as Record<string, unknown>);
        return {
            content: [{ type: "text", text: result === "OK" ? `Updated block ${blockId}.` : `Error: ${result}` }],
            isError: result !== "OK",
        };
    }
);

// ── Connections ──────────────────────────────────────────────────────────

server.tool(
    "connect_blocks",
    "Connect an output of one block to an input of another block. Data flows from source output → target input.",
    {
        materialName: z.string().describe("Name of the material"),
        sourceBlockId: z.number().describe("Block id to connect FROM (the one with the output)"),
        outputName: z.string().describe("Name of the output on the source block (e.g. 'output', 'rgb', 'xyz')"),
        targetBlockId: z.number().describe("Block id to connect TO (the one with the input)"),
        inputName: z.string().describe("Name of the input on the target block (e.g. 'vector', 'left', 'color')"),
    },
    async ({ materialName, sourceBlockId, outputName, targetBlockId, inputName }) => {
        const result = manager.connectBlocks(materialName, sourceBlockId, outputName, targetBlockId, inputName);
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

server.tool(
    "disconnect_input",
    "Disconnect an input on a block (remove an existing connection).",
    {
        materialName: z.string().describe("Name of the material"),
        blockId: z.number().describe("The block id whose input to disconnect"),
        inputName: z.string().describe("Name of the input to disconnect"),
    },
    async ({ materialName, blockId, inputName }) => {
        const result = manager.disconnectInput(materialName, blockId, inputName);
        return {
            content: [{ type: "text", text: result === "OK" ? `Disconnected [${blockId}].${inputName}` : `Error: ${result}` }],
            isError: result !== "OK",
        };
    }
);

// ── Query tools ─────────────────────────────────────────────────────────

server.tool(
    "describe_material",
    "Get a human-readable description of the current state of a material graph, " + "including all blocks and their connections.",
    {
        materialName: z.string().describe("Name of the material to describe"),
    },
    async ({ materialName }) => {
        const desc = manager.describeMaterial(materialName);
        return { content: [{ type: "text", text: desc }] };
    }
);

server.tool(
    "describe_block",
    "Get detailed information about a specific block instance in a material, including its connections and properties.",
    {
        materialName: z.string().describe("Name of the material"),
        blockId: z.number().describe("The block id to describe"),
    },
    async ({ materialName, blockId }) => {
        const desc = manager.describeBlock(materialName, blockId);
        return { content: [{ type: "text", text: desc }] };
    }
);

server.tool(
    "list_block_types",
    "List all available NME block types, grouped by category. Use this to discover which blocks you can add.",
    {
        category: z.string().optional().describe("Optionally filter by category (Input, Math, Vector, Color, Texture, PBR, Output, etc.)"),
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

server.tool(
    "get_block_type_info",
    "Get detailed info about a specific block type — its inputs, outputs, properties, and description.",
    {
        blockType: z.string().describe("The block type name (e.g. 'PBRMetallicRoughnessBlock', 'InputBlock')"),
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
        lines.push(`Target: ${info.target}`);
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

server.tool(
    "validate_material",
    "Run validation checks on a material graph. Reports missing outputs, unconnected required inputs, and broken references.",
    {
        materialName: z.string().describe("Name of the material to validate"),
    },
    async ({ materialName }) => {
        const issues = manager.validateMaterial(materialName);
        return {
            content: [{ type: "text", text: issues.join("\n") }],
            isError: issues.some((i) => i.startsWith("ERROR")),
        };
    }
);

// ── Export / Import ─────────────────────────────────────────────────────

server.tool(
    "export_material_json",
    "Export the material graph as NME-compatible JSON. This JSON can be loaded in the Babylon.js Node Material Editor " + "or via NodeMaterial.Parse() at runtime.",
    {
        materialName: z.string().describe("Name of the material to export"),
    },
    async ({ materialName }) => {
        const json = manager.exportJSON(materialName);
        if (!json) {
            return { content: [{ type: "text", text: `Material "${materialName}" not found.` }], isError: true };
        }
        return { content: [{ type: "text", text: json }] };
    }
);

server.tool(
    "import_material_json",
    "Import an existing NME JSON into memory for editing. You can then modify blocks, connections, etc.",
    {
        materialName: z.string().describe("Name to give the imported material"),
        json: z.string().describe("The NME JSON string to import"),
    },
    async ({ materialName, json }) => {
        const result = manager.importJSON(materialName, json);
        if (result !== "OK") {
            return { content: [{ type: "text", text: `Error: ${result}` }], isError: true };
        }
        const desc = manager.describeMaterial(materialName);
        return { content: [{ type: "text", text: `Imported successfully.\n\n${desc}` }] };
    }
);

// ── Snippet / URL helpers ───────────────────────────────────────────────

server.tool(
    "get_snippet_url",
    "Generate a URL that opens the material in the online Babylon.js Node Material Editor. " + "The JSON is encoded in the URL fragment.",
    {
        materialName: z.string().describe("Name of the material"),
    },
    async ({ materialName }) => {
        const json = manager.exportJSON(materialName);
        if (!json) {
            return { content: [{ type: "text", text: `Material "${materialName}" not found.` }], isError: true };
        }
        // Base64-encode the JSON for the NME URL
        const encoded = Buffer.from(json).toString("base64");
        const url = `https://nme.babylonjs.com/#${encoded}`;
        return {
            content: [
                {
                    type: "text",
                    text: `Open this material in the NME editor:\n${url}\n\nNote: For very large materials, use the snippet server instead (save to playground).`,
                },
            ],
        };
    }
);

// ── Batch operations ────────────────────────────────────────────────────

server.tool(
    "add_blocks_batch",
    "Add multiple blocks at once. More efficient than calling add_block repeatedly. Returns all created block ids.",
    {
        materialName: z.string().describe("Name of the material"),
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
    async ({ materialName, blocks }) => {
        const results: string[] = [];
        for (const blockDef of blocks) {
            const bName = blockDef.blockName ?? blockDef.name;
            const result = manager.addBlock(materialName, blockDef.blockType, bName, blockDef.properties as Record<string, unknown>);
            if (typeof result === "string") {
                results.push(`Error adding ${blockDef.blockType}: ${result}`);
            } else {
                results.push(`[${result.id}] ${result.name} (${blockDef.blockType})`);
            }
        }
        return { content: [{ type: "text", text: `Added blocks:\n${results.join("\n")}` }] };
    }
);

server.tool(
    "connect_blocks_batch",
    "Connect multiple block pairs at once. More efficient than calling connect_blocks repeatedly.",
    {
        materialName: z.string().describe("Name of the material"),
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
    async ({ materialName, connections }) => {
        const results: string[] = [];
        for (const conn of connections) {
            const result = manager.connectBlocks(materialName, conn.sourceBlockId, conn.outputName, conn.targetBlockId, conn.inputName);
            if (result === "OK") {
                results.push(`[${conn.sourceBlockId}].${conn.outputName} → [${conn.targetBlockId}].${conn.inputName}`);
            } else {
                results.push(`Error: ${result}`);
            }
        }
        return { content: [{ type: "text", text: `Connections:\n${results.join("\n")}` }] };
    }
);

// ═══════════════════════════════════════════════════════════════════════════
//  Start the server
// ═══════════════════════════════════════════════════════════════════════════

async function Main() {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error("Babylon.js Node Material Editor MCP Server running on stdio");
}

try {
    await Main();
} catch (err) {
    console.error("Fatal error:", err);
    process.exit(1);
}

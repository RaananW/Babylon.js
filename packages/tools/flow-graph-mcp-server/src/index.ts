#!/usr/bin/env node
/* eslint-disable @typescript-eslint/naming-convention */
/* eslint-disable no-console */
/**
 * Flow Graph MCP Server
 * ─────────────────────
 * A Model Context Protocol server that exposes tools for building Babylon.js
 * Flow Graphs programmatically. An AI agent (or any MCP client) can:
 *
 *   • Create / manage flow graph instances
 *   • Add blocks from the full Flow Graph block catalog (~140 block types)
 *   • Connect blocks with signal connections (execution flow) and data connections
 *   • Set block configuration
 *   • Set context variables
 *   • Validate the graph
 *   • Export the final JSON (loadable by FlowGraphCoordinator.parse())
 *   • Import existing Flow Graph JSON for editing
 *   • Query block type info and the catalog
 *
 * Transport: stdio (the standard MCP transport for local tool servers)
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod/v4";

import { FlowGraphBlockRegistry, GetBlockCatalogSummary, GetBlockTypeDetails } from "./blockRegistry.js";
import { FlowGraphManager } from "./flowGraphManager.js";

// ─── Singleton graph manager ──────────────────────────────────────────────
const manager = new FlowGraphManager();

// ─── MCP Server ───────────────────────────────────────────────────────────
const server = new McpServer({
    name: "babylonjs-flow-graph",
    version: "1.0.0",
});

// ═══════════════════════════════════════════════════════════════════════════
//  Resources (read-only reference data)
// ═══════════════════════════════════════════════════════════════════════════

server.resource("block-catalog", "flow-graph://block-catalog", async (uri) => ({
    contents: [
        {
            uri: uri.href,
            mimeType: "text/markdown",
            text: `# Flow Graph Block Catalog\n${GetBlockCatalogSummary()}`,
        },
    ],
}));

server.resource("rich-types", "flow-graph://rich-types", async (uri) => ({
    contents: [
        {
            uri: uri.href,
            mimeType: "text/markdown",
            text: [
                "# Flow Graph Rich Types Reference",
                "",
                "These are the data types used in Flow Graph data connections:",
                "",
                "| Type | Default Value | Description |",
                "|------|---------------|-------------|",
                "| `any` | undefined | Generic type, accepts any value |",
                '| `string` | "" | Text string |',
                "| `number` | 0 | Floating-point number |",
                "| `boolean` | false | True/false |",
                "| `FlowGraphInteger` | 0 | Integer value |",
                "| `Vector2` | (0, 0) | 2D vector |",
                "| `Vector3` | (0, 0, 0) | 3D vector |",
                "| `Vector4` | (0, 0, 0, 0) | 4D vector |",
                "| `Quaternion` | (0, 0, 0, 1) | Rotation quaternion |",
                "| `Matrix` | Identity 4x4 | 4x4 transformation matrix |",
                "| `Color3` | (0, 0, 0) | RGB color |",
                "| `Color4` | (0, 0, 0, 0) | RGBA color |",
                "",
                "## Serialized Value Formats",
                "",
                "When providing values in config, use these JSON formats:",
                "- **number**: `42`, `3.14`",
                "- **boolean**: `true`, `false`",
                '- **string**: `"hello"`',
                '- **Vector3**: `{ "value": [1, 2, 3], "className": "Vector3" }`',
                '- **Color3**: `{ "value": [1, 0, 0], "className": "Color3" }`',
                '- **Quaternion**: `{ "value": [0, 0, 0, 1], "className": "Quaternion" }`',
                '- **Matrix**: `{ "value": [1,0,0,0, 0,1,0,0, 0,0,1,0, 0,0,0,1], "className": "Matrix" }`',
                '- **Mesh reference**: `{ "name": "myMesh", "className": "Mesh", "id": "mesh-id" }`',
                "",
                "## Connection Types",
                "",
                "Flow Graphs have two types of connections:",
                "1. **Signal connections** — control execution flow (like wires in a circuit). Signal outputs connect to signal inputs.",
                "2. **Data connections** — carry typed values between blocks. Data inputs connect FROM data outputs.",
            ].join("\n"),
        },
    ],
}));

server.resource("concepts", "flow-graph://concepts", async (uri) => ({
    contents: [
        {
            uri: uri.href,
            mimeType: "text/markdown",
            text: [
                "# Flow Graph Concepts",
                "",
                "## What is a Flow Graph?",
                "A Flow Graph is a visual scripting system in Babylon.js that defines scene interactions",
                "using an action-block-based graph. It uses an event-driven execution model where:",
                "",
                "1. **Event blocks** (e.g. SceneReady, MeshPick, SceneTick) serve as entry points",
                "2. **Execution blocks** process logic when triggered by signals (Branch, ForLoop, SetProperty, etc.)",
                "3. **Data blocks** provide values (constants, variables, math operations) that feed into execution blocks",
                "",
                "## Signal Flow vs Data Flow",
                "- **Signal flow** (execution): Event → Execution Block → Execution Block → ...",
                "  - Connected via `connect_signal`: source signal output → target signal input",
                "  - Controls WHEN blocks execute",
                "- **Data flow** (values): Data Block output → Execution Block input",
                "  - Connected via `connect_data`: source data output → target data input",
                "  - Controls WHAT values blocks use",
                "",
                "## Common Patterns",
                "",
                "### On scene ready, log a message:",
                "SceneReadyEvent.out → ConsoleLog.in, with message data input",
                "",
                "### On click, toggle visibility:",
                "MeshPickEvent.out → Branch.in",
                "GetProperty(visible).value → Branch.condition",
                "Branch.onTrue → SetProperty(visible=false).in",
                "Branch.onFalse → SetProperty(visible=true).in",
                "",
                "### Animate on click:",
                "MeshPickEvent.out → PlayAnimation.in",
                "ValueInterpolation.animation → PlayAnimation.animation",
                "",
                "## Context Variables",
                "Variables persist across graph executions and can be shared between blocks:",
                "- SetVariable stores a value",
                "- GetVariable retrieves a value",
                "- Use set_variable tool to initialize values before export",
            ].join("\n"),
        },
    ],
}));

// ═══════════════════════════════════════════════════════════════════════════
//  Prompts (reusable prompt templates)
// ═══════════════════════════════════════════════════════════════════════════

server.prompt("create-click-handler", "Create a flow graph that responds to mesh clicks", () => ({
    messages: [
        {
            role: "user",
            content: {
                type: "text",
                text: [
                    "Create a flow graph that responds when a mesh is clicked. Steps:",
                    "1. create_graph with name 'ClickHandler'",
                    "2. Add MeshPickEvent block (this is the entry point)",
                    "3. Add ConsoleLog block to log the picked point",
                    "4. Connect MeshPickEvent signal: connect_signal MeshPickEvent.out → ConsoleLog.in",
                    "5. Connect data: connect_data MeshPickEvent.pickedPoint → ConsoleLog.message",
                    "6. validate_graph, then export_graph_json",
                ].join("\n"),
            },
        },
    ],
}));

server.prompt("create-toggle-visibility", "Create a flow graph that toggles mesh visibility on click", () => ({
    messages: [
        {
            role: "user",
            content: {
                type: "text",
                text: [
                    "Create a flow graph that toggles a mesh's visibility when clicked. Steps:",
                    "1. create_graph 'ToggleVisibility'",
                    "2. Add MeshPickEvent block",
                    "3. Add GetProperty block with config { propertyName: 'isVisible' }",
                    "4. Connect MeshPickEvent.pickedMesh → GetProperty.object",
                    "5. Add Branch block",
                    "6. Connect MeshPickEvent.out → Branch.in (signal)",
                    "7. Connect GetProperty.value → Branch.condition (data)",
                    "8. Add two SetProperty blocks: one for visible=false, one for visible=true",
                    "   - First SetProperty config: { propertyName: 'isVisible' }, with Constant(false) for value",
                    "   - Second SetProperty config: { propertyName: 'isVisible' }, with Constant(true) for value",
                    "9. Connect Branch.onTrue → SetProperty(false).in",
                    "10. Connect Branch.onFalse → SetProperty(true).in",
                    "11. Connect MeshPickEvent.pickedMesh to both SetProperty.object inputs",
                    "12. validate_graph, then export_graph_json",
                ].join("\n"),
            },
        },
    ],
}));

server.prompt("create-animation-on-ready", "Create a flow graph that plays an animation when the scene is ready", () => ({
    messages: [
        {
            role: "user",
            content: {
                type: "text",
                text: [
                    "Create a flow graph that plays an animation when the scene is ready. Steps:",
                    "1. create_graph 'AnimateOnReady'",
                    "2. Add SceneReadyEvent block (entry point)",
                    "3. Add PlayAnimation block",
                    "4. Connect SceneReadyEvent.out → PlayAnimation.in (signal)",
                    "5. Add GetAsset block to get an animation group, with appropriate config",
                    "6. Connect GetAsset.value → PlayAnimation.animationGroup (data)",
                    "7. Add Constant block for speed (e.g. config { value: 1 })",
                    "8. Connect Constant.output → PlayAnimation.speed (data)",
                    "9. Add Constant block for loop (config { value: true })",
                    "10. Connect loop Constant.output → PlayAnimation.loop (data)",
                    "11. validate_graph, then export_graph_json",
                ].join("\n"),
            },
        },
    ],
}));

server.prompt("create-tick-counter", "Create a flow graph that counts frames using SceneTick", () => ({
    messages: [
        {
            role: "user",
            content: {
                type: "text",
                text: [
                    "Create a flow graph that counts frames and logs every 60 frames. Steps:",
                    "1. create_graph 'TickCounter'",
                    "2. set_variable 'frameCount' to 0",
                    "3. Add SceneTickEvent block",
                    "4. Add GetVariable block (config { variable: 'frameCount' })",
                    "5. Add Constant block with value 1",
                    "6. Add Add block — GetVariable.value + Constant.output",
                    "7. Add SetVariable block (config { variable: 'frameCount' })",
                    "8. Connect SceneTickEvent.out → SetVariable.in (signal)",
                    "9. Connect Add.value → SetVariable.value (data)",
                    "10. Add Modulo block — Add.value % 60",
                    "11. Add Equality block — Modulo.value == 0",
                    "12. Add Branch block",
                    "13. Connect SetVariable.out → Branch.in (signal)",
                    "14. Connect Equality.value → Branch.condition (data)",
                    "15. Add ConsoleLog block",
                    "16. Connect Branch.onTrue → ConsoleLog.in (signal)",
                    "17. Connect Add.value → ConsoleLog.message (data)",
                    "18. validate_graph, then export_graph_json",
                ].join("\n"),
            },
        },
    ],
}));

// ═══════════════════════════════════════════════════════════════════════════
//  Tools
// ═══════════════════════════════════════════════════════════════════════════

// ── Graph lifecycle ───────────────────────────────────────────────────────

server.tool(
    "create_graph",
    "Create a new empty Flow Graph in memory. This is always the first step.",
    {
        name: z.string().describe("Unique name for the flow graph (e.g. 'ClickHandler', 'AnimationController')"),
    },
    async ({ name }) => {
        manager.createGraph(name);
        return {
            content: [
                {
                    type: "text",
                    text: `Created flow graph "${name}". Now add blocks with add_block, connect them with connect_signal/connect_data, then export with export_graph_json.`,
                },
            ],
        };
    }
);

server.tool(
    "delete_graph",
    "Delete a flow graph from memory.",
    {
        name: z.string().describe("Name of the flow graph to delete"),
    },
    async ({ name }) => {
        const ok = manager.deleteGraph(name);
        return {
            content: [{ type: "text", text: ok ? `Deleted "${name}".` : `Graph "${name}" not found.` }],
        };
    }
);

server.tool("list_graphs", "List all flow graphs currently in memory.", {}, async () => {
    const names = manager.listGraphs();
    return {
        content: [
            {
                type: "text",
                text: names.length > 0 ? `Flow graphs in memory:\n${names.map((n) => `  • ${n}`).join("\n")}` : "No flow graphs in memory.",
            },
        ],
    };
});

// ── Block operations ────────────────────────────────────────────────────

server.tool(
    "add_block",
    "Add a new block to a flow graph. Returns the block's id for use in connect_signal/connect_data.",
    {
        graphName: z.string().describe("Name of the flow graph to add the block to"),
        blockType: z
            .string()
            .describe(
                "The block type from the registry (e.g. 'SceneReadyEvent', 'Branch', 'ConsoleLog', 'Add', 'SetProperty'). " + "Use list_block_types to see all available types."
            ),
        name: z.string().optional().describe("Human-friendly name for this block instance (e.g. 'checkCondition', 'logResult')"),
        config: z
            .record(z.string(), z.unknown())
            .optional()
            .describe(
                "Block-specific configuration. Examples:\n" +
                    '  - Constant: { value: 42 } or { value: { "value": [1,2,3], "className": "Vector3" } }\n' +
                    '  - GetVariable: { variable: "myVar" }\n' +
                    '  - SetVariable: { variable: "myVar" }\n' +
                    '  - SetProperty: { propertyName: "position" }\n' +
                    '  - GetProperty: { propertyName: "isVisible" }\n' +
                    "  - Sequence: { outputSignalCount: 3 }\n" +
                    "  - Switch: { cases: [0, 1, 2] }\n" +
                    '  - SendCustomEvent/ReceiveCustomEvent: { eventId: "myEvent" }'
            ),
    },
    async ({ graphName, blockType, name, config }) => {
        const result = manager.addBlock(graphName, blockType, name, config as Record<string, unknown>);
        if (typeof result === "string") {
            return { content: [{ type: "text", text: `Error: ${result}` }], isError: true };
        }
        return {
            content: [
                {
                    type: "text",
                    text: `Added block [${result.id}] "${result.name}" (${blockType}). Use id ${result.id} in connect_signal/connect_data.`,
                },
            ],
        };
    }
);

server.tool(
    "remove_block",
    "Remove a block from a flow graph. Also removes all connections to/from it.",
    {
        graphName: z.string().describe("Name of the flow graph"),
        blockId: z.number().describe("The block id to remove"),
    },
    async ({ graphName, blockId }) => {
        const result = manager.removeBlock(graphName, blockId);
        return {
            content: [{ type: "text", text: result === "OK" ? `Removed block ${blockId}.` : `Error: ${result}` }],
            isError: result !== "OK",
        };
    }
);

server.tool(
    "set_block_config",
    "Set or update configuration on an existing block.",
    {
        graphName: z.string().describe("Name of the flow graph"),
        blockId: z.number().describe("The block id to modify"),
        config: z.record(z.string(), z.unknown()).describe("Configuration key-value pairs to set or update."),
    },
    async ({ graphName, blockId, config }) => {
        const result = manager.setBlockConfig(graphName, blockId, config as Record<string, unknown>);
        return {
            content: [{ type: "text", text: result === "OK" ? `Updated block ${blockId} config.` : `Error: ${result}` }],
            isError: result !== "OK",
        };
    }
);

// ── Signal connections ──────────────────────────────────────────────────

server.tool(
    "connect_signal",
    "Connect a signal output of one block to a signal input of another. " +
        "Signal connections control execution flow (WHEN blocks execute). " +
        "Flow: source block's signal output → target block's signal input.",
    {
        graphName: z.string().describe("Name of the flow graph"),
        sourceBlockId: z.number().describe("Block id with the signal output (e.g. the event or execution block)"),
        signalOutputName: z.string().describe("Name of the signal output on the source block (e.g. 'out', 'onTrue', 'onFalse', 'executionFlow', 'completed')"),
        targetBlockId: z.number().describe("Block id with the signal input (the block to trigger)"),
        signalInputName: z.string().default("in").describe("Name of the signal input on the target block (usually 'in')"),
    },
    async ({ graphName, sourceBlockId, signalOutputName, targetBlockId, signalInputName }) => {
        const result = manager.connectSignal(graphName, sourceBlockId, signalOutputName, targetBlockId, signalInputName);
        return {
            content: [
                {
                    type: "text",
                    text: result === "OK" ? `Connected signal: [${sourceBlockId}].${signalOutputName} → [${targetBlockId}].${signalInputName}` : `Error: ${result}`,
                },
            ],
            isError: result !== "OK",
        };
    }
);

server.tool(
    "disconnect_signal",
    "Disconnect a signal output from its target(s).",
    {
        graphName: z.string().describe("Name of the flow graph"),
        blockId: z.number().describe("Block id that has the signal output"),
        signalOutputName: z.string().describe("Name of the signal output to disconnect"),
    },
    async ({ graphName, blockId, signalOutputName }) => {
        const result = manager.disconnectSignal(graphName, blockId, signalOutputName);
        return {
            content: [{ type: "text", text: result === "OK" ? `Disconnected signal [${blockId}].${signalOutputName}` : `Error: ${result}` }],
            isError: result !== "OK",
        };
    }
);

// ── Data connections ────────────────────────────────────────────────────

server.tool(
    "connect_data",
    "Connect a data output of one block to a data input of another. " +
        "Data connections carry typed values (WHAT blocks process). " +
        "Flow: source block's data output → target block's data input.",
    {
        graphName: z.string().describe("Name of the flow graph"),
        sourceBlockId: z.number().describe("Block id with the data output (the value provider)"),
        outputName: z.string().describe("Name of the data output on the source block (e.g. 'value', 'output', 'pickedPoint')"),
        targetBlockId: z.number().describe("Block id with the data input (the value consumer)"),
        inputName: z.string().describe("Name of the data input on the target block (e.g. 'message', 'condition', 'a', 'b')"),
    },
    async ({ graphName, sourceBlockId, outputName, targetBlockId, inputName }) => {
        const result = manager.connectData(graphName, sourceBlockId, outputName, targetBlockId, inputName);
        return {
            content: [
                {
                    type: "text",
                    text: result === "OK" ? `Connected data: [${sourceBlockId}].${outputName} → [${targetBlockId}].${inputName}` : `Error: ${result}`,
                },
            ],
            isError: result !== "OK",
        };
    }
);

server.tool(
    "disconnect_data",
    "Disconnect a data input from its source.",
    {
        graphName: z.string().describe("Name of the flow graph"),
        blockId: z.number().describe("Block id that has the data input"),
        inputName: z.string().describe("Name of the data input to disconnect"),
    },
    async ({ graphName, blockId, inputName }) => {
        const result = manager.disconnectData(graphName, blockId, inputName);
        return {
            content: [{ type: "text", text: result === "OK" ? `Disconnected data [${blockId}].${inputName}` : `Error: ${result}` }],
            isError: result !== "OK",
        };
    }
);

// ── Context variables ───────────────────────────────────────────────────

server.tool(
    "set_variable",
    "Set a context variable on the flow graph. Variables can be read by GetVariable blocks and written by SetVariable blocks.",
    {
        graphName: z.string().describe("Name of the flow graph"),
        variableName: z.string().describe("Name of the variable"),
        value: z
            .unknown()
            .describe(
                "The variable value. For complex types, use serialized format:\n" +
                    '  - number: 42\n  - string: "hello"\n  - boolean: true\n' +
                    '  - Vector3: { "value": [1, 2, 3], "className": "Vector3" }'
            ),
    },
    async ({ graphName, variableName, value }) => {
        const result = manager.setVariable(graphName, variableName, value);
        return {
            content: [
                {
                    type: "text",
                    text: result === "OK" ? `Set variable "${variableName}" = ${JSON.stringify(value)}` : `Error: ${result}`,
                },
            ],
            isError: result !== "OK",
        };
    }
);

// ── Query tools ─────────────────────────────────────────────────────────

server.tool(
    "describe_graph",
    "Get a human-readable description of a flow graph, including all blocks, their connections, and context variables.",
    {
        graphName: z.string().describe("Name of the flow graph to describe"),
    },
    async ({ graphName }) => {
        const desc = manager.describeGraph(graphName);
        return { content: [{ type: "text", text: desc }] };
    }
);

server.tool(
    "describe_block",
    "Get detailed information about a specific block instance, including all its connections and configuration.",
    {
        graphName: z.string().describe("Name of the flow graph"),
        blockId: z.number().describe("The block id to describe"),
    },
    async ({ graphName, blockId }) => {
        const desc = manager.describeBlock(graphName, blockId);
        return { content: [{ type: "text", text: desc }] };
    }
);

server.tool(
    "list_block_types",
    "List all available Flow Graph block types, grouped by category. Use this to discover which blocks you can add.",
    {
        category: z
            .string()
            .optional()
            .describe("Optionally filter by category (Event, Execution, ControlFlow, Animation, Data, Math, Vector, Matrix, Combine, Extract, Conversion, Utility)"),
    },
    async ({ category }) => {
        if (category) {
            const matching = Object.entries(FlowGraphBlockRegistry)
                .filter(([, info]) => info.category.toLowerCase() === category.toLowerCase())
                .map(([key, info]) => `  ${key} (${info.className}): ${info.description.split(".")[0]}`)
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
    "Get detailed info about a specific block type — its signal/data connections, config options, and description.",
    {
        blockType: z.string().describe("The block type name (e.g. 'Branch', 'SetProperty', 'FlowGraphBranchBlock')"),
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
        lines.push(`## ${blockType} (${info.className})`);
        lines.push(`Category: ${info.category}`);
        lines.push(`Description: ${info.description}`);

        lines.push("\n### Signal Inputs:");
        if (info.signalInputs.length === 0) {
            lines.push("  (none — this is a data-only block)");
        }
        for (const si of info.signalInputs) {
            lines.push(`  • ${si.name}${si.description ? ` — ${si.description}` : ""}`);
        }

        lines.push("\n### Signal Outputs:");
        if (info.signalOutputs.length === 0) {
            lines.push("  (none — this is a data-only block)");
        }
        for (const so of info.signalOutputs) {
            lines.push(`  • ${so.name}${so.description ? ` — ${so.description}` : ""}`);
        }

        lines.push("\n### Data Inputs:");
        if (info.dataInputs.length === 0) {
            lines.push("  (none)");
        }
        for (const di of info.dataInputs) {
            const opt = di.isOptional ? " (optional)" : "";
            lines.push(`  • ${di.name}: ${di.type}${opt}${di.description ? ` — ${di.description}` : ""}`);
        }

        lines.push("\n### Data Outputs:");
        if (info.dataOutputs.length === 0) {
            lines.push("  (none)");
        }
        for (const dout of info.dataOutputs) {
            lines.push(`  • ${dout.name}: ${dout.type}${dout.description ? ` — ${dout.description}` : ""}`);
        }

        if (info.config) {
            lines.push("\n### Configuration (config object):");
            for (const [k, v] of Object.entries(info.config)) {
                lines.push(`  • ${k}: ${v}`);
            }
        }

        return { content: [{ type: "text", text: lines.join("\n") }] };
    }
);

// ── Validation ──────────────────────────────────────────────────────────

server.tool(
    "validate_graph",
    "Run validation checks on a flow graph. Reports missing connections, unreachable blocks, and broken references.",
    {
        graphName: z.string().describe("Name of the flow graph to validate"),
    },
    async ({ graphName }) => {
        const issues = manager.validateGraph(graphName);
        return {
            content: [{ type: "text", text: issues.join("\n") }],
            isError: issues.some((i) => i.startsWith("ERROR")),
        };
    }
);

// ── Export / Import ─────────────────────────────────────────────────────

server.tool(
    "export_graph_json",
    "Export the flow graph as Babylon.js-compatible JSON at the coordinator level. " + "This JSON can be loaded via FlowGraphCoordinator.parse() at runtime.",
    {
        graphName: z.string().describe("Name of the flow graph to export"),
        graphOnly: z
            .boolean()
            .default(false)
            .describe("If true, exports only the graph-level JSON (without the coordinator wrapper). Useful for embedding in glTF or other formats."),
    },
    async ({ graphName, graphOnly }) => {
        const json = graphOnly ? manager.exportGraphJSON(graphName) : manager.exportJSON(graphName);
        if (!json) {
            return { content: [{ type: "text", text: `Graph "${graphName}" not found.` }], isError: true };
        }
        return { content: [{ type: "text", text: json }] };
    }
);

server.tool(
    "import_graph_json",
    "Import an existing Flow Graph JSON into memory for editing. Accepts either coordinator-level or graph-level JSON.",
    {
        graphName: z.string().describe("Name to give the imported flow graph"),
        json: z.string().describe("The Flow Graph JSON string to import"),
    },
    async ({ graphName, json }) => {
        const result = manager.importJSON(graphName, json);
        if (result !== "OK") {
            return { content: [{ type: "text", text: `Error: ${result}` }], isError: true };
        }
        const desc = manager.describeGraph(graphName);
        return { content: [{ type: "text", text: `Imported successfully.\n\n${desc}` }] };
    }
);

// ── Batch operations ────────────────────────────────────────────────────

server.tool(
    "add_blocks_batch",
    "Add multiple blocks at once. More efficient than calling add_block repeatedly. Returns all created block ids.",
    {
        graphName: z.string().describe("Name of the flow graph"),
        blocks: z
            .array(
                z.object({
                    blockType: z.string().describe("Block type name from the registry"),
                    name: z.string().optional().describe("Instance name for the block"),
                    config: z.record(z.string(), z.unknown()).optional().describe("Block configuration"),
                })
            )
            .describe("Array of blocks to add"),
    },
    async ({ graphName, blocks }) => {
        const results: string[] = [];
        for (const blockDef of blocks) {
            const result = manager.addBlock(graphName, blockDef.blockType, blockDef.name, blockDef.config as Record<string, unknown>);
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
    "connect_signals_batch",
    "Connect multiple signal pairs at once.",
    {
        graphName: z.string().describe("Name of the flow graph"),
        connections: z
            .array(
                z.object({
                    sourceBlockId: z.number(),
                    signalOutputName: z.string(),
                    targetBlockId: z.number(),
                    signalInputName: z.string().default("in"),
                })
            )
            .describe("Array of signal connections to make"),
    },
    async ({ graphName, connections }) => {
        const results: string[] = [];
        for (const conn of connections) {
            const result = manager.connectSignal(graphName, conn.sourceBlockId, conn.signalOutputName, conn.targetBlockId, conn.signalInputName);
            results.push(result === "OK" ? `[${conn.sourceBlockId}].${conn.signalOutputName} → [${conn.targetBlockId}].${conn.signalInputName}` : `Error: ${result}`);
        }
        return { content: [{ type: "text", text: `Signal connections:\n${results.join("\n")}` }] };
    }
);

server.tool(
    "connect_data_batch",
    "Connect multiple data pairs at once.",
    {
        graphName: z.string().describe("Name of the flow graph"),
        connections: z
            .array(
                z.object({
                    sourceBlockId: z.number(),
                    outputName: z.string(),
                    targetBlockId: z.number(),
                    inputName: z.string(),
                })
            )
            .describe("Array of data connections to make"),
    },
    async ({ graphName, connections }) => {
        const results: string[] = [];
        for (const conn of connections) {
            const result = manager.connectData(graphName, conn.sourceBlockId, conn.outputName, conn.targetBlockId, conn.inputName);
            results.push(result === "OK" ? `[${conn.sourceBlockId}].${conn.outputName} → [${conn.targetBlockId}].${conn.inputName}` : `Error: ${result}`);
        }
        return { content: [{ type: "text", text: `Data connections:\n${results.join("\n")}` }] };
    }
);

// ═══════════════════════════════════════════════════════════════════════════
//  Start the server
// ═══════════════════════════════════════════════════════════════════════════

async function Main() {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error("Babylon.js Flow Graph MCP Server running on stdio");
}

try {
    await Main();
} catch (err) {
    console.error("Fatal error:", err);
    process.exit(1);
}

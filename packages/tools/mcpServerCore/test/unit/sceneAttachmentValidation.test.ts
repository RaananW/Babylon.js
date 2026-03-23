import {
    ValidateFlowGraphAttachmentPayload,
    ValidateGuiAttachmentPayload,
    ValidateNodeGeometryAttachmentPayload,
    ValidateNodeMaterialAttachmentPayload,
    ValidateNodeRenderGraphAttachmentPayload,
} from "../../src/index";

describe("scene attachment validation helpers", () => {
    it("accepts GUI JSON with a root object", () => {
        expect(ValidateGuiAttachmentPayload({ width: 100, root: {} })).toEqual({ width: 100, root: {} });
    });

    it("rejects GUI JSON without a root object", () => {
        expect(() => ValidateGuiAttachmentPayload({})).toThrow("Invalid GUI JSON: must contain a 'root' object.");
    });

    it("accepts NRG JSON with the expected customType and blocks", () => {
        expect(ValidateNodeRenderGraphAttachmentPayload({ customType: "BABYLON.NodeRenderGraph", blocks: [] })).toEqual({
            customType: "BABYLON.NodeRenderGraph",
            blocks: [],
        });
    });

    it("rejects NRG JSON with the wrong customType", () => {
        expect(() => ValidateNodeRenderGraphAttachmentPayload({ customType: "BABYLON.OtherGraph", blocks: [] })).toThrow(
            'Invalid NRG JSON: customType must be "BABYLON.NodeRenderGraph" but got "BABYLON.OtherGraph".'
        );
    });

    it("accepts NGE JSON with the expected customType and blocks", () => {
        expect(ValidateNodeGeometryAttachmentPayload({ customType: "BABYLON.NodeGeometry", blocks: [] })).toEqual({
            customType: "BABYLON.NodeGeometry",
            blocks: [],
        });
    });

    it("accepts coordinator-level Flow Graph JSON and normalizes graphs", () => {
        const result = ValidateFlowGraphAttachmentPayload({
            _flowGraphs: [{ allBlocks: [], executionContexts: [] }],
            dispatchEventsSynchronously: false,
        });

        expect(result.graphs).toHaveLength(1);
        expect(result.graphs[0].allBlocks).toEqual([]);
    });

    it("accepts graph-level Flow Graph JSON", () => {
        const result = ValidateFlowGraphAttachmentPayload({ allBlocks: [], executionContexts: [] });
        expect(result.graphs).toHaveLength(1);
    });

    it("rejects empty Flow Graph coordinators", () => {
        expect(() => ValidateFlowGraphAttachmentPayload({ _flowGraphs: [] })).toThrow(
            "Invalid Flow Graph JSON: '_flowGraphs' must contain at least one graph."
        );
    });

    it("accepts Node Material JSON with both output blocks", () => {
        expect(
            ValidateNodeMaterialAttachmentPayload({
                mode: 0,
                blocks: [{ customType: "BABYLON.VertexOutputBlock" }, { customType: "BABYLON.FragmentOutputBlock" }],
                outputNodes: [1, 2],
            })
        ).toEqual({
            mode: 0,
            blocks: [{ customType: "BABYLON.VertexOutputBlock" }, { customType: "BABYLON.FragmentOutputBlock" }],
            outputNodes: [1, 2],
        });
    });

    it("rejects Node Material JSON missing required output blocks", () => {
        expect(() =>
            ValidateNodeMaterialAttachmentPayload({
                mode: 0,
                blocks: [{ customType: "BABYLON.VertexOutputBlock" }],
                outputNodes: [1],
            })
        ).toThrow("Invalid NME JSON: missing FragmentOutputBlock.");
    });
});
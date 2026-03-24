/**
 * In-memory glTF document manager.
 * Provides lifecycle, inspection, editing, validation, and export operations
 * on named glTF 2.0 documents held entirely in memory.
 */

import type {
    IGltfDocument,
    IGltfScene,
    IGltfNode,
    IGltfMesh,
    IGltfMaterial,
    IGltfTexture,
    IGltfImage,
    IGltfSampler,
    IGltfAnimation,
    IGltfSkin,
    IGltfExtensible,
    GltfExtensionTargetType,
} from "./gltfTypes.js";

import { GetTypeByteLength, GetTypedArrayConstructor, GetFloatData } from "@dev/core/Buffers/bufferUtils";

/* ------------------------------------------------------------------ */
/*  Helper utilities                                                   */
/* ------------------------------------------------------------------ */

function DeepClone<T>(obj: T): T {
    return JSON.parse(JSON.stringify(obj)) as T;
}

function ArrayOrEmpty<T>(arr: T[] | undefined): T[] {
    return arr ?? [];
}

function EnsureArray<T>(doc: Record<string, unknown>, key: string): T[] {
    if (!Array.isArray(doc[key])) {
        (doc as Record<string, unknown>)[key] = [];
    }
    return doc[key] as T[];
}

/**
 * Resolve a target object by type string and index.
 * @param doc - The glTF document.
 * @param targetType - Extension target type.
 * @param targetIndex - Optional 0-based index for the target.
 * @returns The resolved extensible object, or null if not found.
 */
function ResolveExtensionTarget(doc: IGltfDocument, targetType: GltfExtensionTargetType, targetIndex?: number): IGltfExtensible | null {
    if (targetType === "root") {
        return doc;
    }
    if (targetIndex === undefined || targetIndex < 0) {
        return null;
    }
    const collectionMap: Record<string, unknown[] | undefined> = {
        scene: doc.scenes,
        node: doc.nodes,
        mesh: doc.meshes,
        material: doc.materials,
        texture: doc.textures,
        image: doc.images,
        animation: doc.animations,
    };
    const collection = collectionMap[targetType];
    if (!collection || targetIndex >= collection.length) {
        return null;
    }
    return collection[targetIndex] as IGltfExtensible;
}

/* ------------------------------------------------------------------ */
/*  Validation issue type                                              */
/* ------------------------------------------------------------------ */

/**
 *
 */
export interface IGltfValidationIssue {
    /**
     *
     */
    severity: "error" | "warning" | "info";
    /**
     *
     */
    message: string;
    /**
     *
     */
    path?: string;
}

/* ------------------------------------------------------------------ */
/*  Manager class                                                      */
/* ------------------------------------------------------------------ */

/**
 *
 */
export class GltfManager {
    private _documents: Map<string, IGltfDocument> = new Map();

    /* ======================== Lifecycle ========================== */

    createGltf(name: string): string {
        if (this._documents.has(name)) {
            return `Error: A glTF document named "${name}" already exists.`;
        }
        const doc: IGltfDocument = {
            asset: { version: "2.0", generator: "babylonjs-gltf-mcp" },
            scene: 0,
            scenes: [{ name: "Scene", nodes: [] }],
            nodes: [],
            meshes: [],
            materials: [],
            textures: [],
            images: [],
            samplers: [],
            accessors: [],
            bufferViews: [],
            buffers: [],
            animations: [],
            skins: [],
            cameras: [],
            extensionsUsed: [],
            extensionsRequired: [],
        };
        this._documents.set(name, doc);
        return this.describeGltf(name);
    }

    loadGltf(name: string, jsonText: string): string {
        let doc: IGltfDocument;
        try {
            doc = JSON.parse(jsonText) as IGltfDocument;
        } catch {
            return "Error: Invalid JSON.";
        }
        if (!doc.asset || !doc.asset.version) {
            return "Error: Not a valid glTF document — missing asset.version.";
        }
        if (this._documents.has(name)) {
            return `Error: A glTF document named "${name}" already exists. Use a different name or delete the existing one first.`;
        }
        this._documents.set(name, doc);
        return this.describeGltf(name);
    }

    /**
     * Resolve external buffer and image URIs by reading the referenced files
     * and converting them to base64 data URIs.  This makes the in-memory
     * document fully self-contained so it can be exported as GLB.
     *
     * @param name     Name of the loaded document.
     * @param baseDir  Directory containing the .gltf file (for resolving
     *                 relative URIs).
     * @returns A status message.
     */
    async resolveExternalBuffers(name: string, baseDir: string): Promise<string> {
        const doc = this._getDoc(name);
        if (typeof doc === "string") {
            return doc;
        }

        const fs = await import("node:fs");
        const path = await import("node:path");

        let resolved = 0;

        // Resolve buffer URIs
        for (const buf of ArrayOrEmpty(doc.buffers)) {
            if (buf.uri && !buf.uri.startsWith("data:")) {
                const filePath = path.resolve(baseDir, buf.uri);
                if (fs.existsSync(filePath)) {
                    const data = fs.readFileSync(filePath);
                    buf.uri = `data:application/octet-stream;base64,${data.toString("base64")}`;
                    buf.byteLength = data.length;
                    resolved++;
                }
            }
        }

        // Resolve image URIs
        for (const img of ArrayOrEmpty(doc.images)) {
            if (img.uri && !img.uri.startsWith("data:")) {
                const filePath = path.resolve(baseDir, img.uri);
                if (fs.existsSync(filePath)) {
                    const data = fs.readFileSync(filePath);
                    const ext = path.extname(img.uri).toLowerCase();
                    const mime = ext === ".png" ? "image/png" : ext === ".jpg" || ext === ".jpeg" ? "image/jpeg" : "application/octet-stream";
                    img.uri = `data:${mime};base64,${data.toString("base64")}`;
                    resolved++;
                }
            }
        }

        return resolved > 0 ? `Resolved ${resolved} external URI(s) into embedded data.` : "No external URIs to resolve.";
    }

    listGltfs(): string {
        if (this._documents.size === 0) {
            return "No glTF documents in memory.";
        }
        const lines: string[] = ["## glTF Documents in Memory\n"];
        for (const [name, doc] of this._documents) {
            lines.push(
                `- **${name}** — v${doc.asset.version}, ${ArrayOrEmpty(doc.scenes).length} scene(s), ${ArrayOrEmpty(doc.nodes).length} node(s), ${ArrayOrEmpty(doc.meshes).length} mesh(es), ${ArrayOrEmpty(doc.materials).length} material(s)`
            );
        }
        return lines.join("\n");
    }

    deleteGltf(name: string): string {
        if (!this._documents.has(name)) {
            return `Error: No glTF document named "${name}".`;
        }
        this._documents.delete(name);
        return `Deleted "${name}".`;
    }

    cloneGltf(sourceName: string, newName: string): string {
        const doc = this._documents.get(sourceName);
        if (!doc) {
            return `Error: No glTF document named "${sourceName}".`;
        }
        if (this._documents.has(newName)) {
            return `Error: A glTF document named "${newName}" already exists.`;
        }
        this._documents.set(newName, DeepClone(doc));
        return `Cloned "${sourceName}" → "${newName}".\n\n${this.describeGltf(newName)}`;
    }

    /* ======================== Inspection ======================== */

    describeGltf(name: string): string {
        const doc = this._getDoc(name);
        if (typeof doc === "string") {
            return doc;
        }

        const scenes = ArrayOrEmpty(doc.scenes);
        const nodes = ArrayOrEmpty(doc.nodes);
        const meshes = ArrayOrEmpty(doc.meshes);
        const materials = ArrayOrEmpty(doc.materials);
        const textures = ArrayOrEmpty(doc.textures);
        const images = ArrayOrEmpty(doc.images);
        const animations = ArrayOrEmpty(doc.animations);
        const skins = ArrayOrEmpty(doc.skins);
        const cameras = ArrayOrEmpty(doc.cameras);
        const accessors = ArrayOrEmpty(doc.accessors);
        const samplers = ArrayOrEmpty(doc.samplers);
        const extUsed = ArrayOrEmpty(doc.extensionsUsed);
        const extReq = ArrayOrEmpty(doc.extensionsRequired);

        const lines: string[] = [
            `## glTF: ${name}`,
            `- **Version**: ${doc.asset.version}${doc.asset.generator ? ` (generator: ${doc.asset.generator})` : ""}`,
            `- **Active scene**: ${doc.scene !== undefined ? doc.scene : "none"}`,
            `- **Scenes**: ${scenes.length}`,
            `- **Nodes**: ${nodes.length}`,
            `- **Meshes**: ${meshes.length}`,
            `- **Materials**: ${materials.length}`,
            `- **Textures**: ${textures.length}`,
            `- **Images**: ${images.length}`,
            `- **Samplers**: ${samplers.length}`,
            `- **Accessors**: ${accessors.length}`,
            `- **Animations**: ${animations.length}`,
            `- **Skins**: ${skins.length}`,
            `- **Cameras**: ${cameras.length}`,
        ];

        if (extUsed.length > 0) {
            lines.push(`- **extensionsUsed**: ${extUsed.join(", ")}`);
        }
        if (extReq.length > 0) {
            lines.push(`- **extensionsRequired**: ${extReq.join(", ")}`);
        }

        // Structural warnings
        const warnings: string[] = [];
        if (scenes.length === 0) {
            warnings.push("No scenes defined");
        }
        if (doc.scene !== undefined && (doc.scene < 0 || doc.scene >= scenes.length)) {
            warnings.push(`Active scene index ${doc.scene} is out of range`);
        }
        if (warnings.length > 0) {
            lines.push(`\n**Warnings**: ${warnings.join("; ")}`);
        }

        return lines.join("\n");
    }

    describeScene(name: string, sceneIndex: number): string {
        const doc = this._getDoc(name);
        if (typeof doc === "string") {
            return doc;
        }
        const scenes = ArrayOrEmpty(doc.scenes);
        if (sceneIndex < 0 || sceneIndex >= scenes.length) {
            return `Error: Scene index ${sceneIndex} out of range (0..${scenes.length - 1}).`;
        }
        const s = scenes[sceneIndex];
        const nodeIndices = ArrayOrEmpty(s.nodes);
        const lines: string[] = [
            `## Scene ${sceneIndex}: ${s.name ?? "(unnamed)"}`,
            `- **Root nodes**: ${nodeIndices.length}${nodeIndices.length > 0 ? ` [${nodeIndices.join(", ")}]` : ""}`,
            `- **Is active scene**: ${doc.scene === sceneIndex ? "yes" : "no"}`,
        ];
        if (s.extensions && Object.keys(s.extensions).length > 0) {
            lines.push(`- **Extensions**: ${Object.keys(s.extensions).join(", ")}`);
        }
        return lines.join("\n");
    }

    describeNode(name: string, nodeIndex: number): string {
        const doc = this._getDoc(name);
        if (typeof doc === "string") {
            return doc;
        }
        const nodes = ArrayOrEmpty(doc.nodes);
        if (nodeIndex < 0 || nodeIndex >= nodes.length) {
            return `Error: Node index ${nodeIndex} out of range (0..${nodes.length - 1}).`;
        }
        const n = nodes[nodeIndex];
        const children = ArrayOrEmpty(n.children);
        const parent = this._findParentNode(doc, nodeIndex);

        const lines: string[] = [
            `## Node ${nodeIndex}: ${n.name ?? "(unnamed)"}`,
            `- **Parent**: ${parent !== -1 ? `node ${parent}` : "scene root"}`,
            `- **Children**: ${children.length > 0 ? children.join(", ") : "none"}`,
        ];
        if (n.mesh !== undefined) {
            lines.push(`- **Mesh**: ${n.mesh}`);
        }
        if (n.skin !== undefined) {
            lines.push(`- **Skin**: ${n.skin}`);
        }
        if (n.camera !== undefined) {
            lines.push(`- **Camera**: ${n.camera}`);
        }
        if (n.translation) {
            lines.push(`- **Translation**: [${n.translation.join(", ")}]`);
        }
        if (n.rotation) {
            lines.push(`- **Rotation**: [${n.rotation.join(", ")}]`);
        }
        if (n.scale) {
            lines.push(`- **Scale**: [${n.scale.join(", ")}]`);
        }
        if (n.matrix) {
            lines.push(`- **Matrix**: [${n.matrix.join(", ")}]`);
        }
        if (n.extensions && Object.keys(n.extensions).length > 0) {
            lines.push(`- **Extensions**: ${Object.keys(n.extensions).join(", ")}`);
        }
        return lines.join("\n");
    }

    describeMesh(name: string, meshIndex: number): string {
        const doc = this._getDoc(name);
        if (typeof doc === "string") {
            return doc;
        }
        const meshes = ArrayOrEmpty(doc.meshes);
        if (meshIndex < 0 || meshIndex >= meshes.length) {
            return `Error: Mesh index ${meshIndex} out of range (0..${meshes.length - 1}).`;
        }
        const m = meshes[meshIndex];
        const lines: string[] = [`## Mesh ${meshIndex}: ${m.name ?? "(unnamed)"}`, `- **Primitives**: ${m.primitives.length}`];
        m.primitives.forEach((p, i) => {
            const attrs = Object.keys(p.attributes).join(", ");
            lines.push(`  - Primitive ${i}: attributes=[${attrs}], material=${p.material ?? "none"}, mode=${p.mode ?? 4}`);
        });
        if (m.extensions && Object.keys(m.extensions).length > 0) {
            lines.push(`- **Extensions**: ${Object.keys(m.extensions).join(", ")}`);
        }
        return lines.join("\n");
    }

    describeMaterial(name: string, materialIndex: number): string {
        const doc = this._getDoc(name);
        if (typeof doc === "string") {
            return doc;
        }
        const materials = ArrayOrEmpty(doc.materials);
        if (materialIndex < 0 || materialIndex >= materials.length) {
            return `Error: Material index ${materialIndex} out of range (0..${materials.length - 1}).`;
        }
        const mat = materials[materialIndex];
        const pbr = mat.pbrMetallicRoughness;
        const lines: string[] = [
            `## Material ${materialIndex}: ${mat.name ?? "(unnamed)"}`,
            `- **alphaMode**: ${mat.alphaMode ?? "OPAQUE"}`,
            `- **doubleSided**: ${mat.doubleSided ?? false}`,
        ];
        if (mat.alphaCutoff !== undefined) {
            lines.push(`- **alphaCutoff**: ${mat.alphaCutoff}`);
        }
        if (mat.emissiveFactor) {
            lines.push(`- **emissiveFactor**: [${mat.emissiveFactor.join(", ")}]`);
        }
        if (mat.emissiveTexture) {
            lines.push(`- **emissiveTexture**: texture ${mat.emissiveTexture.index}`);
        }
        if (mat.normalTexture) {
            lines.push(`- **normalTexture**: texture ${mat.normalTexture.index}${mat.normalTexture.scale !== undefined ? `, scale=${mat.normalTexture.scale}` : ""}`);
        }
        if (mat.occlusionTexture) {
            lines.push(
                `- **occlusionTexture**: texture ${mat.occlusionTexture.index}${mat.occlusionTexture.strength !== undefined ? `, strength=${mat.occlusionTexture.strength}` : ""}`
            );
        }
        if (pbr) {
            lines.push(`- **PBR metallic-roughness**:`);
            if (pbr.baseColorFactor) {
                lines.push(`  - baseColorFactor: [${pbr.baseColorFactor.join(", ")}]`);
            }
            if (pbr.metallicFactor !== undefined) {
                lines.push(`  - metallicFactor: ${pbr.metallicFactor}`);
            }
            if (pbr.roughnessFactor !== undefined) {
                lines.push(`  - roughnessFactor: ${pbr.roughnessFactor}`);
            }
            if (pbr.baseColorTexture) {
                lines.push(`  - baseColorTexture: texture ${pbr.baseColorTexture.index}`);
            }
            if (pbr.metallicRoughnessTexture) {
                lines.push(`  - metallicRoughnessTexture: texture ${pbr.metallicRoughnessTexture.index}`);
            }
        }
        if (mat.extensions && Object.keys(mat.extensions).length > 0) {
            lines.push(`- **Extensions**: ${Object.keys(mat.extensions).join(", ")}`);
        }
        return lines.join("\n");
    }

    describeAnimation(name: string, animIndex: number): string {
        const doc = this._getDoc(name);
        if (typeof doc === "string") {
            return doc;
        }
        const anims = ArrayOrEmpty(doc.animations);
        if (animIndex < 0 || animIndex >= anims.length) {
            return `Error: Animation index ${animIndex} out of range (0..${anims.length - 1}).`;
        }
        const a = anims[animIndex];
        const lines: string[] = [`## Animation ${animIndex}: ${a.name ?? "(unnamed)"}`, `- **Channels**: ${a.channels.length}`, `- **Samplers**: ${a.samplers.length}`];
        a.channels.forEach((ch, i) => {
            lines.push(`  - Channel ${i}: node=${ch.target.node ?? "?"}, path=${ch.target.path}, sampler=${ch.sampler}`);
        });
        return lines.join("\n");
    }

    describeSkin(name: string, skinIndex: number): string {
        const doc = this._getDoc(name);
        if (typeof doc === "string") {
            return doc;
        }
        const skins = ArrayOrEmpty(doc.skins);
        if (skinIndex < 0 || skinIndex >= skins.length) {
            return `Error: Skin index ${skinIndex} out of range (0..${skins.length - 1}).`;
        }
        const sk = skins[skinIndex];
        const lines: string[] = [
            `## Skin ${skinIndex}: ${sk.name ?? "(unnamed)"}`,
            `- **Joints**: ${sk.joints.length} [${sk.joints.join(", ")}]`,
            `- **Skeleton root**: ${sk.skeleton ?? "none"}`,
            `- **Inverse bind matrices accessor**: ${sk.inverseBindMatrices ?? "none"}`,
        ];
        return lines.join("\n");
    }

    describeTexture(name: string, texIndex: number): string {
        const doc = this._getDoc(name);
        if (typeof doc === "string") {
            return doc;
        }
        const textures = ArrayOrEmpty(doc.textures);
        if (texIndex < 0 || texIndex >= textures.length) {
            return `Error: Texture index ${texIndex} out of range (0..${textures.length - 1}).`;
        }
        const t = textures[texIndex];
        const lines: string[] = [
            `## Texture ${texIndex}: ${t.name ?? "(unnamed)"}`,
            `- **Source image**: ${t.source !== undefined ? t.source : "none"}`,
            `- **Sampler**: ${t.sampler !== undefined ? t.sampler : "none"}`,
        ];
        // Show image info if source is set
        if (t.source !== undefined) {
            const images = ArrayOrEmpty(doc.images);
            if (t.source >= 0 && t.source < images.length) {
                const img = images[t.source];
                lines.push(`- **Image URI**: ${img.uri ?? "(buffer-backed)"}`);
                if (img.mimeType) {
                    lines.push(`- **Image MIME**: ${img.mimeType}`);
                }
            }
        }
        if (t.extensions && Object.keys(t.extensions).length > 0) {
            lines.push(`- **Extensions**: ${Object.keys(t.extensions).join(", ")}`);
        }
        return lines.join("\n");
    }

    describeImage(name: string, imageIndex: number): string {
        const doc = this._getDoc(name);
        if (typeof doc === "string") {
            return doc;
        }
        const images = ArrayOrEmpty(doc.images);
        if (imageIndex < 0 || imageIndex >= images.length) {
            return `Error: Image index ${imageIndex} out of range (0..${images.length - 1}).`;
        }
        const img = images[imageIndex];
        const lines: string[] = [
            `## Image ${imageIndex}: ${img.name ?? "(unnamed)"}`,
            `- **URI**: ${img.uri ?? "(none)"}`,
            `- **MIME type**: ${img.mimeType ?? "(not set)"}`,
            `- **Buffer view**: ${img.bufferView !== undefined ? img.bufferView : "(none)"}`,
        ];
        return lines.join("\n");
    }

    describeAccessor(name: string, accessorIndex: number): string {
        const doc = this._getDoc(name);
        if (typeof doc === "string") {
            return doc;
        }
        const accessors = ArrayOrEmpty(doc.accessors);
        if (accessorIndex < 0 || accessorIndex >= accessors.length) {
            return `Error: Accessor index ${accessorIndex} out of range (0..${accessors.length - 1}).`;
        }
        const acc = accessors[accessorIndex];
        const lines: string[] = [
            `## Accessor ${accessorIndex}: ${acc.name ?? "(unnamed)"}`,
            `- **Type**: ${acc.type}`,
            `- **Component type**: ${acc.componentType}`,
            `- **Count**: ${acc.count}`,
            `- **Buffer view**: ${acc.bufferView !== undefined ? acc.bufferView : "(none)"}`,
        ];
        if (acc.min) {
            lines.push(`- **Min**: [${acc.min.join(", ")}]`);
        }
        if (acc.max) {
            lines.push(`- **Max**: [${acc.max.join(", ")}]`);
        }
        return lines.join("\n");
    }

    /**
     * Returns the number of components for a glTF accessor type string.
     */
    private static _getNumComponents(type: string): number {
        switch (type) {
            case "SCALAR":
                return 1;
            case "VEC2":
                return 2;
            case "VEC3":
                return 3;
            case "VEC4":
            case "MAT2":
                return 4;
            case "MAT3":
                return 9;
            case "MAT4":
                return 16;
            default:
                throw new Error(`Unknown accessor type: ${type}`);
        }
    }

    /**
     * Decodes the raw binary buffer for a given buffer index from its data URI.
     * Returns null if the buffer has no data URI.
     */
    private _getBufferBytes(doc: IGltfDocument, bufferIndex: number): Uint8Array | null {
        const buf = ArrayOrEmpty(doc.buffers)[bufferIndex];
        if (!buf?.uri) {
            return null;
        }
        const m = buf.uri.match(/^data:[^;]*;base64,(.*)$/);
        if (!m) {
            return null;
        }
        const raw = atob(m[1]);
        const bytes = new Uint8Array(raw.length);
        for (let i = 0; i < raw.length; i++) {
            bytes[i] = raw.charCodeAt(i);
        }
        return bytes;
    }

    /**
     * Reads the data of an accessor as a flat Float32Array.
     * Handles byte stride, normalization, and component type conversion
     * using the utilities from @dev/core bufferUtils.
     */
    readAccessorData(name: string, accessorIndex: number): { data: number[]; componentCount: number; count: number } | string {
        const doc = this._getDoc(name);
        if (typeof doc === "string") {
            return doc;
        }
        const accessors = ArrayOrEmpty(doc.accessors);
        if (accessorIndex < 0 || accessorIndex >= accessors.length) {
            return `Error: Accessor index ${accessorIndex} out of range (0..${accessors.length - 1}).`;
        }
        const acc = accessors[accessorIndex];

        if (acc.bufferView === undefined) {
            // Accessor with no bufferView — all zeros (sparse-only or placeholder)
            const numComponents = GltfManager._getNumComponents(acc.type);
            return { data: new Array(acc.count * numComponents).fill(0), componentCount: numComponents, count: acc.count };
        }

        const bufferViews = ArrayOrEmpty(doc.bufferViews);
        const bv = bufferViews[acc.bufferView];
        if (!bv) {
            return `Error: Buffer view ${acc.bufferView} not found.`;
        }

        const bufferBytes = this._getBufferBytes(doc, bv.buffer);
        if (!bufferBytes) {
            return `Error: Cannot read buffer ${bv.buffer} — no data URI present.`;
        }

        const numComponents = GltfManager._getNumComponents(acc.type);
        const componentByteLength = GetTypeByteLength(acc.componentType);
        const defaultStride = numComponents * componentByteLength;
        const byteStride = bv.byteStride ?? defaultStride;
        const byteOffset = (bv.byteOffset ?? 0) + (acc.byteOffset ?? 0);

        const floatData = GetFloatData(bufferBytes, numComponents, acc.componentType, byteOffset, byteStride, acc.normalized ?? false, acc.count);

        return {
            data: Array.from(floatData),
            componentCount: numComponents,
            count: acc.count,
        };
    }

    describeSampler(name: string, samplerIndex: number): string {
        const doc = this._getDoc(name);
        if (typeof doc === "string") {
            return doc;
        }
        const samplers = ArrayOrEmpty(doc.samplers);
        if (samplerIndex < 0 || samplerIndex >= samplers.length) {
            return `Error: Sampler index ${samplerIndex} out of range (0..${samplers.length - 1}).`;
        }
        const s = samplers[samplerIndex];
        const lines: string[] = [
            `## Sampler ${samplerIndex}: ${s.name ?? "(unnamed)"}`,
            `- **magFilter**: ${s.magFilter ?? "(default)"}`,
            `- **minFilter**: ${s.minFilter ?? "(default)"}`,
            `- **wrapS**: ${s.wrapS ?? 10497}`,
            `- **wrapT**: ${s.wrapT ?? 10497}`,
        ];
        return lines.join("\n");
    }

    /* ==================== List operations ======================= */

    listScenes(name: string): string {
        const doc = this._getDoc(name);
        if (typeof doc === "string") {
            return doc;
        }
        const scenes = ArrayOrEmpty(doc.scenes);
        if (scenes.length === 0) {
            return "No scenes.";
        }
        return scenes.map((s, i) => `${i}: ${s.name ?? "(unnamed)"}${doc.scene === i ? " [active]" : ""} — ${ArrayOrEmpty(s.nodes).length} root node(s)`).join("\n");
    }

    listNodes(name: string): string {
        const doc = this._getDoc(name);
        if (typeof doc === "string") {
            return doc;
        }
        const nodes = ArrayOrEmpty(doc.nodes);
        if (nodes.length === 0) {
            return "No nodes.";
        }
        return nodes
            .map((n, i) => {
                const parts = [`${i}: ${n.name ?? "(unnamed)"}`];
                if (n.mesh !== undefined) {
                    parts.push(`mesh=${n.mesh}`);
                }
                if (n.children && n.children.length > 0) {
                    parts.push(`children=[${n.children.join(",")}]`);
                }
                return parts.join(" ");
            })
            .join("\n");
    }

    listMeshes(name: string): string {
        const doc = this._getDoc(name);
        if (typeof doc === "string") {
            return doc;
        }
        const meshes = ArrayOrEmpty(doc.meshes);
        if (meshes.length === 0) {
            return "No meshes.";
        }
        return meshes.map((m, i) => `${i}: ${m.name ?? "(unnamed)"} — ${m.primitives.length} primitive(s)`).join("\n");
    }

    listMaterials(name: string): string {
        const doc = this._getDoc(name);
        if (typeof doc === "string") {
            return doc;
        }
        const materials = ArrayOrEmpty(doc.materials);
        if (materials.length === 0) {
            return "No materials.";
        }
        return materials
            .map((m, i) => {
                const pbr = m.pbrMetallicRoughness;
                const parts = [`${i}: ${m.name ?? "(unnamed)"}`];
                if (pbr?.metallicFactor !== undefined) {
                    parts.push(`metallic=${pbr.metallicFactor}`);
                }
                if (pbr?.roughnessFactor !== undefined) {
                    parts.push(`roughness=${pbr.roughnessFactor}`);
                }
                parts.push(`alpha=${m.alphaMode ?? "OPAQUE"}`);
                return parts.join(" ");
            })
            .join("\n");
    }

    listAnimations(name: string): string {
        const doc = this._getDoc(name);
        if (typeof doc === "string") {
            return doc;
        }
        const anims = ArrayOrEmpty(doc.animations);
        if (anims.length === 0) {
            return "No animations.";
        }
        return anims.map((a, i) => `${i}: ${a.name ?? "(unnamed)"} — ${a.channels.length} channel(s), ${a.samplers.length} sampler(s)`).join("\n");
    }

    listTextures(name: string): string {
        const doc = this._getDoc(name);
        if (typeof doc === "string") {
            return doc;
        }
        const textures = ArrayOrEmpty(doc.textures);
        if (textures.length === 0) {
            return "No textures.";
        }
        return textures.map((t, i) => `${i}: ${t.name ?? "(unnamed)"} — source=${t.source ?? "none"}, sampler=${t.sampler ?? "none"}`).join("\n");
    }

    listExtensions(name: string): string {
        const doc = this._getDoc(name);
        if (typeof doc === "string") {
            return doc;
        }
        const used = ArrayOrEmpty(doc.extensionsUsed);
        const required = ArrayOrEmpty(doc.extensionsRequired);
        if (used.length === 0 && required.length === 0) {
            return "No extensions declared.";
        }
        const lines: string[] = [];
        if (used.length > 0) {
            lines.push(`**extensionsUsed**: ${used.join(", ")}`);
        }
        if (required.length > 0) {
            lines.push(`**extensionsRequired**: ${required.join(", ")}`);
        }
        return lines.join("\n");
    }

    /* ================ Node and scene editing ==================== */

    addScene(name: string, sceneName?: string): string {
        const doc = this._getDoc(name);
        if (typeof doc === "string") {
            return doc;
        }
        const scenes = EnsureArray<IGltfScene>(doc as unknown as Record<string, unknown>, "scenes");
        const idx = scenes.length;
        scenes.push({ name: sceneName ?? `Scene_${idx}`, nodes: [] });
        return `Added scene ${idx}: "${scenes[idx].name}".`;
    }

    renameScene(name: string, sceneIndex: number, newName: string): string {
        const doc = this._getDoc(name);
        if (typeof doc === "string") {
            return doc;
        }
        const scenes = ArrayOrEmpty(doc.scenes);
        if (sceneIndex < 0 || sceneIndex >= scenes.length) {
            return `Error: Scene index ${sceneIndex} out of range.`;
        }
        const old = scenes[sceneIndex].name;
        scenes[sceneIndex].name = newName;
        return `Renamed scene ${sceneIndex} from "${old ?? "(unnamed)"}" to "${newName}".`;
    }

    setActiveScene(name: string, sceneIndex: number): string {
        const doc = this._getDoc(name);
        if (typeof doc === "string") {
            return doc;
        }
        const scenes = ArrayOrEmpty(doc.scenes);
        if (sceneIndex < 0 || sceneIndex >= scenes.length) {
            return `Error: Scene index ${sceneIndex} out of range.`;
        }
        doc.scene = sceneIndex;
        return `Active scene set to ${sceneIndex}: "${scenes[sceneIndex].name ?? "(unnamed)"}".`;
    }

    addNode(name: string, nodeName?: string, parentNodeIndex?: number, sceneIndex?: number): string {
        const doc = this._getDoc(name);
        if (typeof doc === "string") {
            return doc;
        }
        const nodes = EnsureArray<IGltfNode>(doc as unknown as Record<string, unknown>, "nodes");
        const idx = nodes.length;
        nodes.push({ name: nodeName ?? `Node_${idx}` });

        if (parentNodeIndex !== undefined) {
            if (parentNodeIndex < 0 || parentNodeIndex >= idx) {
                return `Error: Parent node index ${parentNodeIndex} out of range.`;
            }
            const parent = nodes[parentNodeIndex];
            if (!parent.children) {
                parent.children = [];
            }
            parent.children.push(idx);
        } else {
            // Add to scene root
            const si = sceneIndex ?? doc.scene ?? 0;
            const scenes = ArrayOrEmpty(doc.scenes);
            if (si >= 0 && si < scenes.length) {
                if (!scenes[si].nodes) {
                    scenes[si].nodes = [];
                }
                scenes[si].nodes!.push(idx);
            }
        }
        return `Added node ${idx}: "${nodes[idx].name}".`;
    }

    renameNode(name: string, nodeIndex: number, newName: string): string {
        const doc = this._getDoc(name);
        if (typeof doc === "string") {
            return doc;
        }
        const nodes = ArrayOrEmpty(doc.nodes);
        if (nodeIndex < 0 || nodeIndex >= nodes.length) {
            return `Error: Node index ${nodeIndex} out of range.`;
        }
        const old = nodes[nodeIndex].name;
        nodes[nodeIndex].name = newName;
        return `Renamed node ${nodeIndex} from "${old ?? "(unnamed)"}" to "${newName}".`;
    }

    setNodeTransform(
        name: string,
        nodeIndex: number,
        translation?: [number, number, number],
        rotation?: [number, number, number, number],
        scale?: [number, number, number]
    ): string {
        const doc = this._getDoc(name);
        if (typeof doc === "string") {
            return doc;
        }
        const nodes = ArrayOrEmpty(doc.nodes);
        if (nodeIndex < 0 || nodeIndex >= nodes.length) {
            return `Error: Node index ${nodeIndex} out of range.`;
        }
        const n = nodes[nodeIndex];
        // TRS and matrix are mutually exclusive per spec — clear matrix if present
        delete n.matrix;
        if (translation) {
            n.translation = translation;
        }
        if (rotation) {
            n.rotation = rotation;
        }
        if (scale) {
            n.scale = scale;
        }
        return `Updated transform on node ${nodeIndex} "${n.name ?? "(unnamed)"}".`;
    }

    setNodeMatrix(name: string, nodeIndex: number, matrix: number[]): string {
        const doc = this._getDoc(name);
        if (typeof doc === "string") {
            return doc;
        }
        const nodes = ArrayOrEmpty(doc.nodes);
        if (nodeIndex < 0 || nodeIndex >= nodes.length) {
            return `Error: Node index ${nodeIndex} out of range.`;
        }
        if (matrix.length !== 16) {
            return "Error: Matrix must have exactly 16 elements.";
        }
        const n = nodes[nodeIndex];
        // Matrix and TRS are mutually exclusive per spec
        delete n.translation;
        delete n.rotation;
        delete n.scale;
        n.matrix = matrix;
        return `Set matrix on node ${nodeIndex} "${n.name ?? "(unnamed)"}".`;
    }

    clearNodeTransform(name: string, nodeIndex: number): string {
        const doc = this._getDoc(name);
        if (typeof doc === "string") {
            return doc;
        }
        const nodes = ArrayOrEmpty(doc.nodes);
        if (nodeIndex < 0 || nodeIndex >= nodes.length) {
            return `Error: Node index ${nodeIndex} out of range.`;
        }
        const n = nodes[nodeIndex];
        delete n.translation;
        delete n.rotation;
        delete n.scale;
        delete n.matrix;
        return `Cleared transform on node ${nodeIndex} "${n.name ?? "(unnamed)"}".`;
    }

    reparentNode(name: string, nodeIndex: number, newParentIndex?: number, sceneIndex?: number): string {
        const doc = this._getDoc(name);
        if (typeof doc === "string") {
            return doc;
        }
        const nodes = ArrayOrEmpty(doc.nodes);
        if (nodeIndex < 0 || nodeIndex >= nodes.length) {
            return `Error: Node index ${nodeIndex} out of range.`;
        }
        if (newParentIndex !== undefined && (newParentIndex < 0 || newParentIndex >= nodes.length)) {
            return `Error: New parent node index ${newParentIndex} out of range.`;
        }
        if (newParentIndex === nodeIndex) {
            return "Error: A node cannot be its own parent.";
        }
        // Check for cycle
        if (newParentIndex !== undefined && this._isDescendant(doc, newParentIndex, nodeIndex)) {
            return "Error: Reparenting would create a cycle.";
        }

        // Remove from current parent(s) and scene roots
        this._removeNodeFromAllParents(doc, nodeIndex);

        if (newParentIndex !== undefined) {
            const parent = nodes[newParentIndex];
            if (!parent.children) {
                parent.children = [];
            }
            parent.children.push(nodeIndex);
        } else {
            // Move to scene root
            const si = sceneIndex ?? doc.scene ?? 0;
            const scenes = ArrayOrEmpty(doc.scenes);
            if (si >= 0 && si < scenes.length) {
                if (!scenes[si].nodes) {
                    scenes[si].nodes = [];
                }
                scenes[si].nodes!.push(nodeIndex);
            }
        }
        return `Reparented node ${nodeIndex} "${nodes[nodeIndex].name ?? "(unnamed)"}" to ${newParentIndex !== undefined ? `node ${newParentIndex}` : "scene root"}.`;
    }

    removeNode(name: string, nodeIndex: number): string {
        const doc = this._getDoc(name);
        if (typeof doc === "string") {
            return doc;
        }
        const nodes = ArrayOrEmpty(doc.nodes);
        if (nodeIndex < 0 || nodeIndex >= nodes.length) {
            return `Error: Node index ${nodeIndex} out of range.`;
        }
        const nodeName = nodes[nodeIndex].name;
        // Remove from parent references
        this._removeNodeFromAllParents(doc, nodeIndex);
        // Nullify the slot (to preserve indices)
        (nodes as (IGltfNode | null)[])[nodeIndex] = null as unknown as IGltfNode;
        // Clean children references that point to this node
        for (const n of nodes) {
            if (n && n.children) {
                n.children = n.children.filter((c) => c !== nodeIndex);
                if (n.children.length === 0) {
                    delete n.children;
                }
            }
        }
        return `Removed node ${nodeIndex} "${nodeName ?? "(unnamed)"}" (slot nullified to preserve indices).`;
    }

    addChildNode(name: string, parentIndex: number, childName?: string): string {
        return this.addNode(name, childName, parentIndex);
    }

    /* ================ Mesh / primitive editing ================== */

    addMesh(name: string, meshName?: string): string {
        const doc = this._getDoc(name);
        if (typeof doc === "string") {
            return doc;
        }
        const meshes = EnsureArray<IGltfMesh>(doc as unknown as Record<string, unknown>, "meshes");
        const idx = meshes.length;
        meshes.push({
            name: meshName ?? `Mesh_${idx}`,
            primitives: [{ attributes: {} }],
        });
        return `Added mesh ${idx}: "${meshes[idx].name}" with 1 empty primitive.`;
    }

    removeMesh(name: string, meshIndex: number): string {
        const doc = this._getDoc(name);
        if (typeof doc === "string") {
            return doc;
        }
        const meshes = ArrayOrEmpty(doc.meshes);
        if (meshIndex < 0 || meshIndex >= meshes.length) {
            return `Error: Mesh index ${meshIndex} out of range.`;
        }
        const meshName = meshes[meshIndex].name;
        // Nullify slot
        (meshes as (IGltfMesh | null)[])[meshIndex] = null as unknown as IGltfMesh;
        // Remove references from nodes
        for (const n of ArrayOrEmpty(doc.nodes)) {
            if (n && n.mesh === meshIndex) {
                delete n.mesh;
            }
        }
        return `Removed mesh ${meshIndex} "${meshName ?? "(unnamed)"}" and cleared node references.`;
    }

    assignMeshToNode(name: string, nodeIndex: number, meshIndex: number): string {
        const doc = this._getDoc(name);
        if (typeof doc === "string") {
            return doc;
        }
        const nodes = ArrayOrEmpty(doc.nodes);
        const meshes = ArrayOrEmpty(doc.meshes);
        if (nodeIndex < 0 || nodeIndex >= nodes.length) {
            return `Error: Node index ${nodeIndex} out of range.`;
        }
        if (meshIndex < 0 || meshIndex >= meshes.length) {
            return `Error: Mesh index ${meshIndex} out of range.`;
        }
        nodes[nodeIndex].mesh = meshIndex;
        return `Assigned mesh ${meshIndex} to node ${nodeIndex}.`;
    }

    unassignMeshFromNode(name: string, nodeIndex: number): string {
        const doc = this._getDoc(name);
        if (typeof doc === "string") {
            return doc;
        }
        const nodes = ArrayOrEmpty(doc.nodes);
        if (nodeIndex < 0 || nodeIndex >= nodes.length) {
            return `Error: Node index ${nodeIndex} out of range.`;
        }
        delete nodes[nodeIndex].mesh;
        return `Unassigned mesh from node ${nodeIndex}.`;
    }

    describeMeshPrimitives(name: string, meshIndex: number): string {
        return this.describeMesh(name, meshIndex);
    }

    setPrimitiveMaterial(name: string, meshIndex: number, primitiveIndex: number, materialIndex: number): string {
        const doc = this._getDoc(name);
        if (typeof doc === "string") {
            return doc;
        }
        const meshes = ArrayOrEmpty(doc.meshes);
        if (meshIndex < 0 || meshIndex >= meshes.length) {
            return `Error: Mesh index ${meshIndex} out of range.`;
        }
        const prims = meshes[meshIndex].primitives;
        if (primitiveIndex < 0 || primitiveIndex >= prims.length) {
            return `Error: Primitive index ${primitiveIndex} out of range.`;
        }
        const materials = ArrayOrEmpty(doc.materials);
        if (materialIndex < 0 || materialIndex >= materials.length) {
            return `Error: Material index ${materialIndex} out of range.`;
        }
        prims[primitiveIndex].material = materialIndex;
        return `Set material ${materialIndex} on mesh ${meshIndex} primitive ${primitiveIndex}.`;
    }

    removePrimitiveMaterial(name: string, meshIndex: number, primitiveIndex: number): string {
        const doc = this._getDoc(name);
        if (typeof doc === "string") {
            return doc;
        }
        const meshes = ArrayOrEmpty(doc.meshes);
        if (meshIndex < 0 || meshIndex >= meshes.length) {
            return `Error: Mesh index ${meshIndex} out of range.`;
        }
        const prims = meshes[meshIndex].primitives;
        if (primitiveIndex < 0 || primitiveIndex >= prims.length) {
            return `Error: Primitive index ${primitiveIndex} out of range.`;
        }
        delete prims[primitiveIndex].material;
        return `Removed material from mesh ${meshIndex} primitive ${primitiveIndex}.`;
    }

    /* ================ Material editing ========================== */

    addMaterial(name: string, materialName?: string): string {
        const doc = this._getDoc(name);
        if (typeof doc === "string") {
            return doc;
        }
        const materials = EnsureArray<IGltfMaterial>(doc as unknown as Record<string, unknown>, "materials");
        const idx = materials.length;
        materials.push({
            name: materialName ?? `Material_${idx}`,
            pbrMetallicRoughness: {
                baseColorFactor: [1, 1, 1, 1],
                metallicFactor: 1.0,
                roughnessFactor: 1.0,
            },
        });
        return `Added material ${idx}: "${materials[idx].name}".`;
    }

    removeMaterial(name: string, materialIndex: number): string {
        const doc = this._getDoc(name);
        if (typeof doc === "string") {
            return doc;
        }
        const materials = ArrayOrEmpty(doc.materials);
        if (materialIndex < 0 || materialIndex >= materials.length) {
            return `Error: Material index ${materialIndex} out of range.`;
        }
        const matName = materials[materialIndex].name;
        (materials as (IGltfMaterial | null)[])[materialIndex] = null as unknown as IGltfMaterial;
        // Clear refs from mesh primitives
        for (const m of ArrayOrEmpty(doc.meshes)) {
            if (!m) {
                continue;
            }
            for (const p of m.primitives) {
                if (p.material === materialIndex) {
                    delete p.material;
                }
            }
        }
        return `Removed material ${materialIndex} "${matName ?? "(unnamed)"}" and cleared primitive references.`;
    }

    renameMaterial(name: string, materialIndex: number, newName: string): string {
        const doc = this._getDoc(name);
        if (typeof doc === "string") {
            return doc;
        }
        const materials = ArrayOrEmpty(doc.materials);
        if (materialIndex < 0 || materialIndex >= materials.length) {
            return `Error: Material index ${materialIndex} out of range.`;
        }
        const old = materials[materialIndex].name;
        materials[materialIndex].name = newName;
        return `Renamed material ${materialIndex} from "${old ?? "(unnamed)"}" to "${newName}".`;
    }

    setMaterialPbr(
        name: string,
        materialIndex: number,
        baseColorFactor?: [number, number, number, number],
        metallicFactor?: number,
        roughnessFactor?: number,
        baseColorTexture?: number,
        metallicRoughnessTexture?: number
    ): string {
        const doc = this._getDoc(name);
        if (typeof doc === "string") {
            return doc;
        }
        const materials = ArrayOrEmpty(doc.materials);
        if (materialIndex < 0 || materialIndex >= materials.length) {
            return `Error: Material index ${materialIndex} out of range.`;
        }
        const mat = materials[materialIndex];
        if (!mat.pbrMetallicRoughness) {
            mat.pbrMetallicRoughness = {};
        }
        const pbr = mat.pbrMetallicRoughness;
        if (baseColorFactor !== undefined) {
            pbr.baseColorFactor = baseColorFactor;
        }
        if (metallicFactor !== undefined) {
            pbr.metallicFactor = metallicFactor;
        }
        if (roughnessFactor !== undefined) {
            pbr.roughnessFactor = roughnessFactor;
        }
        if (baseColorTexture !== undefined) {
            pbr.baseColorTexture = { index: baseColorTexture };
        }
        if (metallicRoughnessTexture !== undefined) {
            pbr.metallicRoughnessTexture = { index: metallicRoughnessTexture };
        }
        return `Updated PBR properties on material ${materialIndex} "${mat.name ?? "(unnamed)"}".`;
    }

    setMaterialAlphaMode(name: string, materialIndex: number, alphaMode: string, alphaCutoff?: number): string {
        const doc = this._getDoc(name);
        if (typeof doc === "string") {
            return doc;
        }
        const materials = ArrayOrEmpty(doc.materials);
        if (materialIndex < 0 || materialIndex >= materials.length) {
            return `Error: Material index ${materialIndex} out of range.`;
        }
        const valid = ["OPAQUE", "MASK", "BLEND"];
        if (!valid.includes(alphaMode)) {
            return `Error: alphaMode must be one of ${valid.join(", ")}.`;
        }
        materials[materialIndex].alphaMode = alphaMode as "OPAQUE" | "MASK" | "BLEND";
        if (alphaCutoff !== undefined) {
            materials[materialIndex].alphaCutoff = alphaCutoff;
        }
        return `Set alphaMode=${alphaMode} on material ${materialIndex}.`;
    }

    setMaterialDoubleSided(name: string, materialIndex: number, doubleSided: boolean): string {
        const doc = this._getDoc(name);
        if (typeof doc === "string") {
            return doc;
        }
        const materials = ArrayOrEmpty(doc.materials);
        if (materialIndex < 0 || materialIndex >= materials.length) {
            return `Error: Material index ${materialIndex} out of range.`;
        }
        materials[materialIndex].doubleSided = doubleSided;
        return `Set doubleSided=${doubleSided} on material ${materialIndex}.`;
    }

    setMaterialEmissive(name: string, materialIndex: number, emissiveFactor?: [number, number, number], emissiveTexture?: number): string {
        const doc = this._getDoc(name);
        if (typeof doc === "string") {
            return doc;
        }
        const materials = ArrayOrEmpty(doc.materials);
        if (materialIndex < 0 || materialIndex >= materials.length) {
            return `Error: Material index ${materialIndex} out of range.`;
        }
        if (emissiveFactor) {
            materials[materialIndex].emissiveFactor = emissiveFactor;
        }
        if (emissiveTexture !== undefined) {
            materials[materialIndex].emissiveTexture = { index: emissiveTexture };
        }
        return `Updated emissive properties on material ${materialIndex}.`;
    }

    setMaterialTexture(name: string, materialIndex: number, slot: string, textureIndex: number): string {
        const doc = this._getDoc(name);
        if (typeof doc === "string") {
            return doc;
        }
        const materials = ArrayOrEmpty(doc.materials);
        if (materialIndex < 0 || materialIndex >= materials.length) {
            return `Error: Material index ${materialIndex} out of range.`;
        }
        const textures = ArrayOrEmpty(doc.textures);
        if (textureIndex < 0 || textureIndex >= textures.length) {
            return `Error: Texture index ${textureIndex} out of range.`;
        }
        const mat = materials[materialIndex];
        const pbrSlots = ["baseColorTexture", "metallicRoughnessTexture"];
        const topSlots = ["normalTexture", "occlusionTexture", "emissiveTexture"];
        if (pbrSlots.includes(slot)) {
            if (!mat.pbrMetallicRoughness) {
                mat.pbrMetallicRoughness = {};
            }
            (mat.pbrMetallicRoughness as Record<string, unknown>)[slot] = { index: textureIndex };
        } else if (topSlots.includes(slot)) {
            (mat as Record<string, unknown>)[slot] = { index: textureIndex };
        } else {
            return `Error: Unknown texture slot "${slot}". Valid: ${[...pbrSlots, ...topSlots].join(", ")}.`;
        }
        return `Assigned texture ${textureIndex} to ${slot} on material ${materialIndex}.`;
    }

    assignMaterialToMeshPrimitive(name: string, meshIndex: number, primitiveIndex: number, materialIndex: number): string {
        return this.setPrimitiveMaterial(name, meshIndex, primitiveIndex, materialIndex);
    }

    /* ============= Texture / image / sampler editing ============ */

    addImageReference(name: string, uri: string, imageName?: string, mimeType?: string): string {
        const doc = this._getDoc(name);
        if (typeof doc === "string") {
            return doc;
        }
        const images = EnsureArray<IGltfImage>(doc as unknown as Record<string, unknown>, "images");
        const idx = images.length;
        const img: IGltfImage = { uri, name: imageName };
        if (mimeType) {
            img.mimeType = mimeType;
        }
        images.push(img);
        return `Added image ${idx}: "${imageName ?? uri}".`;
    }

    removeImage(name: string, imageIndex: number): string {
        const doc = this._getDoc(name);
        if (typeof doc === "string") {
            return doc;
        }
        const images = ArrayOrEmpty(doc.images);
        if (imageIndex < 0 || imageIndex >= images.length) {
            return `Error: Image index ${imageIndex} out of range.`;
        }
        (images as (IGltfImage | null)[])[imageIndex] = null as unknown as IGltfImage;
        // Clear texture source references
        for (const t of ArrayOrEmpty(doc.textures)) {
            if (t && t.source === imageIndex) {
                delete t.source;
            }
        }
        return `Removed image ${imageIndex} and cleared texture references.`;
    }

    addTexture(name: string, sourceImage?: number, sampler?: number, textureName?: string): string {
        const doc = this._getDoc(name);
        if (typeof doc === "string") {
            return doc;
        }
        const textures = EnsureArray<IGltfTexture>(doc as unknown as Record<string, unknown>, "textures");
        const idx = textures.length;
        const tex: IGltfTexture = { name: textureName };
        if (sourceImage !== undefined) {
            tex.source = sourceImage;
        }
        if (sampler !== undefined) {
            tex.sampler = sampler;
        }
        textures.push(tex);
        return `Added texture ${idx}${textureName ? `: "${textureName}"` : ""}.`;
    }

    removeTexture(name: string, textureIndex: number): string {
        const doc = this._getDoc(name);
        if (typeof doc === "string") {
            return doc;
        }
        const textures = ArrayOrEmpty(doc.textures);
        if (textureIndex < 0 || textureIndex >= textures.length) {
            return `Error: Texture index ${textureIndex} out of range.`;
        }
        (textures as (IGltfTexture | null)[])[textureIndex] = null as unknown as IGltfTexture;
        return `Removed texture ${textureIndex}.`;
    }

    setTextureSampler(name: string, textureIndex: number, samplerIndex: number): string {
        const doc = this._getDoc(name);
        if (typeof doc === "string") {
            return doc;
        }
        const textures = ArrayOrEmpty(doc.textures);
        if (textureIndex < 0 || textureIndex >= textures.length) {
            return `Error: Texture index ${textureIndex} out of range.`;
        }
        const samplers = ArrayOrEmpty(doc.samplers);
        if (samplerIndex < 0 || samplerIndex >= samplers.length) {
            return `Error: Sampler index ${samplerIndex} out of range.`;
        }
        textures[textureIndex].sampler = samplerIndex;
        return `Set sampler ${samplerIndex} on texture ${textureIndex}.`;
    }

    addSampler(name: string, magFilter?: number, minFilter?: number, wrapS?: number, wrapT?: number, samplerName?: string): string {
        const doc = this._getDoc(name);
        if (typeof doc === "string") {
            return doc;
        }
        const samplers = EnsureArray<IGltfSampler>(doc as unknown as Record<string, unknown>, "samplers");
        const idx = samplers.length;
        const s: IGltfSampler = { name: samplerName };
        if (magFilter !== undefined) {
            s.magFilter = magFilter;
        }
        if (minFilter !== undefined) {
            s.minFilter = minFilter;
        }
        if (wrapS !== undefined) {
            s.wrapS = wrapS;
        }
        if (wrapT !== undefined) {
            s.wrapT = wrapT;
        }
        samplers.push(s);
        return `Added sampler ${idx}${samplerName ? `: "${samplerName}"` : ""}.`;
    }

    removeSampler(name: string, samplerIndex: number): string {
        const doc = this._getDoc(name);
        if (typeof doc === "string") {
            return doc;
        }
        const samplers = ArrayOrEmpty(doc.samplers);
        if (samplerIndex < 0 || samplerIndex >= samplers.length) {
            return `Error: Sampler index ${samplerIndex} out of range.`;
        }
        (samplers as (IGltfSampler | null)[])[samplerIndex] = null as unknown as IGltfSampler;
        // Clear texture sampler refs
        for (const t of ArrayOrEmpty(doc.textures)) {
            if (t && t.sampler === samplerIndex) {
                delete t.sampler;
            }
        }
        return `Removed sampler ${samplerIndex} and cleared texture references.`;
    }

    /* ============= Animation / skin editing ===================== */

    listAnimationChannels(name: string, animIndex: number): string {
        const doc = this._getDoc(name);
        if (typeof doc === "string") {
            return doc;
        }
        const anims = ArrayOrEmpty(doc.animations);
        if (animIndex < 0 || animIndex >= anims.length) {
            return `Error: Animation index ${animIndex} out of range.`;
        }
        const a = anims[animIndex];
        if (a.channels.length === 0) {
            return "No channels.";
        }
        return a.channels.map((ch, i) => `${i}: node=${ch.target.node ?? "?"}, path=${ch.target.path}, sampler=${ch.sampler}`).join("\n");
    }

    describeAnimationChannel(name: string, animIndex: number, channelIndex: number): string {
        const doc = this._getDoc(name);
        if (typeof doc === "string") {
            return doc;
        }
        const anims = ArrayOrEmpty(doc.animations);
        if (animIndex < 0 || animIndex >= anims.length) {
            return `Error: Animation index ${animIndex} out of range.`;
        }
        const a = anims[animIndex];
        if (channelIndex < 0 || channelIndex >= a.channels.length) {
            return `Error: Channel index ${channelIndex} out of range.`;
        }
        const ch = a.channels[channelIndex];
        const samp = a.samplers[ch.sampler];
        const lines = [
            `## Animation ${animIndex} Channel ${channelIndex}`,
            `- **Target node**: ${ch.target.node ?? "undefined"}`,
            `- **Target path**: ${ch.target.path}`,
            `- **Sampler**: ${ch.sampler}`,
        ];
        if (samp) {
            lines.push(`- **Interpolation**: ${samp.interpolation ?? "LINEAR"}`);
            lines.push(`- **Input accessor**: ${samp.input}`);
            lines.push(`- **Output accessor**: ${samp.output}`);
        }
        return lines.join("\n");
    }

    renameAnimation(name: string, animIndex: number, newName: string): string {
        const doc = this._getDoc(name);
        if (typeof doc === "string") {
            return doc;
        }
        const anims = ArrayOrEmpty(doc.animations);
        if (animIndex < 0 || animIndex >= anims.length) {
            return `Error: Animation index ${animIndex} out of range.`;
        }
        const old = anims[animIndex].name;
        anims[animIndex].name = newName;
        return `Renamed animation ${animIndex} from "${old ?? "(unnamed)"}" to "${newName}".`;
    }

    removeAnimation(name: string, animIndex: number): string {
        const doc = this._getDoc(name);
        if (typeof doc === "string") {
            return doc;
        }
        const anims = ArrayOrEmpty(doc.animations);
        if (animIndex < 0 || animIndex >= anims.length) {
            return `Error: Animation index ${animIndex} out of range.`;
        }
        const animName = anims[animIndex].name;
        (anims as (IGltfAnimation | null)[])[animIndex] = null as unknown as IGltfAnimation;
        return `Removed animation ${animIndex} "${animName ?? "(unnamed)"}".`;
    }

    removeSkin(name: string, skinIndex: number): string {
        const doc = this._getDoc(name);
        if (typeof doc === "string") {
            return doc;
        }
        const skins = ArrayOrEmpty(doc.skins);
        if (skinIndex < 0 || skinIndex >= skins.length) {
            return `Error: Skin index ${skinIndex} out of range.`;
        }
        const skinName = skins[skinIndex].name;
        (skins as (IGltfSkin | null)[])[skinIndex] = null as unknown as IGltfSkin;
        for (const n of ArrayOrEmpty(doc.nodes)) {
            if (n && n.skin === skinIndex) {
                delete n.skin;
            }
        }
        return `Removed skin ${skinIndex} "${skinName ?? "(unnamed)"}" and cleared node references.`;
    }

    /* ================ Extension handling ======================== */

    getExtensionData(name: string, extensionName: string, targetType: GltfExtensionTargetType, targetIndex?: number): string {
        const doc = this._getDoc(name);
        if (typeof doc === "string") {
            return doc;
        }
        const target = ResolveExtensionTarget(doc, targetType, targetIndex);
        if (!target) {
            return `Error: Invalid target ${targetType}${targetIndex !== undefined ? `[${targetIndex}]` : ""}.`;
        }
        const data = target.extensions?.[extensionName];
        if (data === undefined) {
            return `No extension data for "${extensionName}" on ${targetType}${targetIndex !== undefined ? `[${targetIndex}]` : ""}.`;
        }
        return JSON.stringify(data, null, 2);
    }

    setExtensionData(name: string, extensionName: string, data: unknown, targetType: GltfExtensionTargetType, targetIndex?: number): string {
        const doc = this._getDoc(name);
        if (typeof doc === "string") {
            return doc;
        }
        const target = ResolveExtensionTarget(doc, targetType, targetIndex);
        if (!target) {
            return `Error: Invalid target ${targetType}${targetIndex !== undefined ? `[${targetIndex}]` : ""}.`;
        }
        if (!target.extensions) {
            target.extensions = {};
        }
        target.extensions[extensionName] = data;
        return `Set extension "${extensionName}" on ${targetType}${targetIndex !== undefined ? `[${targetIndex}]` : ""}.`;
    }

    removeExtensionData(name: string, extensionName: string, targetType: GltfExtensionTargetType, targetIndex?: number): string {
        const doc = this._getDoc(name);
        if (typeof doc === "string") {
            return doc;
        }
        const target = ResolveExtensionTarget(doc, targetType, targetIndex);
        if (!target) {
            return `Error: Invalid target ${targetType}${targetIndex !== undefined ? `[${targetIndex}]` : ""}.`;
        }
        if (!target.extensions || !(extensionName in target.extensions)) {
            return `No extension data for "${extensionName}" to remove.`;
        }
        delete target.extensions[extensionName];
        if (Object.keys(target.extensions).length === 0) {
            delete target.extensions;
        }
        return `Removed extension "${extensionName}" from ${targetType}${targetIndex !== undefined ? `[${targetIndex}]` : ""}.`;
    }

    addExtensionToUsed(name: string, extensionName: string): string {
        const doc = this._getDoc(name);
        if (typeof doc === "string") {
            return doc;
        }
        if (!doc.extensionsUsed) {
            doc.extensionsUsed = [];
        }
        if (!doc.extensionsUsed.includes(extensionName)) {
            doc.extensionsUsed.push(extensionName);
        }
        return `"${extensionName}" is in extensionsUsed.`;
    }

    addExtensionToRequired(name: string, extensionName: string): string {
        const doc = this._getDoc(name);
        if (typeof doc === "string") {
            return doc;
        }
        if (!doc.extensionsRequired) {
            doc.extensionsRequired = [];
        }
        if (!doc.extensionsRequired.includes(extensionName)) {
            doc.extensionsRequired.push(extensionName);
        }
        // Also add to used if not already
        if (!doc.extensionsUsed) {
            doc.extensionsUsed = [];
        }
        if (!doc.extensionsUsed.includes(extensionName)) {
            doc.extensionsUsed.push(extensionName);
        }
        return `"${extensionName}" is in extensionsRequired (and extensionsUsed).`;
    }

    removeExtensionFromUsed(name: string, extensionName: string): string {
        const doc = this._getDoc(name);
        if (typeof doc === "string") {
            return doc;
        }
        if (!doc.extensionsUsed) {
            return `"${extensionName}" was not in extensionsUsed.`;
        }
        doc.extensionsUsed = doc.extensionsUsed.filter((e) => e !== extensionName);
        if (doc.extensionsUsed.length === 0) {
            delete doc.extensionsUsed;
        }
        // Also remove from required
        if (doc.extensionsRequired) {
            doc.extensionsRequired = doc.extensionsRequired.filter((e) => e !== extensionName);
            if (doc.extensionsRequired.length === 0) {
                delete doc.extensionsRequired;
            }
        }
        return `Removed "${extensionName}" from extensionsUsed (and extensionsRequired if present).`;
    }

    removeExtensionFromRequired(name: string, extensionName: string): string {
        const doc = this._getDoc(name);
        if (typeof doc === "string") {
            return doc;
        }
        if (!doc.extensionsRequired) {
            return `"${extensionName}" was not in extensionsRequired.`;
        }
        doc.extensionsRequired = doc.extensionsRequired.filter((e) => e !== extensionName);
        if (doc.extensionsRequired.length === 0) {
            delete doc.extensionsRequired;
        }
        return `Removed "${extensionName}" from extensionsRequired.`;
    }

    /* ================ Validation ================================ */

    validateGltf(name: string): IGltfValidationIssue[] {
        const doc = this._getDoc(name);
        if (typeof doc === "string") {
            return [{ severity: "error", message: doc }];
        }

        const issues: IGltfValidationIssue[] = [];
        const nodes = ArrayOrEmpty(doc.nodes);
        const meshes = ArrayOrEmpty(doc.meshes);
        const materials = ArrayOrEmpty(doc.materials);
        const textures = ArrayOrEmpty(doc.textures);
        const images = ArrayOrEmpty(doc.images);
        const samplers = ArrayOrEmpty(doc.samplers);
        const accessors = ArrayOrEmpty(doc.accessors);
        const scenes = ArrayOrEmpty(doc.scenes);
        const animations = ArrayOrEmpty(doc.animations);
        const skins = ArrayOrEmpty(doc.skins);

        // Asset check
        if (!doc.asset?.version) {
            issues.push({ severity: "error", message: "Missing asset.version.", path: "asset" });
        }

        // Active scene check
        if (doc.scene !== undefined && (doc.scene < 0 || doc.scene >= scenes.length)) {
            issues.push({ severity: "error", message: `Active scene index ${doc.scene} out of range (${scenes.length} scenes).`, path: "scene" });
        }

        // Scene node refs
        scenes.forEach((s, si) => {
            for (const ni of ArrayOrEmpty(s.nodes)) {
                if (ni < 0 || ni >= nodes.length || !nodes[ni]) {
                    issues.push({ severity: "error", message: `Scene ${si} references invalid node ${ni}.`, path: `scenes[${si}].nodes` });
                }
            }
        });

        // Node children refs
        nodes.forEach((n, ni) => {
            if (!n) {
                return;
            }
            for (const ci of ArrayOrEmpty(n.children)) {
                if (ci < 0 || ci >= nodes.length || !nodes[ci]) {
                    issues.push({ severity: "error", message: `Node ${ni} references invalid child ${ci}.`, path: `nodes[${ni}].children` });
                }
            }
            if (n.mesh !== undefined && (n.mesh < 0 || n.mesh >= meshes.length || !meshes[n.mesh])) {
                issues.push({ severity: "error", message: `Node ${ni} references invalid mesh ${n.mesh}.`, path: `nodes[${ni}].mesh` });
            }
            if (n.skin !== undefined && (n.skin < 0 || n.skin >= skins.length || !skins[n.skin])) {
                issues.push({ severity: "error", message: `Node ${ni} references invalid skin ${n.skin}.`, path: `nodes[${ni}].skin` });
            }
            // TRS + matrix mutual exclusion
            if (n.matrix && (n.translation || n.rotation || n.scale)) {
                issues.push({ severity: "warning", message: `Node ${ni} has both matrix and TRS properties.`, path: `nodes[${ni}]` });
            }
        });

        // Mesh primitive material refs
        meshes.forEach((m, mi) => {
            if (!m) {
                return;
            }
            m.primitives.forEach((p, pi) => {
                if (p.material !== undefined && (p.material < 0 || p.material >= materials.length || !materials[p.material])) {
                    issues.push({
                        severity: "error",
                        message: `Mesh ${mi} primitive ${pi} references invalid material ${p.material}.`,
                        path: `meshes[${mi}].primitives[${pi}].material`,
                    });
                }
            });
        });

        // Material texture refs
        materials.forEach((mat, mi) => {
            if (!mat) {
                return;
            }
            const checkTex = (
                texInfo:
                    | {
                          /**
                           *
                           */
                          index: number;
                      }
                    | undefined,
                label: string
            ) => {
                if (texInfo && (texInfo.index < 0 || texInfo.index >= textures.length || !textures[texInfo.index])) {
                    issues.push({ severity: "error", message: `Material ${mi} ${label} references invalid texture ${texInfo.index}.`, path: `materials[${mi}].${label}` });
                }
            };
            checkTex(mat.pbrMetallicRoughness?.baseColorTexture, "baseColorTexture");
            checkTex(mat.pbrMetallicRoughness?.metallicRoughnessTexture, "metallicRoughnessTexture");
            checkTex(mat.normalTexture, "normalTexture");
            checkTex(mat.occlusionTexture, "occlusionTexture");
            checkTex(mat.emissiveTexture, "emissiveTexture");
        });

        // Texture image/sampler refs
        textures.forEach((t, ti) => {
            if (!t) {
                return;
            }
            if (t.source !== undefined && (t.source < 0 || t.source >= images.length || !images[t.source])) {
                issues.push({ severity: "error", message: `Texture ${ti} references invalid image ${t.source}.`, path: `textures[${ti}].source` });
            }
            if (t.sampler !== undefined && (t.sampler < 0 || t.sampler >= samplers.length || !samplers[t.sampler])) {
                issues.push({ severity: "error", message: `Texture ${ti} references invalid sampler ${t.sampler}.`, path: `textures[${ti}].sampler` });
            }
        });

        // Animation refs
        animations.forEach((a, ai) => {
            if (!a) {
                return;
            }
            a.channels.forEach((ch, ci) => {
                if (ch.target.node !== undefined && (ch.target.node < 0 || ch.target.node >= nodes.length || !nodes[ch.target.node])) {
                    issues.push({
                        severity: "error",
                        message: `Animation ${ai} channel ${ci} targets invalid node ${ch.target.node}.`,
                        path: `animations[${ai}].channels[${ci}].target.node`,
                    });
                }
                if (ch.sampler < 0 || ch.sampler >= a.samplers.length) {
                    issues.push({
                        severity: "error",
                        message: `Animation ${ai} channel ${ci} references invalid sampler ${ch.sampler}.`,
                        path: `animations[${ai}].channels[${ci}].sampler`,
                    });
                }
            });
            a.samplers.forEach((s, si) => {
                if (s.input < 0 || s.input >= accessors.length) {
                    issues.push({
                        severity: "error",
                        message: `Animation ${ai} sampler ${si} input references invalid accessor ${s.input}.`,
                        path: `animations[${ai}].samplers[${si}].input`,
                    });
                }
                if (s.output < 0 || s.output >= accessors.length) {
                    issues.push({
                        severity: "error",
                        message: `Animation ${ai} sampler ${si} output references invalid accessor ${s.output}.`,
                        path: `animations[${ai}].samplers[${si}].output`,
                    });
                }
            });
        });

        // Skin refs
        skins.forEach((sk, si) => {
            if (!sk) {
                return;
            }
            for (const ji of sk.joints) {
                if (ji < 0 || ji >= nodes.length || !nodes[ji]) {
                    issues.push({ severity: "error", message: `Skin ${si} references invalid joint node ${ji}.`, path: `skins[${si}].joints` });
                }
            }
            if (sk.skeleton !== undefined && (sk.skeleton < 0 || sk.skeleton >= nodes.length || !nodes[sk.skeleton])) {
                issues.push({ severity: "error", message: `Skin ${si} references invalid skeleton node ${sk.skeleton}.`, path: `skins[${si}].skeleton` });
            }
        });

        // Extension consistency
        const referencedExtensions = this._collectUsedExtensions(doc);
        const declaredUsed = new Set(ArrayOrEmpty(doc.extensionsUsed));
        const declaredRequired = new Set(ArrayOrEmpty(doc.extensionsRequired));

        for (const ext of referencedExtensions) {
            if (!declaredUsed.has(ext)) {
                issues.push({ severity: "warning", message: `Extension "${ext}" is used in the document but not listed in extensionsUsed.`, path: "extensionsUsed" });
            }
        }
        for (const ext of declaredRequired) {
            if (!declaredUsed.has(ext)) {
                issues.push({ severity: "warning", message: `Extension "${ext}" is in extensionsRequired but not in extensionsUsed.`, path: "extensionsRequired" });
            }
        }

        // Duplicate names (warnings)
        this._checkDuplicateNames(nodes, "node", issues);
        this._checkDuplicateNames(meshes, "mesh", issues);
        this._checkDuplicateNames(materials, "material", issues);

        if (issues.length === 0) {
            issues.push({ severity: "info", message: "No issues found." });
        }

        return issues;
    }

    summarizeIssues(issues: IGltfValidationIssue[]): string {
        const errors = issues.filter((i) => i.severity === "error");
        const warnings = issues.filter((i) => i.severity === "warning");
        const infos = issues.filter((i) => i.severity === "info");

        const lines: string[] = [`## Validation Summary`, `- Errors: ${errors.length}`, `- Warnings: ${warnings.length}`];
        if (infos.length > 0 && errors.length === 0 && warnings.length === 0) {
            lines.push("\nNo issues found.");
        }
        for (const e of errors) {
            lines.push(`\n**ERROR** ${e.path ? `(${e.path})` : ""}: ${e.message}`);
        }
        for (const w of warnings) {
            lines.push(`\n**WARNING** ${w.path ? `(${w.path})` : ""}: ${w.message}`);
        }
        return lines.join("\n");
    }

    /* ================ Export / Import =========================== */

    exportJson(name: string): string | null {
        const doc = this._getDoc(name);
        if (typeof doc === "string") {
            return null;
        }
        return JSON.stringify(doc, null, 2);
    }

    importJson(name: string, jsonText: string): string {
        return this.loadGltf(name, jsonText);
    }

    exportGlb(name: string): Buffer | null {
        const doc = this._getDoc(name);
        if (typeof doc === "string") {
            return null;
        }

        // Collect binary buffer data (decode data URIs → raw bytes)
        const buffers = ArrayOrEmpty(doc.buffers);
        const binChunks: Buffer[] = [];
        let totalBinLength = 0;

        for (const buf of buffers) {
            if (buf.uri && buf.uri.startsWith("data:")) {
                const commaIdx = buf.uri.indexOf(",");
                if (commaIdx !== -1) {
                    const raw = Buffer.from(buf.uri.substring(commaIdx + 1), "base64");
                    binChunks.push(raw);
                    totalBinLength += raw.length;
                    continue;
                }
            }
            // No data or external URI — push empty placeholder of declared size
            binChunks.push(Buffer.alloc(buf.byteLength || 0));
            totalBinLength += buf.byteLength || 0;
        }

        // Build a single merged BIN buffer (GLB spec: one BIN chunk for all buffers)
        // For multi-buffer glTFs we concatenate (this is correct for single-buffer,
        // which covers the vast majority of real glTFs).
        const hasBin = totalBinLength > 0;
        const binPaddedLength = hasBin ? totalBinLength + ((4 - (totalBinLength % 4)) % 4) : 0;
        const binBuffer = hasBin ? Buffer.alloc(binPaddedLength) : null;

        if (binBuffer) {
            let offset = 0;
            for (const chunk of binChunks) {
                chunk.copy(binBuffer, offset);
                offset += chunk.length;
            }
            // Remainder is already zero-filled (proper GLB BIN padding)
        }

        // Build the JSON chunk — modify buffer entries to point at the GLB BIN chunk
        const exportDoc = DeepClone(doc);
        if (hasBin && exportDoc.buffers && exportDoc.buffers.length > 0) {
            // GLB spec: first buffer has no URI and its byteLength = total BIN chunk size
            exportDoc.buffers[0].uri = undefined;
            exportDoc.buffers[0].byteLength = totalBinLength;
            // Remove extra buffers (all merged into the single BIN chunk)
            if (exportDoc.buffers.length > 1) {
                exportDoc.buffers.length = 1;
            }
        }

        const jsonString = JSON.stringify(exportDoc);
        const jsonPadded = jsonString + " ".repeat((4 - (jsonString.length % 4)) % 4);
        const jsonChunkData = Buffer.from(jsonPadded, "utf-8");

        // GLB layout: Header (12) + JSON chunk header (8) + JSON data + [BIN chunk header (8) + BIN data]
        const totalLength = 12 + 8 + jsonChunkData.length + (hasBin ? 8 + binPaddedLength : 0);

        const glb = Buffer.alloc(totalLength);
        let offset = 0;

        // Header
        glb.writeUInt32LE(0x46546c67, offset);
        offset += 4; // "glTF" magic
        glb.writeUInt32LE(2, offset);
        offset += 4; // version
        glb.writeUInt32LE(totalLength, offset);
        offset += 4; // total length

        // JSON chunk
        glb.writeUInt32LE(jsonChunkData.length, offset);
        offset += 4;
        glb.writeUInt32LE(0x4e4f534a, offset);
        offset += 4; // "JSON"
        jsonChunkData.copy(glb, offset);
        offset += jsonChunkData.length;

        // BIN chunk
        if (binBuffer) {
            glb.writeUInt32LE(binPaddedLength, offset);
            offset += 4;
            glb.writeUInt32LE(0x004e4942, offset);
            offset += 4; // "BIN\0"
            binBuffer.copy(glb, offset);
        }

        return glb;
    }

    importGlb(name: string, buffer: Buffer): string {
        if (this._documents.has(name)) {
            return `Error: A document named "${name}" already exists.`;
        }

        if (buffer.length < 12) {
            return "Error: Buffer too small to be a valid GLB file.";
        }

        const magic = buffer.readUInt32LE(0);
        if (magic !== 0x46546c67) {
            return "Error: Invalid GLB magic number.";
        }

        const version = buffer.readUInt32LE(4);
        if (version !== 2) {
            return `Error: Unsupported GLB version ${version}. Only version 2 is supported.`;
        }

        const totalLength = buffer.readUInt32LE(8);
        if (buffer.length < totalLength) {
            return `Error: Buffer length (${buffer.length}) is less than declared total length (${totalLength}).`;
        }

        if (buffer.length < 20) {
            return "Error: GLB file too small to contain a JSON chunk header.";
        }

        const chunkLength = buffer.readUInt32LE(12);
        const chunkType = buffer.readUInt32LE(16);

        if (chunkType !== 0x4e4f534a) {
            return "Error: First GLB chunk is not JSON.";
        }

        if (buffer.length < 20 + chunkLength) {
            return "Error: GLB buffer too small for declared JSON chunk length.";
        }

        const jsonString = buffer
            .subarray(20, 20 + chunkLength)
            .toString("utf-8")
            .trim();

        let parsed: unknown;
        try {
            parsed = JSON.parse(jsonString);
        } catch {
            return "Error: Failed to parse JSON chunk from GLB.";
        }

        const doc = parsed as IGltfDocument;
        if (!doc.asset?.version) {
            return "Error: GLB JSON chunk is missing required asset.version field.";
        }

        this._documents.set(name, doc);
        return `Loaded GLB as "${name}". Asset version: ${doc.asset.version}.`;
    }

    /* ================ Index compaction ========================== */

    compactIndices(name: string): string {
        const doc = this._getDoc(name);
        if (typeof doc === "string") {
            return doc;
        }

        let totalRemoved = 0;
        const messages: string[] = [];

        // Compact each array type that supports nullification
        totalRemoved += this._compactArray(doc, "nodes", messages);
        totalRemoved += this._compactArray(doc, "meshes", messages);
        totalRemoved += this._compactArray(doc, "materials", messages);
        totalRemoved += this._compactArray(doc, "textures", messages);
        totalRemoved += this._compactArray(doc, "images", messages);
        totalRemoved += this._compactArray(doc, "samplers", messages);
        totalRemoved += this._compactArray(doc, "animations", messages);
        totalRemoved += this._compactArray(doc, "skins", messages);
        totalRemoved += this._compactArray(doc, "accessors", messages);
        totalRemoved += this._compactArray(doc, "cameras", messages);

        if (totalRemoved === 0) {
            return "No null slots found. Document indices are already compact.";
        }

        return `Compacted ${totalRemoved} null slot(s).\n${messages.join("\n")}`;
    }

    /* ================ Search / discovery ======================== */

    findNodes(name: string, query: string, exact: boolean = false): string {
        const doc = this._getDoc(name);
        if (typeof doc === "string") {
            return doc;
        }
        const nodes = ArrayOrEmpty(doc.nodes);
        const results: string[] = [];
        const lq = query.toLowerCase();
        nodes.forEach((n, i) => {
            if (!n) {
                return;
            }
            const nn = (n.name ?? "").toLowerCase();
            if (exact ? nn === lq : nn.includes(lq)) {
                results.push(`${i}: ${n.name ?? "(unnamed)"}`);
            }
        });
        return results.length > 0 ? results.join("\n") : "No matching nodes found.";
    }

    findMaterials(name: string, query: string, exact: boolean = false): string {
        const doc = this._getDoc(name);
        if (typeof doc === "string") {
            return doc;
        }
        const materials = ArrayOrEmpty(doc.materials);
        const results: string[] = [];
        const lq = query.toLowerCase();
        materials.forEach((m, i) => {
            if (!m) {
                return;
            }
            const mn = (m.name ?? "").toLowerCase();
            if (exact ? mn === lq : mn.includes(lq)) {
                results.push(`${i}: ${m.name ?? "(unnamed)"}`);
            }
        });
        return results.length > 0 ? results.join("\n") : "No matching materials found.";
    }

    findMeshes(name: string, query: string, exact: boolean = false): string {
        const doc = this._getDoc(name);
        if (typeof doc === "string") {
            return doc;
        }
        const meshes = ArrayOrEmpty(doc.meshes);
        const results: string[] = [];
        const lq = query.toLowerCase();
        meshes.forEach((m, i) => {
            if (!m) {
                return;
            }
            const mn = (m.name ?? "").toLowerCase();
            if (exact ? mn === lq : mn.includes(lq)) {
                results.push(`${i}: ${m.name ?? "(unnamed)"}`);
            }
        });
        return results.length > 0 ? results.join("\n") : "No matching meshes found.";
    }

    findExtensions(name: string, query: string): string {
        const doc = this._getDoc(name);
        if (typeof doc === "string") {
            return doc;
        }
        const all = this._collectUsedExtensions(doc);
        const lq = query.toLowerCase();
        const results = [...all].filter((e) => e.toLowerCase().includes(lq));
        return results.length > 0 ? results.join("\n") : "No matching extensions found.";
    }

    /* ================ Internal document access ================== */

    /**
     * Exposed for testing.
     * @param name - The document name.
     * @returns The document or undefined.
     */
    _getDocumentForTest(name: string): IGltfDocument | undefined {
        return this._documents.get(name);
    }

    /**
     * Get the raw glTF document object by name, or undefined if not found.
     */
    getDoc(name: string): IGltfDocument | undefined {
        return this._documents.get(name);
    }

    /* ================ Private helpers =========================== */

    private _getDoc(name: string): IGltfDocument | string {
        const doc = this._documents.get(name);
        if (!doc) {
            return `Error: No glTF document named "${name}".`;
        }
        return doc;
    }

    private _findParentNode(doc: IGltfDocument, nodeIndex: number): number {
        const nodes = ArrayOrEmpty(doc.nodes);
        for (let i = 0; i < nodes.length; i++) {
            if (nodes[i] && nodes[i].children?.includes(nodeIndex)) {
                return i;
            }
        }
        return -1;
    }

    private _removeNodeFromAllParents(doc: IGltfDocument, nodeIndex: number): void {
        // Remove from node children
        for (const n of ArrayOrEmpty(doc.nodes)) {
            if (n && n.children) {
                n.children = n.children.filter((c) => c !== nodeIndex);
                if (n.children.length === 0) {
                    delete n.children;
                }
            }
        }
        // Remove from scene roots
        for (const s of ArrayOrEmpty(doc.scenes)) {
            if (s.nodes) {
                s.nodes = s.nodes.filter((n) => n !== nodeIndex);
            }
        }
    }

    private _isDescendant(doc: IGltfDocument, potentialDescendant: number, ancestor: number): boolean {
        const nodes = ArrayOrEmpty(doc.nodes);
        const visited = new Set<number>();
        const stack = [ancestor];
        while (stack.length > 0) {
            const current = stack.pop()!;
            if (visited.has(current)) {
                continue;
            }
            visited.add(current);
            const children = nodes[current]?.children;
            if (children) {
                for (const c of children) {
                    if (c === potentialDescendant) {
                        return true;
                    }
                    stack.push(c);
                }
            }
        }
        return false;
    }

    private _collectUsedExtensions(doc: IGltfDocument): Set<string> {
        const extensions = new Set<string>();
        // Collect from extensionsUsed/extensionsRequired arrays
        if (doc.extensionsUsed) {
            for (const e of doc.extensionsUsed) {
                extensions.add(e);
            }
        }
        if (doc.extensionsRequired) {
            for (const e of doc.extensionsRequired) {
                extensions.add(e);
            }
        }
        // Collect from inline extension blocks on all entities
        const collect = (obj: IGltfExtensible | null | undefined) => {
            if (obj?.extensions) {
                for (const key of Object.keys(obj.extensions)) {
                    extensions.add(key);
                }
            }
        };
        collect(doc);
        for (const s of ArrayOrEmpty(doc.scenes)) {
            collect(s);
        }
        for (const n of ArrayOrEmpty(doc.nodes)) {
            collect(n);
        }
        for (const m of ArrayOrEmpty(doc.meshes)) {
            collect(m);
            if (m) {
                for (const p of m.primitives) {
                    collect(p as unknown as IGltfExtensible);
                }
            }
        }
        for (const mat of ArrayOrEmpty(doc.materials)) {
            collect(mat);
        }
        for (const t of ArrayOrEmpty(doc.textures)) {
            collect(t);
        }
        for (const img of ArrayOrEmpty(doc.images)) {
            collect(img);
        }
        for (const a of ArrayOrEmpty(doc.animations)) {
            collect(a);
        }
        return extensions;
    }

    private _checkDuplicateNames(
        items: ({
            /**
             *
             */
            name?: string;
        } | null)[],
        label: string,
        issues: IGltfValidationIssue[]
    ): void {
        const seen = new Map<string, number[]>();
        items.forEach((item, i) => {
            if (!item?.name) {
                return;
            }
            const arr = seen.get(item.name);
            if (arr) {
                arr.push(i);
            } else {
                seen.set(item.name, [i]);
            }
        });
        for (const [itemName, indices] of seen) {
            if (indices.length > 1) {
                issues.push({ severity: "warning", message: `Duplicate ${label} name "${itemName}" at indices [${indices.join(", ")}].`, path: `${label}s` });
            }
        }
    }

    private _compactArray(doc: IGltfDocument, key: string, messages: string[]): number {
        const arr = (doc as unknown as Record<string, unknown>)[key] as (unknown | null)[] | undefined;
        if (!arr) {
            return 0;
        }

        const nullIndices: number[] = [];
        for (let i = 0; i < arr.length; i++) {
            if (arr[i] === null) {
                nullIndices.push(i);
            }
        }
        if (nullIndices.length === 0) {
            return 0;
        }

        // Build old→new index map
        const remap = new Map<number, number>();
        let newIndex = 0;
        for (let old = 0; old < arr.length; old++) {
            if (arr[old] !== null) {
                remap.set(old, newIndex);
                newIndex++;
            }
        }

        // Remove null entries from the array
        (doc as unknown as Record<string, unknown>)[key] = arr.filter((item) => item !== null);

        // Remap references throughout the document
        this._remapReferences(doc, key, remap);

        messages.push(`${key}: removed ${nullIndices.length} null slot(s), remapped ${remap.size} indices.`);
        return nullIndices.length;
    }

    private _remapReferences(doc: IGltfDocument, key: string, remap: Map<number, number>): void {
        const remapIndex = (old: number | undefined): number | undefined => {
            if (old === undefined) {
                return undefined;
            }
            return remap.get(old);
        };

        switch (key) {
            case "nodes":
                // Scene roots
                for (const scene of ArrayOrEmpty(doc.scenes)) {
                    if (scene?.nodes) {
                        scene.nodes = scene.nodes.map((n) => remap.get(n)!).filter((n) => n !== undefined);
                    }
                }
                // Node children
                for (const node of ArrayOrEmpty(doc.nodes)) {
                    if (node?.children) {
                        node.children = node.children.map((c) => remap.get(c)!).filter((c) => c !== undefined);
                        if (node.children.length === 0) {
                            delete node.children;
                        }
                    }
                    // Skin joints reference nodes
                }
                // Animation channel targets
                for (const anim of ArrayOrEmpty(doc.animations)) {
                    if (anim?.channels) {
                        for (const ch of anim.channels) {
                            if (ch.target?.node !== undefined) {
                                ch.target.node = remapIndex(ch.target.node) ?? ch.target.node;
                            }
                        }
                    }
                }
                // Skins
                for (const skin of ArrayOrEmpty(doc.skins)) {
                    if (skin) {
                        if (skin.skeleton !== undefined) {
                            skin.skeleton = remapIndex(skin.skeleton) ?? skin.skeleton;
                        }
                        if (skin.joints) {
                            skin.joints = skin.joints.map((j) => remap.get(j) ?? j);
                        }
                    }
                }
                break;

            case "meshes":
                for (const node of ArrayOrEmpty(doc.nodes)) {
                    if (node?.mesh !== undefined) {
                        node.mesh = remapIndex(node.mesh) ?? node.mesh;
                    }
                }
                break;

            case "materials":
                for (const mesh of ArrayOrEmpty(doc.meshes)) {
                    if (mesh?.primitives) {
                        for (const prim of mesh.primitives) {
                            if (prim.material !== undefined) {
                                prim.material = remapIndex(prim.material) ?? prim.material;
                            }
                        }
                    }
                }
                break;

            case "textures":
                for (const mat of ArrayOrEmpty(doc.materials)) {
                    if (mat?.pbrMetallicRoughness) {
                        const pbr = mat.pbrMetallicRoughness;
                        if (pbr.baseColorTexture?.index !== undefined) {
                            pbr.baseColorTexture.index = remapIndex(pbr.baseColorTexture.index) ?? pbr.baseColorTexture.index;
                        }
                        if (pbr.metallicRoughnessTexture?.index !== undefined) {
                            pbr.metallicRoughnessTexture.index = remapIndex(pbr.metallicRoughnessTexture.index) ?? pbr.metallicRoughnessTexture.index;
                        }
                    }
                    if (mat?.normalTexture?.index !== undefined) {
                        mat.normalTexture.index = remapIndex(mat.normalTexture.index) ?? mat.normalTexture.index;
                    }
                    if (mat?.occlusionTexture?.index !== undefined) {
                        mat.occlusionTexture.index = remapIndex(mat.occlusionTexture.index) ?? mat.occlusionTexture.index;
                    }
                    if (mat?.emissiveTexture?.index !== undefined) {
                        mat.emissiveTexture.index = remapIndex(mat.emissiveTexture.index) ?? mat.emissiveTexture.index;
                    }
                }
                break;

            case "images":
                for (const tex of ArrayOrEmpty(doc.textures)) {
                    if (tex?.source !== undefined) {
                        tex.source = remapIndex(tex.source) ?? tex.source;
                    }
                }
                break;

            case "samplers":
                for (const tex of ArrayOrEmpty(doc.textures)) {
                    if (tex?.sampler !== undefined) {
                        tex.sampler = remapIndex(tex.sampler) ?? tex.sampler;
                    }
                }
                break;

            case "accessors":
                // Animation samplers reference accessors
                for (const anim of ArrayOrEmpty(doc.animations)) {
                    if (anim?.samplers) {
                        for (const s of anim.samplers) {
                            if (s.input !== undefined) {
                                s.input = remapIndex(s.input) ?? s.input;
                            }
                            if (s.output !== undefined) {
                                s.output = remapIndex(s.output) ?? s.output;
                            }
                        }
                    }
                }
                // Mesh primitives reference accessors
                for (const mesh of ArrayOrEmpty(doc.meshes)) {
                    if (mesh?.primitives) {
                        for (const prim of mesh.primitives) {
                            if (prim.indices !== undefined) {
                                prim.indices = remapIndex(prim.indices) ?? prim.indices;
                            }
                            for (const attrKey of Object.keys(prim.attributes)) {
                                prim.attributes[attrKey] = remapIndex(prim.attributes[attrKey]) ?? prim.attributes[attrKey];
                            }
                        }
                    }
                }
                // Skins reference accessors for inverseBindMatrices
                for (const skin of ArrayOrEmpty(doc.skins)) {
                    if (skin?.inverseBindMatrices !== undefined) {
                        skin.inverseBindMatrices = remapIndex(skin.inverseBindMatrices) ?? skin.inverseBindMatrices;
                    }
                }
                break;

            case "cameras":
                for (const node of ArrayOrEmpty(doc.nodes)) {
                    if (node?.camera !== undefined) {
                        node.camera = remapIndex(node.camera) ?? node.camera;
                    }
                }
                break;

            case "skins":
                for (const node of ArrayOrEmpty(doc.nodes)) {
                    if (node?.skin !== undefined) {
                        node.skin = remapIndex(node.skin) ?? node.skin;
                    }
                }
                break;

            case "animations":
                // Animations are not referenced by index from other places
                break;
        }
    }
}

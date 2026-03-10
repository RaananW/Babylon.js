/** This file must only contain pure code and pure imports */

import { Logger } from "../../Misc/logger";
import type { Nullable } from "../../types";
import { Camera } from "../../Cameras/camera";
import type { Scene } from "../../scene";
import { Mesh } from "../../Meshes/mesh.pure";
import type { AbstractMesh } from "../../Meshes/abstractMesh";
import { Geometry } from "../../Meshes/geometry";
import type { Node } from "../../node";
import { TransformNode } from "../../Meshes/transformNode";
import { Material } from "../../Materials/material";
import { MultiMaterial } from "../../Materials/multiMaterial.pure";
import { CubeTexture } from "../../Materials/Textures/cubeTexture.pure";
import { HDRCubeTexture } from "../../Materials/Textures/hdrCubeTexture.pure";
import { AnimationGroup } from "../../Animations/animationGroup.pure";
import { Light } from "../../Lights/light";
import { SceneLoaderFlags } from "../sceneLoaderFlags";
import { Constants } from "../../Engines/constants";
import { AssetContainer } from "../../assetContainer";
import { ActionManager } from "../../Actions/actionManager";
import { Skeleton } from "../../Bones/skeleton";
import { MorphTargetManager } from "../../Morph/morphTargetManager";
import { ReflectionProbeParse } from "../../Probes/reflectionProbe.pure";
import { GetClass } from "../../Misc/typeStore";
import { ToolsWarn } from "../../Misc/tools.pure";
import { PostProcess } from "../../PostProcesses/postProcess.pure";
import { Parse } from "./babylonFileParser.function";
import { Observable } from "../../Misc/observable";
import type { MorphTarget } from "../../Morph/morphTarget";
import { SpriteManagerParse } from "../../Sprites/spriteManager.pure";

/** @internal */
// eslint-disable-next-line @typescript-eslint/naming-convention, no-var
export var _BabylonLoaderRegistered = true;

/**
 * Helps setting up some configuration for the babylon file loader.
 */
export class BabylonFileLoaderConfiguration {
    /**
     * The loader does not allow injecting custom physics engine into the plugins.
     * Unfortunately in ES6, we need to manually inject them into the plugin.
     * So you could set this variable to your engine import to make it work.
     */
    public static LoaderInjectedPhysicsEngine: any = undefined;
}

let TempIndexContainer: { [key: string]: Node } = {};
export let TempMaterialIndexContainer: { [key: string]: Material } = {};
let TempMorphTargetIndexContainer: { [key: number]: MorphTarget } = {};
export let TempMorphTargetManagerIndexContainer: { [key: string]: MorphTargetManager } = {};
export let TempSkeletonIndexContainer: { [key: number]: Skeleton } = {};

/**
 * @internal
 * Resets the temporary containers used during loading.
 */
export function _ResetTempContainers(): void {
    TempMaterialIndexContainer = {};
    TempMorphTargetManagerIndexContainer = {};
    TempSkeletonIndexContainer = {};
}

// eslint-disable-next-line @typescript-eslint/naming-convention
export const logOperation = (operation: string, producer: { file: string; name: string; version: string; exporter_version: string }) => {
    return (
        operation +
        " of " +
        (producer ? producer.file + " from " + producer.name + " version: " + producer.version + ", exporter version: " + producer.exporter_version : "unknown")
    );
};

export const LoadDetailLevels = (scene: Scene, mesh: AbstractMesh) => {
    const mastermesh: Mesh = mesh as Mesh;

    // Every value specified in the ids array of the lod data points to another mesh which should be used as the lower LOD level.
    // The distances (or coverages) array values specified are used along with the lod mesh ids as a hint to determine the switching threshold for the various LODs.
    if (mesh._waitingData.lods) {
        if (mesh._waitingData.lods.ids && mesh._waitingData.lods.ids.length > 0) {
            const lodmeshes: string[] = mesh._waitingData.lods.ids;
            const wasenabled: boolean = mastermesh.isEnabled(false);
            if (mesh._waitingData.lods.distances) {
                const distances: number[] = mesh._waitingData.lods.distances;
                if (distances.length >= lodmeshes.length) {
                    const culling: number = distances.length > lodmeshes.length ? distances[distances.length - 1] : 0;
                    mastermesh.setEnabled(false);
                    for (let index = 0; index < lodmeshes.length; index++) {
                        const lodid: string = lodmeshes[index];
                        const lodmesh: Mesh = scene.getMeshById(lodid) as Mesh;
                        if (lodmesh != null) {
                            mastermesh.addLODLevel(distances[index], lodmesh);
                        }
                    }
                    if (culling > 0) {
                        mastermesh.addLODLevel(culling, null);
                    }
                    if (wasenabled === true) {
                        mastermesh.setEnabled(true);
                    }
                } else {
                    ToolsWarn("Invalid level of detail distances for " + mesh.name);
                }
            }
        }
        mesh._waitingData.lods = null;
    }
};

const FindParent = (parentId: any, parentInstanceIndex: any, scene: Scene) => {
    if (typeof parentId !== "number") {
        const parentEntry = scene.getLastEntryById(parentId);
        if (parentEntry && parentInstanceIndex !== undefined && parentInstanceIndex !== null) {
            const instance = (parentEntry as Mesh).instances[parseInt(parentInstanceIndex)];
            return instance;
        }
        return parentEntry;
    }

    const parent = TempIndexContainer[parentId];
    if (parent && parentInstanceIndex !== undefined && parentInstanceIndex !== null) {
        const instance = (parent as Mesh).instances[parseInt(parentInstanceIndex)];
        return instance;
    }

    return parent;
};

export const FindMaterial = (materialId: any, scene: Scene) => {
    if (typeof materialId !== "number") {
        return scene.getLastMaterialById(materialId, true);
    }

    return TempMaterialIndexContainer[materialId];
};

/**
 * @experimental
 * Loads an AssetContainer from a serialized Babylon scene.
 * @param scene The scene to load the asset container into.
 * @param serializedScene The serialized scene data. This can be either a JSON string, or an object (e.g. from a call to JSON.parse).
 * @param rootUrl The root URL for loading assets.
 * @returns The loaded AssetContainer.
 */
export function LoadAssetContainerFromSerializedScene(scene: Scene, serializedScene: string | object, rootUrl: string): AssetContainer {
    return LoadAssetContainer(scene, serializedScene, rootUrl);
}

export const LoadAssetContainer = (
    scene: Scene,
    data: string | object,
    rootUrl: string,
    onError?: (message: string, exception?: any) => void,
    addToScene = false
): AssetContainer => {
    const container = new AssetContainer(scene);

    if (!addToScene) {
        scene._blockEntityCollection = true;
    }

    // Entire method running in try block, so ALWAYS logs as far as it got, only actually writes details
    // when SceneLoader.debugLogging = true (default), or exception encountered.
    // Everything stored in var log instead of writing separate lines to support only writing in exception,
    // and avoid problems with multiple concurrent .babylon loads.
    let log = "importScene has failed JSON parse";
    try {
        // eslint-disable-next-line no-var
        var parsedData = typeof data === "object" ? data : JSON.parse(data);
        log = "";
        const fullDetails = SceneLoaderFlags.loggingLevel === Constants.SCENELOADER_DETAILED_LOGGING;

        let index: number;
        let cache: number;

        // Environment texture
        if (parsedData.environmentTexture !== undefined && parsedData.environmentTexture !== null) {
            // PBR needed for both HDR texture (gamma space) & a sky box
            const isPBR = parsedData.isPBR !== undefined ? parsedData.isPBR : true;
            if (parsedData.environmentTextureType && parsedData.environmentTextureType === "BABYLON.HDRCubeTexture") {
                const hdrSize: number = parsedData.environmentTextureSize ? parsedData.environmentTextureSize : 128;
                const hdrTexture = new HDRCubeTexture(
                    (parsedData.environmentTexture.match(/https?:\/\//g) ? "" : rootUrl) + parsedData.environmentTexture,
                    scene,
                    hdrSize,
                    true,
                    !isPBR,
                    undefined,
                    parsedData.environmentTexturePrefilterOnLoad
                );
                if (parsedData.environmentTextureRotationY) {
                    hdrTexture.rotationY = parsedData.environmentTextureRotationY;
                }
                scene.environmentTexture = hdrTexture;
            } else {
                if (typeof parsedData.environmentTexture === "object") {
                    const environmentTexture = CubeTexture.Parse(parsedData.environmentTexture, scene, rootUrl);
                    scene.environmentTexture = environmentTexture;
                } else if ((parsedData.environmentTexture as string).endsWith(".env")) {
                    const compressedTexture = new CubeTexture(
                        (parsedData.environmentTexture.match(/https?:\/\//g) ? "" : rootUrl) + parsedData.environmentTexture,
                        scene,
                        parsedData.environmentTextureForcedExtension
                    );
                    if (parsedData.environmentTextureRotationY) {
                        compressedTexture.rotationY = parsedData.environmentTextureRotationY;
                    }
                    scene.environmentTexture = compressedTexture;
                } else {
                    const cubeTexture = CubeTexture.CreateFromPrefilteredData(
                        (parsedData.environmentTexture.match(/https?:\/\//g) ? "" : rootUrl) + parsedData.environmentTexture,
                        scene,
                        parsedData.environmentTextureForcedExtension
                    );
                    if (parsedData.environmentTextureRotationY) {
                        cubeTexture.rotationY = parsedData.environmentTextureRotationY;
                    }
                    scene.environmentTexture = cubeTexture;
                }
            }
            if (parsedData.createDefaultSkybox === true) {
                const skyboxScale = scene.activeCamera !== undefined && scene.activeCamera !== null ? (scene.activeCamera.maxZ - scene.activeCamera.minZ) / 2 : 1000;
                const skyboxBlurLevel = parsedData.skyboxBlurLevel || 0;
                scene.createDefaultSkybox(scene.environmentTexture, isPBR, skyboxScale, skyboxBlurLevel);
            }
            container.environmentTexture = scene.environmentTexture;
        }

        // Environment Intensity
        if (parsedData.environmentIntensity !== undefined && parsedData.environmentIntensity !== null) {
            scene.environmentIntensity = parsedData.environmentIntensity;
        }

        // IBL Intensity
        if (parsedData.iblIntensity !== undefined && parsedData.iblIntensity !== null) {
            scene.iblIntensity = parsedData.iblIntensity;
        }

        // Lights
        if (parsedData.lights !== undefined && parsedData.lights !== null) {
            for (index = 0, cache = parsedData.lights.length; index < cache; index++) {
                const parsedLight = parsedData.lights[index];
                const light = Light.Parse(parsedLight, scene);
                if (light) {
                    TempIndexContainer[parsedLight.uniqueId] = light;
                    container.lights.push(light);
                    light._parentContainer = container;
                    log += index === 0 ? "\n\tLights:" : "";
                    log += "\n\t\t" + light.toString(fullDetails);
                }
            }
        }

        // Reflection probes
        if (parsedData.reflectionProbes !== undefined && parsedData.reflectionProbes !== null) {
            for (index = 0, cache = parsedData.reflectionProbes.length; index < cache; index++) {
                const parsedReflectionProbe = parsedData.reflectionProbes[index];
                const reflectionProbe = ReflectionProbeParse(parsedReflectionProbe, scene, rootUrl);
                if (reflectionProbe) {
                    container.reflectionProbes.push(reflectionProbe);
                    reflectionProbe._parentContainer = container;
                    log += index === 0 ? "\n\tReflection Probes:" : "";
                    log += "\n\t\t" + reflectionProbe.toString(fullDetails);
                }
            }
        }

        // Animations
        if (parsedData.animations !== undefined && parsedData.animations !== null) {
            for (index = 0, cache = parsedData.animations.length; index < cache; index++) {
                const parsedAnimation = parsedData.animations[index];
                const internalClass = GetClass("BABYLON.Animation");
                if (internalClass) {
                    const animation = internalClass.Parse(parsedAnimation);
                    scene.animations.push(animation);
                    container.animations.push(animation);
                    log += index === 0 ? "\n\tAnimations:" : "";
                    log += "\n\t\t" + animation.toString(fullDetails);
                }
            }
        }

        // Materials
        if (parsedData.materials !== undefined && parsedData.materials !== null) {
            for (index = 0, cache = parsedData.materials.length; index < cache; index++) {
                const parsedMaterial = parsedData.materials[index];
                const mat = Material.Parse(parsedMaterial, scene, rootUrl);
                if (mat) {
                    TempMaterialIndexContainer[parsedMaterial.uniqueId || parsedMaterial.id] = mat;
                    container.materials.push(mat);
                    mat._parentContainer = container;
                    log += index === 0 ? "\n\tMaterials:" : "";
                    log += "\n\t\t" + mat.toString(fullDetails);

                    // Textures
                    const textures = mat.getActiveTextures();
                    for (const t of textures) {
                        if (container.textures.indexOf(t) == -1) {
                            container.textures.push(t);
                            t._parentContainer = container;
                        }
                    }
                }
            }
        }

        if (parsedData.multiMaterials !== undefined && parsedData.multiMaterials !== null) {
            for (index = 0, cache = parsedData.multiMaterials.length; index < cache; index++) {
                const parsedMultiMaterial = parsedData.multiMaterials[index];
                const mmat = MultiMaterial.ParseMultiMaterial(parsedMultiMaterial, scene);
                TempMaterialIndexContainer[parsedMultiMaterial.uniqueId || parsedMultiMaterial.id] = mmat;
                container.multiMaterials.push(mmat);
                mmat._parentContainer = container;

                log += index === 0 ? "\n\tMultiMaterials:" : "";
                log += "\n\t\t" + mmat.toString(fullDetails);

                // Textures
                const textures = mmat.getActiveTextures();
                for (const t of textures) {
                    if (container.textures.indexOf(t) == -1) {
                        container.textures.push(t);
                        t._parentContainer = container;
                    }
                }
            }
        }

        // Morph target managers
        if (parsedData.morphTargetManagers !== undefined && parsedData.morphTargetManagers !== null) {
            for (const parsedManager of parsedData.morphTargetManagers) {
                const manager = MorphTargetManager.Parse(parsedManager, scene);
                TempMorphTargetManagerIndexContainer[parsedManager.id] = manager;
                container.morphTargetManagers.push(manager);
                manager._parentContainer = container;

                // Morph targets - add to TempMorphTargetIndexContainer to later connect animations -> morph targets
                for (let index = 0; index < parsedManager.targets.length; index++) {
                    const parsedTarget = parsedManager.targets[index];
                    if (parsedTarget.uniqueId !== undefined && parsedTarget.uniqueId !== null) {
                        const target = manager.getTarget(index);
                        TempMorphTargetIndexContainer[parsedTarget.uniqueId] = target;
                    }
                }
            }
        }

        // Skeletons
        if (parsedData.skeletons !== undefined && parsedData.skeletons !== null) {
            for (index = 0, cache = parsedData.skeletons.length; index < cache; index++) {
                const parsedSkeleton = parsedData.skeletons[index];
                const skeleton = Skeleton.Parse(parsedSkeleton, scene);
                if (parsedSkeleton.uniqueId !== undefined && parsedSkeleton.uniqueId !== null) {
                    TempSkeletonIndexContainer[parsedSkeleton.uniqueId] = skeleton;
                }
                container.skeletons.push(skeleton);
                skeleton._parentContainer = container;
                log += index === 0 ? "\n\tSkeletons:" : "";
                log += "\n\t\t" + skeleton.toString(fullDetails);

                // Bones - add to TempIndexContainer to later connect animations -> bones
                for (let boneIndex = 0; boneIndex < parsedSkeleton.bones.length; boneIndex++) {
                    const parsedBone = parsedSkeleton.bones[boneIndex];
                    const bone = skeleton.bones[boneIndex]; // This was instantiated in Skeleton.Parse
                    TempIndexContainer[parsedBone.uniqueId] = bone;
                }
            }
        }

        // Geometries
        const geometries = parsedData.geometries;
        if (geometries !== undefined && geometries !== null) {
            const addedGeometry = new Array<Nullable<Geometry>>();

            // VertexData
            const vertexData = geometries.vertexData;
            if (vertexData !== undefined && vertexData !== null) {
                for (index = 0, cache = vertexData.length; index < cache; index++) {
                    const parsedVertexData = vertexData[index];

                    // Geometies are found by loadedUniqueId when imported
                    // So we need to temporarily unblock the entity collection to add them to the scene
                    scene._blockEntityCollection = false;
                    // Temporarily replace the onNewGeometryAddedObservable to avoid multiple notifications
                    const onNewGeometryAddedObservable = scene.onNewGeometryAddedObservable;
                    scene.onNewGeometryAddedObservable = new Observable<Geometry>();

                    addedGeometry.push(Geometry.Parse(parsedVertexData, scene, rootUrl));

                    // Restore the onNewGeometryAddedObservable
                    scene.onNewGeometryAddedObservable = onNewGeometryAddedObservable;
                    // Restore the previous state of entity collection blocking
                    scene._blockEntityCollection = !addToScene;
                }
            }

            for (const g of addedGeometry) {
                if (g) {
                    container.geometries.push(g);
                    g._parentContainer = container;
                }
            }
        }

        // Transform nodes
        if (parsedData.transformNodes !== undefined && parsedData.transformNodes !== null) {
            for (index = 0, cache = parsedData.transformNodes.length; index < cache; index++) {
                const parsedTransformNode = parsedData.transformNodes[index];
                const node = TransformNode.Parse(parsedTransformNode, scene, rootUrl);
                TempIndexContainer[parsedTransformNode.uniqueId] = node;
                container.transformNodes.push(node);
                node._parentContainer = container;
            }
        }

        // Meshes
        if (parsedData.meshes !== undefined && parsedData.meshes !== null) {
            for (index = 0, cache = parsedData.meshes.length; index < cache; index++) {
                const parsedMesh = parsedData.meshes[index];
                const mesh = <AbstractMesh>Mesh.Parse(parsedMesh, scene, rootUrl);
                TempIndexContainer[parsedMesh.uniqueId] = mesh;
                container.meshes.push(mesh);
                mesh._parentContainer = container;
                if (mesh.hasInstances) {
                    for (const instance of (mesh as Mesh).instances) {
                        container.meshes.push(instance);
                        instance._parentContainer = container;
                    }
                }
                log += index === 0 ? "\n\tMeshes:" : "";
                log += "\n\t\t" + mesh.toString(fullDetails);
            }
        }

        // Cameras
        if (parsedData.cameras !== undefined && parsedData.cameras !== null) {
            for (index = 0, cache = parsedData.cameras.length; index < cache; index++) {
                const parsedCamera = parsedData.cameras[index];
                const camera = Camera.Parse(parsedCamera, scene);
                TempIndexContainer[parsedCamera.uniqueId] = camera;
                container.cameras.push(camera);
                camera._parentContainer = container;
                log += index === 0 ? "\n\tCameras:" : "";
                log += "\n\t\t" + camera.toString(fullDetails);
            }
        }

        // Postprocesses
        if (parsedData.postProcesses !== undefined && parsedData.postProcesses !== null) {
            for (index = 0, cache = parsedData.postProcesses.length; index < cache; index++) {
                const parsedPostProcess = parsedData.postProcesses[index];
                const postProcess = PostProcess.Parse(parsedPostProcess, scene, rootUrl);
                if (postProcess) {
                    container.postProcesses.push(postProcess);
                    postProcess._parentContainer = container;
                    log += index === 0 ? "\nPostprocesses:" : "";
                    log += "\n\t\t" + postProcess.toString();
                }
            }
        }

        // Animation Groups
        if (parsedData.animationGroups !== undefined && parsedData.animationGroups !== null && parsedData.animationGroups.length) {
            // Build the nodeMap only for scenes with animationGroups.
            let nodeMap: Nullable<Map<Node["id"], Node>> = null;

            // Helper to get nodes by id more efficiently, building the nodeMap only on first access.
            const getNodeById = (id: Node["id"]) => {
                if (!nodeMap) {
                    nodeMap = new Map<Node["id"], Node>();

                    // Nodes in scene does not change when parsing animationGroups, so it's safe to build a map.
                    // This follows the order of scene.getNodeById: mesh, transformNode, light, camera, bone
                    for (let index = 0; index < scene.meshes.length; index++) {
                        // This follows the behavior of scene.getXXXById, which picks the first match
                        if (!nodeMap.has(scene.meshes[index].id)) {
                            nodeMap.set(scene.meshes[index].id, scene.meshes[index]);
                        }
                    }
                    for (let index = 0; index < scene.transformNodes.length; index++) {
                        if (!nodeMap.has(scene.transformNodes[index].id)) {
                            nodeMap.set(scene.transformNodes[index].id, scene.transformNodes[index]);
                        }
                    }
                    for (let index = 0; index < scene.lights.length; index++) {
                        if (!nodeMap.has(scene.lights[index].id)) {
                            nodeMap.set(scene.lights[index].id, scene.lights[index]);
                        }
                    }
                    for (let index = 0; index < scene.cameras.length; index++) {
                        if (!nodeMap.has(scene.cameras[index].id)) {
                            nodeMap.set(scene.cameras[index].id, scene.cameras[index]);
                        }
                    }
                    for (let skeletonIndex = 0; skeletonIndex < scene.skeletons.length; skeletonIndex++) {
                        const skeleton = scene.skeletons[skeletonIndex];
                        for (let boneIndex = 0; boneIndex < skeleton.bones.length; boneIndex++) {
                            if (!nodeMap.has(skeleton.bones[boneIndex].id)) {
                                nodeMap.set(skeleton.bones[boneIndex].id, skeleton.bones[boneIndex]);
                            }
                        }
                    }
                }

                return nodeMap.get(id);
            };

            const targetLookup = (parsedTargetAnimation: any) => {
                let target = null;
                const isMorphTarget = parsedTargetAnimation.animation.property === "influence";
                const uniqueId = parsedTargetAnimation.targetUniqueId;

                // Attempt to find animation targets by uniqueId first (tracked in TempXXXIndexContainer).
                if (uniqueId !== undefined && uniqueId !== null) {
                    target = isMorphTarget ? TempMorphTargetIndexContainer[uniqueId] : TempIndexContainer[uniqueId];
                }

                // Backwards compatibility: If no uniqueId is provided or no match is found,
                // fall back to searching by id in the scene.
                if (!target) {
                    const id = parsedTargetAnimation.targetId;
                    target = isMorphTarget ? scene.getMorphTargetById(id) : getNodeById(id);
                }

                return target;
            };

            for (index = 0, cache = parsedData.animationGroups.length; index < cache; index++) {
                const parsedAnimationGroup = parsedData.animationGroups[index];
                const animationGroup = AnimationGroup.Parse(parsedAnimationGroup, scene, targetLookup);
                container.animationGroups.push(animationGroup);
                animationGroup._parentContainer = container;
                log += index === 0 ? "\n\tAnimationGroups:" : "";
                log += "\n\t\t" + animationGroup.toString(fullDetails);
            }
        }

        // Sprites
        if (parsedData.spriteManagers) {
            for (let index = 0, cache = parsedData.spriteManagers.length; index < cache; index++) {
                const parsedSpriteManager = parsedData.spriteManagers[index];
                const spriteManager = SpriteManagerParse(parsedSpriteManager, scene, rootUrl);
                container.spriteManagers.push(spriteManager);
                spriteManager._parentContainer = container;
                log += "\n\t\tSpriteManager " + spriteManager.name;
            }
        }

        // Browsing all the graph to connect the dots
        for (index = 0, cache = scene.cameras.length; index < cache; index++) {
            const camera = scene.cameras[index];
            if (camera._waitingParentId !== null) {
                camera.parent = FindParent(camera._waitingParentId, camera._waitingParentInstanceIndex, scene);
                camera._waitingParentId = null;
                camera._waitingParentInstanceIndex = null;
            }
        }

        for (index = 0, cache = scene.lights.length; index < cache; index++) {
            const light = scene.lights[index];
            if (light && light._waitingParentId !== null) {
                light.parent = FindParent(light._waitingParentId, light._waitingParentInstanceIndex, scene);
                light._waitingParentId = null;
                light._waitingParentInstanceIndex = null;
            }
        }

        // Connect parents & children and parse actions and lods
        for (index = 0, cache = scene.transformNodes.length; index < cache; index++) {
            const transformNode = scene.transformNodes[index];
            if (transformNode._waitingParentId !== null) {
                transformNode.parent = FindParent(transformNode._waitingParentId, transformNode._waitingParentInstanceIndex, scene);
                transformNode._waitingParentId = null;
                transformNode._waitingParentInstanceIndex = null;
            }
        }
        for (index = 0, cache = scene.meshes.length; index < cache; index++) {
            const mesh = scene.meshes[index];
            if (mesh._waitingParentId !== null) {
                mesh.parent = FindParent(mesh._waitingParentId, mesh._waitingParentInstanceIndex, scene);
                mesh._waitingParentId = null;
                mesh._waitingParentInstanceIndex = null;
            }
            if (mesh._waitingData.lods) {
                LoadDetailLevels(scene, mesh);
            }
        }

        // link multimats with materials
        for (const multimat of scene.multiMaterials) {
            for (const subMaterial of multimat._waitingSubMaterialsUniqueIds) {
                multimat.subMaterials.push(FindMaterial(subMaterial, scene));
            }
            multimat._waitingSubMaterialsUniqueIds = [];
        }

        // link meshes with materials
        for (const mesh of scene.meshes) {
            if (mesh._waitingMaterialId !== null) {
                mesh.material = FindMaterial(mesh._waitingMaterialId, scene);
                mesh._waitingMaterialId = null;
            }
        }

        // link meshes with morph target managers
        for (const mesh of scene.meshes) {
            if (mesh._waitingMorphTargetManagerId !== null) {
                mesh.morphTargetManager = TempMorphTargetManagerIndexContainer[mesh._waitingMorphTargetManagerId];
                mesh._waitingMorphTargetManagerId = null;
            }
        }

        // link meshes with skeletons
        for (const mesh of scene.meshes) {
            // First try to get it via uniqueId
            if (mesh._waitingSkeletonUniqueId !== null) {
                mesh.skeleton = TempSkeletonIndexContainer[mesh._waitingSkeletonUniqueId];
            }

            // If not possible or not found, try to get it from the scene (backwards compatibility)
            if (mesh._waitingSkeletonId !== null && !mesh.skeleton) {
                mesh.skeleton = scene.getLastSkeletonById(mesh._waitingSkeletonId);
            }

            mesh._waitingSkeletonId = null;
            mesh._waitingSkeletonUniqueId = null;
        }

        // link bones to transform nodes
        for (index = 0, cache = scene.skeletons.length; index < cache; index++) {
            const skeleton = scene.skeletons[index];
            if (skeleton._hasWaitingData) {
                if (skeleton.bones != null) {
                    for (const bone of skeleton.bones) {
                        let linkTransformNode: Nullable<Node> = null;
                        // First try to get it via uniqueId
                        if (bone._waitingTransformNodeUniqueId !== null) {
                            linkTransformNode = TempIndexContainer[bone._waitingTransformNodeUniqueId];
                        }

                        // If not possible or not found, try to get it from the scene (backwards compatibility)
                        if (bone._waitingTransformNodeId !== null && !linkTransformNode) {
                            linkTransformNode = scene.getLastEntryById(bone._waitingTransformNodeId);
                        }

                        if (linkTransformNode) {
                            bone.linkTransformNode(linkTransformNode as TransformNode);
                        }

                        bone._waitingTransformNodeId = null;
                        bone._waitingTransformNodeUniqueId = null;
                    }
                }

                skeleton._hasWaitingData = null;
            }
        }

        // freeze world matrix application
        for (index = 0, cache = scene.meshes.length; index < cache; index++) {
            const currentMesh = scene.meshes[index];
            if (currentMesh._waitingData.freezeWorldMatrix) {
                currentMesh.freezeWorldMatrix();
                currentMesh._waitingData.freezeWorldMatrix = null;
            } else {
                currentMesh.computeWorldMatrix(true);
            }
        }

        // Lights exclusions / inclusions
        for (index = 0, cache = scene.lights.length; index < cache; index++) {
            const light = scene.lights[index];
            // Excluded check
            if (light._excludedMeshesIds.length > 0) {
                for (let excludedIndex = 0; excludedIndex < light._excludedMeshesIds.length; excludedIndex++) {
                    const excludedMesh = scene.getMeshById(light._excludedMeshesIds[excludedIndex]);

                    if (excludedMesh) {
                        light.excludedMeshes.push(excludedMesh);
                    }
                }

                light._excludedMeshesIds = [];
            }

            // Included check
            if (light._includedOnlyMeshesIds.length > 0) {
                for (let includedOnlyIndex = 0; includedOnlyIndex < light._includedOnlyMeshesIds.length; includedOnlyIndex++) {
                    const includedOnlyMesh = scene.getMeshById(light._includedOnlyMeshesIds[includedOnlyIndex]);

                    if (includedOnlyMesh) {
                        light.includedOnlyMeshes.push(includedOnlyMesh);
                    }
                }

                light._includedOnlyMeshesIds = [];
            }
        }

        for (const g of scene.geometries) {
            g._loadedUniqueId = "";
        }

        Parse(parsedData, scene, container, rootUrl);

        // Actions (scene) Done last as it can access other objects.
        for (index = 0, cache = scene.meshes.length; index < cache; index++) {
            const mesh = scene.meshes[index];
            if (mesh._waitingData.actions) {
                ActionManager.Parse(mesh._waitingData.actions, mesh, scene);
                mesh._waitingData.actions = null;
            }
        }
        if (parsedData.actions !== undefined && parsedData.actions !== null) {
            ActionManager.Parse(parsedData.actions, null, scene);
        }
    } catch (err) {
        const msg = logOperation("loadAssets", parsedData ? parsedData.producer : "Unknown") + log;
        if (onError) {
            onError(msg, err);
        } else {
            Logger.Log(msg);
            throw err;
        }
    } finally {
        TempIndexContainer = {};
        TempMaterialIndexContainer = {};
        TempMorphTargetIndexContainer = {};
        TempMorphTargetManagerIndexContainer = {};
        TempSkeletonIndexContainer = {};

        if (!addToScene) {
            // Removes any breadcrumb left during the loading like geometries
            container.removeAllFromScene();
            // Unblock entity collection
            scene._blockEntityCollection = false;
        }
        if (log !== null && SceneLoaderFlags.loggingLevel !== Constants.SCENELOADER_NO_LOGGING) {
            Logger.Log(
                logOperation("loadAssets", parsedData ? parsedData.producer : "Unknown") + (SceneLoaderFlags.loggingLevel !== Constants.SCENELOADER_MINIMAL_LOGGING ? log : "")
            );
        }
    }

    return container;
};

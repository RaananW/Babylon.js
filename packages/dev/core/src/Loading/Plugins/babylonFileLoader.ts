/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import babylonFileLoader.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./babylonFileLoader.pure";

import {
    BabylonFileLoaderConfiguration,
    FindMaterial,
    LoadAssetContainer,
    LoadDetailLevels,
    TempMaterialIndexContainer,
    TempMorphTargetManagerIndexContainer,
    TempSkeletonIndexContainer,
    _ResetTempContainers,
    logOperation,
} from "./babylonFileLoader.pure";
import { Logger } from "../../Misc/logger";
import type { Nullable } from "../../types";
import type { Scene } from "../../scene";
import { Mesh } from "../../Meshes/mesh";
import type { AbstractMesh } from "../../Meshes/abstractMesh";
import { Geometry } from "../../Meshes/geometry";
import type { Node } from "../../node";
import { TransformNode } from "../../Meshes/transformNode";
import { Material } from "../../Materials/material";
import { MultiMaterial } from "../../Materials/multiMaterial";
import { SceneLoaderFlags } from "../sceneLoaderFlags";
import { Constants } from "../../Engines/constants";
import type { AssetContainer } from "../../assetContainer";
import type { IParticleSystem } from "../../Particles/IParticleSystem";
import { Skeleton } from "../../Bones/skeleton";
import { MorphTargetManager } from "../../Morph/morphTargetManager";
import { GetIndividualParser } from "./babylonFileParser.function";
import { Vector3 } from "../../Maths/math.vector";
import { Color3, Color4 } from "../../Maths/math.color";
import { SceneComponentConstants } from "../../sceneComponent";
import { RegisterSceneLoaderPlugin } from "../../Loading/sceneLoader";
import { CannonJSPlugin } from "../../Physics/v1/Plugins/cannonJSPlugin";
import { OimoJSPlugin } from "../../Physics/v1/Plugins/oimoJSPlugin";
import { AmmoJSPlugin } from "../../Physics/v1/Plugins/ammoJSPlugin";

const IsDescendantOf = (mesh: any, names: Array<any>, hierarchyIds: Array<number>) => {
    for (const i in names) {
        if (mesh.name === names[i]) {
            hierarchyIds.push(mesh.id);
            return true;
        }
    }
    if (mesh.parentId !== undefined && hierarchyIds.indexOf(mesh.parentId) !== -1) {
        hierarchyIds.push(mesh.id);
        return true;
    }
    return false;
};

const ParseMaterialByPredicate = (predicate: (parsedMaterial: any) => boolean, parsedData: any, scene: Scene, rootUrl: string) => {
    if (!parsedData.materials) {
        return null;
    }

    for (let index = 0, cache = parsedData.materials.length; index < cache; index++) {
        const parsedMaterial = parsedData.materials[index];
        if (predicate(parsedMaterial)) {
            return { parsedMaterial, material: Material.Parse(parsedMaterial, scene, rootUrl) };
        }
    }
    return null;
};

RegisterSceneLoaderPlugin({
    name: "babylon.js",
    extensions: ".babylon",
    canDirectLoad: (data: string) => {
        if (data.indexOf("babylon") !== -1) {
            // We consider that the producer string is filled
            return true;
        }

        return false;
    },
    importMesh: (
        meshesNames: any,
        scene: Scene,
        data: any,
        rootUrl: string,
        meshes: AbstractMesh[],
        particleSystems: IParticleSystem[],
        skeletons: Skeleton[],
        onError?: (message: string, exception?: any) => void
    ): boolean => {
        // Entire method running in try block, so ALWAYS logs as far as it got, only actually writes details
        // when SceneLoader.debugLogging = true (default), or exception encountered.
        // Everything stored in var log instead of writing separate lines to support only writing in exception,
        // and avoid problems with multiple concurrent .babylon loads.
        let log = "importMesh has failed JSON parse";
        try {
            // eslint-disable-next-line no-var
            var parsedData = JSON.parse(data);
            log = "";
            const fullDetails = SceneLoaderFlags.loggingLevel === Constants.SCENELOADER_DETAILED_LOGGING;
            if (!meshesNames) {
                meshesNames = null;
            } else if (!Array.isArray(meshesNames)) {
                meshesNames = [meshesNames];
            }

            const hierarchyIds: number[] = [];
            const parsedIdToNodeMap = new Map<number, Node>();

            // Transform nodes (the overall idea is to load all of them as this is super fast and then get rid of the ones we don't need)
            const loadedTransformNodes = [];
            if (parsedData.transformNodes !== undefined && parsedData.transformNodes !== null) {
                for (let index = 0, cache = parsedData.transformNodes.length; index < cache; index++) {
                    const parsedJSONTransformNode = parsedData.transformNodes[index];
                    const parsedTransformNode = TransformNode.Parse(parsedJSONTransformNode, scene, rootUrl);
                    loadedTransformNodes.push(parsedTransformNode);
                    parsedIdToNodeMap.set(parsedTransformNode._waitingParsedUniqueId!, parsedTransformNode);
                    parsedTransformNode._waitingParsedUniqueId = null;
                }
            }
            if (parsedData.meshes !== undefined && parsedData.meshes !== null) {
                const loadedSkeletonsIds = [];
                const loadedMaterialsIds: string[] = [];
                const loadedMaterialsUniqueIds: string[] = [];
                const loadedMorphTargetManagerIds: number[] = [];
                for (let index = 0, cache = parsedData.meshes.length; index < cache; index++) {
                    const parsedMesh = parsedData.meshes[index];

                    if (meshesNames === null || IsDescendantOf(parsedMesh, meshesNames, hierarchyIds)) {
                        if (meshesNames !== null) {
                            // Remove found mesh name from list.
                            delete meshesNames[meshesNames.indexOf(parsedMesh.name)];
                        }

                        //Geometry?
                        if (parsedMesh.geometryId !== undefined && parsedMesh.geometryId !== null) {
                            //does the file contain geometries?
                            if (parsedData.geometries !== undefined && parsedData.geometries !== null) {
                                //find the correct geometry and add it to the scene
                                let found: boolean = false;
                                const geoms = ["boxes", "spheres", "cylinders", "toruses", "grounds", "planes", "torusKnots", "vertexData"];
                                for (const geometryType of geoms) {
                                    if (!parsedData.geometries[geometryType] || !Array.isArray(parsedData.geometries[geometryType])) {
                                        continue;
                                    }
                                    const geom = parsedData.geometries[geometryType];
                                    for (const parsedGeometryData of geom) {
                                        if (parsedGeometryData.id === parsedMesh.geometryId) {
                                            switch (geometryType) {
                                                case "vertexData":
                                                    Geometry.Parse(parsedGeometryData, scene, rootUrl);
                                                    break;
                                            }
                                            found = true;
                                            break;
                                        }
                                    }

                                    if (found) {
                                        break;
                                    }
                                }
                                if (found === false) {
                                    Logger.Warn("Geometry not found for mesh " + parsedMesh.id);
                                }
                            }
                        }

                        // Material ?
                        if (parsedMesh.materialUniqueId || parsedMesh.materialId) {
                            // if we have a unique ID, look up and store in loadedMaterialsUniqueIds, else use loadedMaterialsIds
                            const materialArray = parsedMesh.materialUniqueId ? loadedMaterialsUniqueIds : loadedMaterialsIds;
                            let materialFound = materialArray.indexOf(parsedMesh.materialUniqueId || parsedMesh.materialId) !== -1;
                            if (materialFound === false && parsedData.multiMaterials !== undefined && parsedData.multiMaterials !== null) {
                                // Loads a submaterial of a multimaterial
                                const loadSubMaterial = (subMatId: string, predicate: (parsedMaterial: any) => boolean) => {
                                    materialArray.push(subMatId);
                                    const mat = ParseMaterialByPredicate(predicate, parsedData, scene, rootUrl);
                                    if (mat && mat.material) {
                                        TempMaterialIndexContainer[mat.parsedMaterial.uniqueId || mat.parsedMaterial.id] = mat.material;
                                        log += "\n\tMaterial " + mat.material.toString(fullDetails);
                                    }
                                };
                                for (let multimatIndex = 0, multimatCache = parsedData.multiMaterials.length; multimatIndex < multimatCache; multimatIndex++) {
                                    const parsedMultiMaterial = parsedData.multiMaterials[multimatIndex];
                                    if (
                                        (parsedMesh.materialUniqueId && parsedMultiMaterial.uniqueId === parsedMesh.materialUniqueId) ||
                                        parsedMultiMaterial.id === parsedMesh.materialId
                                    ) {
                                        if (parsedMultiMaterial.materialsUniqueIds) {
                                            // if the materials inside the multimat are stored by unique id
                                            for (const subMatId of parsedMultiMaterial.materialsUniqueIds) {
                                                loadSubMaterial(subMatId, (parsedMaterial) => parsedMaterial.uniqueId === subMatId);
                                            }
                                        } else {
                                            // if the mats are stored by id instead
                                            for (const subMatId of parsedMultiMaterial.materials) {
                                                loadSubMaterial(subMatId, (parsedMaterial) => parsedMaterial.id === subMatId);
                                            }
                                        }
                                        materialArray.push(parsedMultiMaterial.uniqueId || parsedMultiMaterial.id);
                                        const mmat = MultiMaterial.ParseMultiMaterial(parsedMultiMaterial, scene);
                                        TempMaterialIndexContainer[parsedMultiMaterial.uniqueId || parsedMultiMaterial.id] = mmat;
                                        if (mmat) {
                                            materialFound = true;
                                            log += "\n\tMulti-Material " + mmat.toString(fullDetails);
                                        }
                                        break;
                                    }
                                }
                            }

                            if (materialFound === false) {
                                materialArray.push(parsedMesh.materialUniqueId || parsedMesh.materialId);
                                const mat = ParseMaterialByPredicate(
                                    (parsedMaterial) =>
                                        (parsedMesh.materialUniqueId && parsedMaterial.uniqueId === parsedMesh.materialUniqueId) || parsedMaterial.id === parsedMesh.materialId,
                                    parsedData,
                                    scene,
                                    rootUrl
                                );
                                if (!mat || !mat.material) {
                                    Logger.Warn("Material not found for mesh " + parsedMesh.id);
                                } else {
                                    TempMaterialIndexContainer[mat.parsedMaterial.uniqueId || mat.parsedMaterial.id] = mat.material;
                                    log += "\n\tMaterial " + mat.material.toString(fullDetails);
                                }
                            }
                        }

                        // Skeleton ?
                        if (
                            parsedMesh.skeletonId !== null &&
                            parsedMesh.skeletonId !== undefined &&
                            parsedData.skeletonId !== -1 &&
                            parsedData.skeletons !== undefined &&
                            parsedData.skeletons !== null
                        ) {
                            const skeletonAlreadyLoaded = loadedSkeletonsIds.indexOf(parsedMesh.skeletonId) > -1;
                            if (!skeletonAlreadyLoaded) {
                                for (let skeletonIndex = 0, skeletonCache = parsedData.skeletons.length; skeletonIndex < skeletonCache; skeletonIndex++) {
                                    const parsedSkeleton = parsedData.skeletons[skeletonIndex];
                                    if (parsedSkeleton.id === parsedMesh.skeletonId) {
                                        const skeleton = Skeleton.Parse(parsedSkeleton, scene);
                                        loadedSkeletonsIds.push(parsedSkeleton.id);
                                        if (parsedSkeleton.uniqueId !== undefined && parsedSkeleton.uniqueId !== null) {
                                            TempSkeletonIndexContainer[parsedSkeleton.uniqueId] = skeleton;
                                        }
                                        skeletons.push(skeleton);
                                        log += "\n\tSkeleton " + skeleton.toString(fullDetails);
                                    }
                                }
                            }
                        }

                        // Morph target managers ?
                        if (parsedMesh.morphTargetManagerId > -1 && parsedData.morphTargetManagers !== undefined && parsedData.morphTargetManagers !== null) {
                            const morphTargetManagerAlreadyLoaded = loadedMorphTargetManagerIds.indexOf(parsedMesh.morphTargetManagerId) > -1;
                            if (!morphTargetManagerAlreadyLoaded) {
                                for (let morphTargetManagerIndex = 0; morphTargetManagerIndex < parsedData.morphTargetManagers.length; morphTargetManagerIndex++) {
                                    const parsedManager = parsedData.morphTargetManagers[morphTargetManagerIndex];
                                    if (parsedManager.id === parsedMesh.morphTargetManagerId) {
                                        const morphTargetManager = MorphTargetManager.Parse(parsedManager, scene);
                                        TempMorphTargetManagerIndexContainer[parsedManager.id] = morphTargetManager;
                                        loadedMorphTargetManagerIds.push(parsedManager.id);
                                        log += "\nMorph target manager" + morphTargetManager.toString();
                                    }
                                }
                            }
                        }

                        const mesh = Mesh.Parse(parsedMesh, scene, rootUrl);
                        meshes.push(mesh);
                        parsedIdToNodeMap.set(mesh._waitingParsedUniqueId!, mesh);
                        mesh._waitingParsedUniqueId = null;
                        log += "\n\tMesh " + mesh.toString(fullDetails);
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

                // Connecting parents and lods
                for (let index = 0, cache = scene.transformNodes.length; index < cache; index++) {
                    const transformNode = scene.transformNodes[index];
                    if (transformNode._waitingParentId !== null) {
                        let parent = parsedIdToNodeMap.get(parseInt(transformNode._waitingParentId)) || null;
                        if (parent === null) {
                            parent = scene.getLastEntryById(transformNode._waitingParentId);
                        }
                        let parentNode = parent;
                        if (transformNode._waitingParentInstanceIndex) {
                            parentNode = (parent as Mesh).instances[parseInt(transformNode._waitingParentInstanceIndex)];
                            transformNode._waitingParentInstanceIndex = null;
                        }
                        transformNode.parent = parentNode;
                        transformNode._waitingParentId = null;
                    }
                }
                let currentMesh: AbstractMesh;
                for (let index = 0, cache = scene.meshes.length; index < cache; index++) {
                    currentMesh = scene.meshes[index];
                    if (currentMesh._waitingParentId) {
                        let parent = parsedIdToNodeMap.get(parseInt(currentMesh._waitingParentId)) || null;
                        if (parent === null) {
                            parent = scene.getLastEntryById(currentMesh._waitingParentId);
                        }
                        let parentNode = parent;
                        if (currentMesh._waitingParentInstanceIndex) {
                            parentNode = (parent as Mesh).instances[parseInt(currentMesh._waitingParentInstanceIndex)];
                            currentMesh._waitingParentInstanceIndex = null;
                        }
                        currentMesh.parent = parentNode;
                        currentMesh._waitingParentId = null;
                    }
                    if (currentMesh._waitingData.lods) {
                        LoadDetailLevels(scene, currentMesh);
                    }
                }

                // Remove unused transform nodes
                for (const transformNode of loadedTransformNodes) {
                    const childMeshes = transformNode.getChildMeshes(false);
                    if (!childMeshes.length) {
                        transformNode.dispose();
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
                for (let index = 0, cache = scene.skeletons.length; index < cache; index++) {
                    const skeleton = scene.skeletons[index];
                    if (skeleton._hasWaitingData) {
                        if (skeleton.bones != null) {
                            for (const bone of skeleton.bones) {
                                let linkTransformNode: Nullable<Node> = null;
                                // First try to get it via uniqueId
                                if (bone._waitingTransformNodeUniqueId !== null) {
                                    linkTransformNode = parsedIdToNodeMap.get(bone._waitingTransformNodeUniqueId) ?? null;
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

                // freeze and compute world matrix application
                for (let index = 0, cache = scene.meshes.length; index < cache; index++) {
                    currentMesh = scene.meshes[index];
                    if (currentMesh._waitingData.freezeWorldMatrix) {
                        currentMesh.freezeWorldMatrix();
                        currentMesh._waitingData.freezeWorldMatrix = null;
                    } else {
                        currentMesh.computeWorldMatrix(true);
                    }
                }
            }

            // Particles
            if (parsedData.particleSystems !== undefined && parsedData.particleSystems !== null) {
                const parser = GetIndividualParser(SceneComponentConstants.NAME_PARTICLESYSTEM);
                if (parser) {
                    for (let index = 0, cache = parsedData.particleSystems.length; index < cache; index++) {
                        const parsedParticleSystem = parsedData.particleSystems[index];
                        if (hierarchyIds.indexOf(parsedParticleSystem.emitterId) !== -1) {
                            particleSystems.push(parser(parsedParticleSystem, scene, rootUrl));
                        }
                    }
                }
            }

            for (const g of scene.geometries) {
                g._loadedUniqueId = "";
            }

            return true;
        } catch (err) {
            const msg = logOperation("importMesh", parsedData ? parsedData.producer : "Unknown") + log;
            if (onError) {
                onError(msg, err);
            } else {
                Logger.Log(msg);
                throw err;
            }
        } finally {
            if (log !== null && SceneLoaderFlags.loggingLevel !== Constants.SCENELOADER_NO_LOGGING) {
                Logger.Log(
                    logOperation("importMesh", parsedData ? parsedData.producer : "Unknown") + (SceneLoaderFlags.loggingLevel !== Constants.SCENELOADER_MINIMAL_LOGGING ? log : "")
                );
            }
            _ResetTempContainers();
        }

        return false;
    },
    load: (scene: Scene, data: string, rootUrl: string, onError?: (message: string, exception?: any) => void): boolean => {
        // Entire method running in try block, so ALWAYS logs as far as it got, only actually writes details
        // when SceneLoader.debugLogging = true (default), or exception encountered.
        // Everything stored in var log instead of writing separate lines to support only writing in exception,
        // and avoid problems with multiple concurrent .babylon loads.
        let log = "importScene has failed JSON parse";
        try {
            // eslint-disable-next-line no-var
            var parsedData = JSON.parse(data);
            log = "";

            // Scene
            if (parsedData.useDelayedTextureLoading !== undefined && parsedData.useDelayedTextureLoading !== null) {
                scene.useDelayedTextureLoading = parsedData.useDelayedTextureLoading && !SceneLoaderFlags.ForceFullSceneLoadingForIncremental;
            }
            if (parsedData.autoClear !== undefined && parsedData.autoClear !== null) {
                scene.autoClear = parsedData.autoClear;
            }
            if (parsedData.clearColor !== undefined && parsedData.clearColor !== null) {
                scene.clearColor = Color4.FromArray(parsedData.clearColor);
            }
            if (parsedData.ambientColor !== undefined && parsedData.ambientColor !== null) {
                scene.ambientColor = Color3.FromArray(parsedData.ambientColor);
            }
            if (parsedData.gravity !== undefined && parsedData.gravity !== null) {
                scene.gravity = Vector3.FromArray(parsedData.gravity);
            }

            if (parsedData.useRightHandedSystem !== undefined) {
                scene.useRightHandedSystem = !!parsedData.useRightHandedSystem;
            }

            // Fog
            if (parsedData.fogMode !== undefined && parsedData.fogMode !== null) {
                scene.fogMode = parsedData.fogMode;
            }
            if (parsedData.fogColor !== undefined && parsedData.fogColor !== null) {
                scene.fogColor = Color3.FromArray(parsedData.fogColor);
            }
            if (parsedData.fogStart !== undefined && parsedData.fogStart !== null) {
                scene.fogStart = parsedData.fogStart;
            }
            if (parsedData.fogEnd !== undefined && parsedData.fogEnd !== null) {
                scene.fogEnd = parsedData.fogEnd;
            }
            if (parsedData.fogDensity !== undefined && parsedData.fogDensity !== null) {
                scene.fogDensity = parsedData.fogDensity;
            }
            log += "\tFog mode for scene:  ";
            switch (scene.fogMode) {
                case 0:
                    log += "none\n";
                    break;
                // getters not compiling, so using hardcoded
                case 1:
                    log += "exp\n";
                    break;
                case 2:
                    log += "exp2\n";
                    break;
                case 3:
                    log += "linear\n";
                    break;
            }

            //Physics
            if (parsedData.physicsEnabled) {
                let physicsPlugin;
                if (parsedData.physicsEngine === "cannon" || parsedData.physicsEngine === CannonJSPlugin.name) {
                    physicsPlugin = new CannonJSPlugin(undefined, undefined, BabylonFileLoaderConfiguration.LoaderInjectedPhysicsEngine);
                } else if (parsedData.physicsEngine === "oimo" || parsedData.physicsEngine === OimoJSPlugin.name) {
                    physicsPlugin = new OimoJSPlugin(undefined, BabylonFileLoaderConfiguration.LoaderInjectedPhysicsEngine);
                } else if (parsedData.physicsEngine === "ammo" || parsedData.physicsEngine === AmmoJSPlugin.name) {
                    physicsPlugin = new AmmoJSPlugin(undefined, BabylonFileLoaderConfiguration.LoaderInjectedPhysicsEngine, undefined);
                }
                log = "\tPhysics engine " + (parsedData.physicsEngine ? parsedData.physicsEngine : "oimo") + " enabled\n";
                //else - default engine, which is currently oimo
                const physicsGravity = parsedData.gravity ? Vector3.FromArray(parsedData.gravity) : parsedData.physicsGravity ? Vector3.FromArray(parsedData.physicsGravity) : null;
                scene.enablePhysics(physicsGravity, physicsPlugin);
            }

            // Metadata
            if (parsedData.metadata !== undefined && parsedData.metadata !== null) {
                scene.metadata = parsedData.metadata;
            }

            //collisions, if defined. otherwise, default is true
            if (parsedData.collisionsEnabled !== undefined && parsedData.collisionsEnabled !== null) {
                scene.collisionsEnabled = parsedData.collisionsEnabled;
            }

            const container = LoadAssetContainer(scene, data, rootUrl, onError, true);
            if (!container) {
                return false;
            }

            if (parsedData.autoAnimate) {
                scene.beginAnimation(scene, parsedData.autoAnimateFrom, parsedData.autoAnimateTo, parsedData.autoAnimateLoop, parsedData.autoAnimateSpeed || 1.0);
            }

            if (parsedData.activeCameraID !== undefined && parsedData.activeCameraID !== null) {
                scene.setActiveCameraById(parsedData.activeCameraID);
            }

            // Finish
            return true;
        } catch (err) {
            const msg = logOperation("importScene", parsedData ? parsedData.producer : "Unknown") + log;
            if (onError) {
                onError(msg, err);
            } else {
                Logger.Log(msg);
                throw err;
            }
        } finally {
            if (log !== null && SceneLoaderFlags.loggingLevel !== Constants.SCENELOADER_NO_LOGGING) {
                Logger.Log(
                    logOperation("importScene", parsedData ? parsedData.producer : "Unknown") + (SceneLoaderFlags.loggingLevel !== Constants.SCENELOADER_MINIMAL_LOGGING ? log : "")
                );
            }
        }
        return false;
    },
    loadAssetContainer: (scene: Scene, data: string, rootUrl: string, onError?: (message: string, exception?: any) => void): AssetContainer => {
        const container = LoadAssetContainer(scene, data, rootUrl, onError);
        return container;
    },
});

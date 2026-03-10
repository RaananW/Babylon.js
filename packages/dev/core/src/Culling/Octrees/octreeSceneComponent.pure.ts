/** This file must only contain pure code and pure imports */

import type { ISmartArrayLike } from "../../Misc/smartArray";
import { Scene } from "../../scene.pure";
import { Vector3 } from "../../Maths/math.vector.pure";
import type { SubMesh } from "../../Meshes/subMesh";
import { AbstractMesh } from "../../Meshes/abstractMesh.pure";
import { Ray } from "../../Culling/ray.pure";
import { SceneComponentConstants } from "../../sceneComponent";
import { EngineStore } from "../../Engines/engineStore";
import type { Collider } from "../../Collisions/collider";
import { RayTransformToRef } from "../ray.core";

/**
 * Defines the octree scene component responsible to manage any octrees
 * in a given scene.
 */
export class OctreeSceneComponent {
    /**
     * The component name help to identify the component in the list of scene components.
     */
    public readonly name = SceneComponentConstants.NAME_OCTREE;

    /**
     * The scene the component belongs to.
     */
    public scene: Scene;

    /**
     * Indicates if the meshes have been checked to make sure they are isEnabled()
     */
    public readonly checksIsEnabled = true;

    /**
     * Creates a new instance of the component for the given scene
     * @param scene Defines the scene to register the component in
     */
    constructor(scene?: Scene) {
        scene = scene || <Scene>EngineStore.LastCreatedScene;
        if (!scene) {
            return;
        }
        this.scene = scene;

        this.scene.getActiveMeshCandidates = () => this.getActiveMeshCandidates();
        this.scene.getActiveSubMeshCandidates = (mesh: AbstractMesh) => this.getActiveSubMeshCandidates(mesh);
        this.scene.getCollidingSubMeshCandidates = (mesh: AbstractMesh, collider: Collider) => this.getCollidingSubMeshCandidates(mesh, collider);
        this.scene.getIntersectingSubMeshCandidates = (mesh: AbstractMesh, localRay: Ray) => this.getIntersectingSubMeshCandidates(mesh, localRay);
    }

    /**
     * Registers the component in a given scene
     */
    public register(): void {
        this.scene.onMeshRemovedObservable.add((mesh: AbstractMesh) => {
            const sceneOctree = this.scene.selectionOctree;
            if (sceneOctree !== undefined && sceneOctree !== null) {
                const index = sceneOctree.dynamicContent.indexOf(mesh);

                if (index !== -1) {
                    sceneOctree.dynamicContent.splice(index, 1);
                }
            }
        });

        this.scene.onMeshImportedObservable.add((mesh: AbstractMesh) => {
            const sceneOctree = this.scene.selectionOctree;
            if (sceneOctree !== undefined && sceneOctree !== null) {
                sceneOctree.addMesh(mesh);
            }
        });
    }

    /**
     * Return the list of active meshes
     * @returns the list of active meshes
     */
    public getActiveMeshCandidates(): ISmartArrayLike<AbstractMesh> {
        return this.scene._selectionOctree?.select(this.scene.frustumPlanes) || this.scene._getDefaultMeshCandidates();
    }

    /**
     * Return the list of active sub meshes
     * @param mesh The mesh to get the candidates sub meshes from
     * @returns the list of active sub meshes
     */
    public getActiveSubMeshCandidates(mesh: AbstractMesh): ISmartArrayLike<SubMesh> {
        if (mesh._submeshesOctree && mesh.useOctreeForRenderingSelection) {
            const intersections = mesh._submeshesOctree.select(this.scene.frustumPlanes);
            return intersections;
        }
        return this.scene._getDefaultSubMeshCandidates(mesh);
    }

    private _tempRay = new Ray(Vector3.Zero(), new Vector3(1, 1, 1));
    /**
     * Return the list of sub meshes intersecting with a given local ray
     * @param mesh defines the mesh to find the submesh for
     * @param localRay defines the ray in local space
     * @returns the list of intersecting sub meshes
     */
    public getIntersectingSubMeshCandidates(mesh: AbstractMesh, localRay: Ray): ISmartArrayLike<SubMesh> {
        if (mesh._submeshesOctree && mesh.useOctreeForPicking) {
            RayTransformToRef(localRay, mesh.getWorldMatrix(), this._tempRay);
            const intersections = mesh._submeshesOctree.intersectsRay(this._tempRay);

            return intersections;
        }
        return this.scene._getDefaultSubMeshCandidates(mesh);
    }

    /**
     * Return the list of sub meshes colliding with a collider
     * @param mesh defines the mesh to find the submesh for
     * @param collider defines the collider to evaluate the collision against
     * @returns the list of colliding sub meshes
     */
    public getCollidingSubMeshCandidates(mesh: AbstractMesh, collider: Collider): ISmartArrayLike<SubMesh> {
        if (mesh._submeshesOctree && mesh.useOctreeForCollisions) {
            const radius = collider._velocityWorldLength + Math.max(collider._radius.x, collider._radius.y, collider._radius.z);
            const intersections = mesh._submeshesOctree.intersects(collider._basePointWorld, radius);

            return intersections;
        }
        return this.scene._getDefaultSubMeshCandidates(mesh);
    }

    /**
     * Rebuilds the elements related to this component in case of
     * context lost for instance.
     */
    public rebuild(): void {
        // Nothing to do here.
    }

    /**
     * Disposes the component and the associated resources.
     */
    public dispose(): void {
        // Nothing to do here.
    }
}

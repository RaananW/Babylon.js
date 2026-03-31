import { FlowGraphEventBlock } from "../../flowGraphEventBlock";
import { type FlowGraphContext } from "../../flowGraphContext";
import { type IFlowGraphBlockConfiguration } from "../../flowGraphBlock";
import { RegisterClass } from "../../../Misc/typeStore";
import { FlowGraphBlockNames } from "../flowGraphBlockNames";
import { type FlowGraphDataConnection } from "../../flowGraphDataConnection";
import { RichTypeAny, RichTypeNumber, RichTypeVector3 } from "../../flowGraphRichTypes";
import { type Vector3 } from "../../../Maths/math.vector";
import { type PhysicsBody } from "../../../Physics/v2/physicsBody";
import { type IPhysicsCollisionEvent } from "../../../Physics/v2/IPhysicsEnginePlugin";
import { type Observer } from "../../../Misc/observable";
import { type Nullable } from "../../../types";

/**
 * Configuration for the physics collision event block.
 */
export interface IFlowGraphPhysicsCollisionEventBlockConfiguration extends IFlowGraphBlockConfiguration {
    /**
     * The physics body to listen for collisions on.
     */
    body?: PhysicsBody;
}

/**
 * @experimental
 * An event block that fires when a physics collision occurs on the specified body.
 * Subscribes to the body's collision observable and exposes collision details
 * (the other body, contact point, normal, impulse, and distance) as data outputs.
 */
export class FlowGraphPhysicsCollisionEventBlock extends FlowGraphEventBlock {
    /**
     * Input connection: The physics body to monitor for collisions.
     */
    public readonly body: FlowGraphDataConnection<PhysicsBody>;

    /**
     * Output connection: The other physics body involved in the collision.
     */
    public readonly otherBody: FlowGraphDataConnection<PhysicsBody>;

    /**
     * Output connection: The world-space contact point of the collision.
     */
    public readonly point: FlowGraphDataConnection<Vector3>;

    /**
     * Output connection: The world-space collision normal direction.
     */
    public readonly normal: FlowGraphDataConnection<Vector3>;

    /**
     * Output connection: The impulse magnitude computed by the physics solver.
     */
    public readonly impulse: FlowGraphDataConnection<number>;

    /**
     * Output connection: The penetration distance of the collision.
     */
    public readonly distance: FlowGraphDataConnection<number>;

    private _collisionObserver: Nullable<Observer<IPhysicsCollisionEvent>> = null;

    /**
     * Constructs a new FlowGraphPhysicsCollisionEventBlock.
     * @param config - optional configuration for the block
     */
    public constructor(
        /**
         * the configuration of the block
         */
        public override config?: IFlowGraphPhysicsCollisionEventBlockConfiguration
    ) {
        super(config);
        this.body = this.registerDataInput("body", RichTypeAny, config?.body);
        this.otherBody = this.registerDataOutput("otherBody", RichTypeAny);
        this.point = this.registerDataOutput("point", RichTypeVector3);
        this.normal = this.registerDataOutput("normal", RichTypeVector3);
        this.impulse = this.registerDataOutput("impulse", RichTypeNumber);
        this.distance = this.registerDataOutput("distance", RichTypeNumber);
    }

    /**
     * @internal
     */
    public override _preparePendingTasks(context: FlowGraphContext): void {
        const physicsBody = this.body.getValue(context);
        if (!physicsBody) {
            this._reportError(context, "No physics body provided for collision event");
            return;
        }
        // Enable collision callbacks on the body
        physicsBody.setCollisionCallbackEnabled(true);
        this._collisionObserver = physicsBody.getCollisionObservable().add((event) => {
            this._onCollision(context, event);
        });
    }

    private _onCollision(context: FlowGraphContext, event: IPhysicsCollisionEvent): void {
        const physicsBody = this.body.getValue(context);
        // Determine the "other" body from the collision pair
        const other = event.collider === physicsBody ? event.collidedAgainst : event.collider;
        this.otherBody.setValue(other, context);
        if (event.point) {
            this.point.setValue(event.point, context);
        }
        if (event.normal) {
            this.normal.setValue(event.normal, context);
        }
        this.impulse.setValue(event.impulse, context);
        this.distance.setValue(event.distance, context);
        this._execute(context);
    }

    /**
     * @internal
     */
    public override _executeEvent(_context: FlowGraphContext, _payload: any): boolean {
        // This block manages its own observable subscription, so the
        // central event coordinator does not dispatch to it.
        return true;
    }

    /**
     * @internal
     */
    public override _cancelPendingTasks(_context: FlowGraphContext): void {
        if (this._collisionObserver) {
            const physicsBody = this.body.getValue(_context);
            if (physicsBody) {
                physicsBody.getCollisionObservable().remove(this._collisionObserver);
            }
            this._collisionObserver = null;
        }
    }

    /**
     * @returns class name of the block.
     */
    public override getClassName(): string {
        return FlowGraphBlockNames.PhysicsCollisionEvent;
    }
}
RegisterClass(FlowGraphBlockNames.PhysicsCollisionEvent, FlowGraphPhysicsCollisionEventBlock);

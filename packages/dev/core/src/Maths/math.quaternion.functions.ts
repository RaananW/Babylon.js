import type { DeepImmutable } from "../types";
import type { IQuaternionLike, IVector3Like } from "./math.like";

// ── Quaternion free functions ───────────────────────────────────────────────

/**
 * Returns the dot product of two IQuaternionLike.
 * @param left - first operand
 * @param right - second operand
 * @returns the dot product
 */
export function QuaternionDot(left: DeepImmutable<IQuaternionLike>, right: DeepImmutable<IQuaternionLike>): number {
    return left.x * right.x + left.y * right.y + left.z * right.z + left.w * right.w;
}

/**
 * Computes the squared length (norm²) of an IQuaternionLike.
 * @param q - the quaternion to measure
 * @returns the squared length
 */
export function QuaternionLengthSquared(q: DeepImmutable<IQuaternionLike>): number {
    return q.x * q.x + q.y * q.y + q.z * q.z + q.w * q.w;
}

/**
 * Computes the length (norm) of an IQuaternionLike.
 * @param q - the quaternion to measure
 * @returns the length
 */
export function QuaternionLength(q: DeepImmutable<IQuaternionLike>): number {
    return Math.sqrt(QuaternionLengthSquared(q));
}

/**
 * Normalizes an IQuaternionLike and stores the result.
 * @param q - the quaternion to normalize
 * @param result - quaternion to store the result
 * @returns result
 */
export function QuaternionNormalizeToRef<T extends IQuaternionLike>(q: DeepImmutable<IQuaternionLike>, result: T): T {
    const len = QuaternionLength(q);
    if (len === 0) {
        result.x = 0;
        result.y = 0;
        result.z = 0;
        result.w = 0;
    } else {
        const inv = 1.0 / len;
        result.x = q.x * inv;
        result.y = q.y * inv;
        result.z = q.z * inv;
        result.w = q.w * inv;
    }
    return result;
}

/**
 * Stores the inverse of q into result (assumes unit quaternion: conjugate).
 * @param q - the source quaternion
 * @param result - quaternion to store the result
 * @returns result
 */
export function QuaternionInverseToRef<T extends IQuaternionLike>(q: DeepImmutable<IQuaternionLike>, result: T): T {
    result.x = -q.x;
    result.y = -q.y;
    result.z = -q.z;
    result.w = q.w;
    return result;
}

/**
 * Returns true if two IQuaternionLike represent approximately the same rotation.
 * Accounts for quaternion double-cover (q and -q represent the same rotation).
 * @param quat0 - first quaternion
 * @param quat1 - second quaternion
 * @returns true if close
 */
export function QuaternionAreClose(quat0: DeepImmutable<IQuaternionLike>, quat1: DeepImmutable<IQuaternionLike>): boolean {
    const dot = QuaternionDot(quat0, quat1);
    return dot >= 0;
}

/**
 * Spherical linear interpolation (SLERP) between two IQuaternionLike and stores the result.
 * @param left - start quaternion
 * @param right - end quaternion
 * @param amount - interpolant (0..1)
 * @param result - quaternion to store the result
 * @returns result
 */
export function QuaternionSlerpToRef<T extends IQuaternionLike>(left: DeepImmutable<IQuaternionLike>, right: DeepImmutable<IQuaternionLike>, amount: number, result: T): T {
    let num2;
    let num3;
    let num4 = left.x * right.x + left.y * right.y + left.z * right.z + left.w * right.w;
    let flag = false;

    if (num4 < 0) {
        flag = true;
        num4 = -num4;
    }

    if (num4 > 0.999999) {
        num3 = 1 - amount;
        num2 = flag ? -amount : amount;
    } else {
        const num5 = Math.acos(num4);
        const num6 = 1.0 / Math.sin(num5);
        num3 = Math.sin((1.0 - amount) * num5) * num6;
        num2 = flag ? -Math.sin(amount * num5) * num6 : Math.sin(amount * num5) * num6;
    }

    result.x = num3 * left.x + num2 * right.x;
    result.y = num3 * left.y + num2 * right.y;
    result.z = num3 * left.z + num2 * right.z;
    result.w = num3 * left.w + num2 * right.w;
    return result;
}

/**
 * Creates a rotation quaternion from an axis and angle and stores the result.
 * @param axis - the rotation axis (does not need to be normalized)
 * @param angle - the rotation angle in radians
 * @param result - quaternion to store the result
 * @returns result
 */
export function QuaternionRotationAxisToRef<T extends IQuaternionLike>(axis: DeepImmutable<IVector3Like>, angle: number, result: T): T {
    const axisLength = Math.sqrt(axis.x * axis.x + axis.y * axis.y + axis.z * axis.z);
    const halfAngle = angle * 0.5;
    const s = Math.sin(halfAngle) / axisLength;
    result.x = axis.x * s;
    result.y = axis.y * s;
    result.z = axis.z * s;
    result.w = Math.cos(halfAngle);
    return result;
}

/**
 * Creates a rotation quaternion from Euler angles (pitch, yaw, roll) in YXZ order and stores the result.
 * @param x - rotation around X axis (pitch) in radians
 * @param y - rotation around Y axis (yaw) in radians
 * @param z - rotation around Z axis (roll) in radians
 * @param result - quaternion to store the result
 * @returns result
 */
export function QuaternionFromEulerAnglesToRef<T extends IQuaternionLike>(x: number, y: number, z: number, result: T): T {
    return QuaternionRotationYawPitchRollToRef(y, x, z, result);
}

/**
 * Creates a rotation quaternion from yaw, pitch, roll (y-x-z order) and stores the result.
 * @param yaw - rotation around Y axis in radians
 * @param pitch - rotation around X axis in radians
 * @param roll - rotation around Z axis in radians
 * @param result - quaternion to store the result
 * @returns result
 */
export function QuaternionRotationYawPitchRollToRef<T extends IQuaternionLike>(yaw: number, pitch: number, roll: number, result: T): T {
    const halfRoll = roll * 0.5;
    const halfPitch = pitch * 0.5;
    const halfYaw = yaw * 0.5;

    const sinRoll = Math.sin(halfRoll);
    const cosRoll = Math.cos(halfRoll);
    const sinPitch = Math.sin(halfPitch);
    const cosPitch = Math.cos(halfPitch);
    const sinYaw = Math.sin(halfYaw);
    const cosYaw = Math.cos(halfYaw);

    result.x = cosYaw * sinPitch * cosRoll + sinYaw * cosPitch * sinRoll;
    result.y = sinYaw * cosPitch * cosRoll - cosYaw * sinPitch * sinRoll;
    result.z = cosYaw * cosPitch * sinRoll - sinYaw * sinPitch * cosRoll;
    result.w = cosYaw * cosPitch * cosRoll + sinYaw * sinPitch * sinRoll;
    return result;
}

/**
 * Multiplies two IQuaternionLike and stores the result (Hamilton product).
 * @param left - the left operand
 * @param right - the right operand
 * @param result - quaternion to store the result
 * @returns result
 */
export function QuaternionMultiplyToRef<T extends IQuaternionLike>(left: DeepImmutable<IQuaternionLike>, right: DeepImmutable<IQuaternionLike>, result: T): T {
    const lx = left.x,
        ly = left.y,
        lz = left.z,
        lw = left.w;
    const rx = right.x,
        ry = right.y,
        rz = right.z,
        rw = right.w;

    result.x = lx * rw + lw * rx + ly * rz - lz * ry;
    result.y = ly * rw + lw * ry + lz * rx - lx * rz;
    result.z = lz * rw + lw * rz + lx * ry - ly * rx;
    result.w = lw * rw - lx * rx - ly * ry - lz * rz;
    return result;
}

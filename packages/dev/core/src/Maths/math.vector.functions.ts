import type { DeepImmutable } from "../types";
import type { IVector2Like, IVector3Like, IVector4Like } from "./math.like";

/**
 * Creates a string representation of the IVector2Like
 * @param vector defines the IVector2Like to stringify
 * @param decimalCount defines the number of decimals to use
 * @returns a string with the IVector2Like coordinates.
 */
export function Vector2ToFixed(vector: DeepImmutable<IVector2Like>, decimalCount: number): string {
    return `{X: ${vector.x.toFixed(decimalCount)} Y: ${vector.y.toFixed(decimalCount)}}`;
}

/**
 * Computes the dot product of two IVector3Like objects.
 * @param a defines the first vector
 * @param b defines the second vector
 * @returns the dot product
 */
export function Vector3Dot(a: DeepImmutable<IVector3Like>, b: DeepImmutable<IVector3Like>): number {
    return a.x * b.x + a.y * b.y + a.z * b.z;
}

/**
 * Computes the squared length of the IVector3Like
 * @param vector the vector to measure
 * @returns the squared length of the vector
 */
export function Vector3LengthSquared(vector: DeepImmutable<IVector3Like>): number {
    return vector.x * vector.x + vector.y * vector.y + vector.z * vector.z;
}

/**
 * Computes the length of the IVector3Like
 * @param vector the vector to measure
 * @returns the length of the vector
 */
export function Vector3Length(vector: DeepImmutable<IVector3Like>): number {
    return Math.sqrt(Vector3LengthSquared(vector));
}

/**
 * Computes the squared distance between the IVector3Like objects
 * @param a defines the first vector
 * @param b defines the second vector
 * @returns the squared distance
 */
export function Vector3DistanceSquared(a: DeepImmutable<IVector3Like>, b: DeepImmutable<IVector3Like>): number {
    const x = b.x - a.x;
    const y = b.y - a.y;
    const z = b.z - a.z;
    return x * x + y * y + z * z;
}

/**
 * Computes the distance between the IVector3Like objects
 * @param a defines the first vector
 * @param b defines the second vector
 * @returns the distance
 */
export function Vector3Distance(a: DeepImmutable<IVector3Like>, b: DeepImmutable<IVector3Like>): number {
    return Math.sqrt(Vector3DistanceSquared(a, b));
}

/**
 * Sets the given floats into the result.
 * @param x defines the x coordinate
 * @param y defines the y coordinate
 * @param z defines the z coordinate
 * @param result defines the result vector
 * @returns the result vector
 */
export function Vector3FromFloatsToRef<T extends IVector3Like>(x: number, y: number, z: number, result: T): T {
    result.x = x;
    result.y = y;
    result.z = z;
    return result;
}

/**
 * Stores the scaled values of a vector into the result.
 * @param a defines the source vector
 * @param scale defines the scale factor
 * @param result defines the result vector
 * @returns the scaled vector
 */
export function Vector3ScaleToRef<T extends IVector3Like>(a: DeepImmutable<IVector3Like>, scale: number, result: T): T {
    result.x = a.x * scale;
    result.y = a.y * scale;
    result.z = a.z * scale;
    return result;
}

/**
 * Scales the current vector values in place by a factor.
 * @param vector defines the vector to scale
 * @param scale defines the scale factor
 * @returns the scaled vector
 */
export function Vector3ScaleInPlace<T extends IVector3Like>(vector: T, scale: number): T {
    vector.x *= scale;
    vector.y *= scale;
    vector.z *= scale;
    return vector;
}

export function Vector3SubtractToRef<T extends IVector3Like>(a: DeepImmutable<IVector3Like>, b: DeepImmutable<IVector3Like>, result: T): T {
    result.x = a.x - b.x;
    result.y = a.y - b.y;
    result.z = a.z - b.z;
    return result;
}

export function Vector3CopyToRef<T extends IVector3Like>(source: DeepImmutable<IVector3Like>, result: T): T {
    result.x = source.x;
    result.y = source.y;
    result.z = source.z;
    return result;
}

export function Vector3LerpToRef<T extends IVector3Like>(start: DeepImmutable<IVector3Like>, end: DeepImmutable<IVector3Like>, amount: number, result: T): T {
    result.x = start.x + (end.x - start.x) * amount;
    result.y = start.y + (end.y - start.y) * amount;
    result.z = start.z + (end.z - start.z) * amount;
    return result;
}

export function Vector3NormalizeToRef<T extends IVector3Like>(vector: DeepImmutable<IVector3Like>, result: T): T {
    const len = Vector3Length(vector);
    if (len === 0) {
        result.x = 0;
        result.y = 0;
        result.z = 0;
    } else {
        result.x = vector.x / len;
        result.y = vector.y / len;
        result.z = vector.z / len;
    }
    return result;
}

/**
 * Computes the signed distance between the specified point and plane.
 * @param origin defines a point on the plane
 * @param normal defines the plane normal (assumes normalized)
 * @param point defines the point to compute the signed distance to
 * @returns the signed distance
 */
export function Vector3SignedDistanceToPlaneFromPositionAndNormal(
    origin: DeepImmutable<IVector3Like>,
    normal: DeepImmutable<IVector3Like>,
    point: DeepImmutable<IVector3Like>
): number {
    return (point.x - origin.x) * normal.x + (point.y - origin.y) * normal.y + (point.z - origin.z) * normal.z;
}

/**
 * Creates a string representation of the IVector3Like
 * @param vector defines the IVector3Like to stringify
 * @param decimalCount defines the number of decimals to use
 * @returns a string with the IVector3Like coordinates.
 */
export function Vector3ToFixed(vector: DeepImmutable<IVector3Like>, decimalCount: number): string {
    return `{X: ${vector.x.toFixed(decimalCount)} Y: ${vector.y.toFixed(decimalCount)} Z: ${vector.z.toFixed(decimalCount)}}`;
}

/**
 * Computes the dot product of two IVector4Like objects
 * @param a defines the first vector
 * @param b defines the second vector
 * @returns the dot product
 */
export function Vector4Dot(a: DeepImmutable<IVector4Like>, b: DeepImmutable<IVector4Like>): number {
    return a.x * b.x + a.y * b.y + a.z * b.z + a.w * b.w;
}

/**
 * Creates a string representation of the IVector4Like
 * @param vector defines the IVector4Like to stringify
 * @param decimalCount defines the number of decimals to use
 * @returns a string with the IVector4Like coordinates.
 */
export function Vector4ToFixed(vector: DeepImmutable<IVector4Like>, decimalCount: number): string {
    return `{X: ${vector.x.toFixed(decimalCount)} Y: ${vector.y.toFixed(decimalCount)} Z: ${vector.z.toFixed(decimalCount)} W: ${vector.w.toFixed(decimalCount)}}`;
}

// ── Vector2 arithmetic ──────────────────────────────────────────────────────

/**
 * Adds two IVector2Like objects component-wise and stores the result.
 * @param a - first operand
 * @param b - second operand
 * @param result - vector to store the result
 * @returns result
 */
export function Vector2AddToRef<T extends IVector2Like>(a: DeepImmutable<IVector2Like>, b: DeepImmutable<IVector2Like>, result: T): T {
    result.x = a.x + b.x;
    result.y = a.y + b.y;
    return result;
}

/**
 * Subtracts two IVector2Like objects component-wise and stores the result.
 * @param a - first operand (minuend)
 * @param b - second operand (subtrahend)
 * @param result - vector to store the result
 * @returns result
 */
export function Vector2SubtractToRef<T extends IVector2Like>(a: DeepImmutable<IVector2Like>, b: DeepImmutable<IVector2Like>, result: T): T {
    result.x = a.x - b.x;
    result.y = a.y - b.y;
    return result;
}

/**
 * Computes the squared length of an IVector2Like.
 * @param vector - the vector to measure
 * @returns the squared length
 */
export function Vector2LengthSquared(vector: DeepImmutable<IVector2Like>): number {
    return vector.x * vector.x + vector.y * vector.y;
}

/**
 * Computes the length of an IVector2Like.
 * @param vector - the vector to measure
 * @returns the length
 */
export function Vector2Length(vector: DeepImmutable<IVector2Like>): number {
    return Math.sqrt(Vector2LengthSquared(vector));
}

/**
 * Computes the dot product of two IVector2Like objects.
 * @param a - first operand
 * @param b - second operand
 * @returns the dot product
 */
export function Vector2Dot(a: DeepImmutable<IVector2Like>, b: DeepImmutable<IVector2Like>): number {
    return a.x * b.x + a.y * b.y;
}

// ── Vector3 arithmetic (continued) ─────────────────────────────────────────

/**
 * Adds two IVector3Like objects component-wise and stores the result.
 * @param a - first operand
 * @param b - second operand
 * @param result - vector to store the result
 * @returns result
 */
export function Vector3AddToRef<T extends IVector3Like>(a: DeepImmutable<IVector3Like>, b: DeepImmutable<IVector3Like>, result: T): T {
    result.x = a.x + b.x;
    result.y = a.y + b.y;
    result.z = a.z + b.z;
    return result;
}

/**
 * Multiplies two IVector3Like objects component-wise and stores the result.
 * @param a - first operand
 * @param b - second operand
 * @param result - vector to store the result
 * @returns result
 */
export function Vector3MultiplyToRef<T extends IVector3Like>(a: DeepImmutable<IVector3Like>, b: DeepImmutable<IVector3Like>, result: T): T {
    result.x = a.x * b.x;
    result.y = a.y * b.y;
    result.z = a.z * b.z;
    return result;
}

/**
 * Negates an IVector3Like and stores the result.
 * @param value - the vector to negate
 * @param result - vector to store the result
 * @returns result
 */
export function Vector3NegateToRef<T extends IVector3Like>(value: DeepImmutable<IVector3Like>, result: T): T {
    result.x = -value.x;
    result.y = -value.y;
    result.z = -value.z;
    return result;
}

/**
 * Sets the given vector "result" with the cross product of "left" and "right".
 * The cross product is orthogonal to both "left" and "right".
 * @param left - first operand
 * @param right - second operand
 * @param result - vector to store the result
 * @returns result
 */
export function Vector3CrossToRef<T extends IVector3Like>(left: DeepImmutable<IVector3Like>, right: DeepImmutable<IVector3Like>, result: T): T {
    const x = left.y * right.z - left.z * right.y;
    const y = left.z * right.x - left.x * right.z;
    const z = left.x * right.y - left.y * right.x;
    result.x = x;
    result.y = y;
    result.z = z;
    return result;
}

/**
 * Gets the minimal coordinate values between two IVector3Like and stores the result.
 * @param left - first operand
 * @param right - second operand
 * @param result - vector to store the result
 * @returns result
 */
export function Vector3MinimizeToRef<T extends IVector3Like>(left: DeepImmutable<IVector3Like>, right: DeepImmutable<IVector3Like>, result: T): T {
    result.x = Math.min(left.x, right.x);
    result.y = Math.min(left.y, right.y);
    result.z = Math.min(left.z, right.z);
    return result;
}

/**
 * Gets the maximal coordinate values between two IVector3Like and stores the result.
 * @param left - first operand
 * @param right - second operand
 * @param result - vector to store the result
 * @returns result
 */
export function Vector3MaximizeToRef<T extends IVector3Like>(left: DeepImmutable<IVector3Like>, right: DeepImmutable<IVector3Like>, result: T): T {
    result.x = Math.max(left.x, right.x);
    result.y = Math.max(left.y, right.y);
    result.z = Math.max(left.z, right.z);
    return result;
}

/**
 * Clamps an IVector3Like between min and max component-wise and stores the result.
 * @param value - the vector to clamp
 * @param min - lower range
 * @param max - upper range
 * @param result - vector to store the result
 * @returns result
 */
export function Vector3ClampToRef<T extends IVector3Like>(value: DeepImmutable<IVector3Like>, min: DeepImmutable<IVector3Like>, max: DeepImmutable<IVector3Like>, result: T): T {
    let x = value.x;
    x = x > max.x ? max.x : x;
    x = x < min.x ? min.x : x;

    let y = value.y;
    y = y > max.y ? max.y : y;
    y = y < min.y ? min.y : y;

    let z = value.z;
    z = z > max.z ? max.z : z;
    z = z < min.z ? min.z : z;

    result.x = x;
    result.y = y;
    result.z = z;
    return result;
}

/**
 * Updates min and max IVector3Like so that the point v is enclosed within the axis-aligned bounding box they describe.
 * @param v - the point to check
 * @param min - current minimum (mutated in-place)
 * @param max - current maximum (mutated in-place)
 */
export function Vector3CheckExtends(v: DeepImmutable<IVector3Like>, min: IVector3Like, max: IVector3Like): void {
    min.x = Math.min(min.x, v.x);
    min.y = Math.min(min.y, v.y);
    min.z = Math.min(min.z, v.z);
    max.x = Math.max(max.x, v.x);
    max.y = Math.max(max.y, v.y);
    max.z = Math.max(max.z, v.z);
}

/**
 * Updates an IVector3Like with the 1st derivative of the Hermite spline.
 * @param value1 - first control point
 * @param tangent1 - first tangent
 * @param value2 - second control point
 * @param tangent2 - second tangent
 * @param time - parametric position on the spline
 * @param result - vector to store the derivative
 * @returns result
 */
export function Vector3Hermite1stDerivativeToRef<T extends IVector3Like>(
    value1: DeepImmutable<IVector3Like>,
    tangent1: DeepImmutable<IVector3Like>,
    value2: DeepImmutable<IVector3Like>,
    tangent2: DeepImmutable<IVector3Like>,
    time: number,
    result: T
): T {
    const t2 = time * time;

    result.x = (t2 - time) * 6 * value1.x + (3 * t2 - 4 * time + 1) * tangent1.x + (-t2 + time) * 6 * value2.x + (3 * t2 - 2 * time) * tangent2.x;
    result.y = (t2 - time) * 6 * value1.y + (3 * t2 - 4 * time + 1) * tangent1.y + (-t2 + time) * 6 * value2.y + (3 * t2 - 2 * time) * tangent2.y;
    result.z = (t2 - time) * 6 * value1.z + (3 * t2 - 4 * time + 1) * tangent1.z + (-t2 + time) * 6 * value2.z + (3 * t2 - 2 * time) * tangent2.z;
    return result;
}

/**
 * Interpolates between two IVector3Like using Hermite interpolation and stores the result.
 * @param value1 - first control point
 * @param tangent1 - first tangent
 * @param value2 - second control point
 * @param tangent2 - second tangent
 * @param amount - interpolant (0..1)
 * @param result - vector to store the result
 * @returns result
 */
export function Vector3HermiteToRef<T extends IVector3Like>(
    value1: DeepImmutable<IVector3Like>,
    tangent1: DeepImmutable<IVector3Like>,
    value2: DeepImmutable<IVector3Like>,
    tangent2: DeepImmutable<IVector3Like>,
    amount: number,
    result: T
): T {
    const squared = amount * amount;
    const cubed = squared * amount;
    const part1 = 2.0 * cubed - 3.0 * squared + 1.0;
    const part2 = -2.0 * cubed + 3.0 * squared;
    const part3 = cubed - 2.0 * squared + amount;
    const part4 = cubed - squared;

    result.x = value1.x * part1 + value2.x * part2 + tangent1.x * part3 + tangent2.x * part4;
    result.y = value1.y * part1 + value2.y * part2 + tangent1.y * part3 + tangent2.y * part4;
    result.z = value1.z * part1 + value2.z * part2 + tangent1.z * part3 + tangent2.z * part4;
    return result;
}

/**
 * Returns true if each component of the two IVector3Like objects are within epsilon of each other.
 * @param left - first operand
 * @param right - second operand
 * @param epsilon - tolerance (default: very small)
 * @returns true if approximately equal
 */
export function Vector3EqualsWithEpsilon(left: DeepImmutable<IVector3Like>, right: DeepImmutable<IVector3Like>, epsilon: number = 1.401298e-45): boolean {
    return Math.abs(left.x - right.x) <= epsilon && Math.abs(left.y - right.y) <= epsilon && Math.abs(left.z - right.z) <= epsilon;
}

// ── Vector4 arithmetic ──────────────────────────────────────────────────────

/**
 * Adds two IVector4Like objects component-wise and stores the result.
 * @param a - first operand
 * @param b - second operand
 * @param result - vector to store the result
 * @returns result
 */
export function Vector4AddToRef<T extends IVector4Like>(a: DeepImmutable<IVector4Like>, b: DeepImmutable<IVector4Like>, result: T): T {
    result.x = a.x + b.x;
    result.y = a.y + b.y;
    result.z = a.z + b.z;
    result.w = a.w + b.w;
    return result;
}

/**
 * Subtracts two IVector4Like objects component-wise and stores the result.
 * @param a - first operand (minuend)
 * @param b - second operand (subtrahend)
 * @param result - vector to store the result
 * @returns result
 */
export function Vector4SubtractToRef<T extends IVector4Like>(a: DeepImmutable<IVector4Like>, b: DeepImmutable<IVector4Like>, result: T): T {
    result.x = a.x - b.x;
    result.y = a.y - b.y;
    result.z = a.z - b.z;
    result.w = a.w - b.w;
    return result;
}

/**
 * Scales an IVector4Like and stores the result.
 * @param a - vector to scale
 * @param scale - scale factor
 * @param result - vector to store the result
 * @returns result
 */
export function Vector4ScaleToRef<T extends IVector4Like>(a: DeepImmutable<IVector4Like>, scale: number, result: T): T {
    result.x = a.x * scale;
    result.y = a.y * scale;
    result.z = a.z * scale;
    result.w = a.w * scale;
    return result;
}

/**
 * Normalizes an IVector4Like and stores the result.
 * @param vector - the vector to normalize
 * @param result - vector to store the result
 * @returns result
 */
export function Vector4NormalizeToRef<T extends IVector4Like>(vector: DeepImmutable<IVector4Like>, result: T): T {
    const len = Math.sqrt(Vector4Dot(vector, vector));
    if (len === 0) {
        result.x = 0;
        result.y = 0;
        result.z = 0;
        result.w = 0;
    } else {
        const inv = 1.0 / len;
        result.x = vector.x * inv;
        result.y = vector.y * inv;
        result.z = vector.z * inv;
        result.w = vector.w * inv;
    }
    return result;
}

/**
 * Linearly interpolates between two IVector4Like and stores the result.
 * @param start - start value
 * @param end - end value
 * @param amount - interpolant (0..1)
 * @param result - vector to store the result
 * @returns result
 */
export function Vector4LerpToRef<T extends IVector4Like>(start: DeepImmutable<IVector4Like>, end: DeepImmutable<IVector4Like>, amount: number, result: T): T {
    result.x = start.x + (end.x - start.x) * amount;
    result.y = start.y + (end.y - start.y) * amount;
    result.z = start.z + (end.z - start.z) * amount;
    result.w = start.w + (end.w - start.w) * amount;
    return result;
}

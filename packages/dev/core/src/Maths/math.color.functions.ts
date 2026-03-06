import type { DeepImmutable } from "../types";
import type { IColor3Like, IColor4Like } from "./math.like";
import { ToGammaSpace, ToLinearSpace } from "./math.constants";

export { Color3LerpToRef, Color3HSVtoRGBToRef, Color4LerpToRef } from "./math.color.pure";

// ── sRGB ↔ linear helpers ───────────────────────────────────────────────────

function channelToLinearApprox(c: number): number {
    return Math.pow(c, ToLinearSpace);
}

function channelToLinearExact(c: number): number {
    return c <= 0.04045 ? 0.0773993808 * c : Math.pow(0.947867299 * (c + 0.055), 2.4);
}

function channelToGammaApprox(c: number): number {
    return Math.pow(c, ToGammaSpace);
}

function channelToGammaExact(c: number): number {
    return c <= 0.0031308 ? 12.92 * c : 1.055 * Math.pow(c, 0.41666) - 0.055;
}

// ── Color3 free functions ───────────────────────────────────────────────────

/**
 * Converts an IColor3Like from sRGB to linear space and stores the result.
 * @param color - the sRGB color
 * @param result - color to store the linear result
 * @param exact - if true, uses the exact IEC 61966-2-1 formula (slower but more accurate)
 * @returns result
 */
export function Color3ToLinearSpaceToRef<T extends IColor3Like>(color: DeepImmutable<IColor3Like>, result: T, exact = false): T {
    const fn = exact ? channelToLinearExact : channelToLinearApprox;
    result.r = fn(color.r);
    result.g = fn(color.g);
    result.b = fn(color.b);
    return result;
}

/**
 * Converts an IColor3Like from linear to sRGB (gamma) space and stores the result.
 * @param color - the linear color
 * @param result - color to store the gamma result
 * @param exact - if true, uses the exact IEC 61966-2-1 formula (slower but more accurate)
 * @returns result
 */
export function Color3ToGammaSpaceToRef<T extends IColor3Like>(color: DeepImmutable<IColor3Like>, result: T, exact = false): T {
    const fn = exact ? channelToGammaExact : channelToGammaApprox;
    result.r = fn(color.r);
    result.g = fn(color.g);
    result.b = fn(color.b);
    return result;
}

/**
 * Returns true if each component of two IColor3Like objects are within epsilon of each other.
 * @param left - first color
 * @param right - second color
 * @param epsilon - tolerance (default: very small)
 * @returns true if approximately equal
 */
export function Color3EqualsWithEpsilon(left: DeepImmutable<IColor3Like>, right: DeepImmutable<IColor3Like>, epsilon: number = 1.401298e-45): boolean {
    return Math.abs(left.r - right.r) <= epsilon && Math.abs(left.g - right.g) <= epsilon && Math.abs(left.b - right.b) <= epsilon;
}

// ── Color4 free functions ───────────────────────────────────────────────────

/**
 * Converts an IColor4Like from sRGB to linear space and stores the result.
 * Alpha is copied as-is.
 * @param color - the sRGB color
 * @param result - color to store the linear result
 * @param exact - if true, uses the exact IEC 61966-2-1 formula (slower but more accurate)
 * @returns result
 */
export function Color4ToLinearSpaceToRef<T extends IColor4Like>(color: DeepImmutable<IColor4Like>, result: T, exact = false): T {
    const fn = exact ? channelToLinearExact : channelToLinearApprox;
    result.r = fn(color.r);
    result.g = fn(color.g);
    result.b = fn(color.b);
    result.a = color.a;
    return result;
}

/**
 * Converts an IColor4Like from linear to sRGB (gamma) space and stores the result.
 * Alpha is copied as-is.
 * @param color - the linear color
 * @param result - color to store the gamma result
 * @param exact - if true, uses the exact IEC 61966-2-1 formula (slower but more accurate)
 * @returns result
 */
export function Color4ToGammaSpaceToRef<T extends IColor4Like>(color: DeepImmutable<IColor4Like>, result: T, exact = false): T {
    const fn = exact ? channelToGammaExact : channelToGammaApprox;
    result.r = fn(color.r);
    result.g = fn(color.g);
    result.b = fn(color.b);
    result.a = color.a;
    return result;
}

/**
 * Returns true if each component of two IColor4Like objects are within epsilon of each other.
 * @param left - first color
 * @param right - second color
 * @param epsilon - tolerance (default: very small)
 * @returns true if approximately equal
 */
export function Color4EqualsWithEpsilon(left: DeepImmutable<IColor4Like>, right: DeepImmutable<IColor4Like>, epsilon: number = 1.401298e-45): boolean {
    return Math.abs(left.r - right.r) <= epsilon && Math.abs(left.g - right.g) <= epsilon && Math.abs(left.b - right.b) <= epsilon && Math.abs(left.a - right.a) <= epsilon;
}

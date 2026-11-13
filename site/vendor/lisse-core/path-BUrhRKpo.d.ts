/** Corner curve family. Default: `'squircle'` (the Figma curve). */
type CurveType = "arc" | "squircle" | "superellipse" | "clothoid";
/** Configuration for a single corner. */
interface CornerConfig {
    radius: number;
    /** Curve family. Default: `'squircle'`. */
    curve?: CurveType;
    /** 0 (sharp) to 1 (max). Used by `'squircle'` and `'clothoid'`;
     *  ignored by `'arc'` and `'superellipse'`. Default: `0.65`
     *  (`APPLE_SMOOTHING`); Figma's "iOS" preset is `0.6`
     *  (`FIGMA_SMOOTHING`). */
    smoothing?: number;
    /** Superellipse exponent, only when `curve === 'superellipse'`.
     *  Default: `4` (matches CSS `corner-shape: squircle`). */
    exponent?: number;
    /** Preserve smoothing when space is limited. Default: `true`. */
    preserveSmoothing?: boolean;
}
/** Per-corner configuration. Each corner can be a CornerConfig or a number (radius shorthand). */
interface PerCornerConfig {
    topLeft?: CornerConfig | number;
    topRight?: CornerConfig | number;
    bottomRight?: CornerConfig | number;
    bottomLeft?: CornerConfig | number;
}
/** Uniform corner options — all corners share the same values.
 *  Alias for {@link CornerConfig} so {@link SmoothCornerOptions} reads as
 *  `uniform | per-corner` at the call site. */
type UniformCornerOptions = CornerConfig;
/** Options for generating a smooth-cornered path. */
type SmoothCornerOptions = UniformCornerOptions | PerCornerConfig;
/** Squircle-only resolved parameters (`a, b, c, d, p, arcSectionLength`).
 *  Implementation detail of the Figma squircle curve — not meaningful
 *  for arc / superellipse / clothoid. New code should treat this as
 *  the return shape of `getPathParamsForCorner` rather than
 *  constructing it directly. */
interface CornerPathParams {
    a: number;
    b: number;
    c: number;
    d: number;
    p: number;
    cornerRadius: number;
    arcSectionLength: number;
}
/** Input parameters for computing a corner's path arcs. */
interface CornerParams {
    cornerRadius: number;
    cornerSmoothing: number;
    preserveSmoothing: boolean;
    roundingAndSmoothingBudget: number;
}
/** A corner after radius distribution with its available budget. */
interface NormalizedCorner {
    radius: number;
    roundingAndSmoothingBudget: number;
}
/** All four corners after radius distribution. */
interface NormalizedCorners {
    topLeft: NormalizedCorner;
    topRight: NormalizedCorner;
    bottomLeft: NormalizedCorner;
    bottomRight: NormalizedCorner;
}
/** A rectangle with per-corner radii, used as input for radius distribution. */
interface RoundedRectangle {
    topLeftCornerRadius: number;
    topRightCornerRadius: number;
    bottomRightCornerRadius: number;
    bottomLeftCornerRadius: number;
    width: number;
    height: number;
}
/** A single color stop within a gradient. */
interface GradientStop {
    offset: number;
    color: string;
    opacity?: number;
}
/** Linear gradient configuration. */
interface LinearGradientConfig {
    type: "linear";
    angle?: number;
    stops: GradientStop[];
}
/** Radial gradient configuration. */
interface RadialGradientConfig {
    type: "radial";
    cx?: number;
    cy?: number;
    r?: number;
    stops: GradientStop[];
}
/** A gradient configuration — either linear or radial. */
type GradientConfig = LinearGradientConfig | RadialGradientConfig;
/** Supported border style values for SVG rendering. */
type BorderStyle = "solid" | "dashed" | "dotted" | "double" | "groove" | "ridge";
/** Configuration for an inner or outer border stroke. */
interface BorderConfig {
    width: number;
    color: string | GradientConfig;
    opacity: number;
    style?: BorderStyle;
    /** Custom dash length for dashed/dotted styles. */
    dash?: number;
    /** Custom gap length for dashed/dotted styles. */
    gap?: number;
    /** Line cap for dashed/dotted strokes. Default: "butt" for dashed, "round" for dotted. */
    lineCap?: "butt" | "round" | "square";
}
/** Configuration for an inner or drop shadow effect. */
interface ShadowConfig {
    offsetX: number;
    offsetY: number;
    blur: number;
    spread: number;
    color: string;
    opacity: number;
}
/** Combined configuration for all visual effects applied to a smooth-cornered element. */
interface EffectsConfig {
    innerBorder?: BorderConfig;
    outerBorder?: BorderConfig;
    middleBorder?: BorderConfig;
    innerShadow?: ShadowConfig | ShadowConfig[];
    shadow?: ShadowConfig | ShadowConfig[];
}

/** Closest Figma-curve match to Apple continuous corners (≈0.5 px residual at R=100). */
declare const APPLE_SMOOTHING = 0.65;
/** Figma's labeled "iOS" preset — use for design-handoff parity. */
declare const FIGMA_SMOOTHING = 0.6;
/** Default smoothing — same value as `APPLE_SMOOTHING`. Use `FIGMA_SMOOTHING` for Figma's 60% preset. */
declare const DEFAULT_SMOOTHING = 0.65;
declare const DEFAULT_PRESERVE_SMOOTHING = true;
declare const DEFAULT_CURVE: CurveType;
/** SVG path `d` string for a smooth-cornered rectangle. */
declare function generatePath(width: number, height: number, options: SmoothCornerOptions): string;
/** CSS `clip-path: path(...)` value for a smooth-cornered rectangle. */
declare function generateClipPath(width: number, height: number, options: SmoothCornerOptions): string;

/**
 * Compute bezier curve parameters for a single corner.
 *
 * Based on Figma's squircle blog post and MartinRGB's approximation:
 * https://www.figma.com/blog/desperately-seeking-squircles/
 * https://github.com/MartinRGB/Figma_Squircles_Approximation
 */
declare function getPathParamsForCorner({ cornerRadius, cornerSmoothing, preserveSmoothing, roundingAndSmoothingBudget, }: CornerParams): CornerPathParams;

/**
 * Distribute available space among corners, normalizing radii so they
 * don't exceed the rectangle dimensions. Larger corners get priority.
 *
 * Allocation-free: no `Object.entries`, no `.sort`, no `.map`, and no
 * per-call closures. The stable "bigger corner chooses first" ordering
 * (ties broken by TL → TR → BL → BR insertion order) is reproduced with
 * explicit rank comparisons; a uniform equal-radius input resolves through
 * a closed-form fast path.
 */
declare function distributeAndNormalize({ topLeftCornerRadius: OTL, topRightCornerRadius: OTR, bottomRightCornerRadius: OBR, bottomLeftCornerRadius: OBL, width, height, }: RoundedRectangle): NormalizedCorners;

/** Target's border box relative to its anchor's padding box, in CSS px. */
interface OverlayOffset {
    x: number;
    y: number;
}
/** A ShadowConfig with all values zeroed — no visible shadow. */
declare const DEFAULT_SHADOW: ShadowConfig;
/**
 * Best-effort CSS `border-radius` matching the per-corner radii. The SSR
 * fallback and the box-shadow sibling both derive their rounding from this.
 */
declare function cornerOptionsToBorderRadius(options: SmoothCornerOptions): string;

/**
 * Corner orientation in clockwise traversal. Builders write one canonical
 * (entry → exit) curve, rotated to each corner via `orient`.
 */
type Orient = "TR" | "BR" | "BL" | "TL";
/**
 * Both `cornerRadius` and `roundingAndSmoothingBudget` are post-distribute:
 * the radius is already clamped to the rectangle, the budget is how much of
 * the adjacent edge this corner may consume.
 */
interface CurveBuilderInput {
    cornerRadius: number;
    smoothing: number;
    exponent: number;
    preserveSmoothing: boolean;
    roundingAndSmoothingBudget: number;
}
/**
 * `p` is the tangency distance from the sharp vertex — where the curve
 * starts along each adjacent edge; the stitcher uses it to place the
 * straight `L` between corners. `pathSegment(orient)` returns relative SVG
 * commands, entering at the pen and exiting at the opposite tangency point.
 */
interface CurveBuilderOutput {
    p: number;
    pathSegment: (orient: Orient) => string;
}
type CurveBuilder = (input: CurveBuilderInput) => CurveBuilderOutput;

/**
 * Plain quarter-circle corner via native SVG `a` — the CSS `border-radius`
 * curve and the smoothing → 0 fallback. G1 with the adjacent edges.
 */
declare const buildArc: CurveBuilder;

/**
 * Figma squircle — cubic shoulder + central arc + cubic shoulder. G1
 * with the adjacent edges (curvature steps at the cubic↔arc seams).
 *
 * The four per-orient arms stay hand-written rather than going through the
 * shared `cubic` emitter: their literal `0` characters (e.g. `c ${a} 0 …`)
 * print as `0`, not `0.0000`, and routing them through a formatter would
 * round those literals and diff every downstream snapshot despite identical
 * visuals.
 */
declare const buildSquircle: CurveBuilder;

/**
 * Superellipse corner. `|X/p|^n + |Y'/p|^n = 1` reflected into the
 * corner, running (0, 0) → (p, p). For n > 2 curvature is exactly 0 at
 * the axis crossings, so the curve is G2-flat with the adjacent edges.
 * n = 2 is a quarter circle; n = 4 is what CSS `corner-shape: squircle`
 * resolves to.
 *
 * Parametric form (X along entry edge toward the sharp vertex, Y into
 * the interior):
 *     X(θ) = p · sin^(2/n)(θ),  Y(θ) = p · (1 − cos^(2/n)(θ))
 * Endpoint tangents: (1, 0) at θ = 0, (0, 1) at θ = π/2; interior
 * tangents are the analytic parametric derivative, normalised.
 *
 * Three cubic Béziers per quadrant, sampled at θ ∈ {0, π/6, π/3, π/2}.
 * Each cubic uses the midpoint-match scheme: endpoint position + tangent
 * (4 constraints) plus the parameter midpoint (2). Hausdorff error is
 * well sub-pixel for n ∈ [2, 4] at Lisse-realistic radii; degrades to
 * ~5% of corner footprint for n ∈ (4, 8] as the Lamé shape sharpens.
 * Reference-shape tests pin the actual tolerances per exponent.
 */
declare const buildSuperellipse: CurveBuilder;

/**
 * Clothoid blend: line → clothoid → arc → clothoid → line. Curvature
 * ramps linearly along arc length from 0 (edge) to 1/R (central arc)
 * and mirrors on the way out. G2 at every seam.
 *
 * Smoothing s ∈ [0, 1] splits the 90° rotation: each clothoid half
 * rotates (π/4)·s, the arc rotates (π/2)(1 − s). s = 0 is a quarter
 * circle; s = 1 is the pure Cornu corner. One cubic Bézier per
 * half-fillet + one native SVG `a` for the arc.
 */
declare const buildClothoid: CurveBuilder;

/** Default superellipse exponent. Matches CSS `corner-shape: squircle` (Lamé n = 4). */
declare const DEFAULT_EXPONENT = 4;
/** Registered curve types — iterate this rather than the union literal. */
declare const CURVE_TYPES: readonly CurveType[];
declare function getCurveBuilder(type: CurveType): CurveBuilder;

export { APPLE_SMOOTHING as A, type BorderConfig as B, CURVE_TYPES as C, DEFAULT_CURVE as D, type EffectsConfig as E, FIGMA_SMOOTHING as F, type GradientConfig as G, type LinearGradientConfig as L, type NormalizedCorner as N, type OverlayOffset as O, type PerCornerConfig as P, type RadialGradientConfig as R, type SmoothCornerOptions as S, type UniformCornerOptions as U, type ShadowConfig as a, type BorderStyle as b, type CornerConfig as c, type CornerParams as d, type CornerPathParams as e, type CurveBuilder as f, type CurveBuilderInput as g, type CurveBuilderOutput as h, type CurveType as i, DEFAULT_EXPONENT as j, DEFAULT_PRESERVE_SMOOTHING as k, DEFAULT_SHADOW as l, DEFAULT_SMOOTHING as m, type GradientStop as n, type NormalizedCorners as o, type Orient as p, buildArc as q, buildClothoid as r, buildSquircle as s, buildSuperellipse as t, cornerOptionsToBorderRadius as u, distributeAndNormalize as v, generateClipPath as w, generatePath as x, getCurveBuilder as y, getPathParamsForCorner as z };

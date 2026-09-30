/**
 * Point or vector in pixels. Components of positions and velocities have this shape, so they are passed as is.
 */
export interface Vector {
  x: number;
  y: number;
}

export interface Size {
  readonly width: number;
  readonly height: number;
}

export function distanceSquared(a: Readonly<Vector>, b: Readonly<Vector>): number {
  return (a.x - b.x) ** 2 + (a.y - b.y) ** 2;
}

export function distance(a: Readonly<Vector>, b: Readonly<Vector>): number {
  return Math.sqrt(distanceSquared(a, b));
}

/**
 * Returns a value indicating whether the points are not further from each other than the radius.
 * It compares squares of distances, so it doesn't calculate a square root.
 */
export function isWithin(a: Readonly<Vector>, b: Readonly<Vector>, radius: number): boolean {
  return distanceSquared(a, b) <= radius * radius;
}

/**
 * Returns the direction from one point to another in radians, 0 points to the right
 */
export function angleTo(from: Readonly<Vector>, to: Readonly<Vector>): number {
  return Math.atan2(to.y - from.y, to.x - from.x);
}

/**
 * Moves the point towards the target, but not further than the target
 * @returns The part of the step left after the target has been reached, or undefined if it hasn't been reached
 */
export function moveTowards(point: Vector, target: Readonly<Vector>, step: number): number | undefined {
  const left = distance(point, target);
  if (left <= step) {
    point.x = target.x;
    point.y = target.y;
    return step - left;
  }
  point.x += ((target.x - point.x) / left) * step;
  point.y += ((target.y - point.y) / left) * step;
  return undefined;
}

/**
 * Returns a value indicating whether the point is inside the area from (0, 0) to the size, extended by the margin
 * on every side
 */
export function isInside({x, y}: Readonly<Vector>, {width, height}: Size, margin: number = 0): boolean {
  return x >= -margin && y >= -margin && x < width + margin && y < height + margin;
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/**
 * Wraps the value around the range from 0 to the size, like objects leaving one edge of the screen and appearing
 * at the opposite one
 */
export function wrap(value: number, size: number): number {
  return ((value % size) + size) % size;
}

/**
 * Returns the shortest difference from one value to another on a range, that wraps around the size
 */
export function wrappedDifference(from: number, to: number, size: number): number {
  return wrap(to - from + size / 2, size) - size / 2;
}

/**
 * Returns the difference of angles normalized to the range from -PI to PI, the shortest turn from one angle to another
 */
export function angleDifference(from: number, to: number): number {
  return Math.atan2(Math.sin(to - from), Math.cos(to - from));
}

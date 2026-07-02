import type { Coord } from "./types";

export const DIRECTIONS: ReadonlyArray<readonly [number, number]> = [
  [1, 0],
  [1, -1],
  [0, -1],
  [-1, 0],
  [-1, 1],
  [0, 1]
];

export function keyOf(coord: Coord): string {
  return `${coord.q},${coord.r}`;
}

export function parseKey(key: string): Coord {
  const [q, r] = key.split(",").map(Number);
  return { q, r };
}

export function neighborsOf(coord: Coord): Coord[] {
  return DIRECTIONS.map(([dq, dr]) => ({ q: coord.q + dq, r: coord.r + dr }));
}

export function distance(a: Coord, b: Coord): number {
  return (Math.abs(a.q - b.q) + Math.abs(a.q + a.r - b.q - b.r) + Math.abs(a.r - b.r)) / 2;
}

export function edgeKey(a: Coord, b: Coord): string {
  const ak = keyOf(a);
  const bk = keyOf(b);
  return ak < bk ? `${ak}|${bk}` : `${bk}|${ak}`;
}

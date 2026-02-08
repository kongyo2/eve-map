// EVE coordinates are in the range of ~10^17
// Normalize to a workable range for canvas rendering
// Use x and z axes for 2D projection (top-down view)
const SCALE_FACTOR = 1e16;

export const normalizeEveCoordinate = (coord: number): number => coord / SCALE_FACTOR;

export const normalizePosition = (x: number, z: number): { nx: number; nz: number } => ({
  nx: normalizeEveCoordinate(x),
  nz: normalizeEveCoordinate(z),
});

export const screenToWorld = (
  screenX: number,
  screenY: number,
  panX: number,
  panY: number,
  scale: number,
): { x: number; y: number } => ({
  x: (screenX - panX) / scale,
  y: (screenY - panY) / scale,
});

export const worldToScreen = (
  worldX: number,
  worldY: number,
  panX: number,
  panY: number,
  scale: number,
): { x: number; y: number } => ({
  x: worldX * scale + panX,
  y: worldY * scale + panY,
});

export const isInViewport = (
  worldX: number,
  worldY: number,
  left: number,
  right: number,
  top: number,
  bottom: number,
  margin: number,
): boolean =>
  worldX >= left - margin &&
  worldX <= right + margin &&
  worldY >= top - margin &&
  worldY <= bottom + margin;

export const distanceSquared = (x1: number, y1: number, x2: number, y2: number): number =>
  (x1 - x2) ** 2 + (y1 - y2) ** 2;

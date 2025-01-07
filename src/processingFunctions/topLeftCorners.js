import { calculateGrowthFactorCannon, calculateGrowthFactorHeight } from "./calculateGrowthFactor";
import { findPivotGlobalCoords } from "./findPivotGlobalCoords";


// gets the top left corner when cannon is at rotational position 0 degrees
export function findCannonTopLeftGlobalCoords(canvas, USER_ANCHOR_POINT, cannonInfo) {
  const [piv_x, piv_y] = findPivotGlobalCoords(canvas, USER_ANCHOR_POINT);
  return [
    piv_x - cannonInfo.pivot_x * calculateGrowthFactorCannon(cannonInfo),
    piv_y - cannonInfo.pivot_y * calculateGrowthFactorCannon(cannonInfo)
  ];
}

export function topLeftCornerVelocityBar(cannonPosition, canvas) {
  const pos_x = cannonPosition[0];
  const pos_y = cannonPosition[1] + 0.18 * canvas.height;
  return [pos_x, pos_y]
}

export function topLeftCornerHeightScale(cannonPosition, canvas) {
  const growthFactor = calculateGrowthFactorHeight(canvas);

  const pos_x = cannonPosition[0] - 0.1 * canvas.width;
  const pos_y = 0.1 * canvas.height - 23 * growthFactor; // 23 pixels is the number of pixels that the actual start of the 
  return [pos_x, pos_y]
}
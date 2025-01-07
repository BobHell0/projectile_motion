export function calculateGrowthFactorCannon(cannonInfo) {
  // LOGIC: say we want the cannon to be ~1/10 of the canvas width
  // Then get the total width of the canvas
  // get the width of the cannon

  // cannonWidth * growthFactor = 1/10 * canvasWidth
  // growthFactor = ( 1/10 * canvasWidth ) / cannonWidth

  // requires cannon_width != 0

  const FRACTION_OF_SCREEN = 1/3;

  return (FRACTION_OF_SCREEN * window.innerWidth) / cannonInfo.pixel_width
}

export function calclateGrowthFactorVelocity(canvas) {
  const FRACTION_OF_CANVAS = 1/10;
  return (FRACTION_OF_CANVAS * canvas.width) / 817 // 817 is the velocityBar_pixel_width
}
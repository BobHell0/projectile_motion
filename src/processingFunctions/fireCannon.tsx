import { calculateConversionRate } from "./calculateConversionRate.tsx";
import { drawCircle } from "./drawingFunctions.tsx";
import { findPivotGlobalCoords } from "./findPivotGlobalCoords.tsx";

// needs canvas, user anchor point, launch vel, elevation angle, ground level scalar   
export function fireCannon(
    canvas: any, 
    USER_ANCHOR_POINT: number[], 
    launchVelocity: number, 
    elevationAngle: number, 
    GROUND_LEVEL_SCALAR: number, 
    MAX_HORIZONTAL_RANGE: number,
    width: number
) {

    const ctx = canvas.getContext('2d');
    var reqNum: number;
    try {
      if (canvas) {
        const [initial_x, initial_y] 
          = findPivotGlobalCoords(canvas, USER_ANCHOR_POINT)

        const conversionRate = calculateConversionRate(canvas, USER_ANCHOR_POINT, MAX_HORIZONTAL_RANGE);

        const accel = 9.8 * conversionRate;          // TODO: acceleration could become a state variable if we move to different planets
        const initial_v =  launchVelocity * conversionRate;
        var x = initial_x;
        var y = initial_y;
        var currTime = 0;
        const angle_rad = elevationAngle * (Math.PI / 180);


        function trackProjectile() {      
          x = initial_x + initial_v * Math.cos(angle_rad) * currTime;                 
          y = initial_y
            - (initial_v * Math.sin(angle_rad) * currTime) 
            + (1/2 * accel * currTime ** 2);            

          currTime += 0.04; // something to experiment with
          canvas.parentNode.scrollTo({
            top: 0,
            left: (x) / window.devicePixelRatio - width / 2,
            behavior: "instant"
          });
          
          drawCircle(ctx, x, y, 5, "blue", "black");
          if (initial_y
            - (initial_v * Math.sin(angle_rad) * currTime) 
            + (1/2 * accel * currTime ** 2)  <= GROUND_LEVEL_SCALAR * canvas.height) {
            reqNum = requestAnimationFrame(trackProjectile);
          } else {
            cancelAnimationFrame(reqNum);
          }
        }
        reqNum = requestAnimationFrame(trackProjectile);

      }

    } catch (e: unknown) {
      if (e instanceof Error) {
        console.error(e.message);
      }
    }
  }

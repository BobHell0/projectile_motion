// Big shout out to Chris Courses 
// https://www.youtube.com/watch?v=EO6OkltgudE&t=213s

var canvas = document.querySelector('canvas');

canvas.style.width = window.innerWidth * 3/4 + "px";
canvas.style.height = window.innerHeight * 3/4 + "px";
var ctx = canvas.getContext("2d"); // passing a ton of methods through ctx; it's a magic paintbrush


const canvasInfo = document.getElementById("canvas").getBoundingClientRect();
var scale = window.devicePixelRatio;

console.log(canvas.style.width);

canvas.width = Math.floor(canvas.style.height * scale);
canvas.height = Math.floor(canvas.style.height * scale);

ctx.scale(scale, scale);

console.log(`CanvasWidth = ${canvas.width}`);
console.log(`CanvasHeight = ${canvas.height}`);


// https://www.youtube.com/watch?v=dyzAyDByfvY&t=57s : Potentially a (relatively hardcode-y) way of fixing the resolution issues.

////////////////////////////////////////////////////////////////////////////////

// CONSTANTS

// this value basically sets everything else:
const ROTATION_POINT_RADIUS = 20;
const CANNON_BORDER_THICKNESS = 10;

// Length : Height = 4 : 1 
const CANNON_HEIGHT = ROTATION_POINT_RADIUS; 
const CANNON_HEIGHT_W_BORDERS = CANNON_HEIGHT + CANNON_BORDER_THICKNESS;
const CANNON_LENGTH = CANNON_HEIGHT * 4;
const CANNON_LENGTH_W_BORDERS = CANNON_LENGTH + CANNON_BORDER_THICKNESS
    


const CANNON_BALL_RADIUS = CANNON_HEIGHT / 2;

const CANNON_PIVOT_X = ROTATION_POINT_RADIUS + 50;
const GROUND_Y_COORD = canvas.height * (7/8);
const GROUND_COLOUR = '#00ad14'
const SKY_COLOUR = '#00aaff'
const ROTATION_POINT_COLOUR = '#6b423f'
const CANNON_COLOUR = '#333333'

////////////////////////////////////////////////////////////////////////////////

// starts at 60 and will change depending on user input:

var currLaunchAngle = 0; // (degs)
var cannonCoords;

/////////////////////////////////////////////////////////////////////////////////
// User behaviour
var userClick_x;
var userClick_y;
var scalarFactorOfCannonLength; // (lambda value of userClicksCannon
var scalarFactorOfCannonWidth; // (mu value of userClicksCannon)

var userDrag_x;
var userDrag_y;


var userCurr_x;
var userCurr_y;

var draggingCannon = false;

////////////////////////////////////////////////////////////////////////////////

/**
 * Converting an angle in degrees into an angle in radians
 * @param {number} angle angle (in degrees) to convert into radians
 * @returns {number} the angle in radians
 */
const degreesToRadians = (angle) => {
    return angle * Math.PI / 180;
}

/**
 * Converts an angle that is in degrees into the equivalent angle in raidans.
 * @param {number} angle the angle in radians.
 * @returns {number} the angle in degrees
 */
const radiansToDegrees = (angle) => {
  return angle * 180 / Math.PI;
}

/**
 * Draws the barrel and pivot of the cannon. 
 * @param {number} angle - launch angle
 * @param {number} x_start - the x-coordinate of the bottom-most corner of the 
 * cannon barrel
 * @param {number} y_start  - the x-coordinate of the bottom-most corner of the 
 * cannon barrel
 * @returns {Object} with the following key-value pairs:
 * - frontCoord_1: Coordinate (x1, y1)
 * - frontCoord_2: Coordinate (x2, y2)
 * - backCoord_1: Coordinate (x3, y3)
 * Note that (x_start, y_start) is the same coordinate as the centre of the pivot
 * Diagram of cannon barrel:
      (x2, y2) _____ (x1, y1)
              /    / 
             /    /    
            /    /   
           /    /
           -----
      (x3, y3)   (x_start, y_start)
*/
const drawCannon = (angle, x_start, y_start) => {

  if (angle > 90) {
    angle = 90;
    currLaunchAngle = angle;
  } else if (angle < 0) {
    angle = 0;
    currLaunchAngle = angle;
  }
  const angleRadians = degreesToRadians(angle);

  ctx.beginPath();
  ctx.moveTo(x_start, y_start);
  
  const x1 = x_start + CANNON_LENGTH * Math.cos(angleRadians);
  const y1 = y_start - CANNON_LENGTH * Math.sin(angleRadians);
  ctx.lineTo(x1, y1);
  ctx.stroke();

  const x2 = x1 - CANNON_HEIGHT * Math.sin(angleRadians);
  const y2 = y1 - CANNON_HEIGHT * Math.cos(angleRadians);
  ctx.lineTo(x2, y2);
  ctx.stroke();

  const x3 = x2 - CANNON_LENGTH * Math.cos(angleRadians);
  const y3 = y2 + CANNON_LENGTH * Math.sin(angleRadians);
  ctx.lineTo(x3, y3);
  ctx.stroke();

  ctx.lineTo(x_start, y_start);
  ctx.stroke();
  ctx.fillStyle = CANNON_COLOUR;    
  ctx.fill();
  ctx.closePath();

  // The math involved here is explained by 'FindingOuterCornersOfCannons' in 
  // MathematicalArguments.
  return {
    startCoord: [
      x_start + CANNON_BORDER_THICKNESS/2 * (Math.sin(angleRadians) - Math.cos(angleRadians)),
      y_start + CANNON_BORDER_THICKNESS/2 * (Math.sin(angleRadians) + Math.cos(angleRadians))
    ],
    frontCoord_1: [
      x1 + CANNON_BORDER_THICKNESS/2 * (Math.sin(angleRadians) + Math.cos(angleRadians)),
      y1 + CANNON_BORDER_THICKNESS/2 * (- Math.sin(angleRadians) + Math.cos(angleRadians))
    ],
    frontCoord_2: [
      x2 + CANNON_BORDER_THICKNESS/2 * (- Math.sin(angleRadians) + Math.cos(angleRadians)), 
      y2 + CANNON_BORDER_THICKNESS/2 * (- Math.sin(angleRadians) - Math.cos(angleRadians))
    ],
    backCoord_1: [
      x3 + CANNON_BORDER_THICKNESS/2 * (- Math.sin(angleRadians) - Math.cos(angleRadians)),
      y3 + CANNON_BORDER_THICKNESS/2 * (Math.sin(angleRadians) - Math.cos(angleRadians))
    ],
  }
}

/**
 * Draws the main objects of the setting - grass, sky and cannon.
 * @returns {Object} - the three coordinates that are returned in drawCannon.
 */
function drawSetting() {
  ctx.lineWidth = CANNON_BORDER_THICKNESS;
  // drawing grass
  ctx.beginPath();
  ctx.rect(0, GROUND_Y_COORD, canvas.width, canvas.height - GROUND_Y_COORD);
  ctx.strokeStyle = 'black';
  ctx.stroke();
  ctx.fillStyle = GROUND_COLOUR;
  ctx.fill();
  ctx.closePath();

  // drawing sky
  ctx.beginPath();
  ctx.rect(0, 0, canvas.width, GROUND_Y_COORD);
  ctx.stroke();
  ctx.fillStyle = SKY_COLOUR;
  ctx.fill();
  ctx.closePath();

  // Example cannon - change the first argument to change the angle (degrees),
  // keep the other two parameters fixed.
  const cannonCoords = 
    drawCannon(currLaunchAngle, CANNON_PIVOT_X, GROUND_Y_COORD);

  // drawing point of rotation - draw it after the cannon so that it appears in
  // front of the cannon
  ctx.beginPath();
  ctx.arc(CANNON_PIVOT_X, GROUND_Y_COORD, ROTATION_POINT_RADIUS, 0, Math.PI * 2, false);
  ctx.stroke();
  ctx.fillStyle = ROTATION_POINT_COLOUR;
  ctx.fill();
  ctx.closePath();

  return cannonCoords
}

cannonCoords = drawSetting();
console.log('Initial cannon Coords are:');
console.log(cannonCoords);

/**
 * Draws the initial cannon ball. Takes the midpoint of the mouth of the cannon
 * barrel to be the centre of the cannon ball.
 * @param {Object} cannonCoords - the three coordinates (x1, y1), (x2, y2) and
 * (x3, y3) as per the diagram in the drawCannon documentation.
 * @returns {Object} with the following key-value pairs: 
 * - ball_centre_x: the x-coordinate of the centre of the cannon ball in its 
 * initial position
 * - ball_centre_y: the y-coordinate of the centre of the cannon ball in its 
 * initial position
 */
function initialiseProjectile(cannonCoords) {
  const x1 = cannonCoords.frontCoord_1[0];
  const y1 = cannonCoords.frontCoord_1[1];

  const x2 = cannonCoords.frontCoord_2[0];
  const y2 = cannonCoords.frontCoord_2[1];

  const mid_x = (x1 + x2) / 2;
  const mid_y = (y1 + y2) / 2;

  ctx.beginPath();
  ctx.moveTo(mid_x, mid_y);
  ctx.arc(mid_x, mid_y, CANNON_BALL_RADIUS, 0, Math.PI * 2, false);
  ctx.stroke();
  ctx.fillStyle = 'black';
  ctx.fill();
  ctx.closePath();
  return {
    ball_centre_x: mid_x,
    ball_center_y: mid_y
  }
}

// const cannonCoords = drawSetting();
// On fire button click:
// const ball_centre = initialiseProjectile(cannonCoords);

// could find initial height above the ground using length of cannon and launch angle
// and then end the trajectory when the required negative displacement is reached.
// on fire button click:

function fullProjectileCycle() {
  const cannonCoords = drawSetting();
  const ball_centre = initialiseProjectile(cannonCoords);

  var t = 0;
  var x_start = ball_centre.ball_centre_x;;
  var x = x_start;
  var y_start = ball_centre.ball_center_y;
  var y = y_start;
  
  // hard coded for now:
  var init_angle = currLaunchAngle;
  var accel = 80;
  var init_speed = 200;
  var keepTracking = true;

  function trackProjectile() {

    if (!keepTracking) return;

    ctx.clearRect(0, 0, canvas.widthh, canvas.height);
    drawSetting();

    const angleRads = degreesToRadians(init_angle);

    if (y - (init_speed * Math.sin(angleRads) * t) + (1/2 * accel * t**2) < GROUND_Y_COORD) {    
      x = x_start + init_speed * Math.cos(angleRads) * t;                             // (1)
      y = 
        y_start - (init_speed * Math.sin(angleRads) * t) + (1/2 * accel * t**2);    // (2)
      t += 0.1;

      // redrawing the cannon ball in a new position
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.arc(x, y, CANNON_BALL_RADIUS, 0, Math.PI * 2, false);
      ctx.stroke();
      ctx.fillStyle = 'black';
      ctx.fill();
      ctx.closePath(); 
    } else {

      // Finding position of cannonball when it hits y = GROUND_Y_COORD.
      // solve for t by using equation (2) and then substitute the result 
      // into equation (1) to find the corresponding x coordinate.
      const a = 1/2 * accel
      const b = -init_speed * Math.sin(angleRads);
      const c = y_start - GROUND_Y_COORD;

      const tf = (-b + Math.sqrt(b ** 2 - 4 * a * c)) / (2 * a);
      x = x_start + init_speed * Math.cos(angleRads) * tf;  

      // drawing the final ball
      ctx.beginPath();
      ctx.moveTo(x, GROUND_Y_COORD);
      ctx.arc(x, GROUND_Y_COORD, CANNON_BALL_RADIUS, 0, Math.PI * 2, false);
      ctx.stroke();
      ctx.fillStyle = 'red';
      ctx.fill();
      ctx.closePath(); 
      keepTracking = false;
    }

    requestAnimationFrame(trackProjectile);
  }

  trackProjectile();
}

// the math behind this function can be found on the repo and wiki
function userClicksCannon() {
  // NOTE: These coordinates refer to the corners of the filled in part of the 
  // cannon, NOT the surrounding border. More intense is required for finding 
  // the corners of the cannon border.
  const x0 = cannonCoords.startCoord[0];
  const y0 = cannonCoords.startCoord[1];

  const x1 = cannonCoords.frontCoord_1[0];
  const y1 = cannonCoords.frontCoord_1[1];

  const x3 = cannonCoords.backCoord_1[0];
  const y3 = cannonCoords.backCoord_1[1];

  const C1 = userClick_x - x0;
  const X1 = x1 - x0;
  const X2 = x3 - x0;

  const C2 = userClick_y - y0;
  const Y1 = y1 - y0;
  const Y2 = y3 - y0;

  const mu = (C1 * Y1 - C2 * X1) / (X2 * Y1 - X1 * Y2);

  console.log(`mu = ${mu}`);
  // bug: when in the upright position, lambda is coming as Nan and Infinity :(
  // This is because in the upright position, X1 is 0 so there was some illegal 
  // dividing-by-zero shennagians occuring. But now I have this if-else check
  // so that I don't divide by zero.

  console.log(`X1 = ${X1}`);
  let lambda;
  if (X1 !== 0) {
    lambda = (C1 - X2 * mu) / X1;
  } else {
    lambda = (C2 - Y2 * mu) / Y1;
  }
  console.log(`lambda = ${lambda}`);

  
  if (mu >= 0 && mu <= 1 && lambda >= 0 && lambda <= 1) {
    scalarFactorOfCannonLength = lambda;
    scalarFactorOfCannonWidth = mu; 
    return true;
  }

  return false;

}

// What to do if the user clicks on the canvas:
document.getElementById("canvas").addEventListener("mousedown", (event) => {
  userClick_x = event.clientX - canvasInfo.left;
  userClick_y = event.clientY - canvasInfo.top;
  console.log(`Coords of user click = (${userClick_x}, ${userClick_y})`);
  if (userClicksCannon()) {
    console.log('User clicked the cannon');
    draggingCannon = true;
    
  } else {
    console.log('User did NOT clicked the cannon');
  }
});

// What to do when the user starts dragging 
document.getElementById("canvas").addEventListener("mousemove", (event) => {
  if (draggingCannon) {
    userDrag_x = event.clientX - canvasInfo.left;
    userDrag_y = event.clientY - canvasInfo.top;
    // function for figuring out the new launch angle.
    findNewLaunchAngle();
  }
});

// Math behind this code can be found on the repo and wiki.
function findNewLaunchAngle() {
  const A = {
    x: cannonCoords.startCoord[0],
    y: cannonCoords.startCoord[1]
  };
  console.log(`User clicked at ${userClick_x}, ${userClick_y}`)

  const C = {
    x: userDrag_x,
    y: userDrag_y
  }
  console.log(`Drag coords are (${C.x}, ${C.y})`);

  const AC = {
    x: C.x - A.x,
    y: C.y - A.y
  };
  console.log('Vec A is:')
  console.log(A)
  console.log('Vec AC is:')
  console.log(AC);
  const magAC = Math.sqrt(AC.x ** 2 + AC.y ** 2);
  const alpha = Math.asin((scalarFactorOfCannonWidth * (CANNON_HEIGHT_W_BORDERS)) / magAC);
  console.log(`alpha is ${alpha * 180/Math.PI}`);

  const magAE = magAC * Math.cos(alpha);
  const beta = Math.atan(Math.abs(AC.y) / Math.abs(AC.x));
  console.log(`beta is ${beta * 180/Math.PI}`)

  const e1 = magAE * Math.cos(beta - alpha) + A.x;
  const e2 = magAE * Math.sin(beta - alpha) + A.y;

  AE = {
    x: e1 - A.x,
    y: e2 - A.y
  }
  console.log('Vec AE is:')
  console.log(AE);
  D = {
    x: cannonCoords.frontCoord_1[0],
    y: cannonCoords.frontCoord_1[1]
  }
  console.log('Vec D is');
  console.log(D)
  AD = {
    x: D.x - A.x,
    y: D.y - A.y
  }
  console.log('Vec AD is:')
  console.log(AD);
  const magAD = Math.sqrt(AD.x ** 2 + AD.y ** 2)
  let thetaInRadians = Math.acos((AE.x * AD.x + AE.y * AD.y) / (magAE * magAD));
  // This resulting fraction would sometimes be 1.000000..002 because of how 
  // similar the top and bottom the fraction is. This as an input value for Math.acos()
  // causes a return of a NaN value. I am curious for what user 
  // behaviours you get this resulting behaviour. 

  // For now, if this NaN return behaviour occurs, I will assume the input of 
  // the acos was close to 1, so I will let thetaInRadians = 0 since 
  // acos(1) === 0;

  // a way of checking if a value is NaN
  if (thetaInRadians !== thetaInRadians) {
    // console.log('NaN Check was triggered');
    thetaInRadians = 0;
  }
  // this divding by 100 is an 'engineering' solution, not a mathematical one.
  // Take it out and see how the thing behaves.
  const theta = radiansToDegrees(thetaInRadians) / 50;

  // if you drag to the left, you are dragging up
  if (userDrag_x < userClick_x || (userDrag_x === userClick_x && userDrag_y < userClick_y)) {
    console.log('Need to drag up');
    currLaunchAngle += theta;
  } else {
    console.log('Need to drag down');
    currLaunchAngle -= theta;
  }

  console.log(`Calculated theta = ${theta}`);
  ctx.clearRect(0, 0, canvas.widthh, canvas.height);
  cannonCoords = drawSetting();
  console.log(`new currLaunchAngle value = ${currLaunchAngle}`);

  console.log(cannonCoords);

  // new bug: when in upright position, if I click and drag, it immediately 
  // makes launch angle = 0. :( Actually, upon further investigation, I think
  // dragging downwards in general (that is decreasing launch angle) is a bit
  // dodge. TBF, the main working out I did was for the case where you drag
  // upwards so it is possible that I completely shanked it.

  // Ok I just worked through it, it seems to be the same math so Idk.
  // Nvm the math changes a bit
  // Where I do beta - alpha, it will not always be like that, it depends on the 
  // case type. I believe if I am lowering the cannon, it might flip or smth.
  // Ok so the case is when you drag the cursor from a point within the cannon to
  // another point within the cannon. I think it only really happens when you are
  // in the upright position.

}

// What to do when the user unclicks the canvas
document.getElementById("canvas").addEventListener("mouseup", () => {
  draggingCannon = false;
})

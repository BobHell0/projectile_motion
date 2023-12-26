import { 
  drawSetting, 
  fullProjectileCycle,
  userClicksCannon,
  findNewLaunchAngle

} from "./canvasFunctions.js";

var canvas = document.querySelector('canvas');
export var ctx = canvas.getContext("2d");

window.devicePixelRatio = 2;

export const canvasWidth = window.innerWidth * 3/4;
export const canvasHeight = window.innerHeight * 3/4;
canvas.style.width = canvasWidth + "px";
canvas.style.height = canvasHeight + "px";

console.log(`Naive canvasWidth is ${canvasWidth}`);
console.log(`Naive canvasHeight is ${canvasHeight}`);

var scale = window.devicePixelRatio;

canvas.width = Math.floor(canvasWidth * scale);
canvas.height = Math.floor(canvasHeight * scale);
ctx.scale(scale, scale);
console.log(`Canvas width = ${canvas.width}`);
console.log(`Canvas height = ${canvas.height}`);

const canvasInfo = document.getElementById("canvas").getBoundingClientRect();



////////////////////////////////////////////////////////////////////////////////
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
// Iniital Drawing:
drawSetting();

// Clicking Fire Button:

const fireButton = document.getElementById('fireButton');
// const buttonWidth = 120;
// const buttonHeight = 100;
fireButton.addEventListener("mousedown", (event) => {
  fireButton.className = 'fireButtonOnClick';
});

fireButton.addEventListener("mouseup", (event) => {
  fireButton.className = 'fireButton';

});
document.getElementById('fireButton').addEventListener("click", (event) => {
  fullProjectileCycle();
});

// Clicking the cannon:

document.getElementById("canvas").addEventListener("mousedown", (event) => {
  userClick_x = event.clientX - canvasInfo.left;
  userClick_y = event.clientY - canvasInfo.top;
  console.log(`Coords of user click = (${userClick_x}, ${userClick_y})`);
  if (userClicksCannon(userClick_x, userClick_y)) {
    console.log('User clicked the cannon');
    draggingCannon = true;
  } else {
    console.log('User did NOT clicked the cannon');
  }
});

// Dragging the cannon: 

document.getElementById("canvas").addEventListener("mousemove", (event) => {
  if (draggingCannon) {
    userDrag_x = event.clientX - canvasInfo.left;
    userDrag_y = event.clientY - canvasInfo.top;
    // function for figuring out the new launch angle.
    findNewLaunchAngle();
  }
});

document.getElementById("canvas").addEventListener("mouseup", () => {
  draggingCannon = false;
});


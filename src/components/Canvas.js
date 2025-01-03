import { useEffect, useRef, useState } from "react"
import useWindowSize from './resizingHook';

import "./CSS/Canvas.css"

import { 
  drawRotatedCannon, 
  getCannonInfo, 
  getHolsterInfo,
  drawVelocitySlider,
  drawDefaultCannon,
  drawDefaultVelocitySlider
} from "../processingFunctions/drawingFunctions"

import cannonImg from "../images/Cannons/Cannonv2/Cannon_v2.0_body.png"
import holsterImg from "../images/Cannons/Cannonv2/Cannon_v2.0_holster.png"

import velocityBar from "../images/velocity/velocityBar.png"
import velocitySlider from "../images/velocity/velocitySlider.png"

import { clickedOnCannon, clickedOnVelocitySlider } from "../processingFunctions/readingPixels"
import { calculateAngularDisplacement } from "../processingFunctions/calculateAngularDisplacement"
import { findCannonTopLeftGlobalCoords, findPivotGlobalCoords } from "../processingFunctions/findPivotGlobalCoords"
import { topLeftConerVelocityBar } from "../processingFunctions/topLeftCorners";
import { calclateGrowthFactorVelocity } from "../processingFunctions/calculateGrowthFactor";

export default function Canvas() {

  const ctxRef = useRef(null);

  const USER_ANCHOR_POINT = useRef([0.15, 0.80])

  const { width, height } = useWindowSize();

  const canvasRef = useRef(null);
  const cannonRef = useRef(null);
  const holsterRef = useRef(null);
  const velocityBarRef = useRef(null);
  const velocitySliderRef = useRef(null);

  const angleInputRef = useRef(null);
  const velocityInputRef = useRef(null);


  const MAX_SPEED = 140;

  // Cannon State Variables
  const cannonInfo = getCannonInfo("v2");
  const holsterInfo = getHolsterInfo("holster_v1");
  const [elevationAngle, setElevationAngle] = useState(0);
  const [launchVelocity, setLaunchVelocity] = useState(0)

  // User state variables
  const cannonClick = useRef(false);
  const sliderClick = useRef(false);

  const click_x = useRef(0);
  const click_y = useRef(0);
  const clickedBehindPivot = useRef(1);

  
  //////////////////////// Canvas Drawings ///////////////////////////////////////

  useEffect(() => {
    let dpi = window.devicePixelRatio;
    const canvas = canvasRef.current
  
    function fix_dpi() {
      let style_height = +getComputedStyle(canvas).getPropertyValue("height").slice(0, -2);
      let style_width = +getComputedStyle(canvas).getPropertyValue("width").slice(0, -2);
      canvas.setAttribute('height', style_height * dpi);
      canvas.setAttribute('width', style_width * dpi);
    }
    if (canvas) {
      fix_dpi();
    }
  }, [width, height]);

  useEffect(() => {
    ctxRef.current = canvasRef.current.getContext('2d');
    drawDefaultCannon(ctxRef.current, canvasRef.current, cannonRef.current, holsterRef.current, cannonInfo, holsterInfo, USER_ANCHOR_POINT.current)
    drawDefaultVelocitySlider(ctxRef.current, canvasRef.current, velocityBarRef.current, velocitySliderRef.current, findCannonTopLeftGlobalCoords(canvasRef.current, USER_ANCHOR_POINT.current, cannonInfo))
  })

  useEffect(() => {
    ctxRef.current = canvasRef.current.getContext('2d');
    if (ctxRef && ctxRef.current) {
      ctxRef.current.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    }

    drawRotatedCannon(ctxRef.current, canvasRef.current, 
      -elevationAngle, 
      cannonRef.current, holsterRef.current, 
      cannonInfo, holsterInfo,
      USER_ANCHOR_POINT.current
    );

    drawVelocitySlider(
      ctxRef.current, canvasRef.current, 
      velocityBarRef.current, velocitySliderRef.current,
      findCannonTopLeftGlobalCoords(canvasRef.current, USER_ANCHOR_POINT.current, cannonInfo),
      launchVelocity, MAX_SPEED
    );

    // drawing a scrappy target
    // say i want to get a target 400 m away
    // 1 metre = 5 pixels is my conversion rate atm
    const [piv_x, piv_y] = findPivotGlobalCoords(
      canvasRef.current, USER_ANCHOR_POINT.current
    )

    const availableSpace = (2 * width - piv_x) * 9/10 * window.devicePixelRatio;
    const conversionRate = availableSpace / 500;

    ctxRef.current.beginPath();

    ctxRef.current.arc(piv_x + 500 * conversionRate, piv_y, 20, 0, 2 * Math.PI);
    ctxRef.current.strokeStyle = "blue";
    ctxRef.current.fillStyle = "purple"
    ctxRef.current.stroke();
    ctxRef.current.fill();
  }, [cannonInfo, elevationAngle, holsterInfo, width, launchVelocity])

  //////////////////////////////// Textbox Input ////////////////////////////////////////////////////

  function changeAngleWithTextBox(e) {
    const val = e.target.value;
    // requires some defensive programming
    try {
      if (val === "") {
        setElevationAngle(0);
      }
      // some defensive programming
      if (isNaN(parseFloat(val))) {
        return;
      } else if (parseFloat(val) < 0) {
        setElevationAngle(0)
      } else if (parseFloat(val) > 90) {
        setElevationAngle(90);
      } else {
        setElevationAngle(parseFloat(val))
      }
    } catch (error) {
      console.error("In Canvas.js | function changeAngleWithTextBox")
      console.error(error.message)
      return;
    }
  }

  function changeVelocityWithTextBox(e) {
    const val = e.target.value;
    try {
      if (val === "") {
        setLaunchVelocity(0);
      }
      if (isNaN(parseFloat(val))) {
        return;
      } else if (parseFloat(val) < 0) {
        setLaunchVelocity(0);
      } else if (parseFloat(val) > MAX_SPEED) {
        setLaunchVelocity(MAX_SPEED);
      } else {
        setLaunchVelocity(parseFloat(val));
      }
    } catch (error) {
      console.error("In Canvas.js | function changeVelocityWithTextBox")
      console.error(error.message)
    }
  }

  //////////////////////// Changing Angles Mouse Events ////////////////////////

  function mouseDown(e) {
    // uses e.PageX and e.PageY not e.clientX and clientY
    
    cannonClick.current = clickedOnCannon(
      ctxRef.current, canvasRef.current, 
      e.pageX, e.pageY,
      cannonInfo, 
      elevationAngle,
      clickedBehindPivot,
      USER_ANCHOR_POINT.current
    )

    const cannonTopLeft = findCannonTopLeftGlobalCoords(canvasRef.current, USER_ANCHOR_POINT.current, cannonInfo)
    sliderClick.current = clickedOnVelocitySlider(
      e.pageX, e.pageY, launchVelocity, 
      817, 25, 50, 51, 
      topLeftConerVelocityBar(cannonTopLeft, canvasRef.current), 
      MAX_SPEED, ctxRef.current
    )

    click_x.current = e.pageX;
    click_y.current = e.pageY;
  }

  function mouseMove(e) {
    if (cannonClick.current) {
      const angularDisplacement = calculateAngularDisplacement(
        e.pageX, e.pageY, 
        click_x.current, click_y.current, clickedBehindPivot.current,
        cannonInfo, 
        canvasRef.current,
        elevationAngle,
        USER_ANCHOR_POINT.current
      );

      click_x.current = e.pageX;
      click_y.current = e.pageY;
      if (elevationAngle + angularDisplacement > 90) {
        setElevationAngle(90)
      } else if (elevationAngle + angularDisplacement < 0) {
        setElevationAngle(0)
      } else {
        setElevationAngle(elevationAngle + angularDisplacement);
      }
      angleInputRef.current.value = Math.round(elevationAngle * 1000) / 1000;

    } else if (sliderClick.current) {
      const mouse_x = e.pageX;
      const mouse_y = e.pageY;

      const xDisplacement = (mouse_x  - click_x.current) * window.devicePixelRatio;
      // TODO: 817 is a magic number that needs to be better handled throughout the ENTIRE code base
      const velocityPerPixel = MAX_SPEED / (817 * calclateGrowthFactorVelocity());
      
      click_x.current = mouse_x;
      click_y.current = mouse_y;

      if (launchVelocity + xDisplacement * velocityPerPixel > MAX_SPEED) {
        setLaunchVelocity(MAX_SPEED)
      } else if (launchVelocity + xDisplacement * velocityPerPixel < 0) {
        setLaunchVelocity(0)
      } else {
        setLaunchVelocity(launchVelocity + xDisplacement * velocityPerPixel);
      }

      velocityInputRef.current.value = Math.round(launchVelocity * 1000) / 1000;
    }
  }

  function mouseUp(){
    cannonClick.current = false;
    sliderClick.current = false;
  }

  //////////////////////////////////////////////////////////////////////////////

  function fireCannon() {
    try {
      if (canvasRef.current) {
        const [initial_x, initial_y] 
          = findPivotGlobalCoords(canvasRef.current, USER_ANCHOR_POINT.current)

        const availableSpace = (2 * width - initial_x) * 9/10;
        const conversionRate = availableSpace / 500 * window.devicePixelRatio;

        const accel = 9.8 * conversionRate;          // TODO: could become a state variable if we move to different planets
        const initial_v =  launchVelocity * conversionRate;
        var x = initial_x;
        var y = initial_y;
        var currTime = 0;
        const angle_rad = elevationAngle * (Math.PI / 180)

        function trackProjectile() {
          if (y - (initial_v * Math.sin(angle_rad) * currTime) 
            + (1/2 * accel * currTime**2) <= initial_y) 
          {    
            x = initial_x + initial_v * Math.cos(angle_rad) * currTime;                 
            y = initial_y
              - (initial_v * Math.sin(angle_rad) * currTime) 
              + (1/2 * accel * currTime ** 2); 
            

            currTime += 0.05; // something to experiment with
      
            // redrawing the cannon ball in a new position
            // TODO: write a separate function for drawing a generic ball
            ctxRef.current.beginPath();
            ctxRef.current.moveTo(x, y);
            ctxRef.current.arc(x, y, 5, 0, Math.PI * 2, false);
            ctxRef.current.stroke();
            ctxRef.current.strokeStyle = "red"
            ctxRef.current.fillStyle = 'black';
            ctxRef.current.fill();
            ctxRef.current.closePath(); 
          }
          requestAnimationFrame(trackProjectile);
        }
        trackProjectile(); 
      }

    } catch (e) {
      console.error(e.message);
    }
  }

  ////////////////////////////////////////////////////////////////////////////////
  return (
    <>
      <canvas ref={canvasRef} 
        style={{height: 1.3 * height, width: 2 * width}} id="canvas" 
        onMouseDown={(e) => mouseDown(e)}
        onMouseUp={() => mouseUp()}
        onMouseMove={(e) => mouseMove(e)}
      >
        <img
          src={cannonImg}
          alt="barrel"
          ref={cannonRef}
        />
        <img 
          src={holsterImg}
          alt="holster"
          ref={holsterRef}
        />
        <img
          src={velocityBar}
          alt="velocityBar"
          ref={velocityBarRef}
        />
        <img
          src={velocitySlider}
          alt="velocitySlider"
          ref={velocitySliderRef}
        />
      </canvas>

      <div id="inputPanel">
        <div id="velocityInput">
          Velocity:
          <input 
            type="text"
            ref={velocityInputRef}
            onChange={(e) => changeVelocityWithTextBox(e)}
            maxLength={8}
          />
          m/s
        </div>
        <div id="angleInput">
          Angle: 
          <input 
            type="text" 
            ref={angleInputRef}
            onChange={(e) => {changeAngleWithTextBox(e)}} 
            style={{bottom: "95px"}}
            maxLength={6}
          />
          degrees
        </div>
      </div>
      <button id="fireButton" onClick={() => fireCannon()}>
        Fire
      </button>

    </>
    
  )
}
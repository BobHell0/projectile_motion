import { RefObject, useEffect, useRef, useState } from "react"
import useWindowSize from "./resizingHook.tsx"

import "./CSS/Canvas.css"

import { 
  getCannonInfo, 
  getHolsterInfo,
  getVelocitySliderInfo,
  isLandscape
} from "../processingFunctions/drawingFunctions.tsx"

import grassImg from "../images/foregrounds/grassLarge.png"

import cannonImg from "../images/Cannons/Cannonv2/Cannon_v2.0_body.png"
import holsterImg from "../images/Cannons/Cannonv2/Cannon_v2.0_holster.png"

import velocityBarImg from "../images/velocity/velocityBar.png"
import velocitySliderImg from "../images/velocity/velocitySlider.png"

import heightScaleImg from "../images/height/heightBar.png"
import heightArrowImg from "../images/height/heightIndicator.png"


import targetImg from "../images/targets/trainingTarget.png"

import { clickedOnCannon, clickedOnHeightArrow, clickedOnVelocitySlider } from "../processingFunctions/clickedOnObject.tsx"
import { calculateAngularDisplacement } from "../processingFunctions/calculateAngularDisplacement.tsx"
import { calclateGrowthFactorVelocity } from "../processingFunctions/calculateGrowthFactor.tsx";
import FireButton from "./FireButton.tsx";
import InputPanel from "./InputPanel.tsx";
import { calculateConversionRate } from "../processingFunctions/calculateConversionRate.tsx";
import { fireCannon } from "../processingFunctions/fireCannon.tsx";
import { CanvasPositionAndSizes } from "../OOP/CanvasPositionAndSizes.tsx";
import { DrawingImages } from "../OOP/DrawingImages.tsx"
import { CanvasMouseDown } from "../OOP/canvasMouseEvents/CanvasMouseDown.tsx"


interface CanvasProps {
  MAX_RANGE: number,
  target_range: number,
  target_altitude: number
}
// TODO: ensure target_range <= MAX_HORIZONTAL_RANGE
export default function Canvas({MAX_RANGE, target_range, target_altitude}: CanvasProps) {

  // Hack to make sure the input panel loads in after the canvas is rendered
  const [readyToDraw, setReadyToDraw] = useState(false);

  // Positioning Constants
  const GROUND_LEVEL_SCALAR = 0.8;
  const [CANNON_HORIZONTAL_SCALAR, setCannonHorizontalScalar] = useState(isLandscape() ? 0.5: 0.5);

  const [USER_ANCHOR_POINT, setUserAnchorPoint] = useState([CANNON_HORIZONTAL_SCALAR, GROUND_LEVEL_SCALAR] as number[])

  const { width, height } = useWindowSize();

  //// Element References
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Image references
  const cannonRef = useRef<HTMLImageElement>(null);
  const holsterRef = useRef<HTMLImageElement>(null);

  const velocityBarRef = useRef<HTMLImageElement>(null);
  const velocitySliderRef = useRef<HTMLImageElement>(null);

  const heightScaleRef = useRef<HTMLImageElement>(null);
  const heightArrowRef = useRef<HTMLImageElement>(null);


  // Foreground image reference
  const foregroundRef = useRef<HTMLImageElement>(null);
  
  // Target image reference
  const targetRef = useRef<HTMLImageElement>(null);

  // Textbox references
  const angleInputRef = useRef<HTMLInputElement>(null);
  const velocityInputRef = useRef<HTMLInputElement>(null);
  const heightInputRef = useRef<HTMLInputElement>(null);

  const MAX_SPEED = Math.sqrt(9.8 * MAX_RANGE)

  const cannonInfo = getCannonInfo("v2")
  const holsterInfo = getHolsterInfo("holster_v1")
  const velocitySliderInfo = getVelocitySliderInfo("velocity_slider");
  
  // Cannon State Variables
  const [elevationAngle, setElevationAngle] = useState(0);
  const [launchVelocity, setLaunchVelocity] = useState(0)

  // User state variables
  const cannonClick = useRef(false);
  const sliderClick = useRef(false);
  const heightArrowClick = useRef(false);

  const click_x = useRef<number>(0);
  const click_y = useRef<number>(0);
  const clickedBehindPivot = useRef<number>(1);

  // For class instances
  const positionAndSizesInterfaceRef = useRef<CanvasPositionAndSizes>(null);
  const drawingInterfaceRef = useRef<DrawingImages>(null);

  const canvasMouseDownEvent = useRef<CanvasMouseDown>(null);


  useEffect(() => {
    if (isLandscape()) {
      setCannonHorizontalScalar(0.5);
    } else {
      setCannonHorizontalScalar(0.5);
    }
  }, [width, height]);
  //////////////////////// Canvas Drawings ///////////////////////////////////////
  
  function loadImages(arr: string[], callback: Function) {
    type SrcToImage = { [key: string]: HTMLImageElement };

    const images: SrcToImage= {};
    var loadedImageCount = 0;

    // Make sure arr is actually an array and any other error checking
    for (var i = 0; i < arr.length; i++){
        var img = new Image();
        img.onload = imageLoaded;
        img.src = arr[i];
        images[arr[i]] = img;
    }

    function imageLoaded() {
        loadedImageCount++;
        if (loadedImageCount >= arr.length) {
            callback();
        }
    }
  }

  const imageArray: string[] = [grassImg, holsterImg, cannonImg, velocityBarImg, velocitySliderImg, heightScaleImg, heightArrowImg, targetImg]

  useEffect(() => {
    loadImages(imageArray, function() {
      drawEnvironmentFromCanvas();
  });
  }, [])

  useEffect(() => {
    let dpi = window.devicePixelRatio;
    const canvas = canvasRef.current
  
    function fix_dpi() {
      if (canvas) {
        let style_height = +getComputedStyle(canvas).getPropertyValue("height").slice(0, -2);
        let style_width = +getComputedStyle(canvas).getPropertyValue("width").slice(0, -2);
        canvas.setAttribute('height', (style_height * dpi).toString());
        canvas.setAttribute('width', (style_width * dpi).toString());
      }
    }
    
    fix_dpi();
  }, [width, height, readyToDraw]);


  // violates open-close principle because if i add an extra image, it has to be added here
  function allImagesReferenced() {
    return (
      holsterRef.current !== null &&
      cannonRef.current !== null &&
      velocityBarRef.current !== null &&
      velocitySliderRef.current !== null &&
      heightScaleRef.current !== null &&
      heightArrowRef.current !== null &&
      foregroundRef.current !== null &&
      targetRef.current !== null
    )
  }

  // useEffect for initialising all our classes
  useEffect(() => {
    if (canvasRef.current) {
      positionAndSizesInterfaceRef.current = new CanvasPositionAndSizes(canvasRef.current, cannonInfo, holsterInfo, velocitySliderInfo, MAX_RANGE);
      if (allImagesReferenced()) {
        drawingInterfaceRef.current = new DrawingImages(
          positionAndSizesInterfaceRef.current,
          holsterRef as RefObject<HTMLImageElement>,
          cannonRef as RefObject<HTMLImageElement>,
          velocityBarRef as RefObject<HTMLImageElement>,
          velocitySliderRef as RefObject<HTMLImageElement>,
          heightScaleRef as RefObject<HTMLImageElement>,
          heightArrowRef as RefObject<HTMLImageElement>,
          foregroundRef as RefObject<HTMLImageElement>,
          targetRef as RefObject<HTMLImageElement>
        )

        canvasMouseDownEvent.current = new CanvasMouseDown(
          positionAndSizesInterfaceRef.current,
          cannonClick,
          clickedBehindPivot,
          sliderClick,
          heightArrowClick,
          click_x,
          click_y
        )
      }
      setReadyToDraw(true);
    } else {
      
    }
  }, [cannonInfo, holsterInfo, MAX_RANGE])

  useEffect(() => {
      drawEnvironmentFromCanvas();
  })

  function drawEnvironmentFromCanvas() {

    drawingInterfaceRef.current?.drawEnvironment(
      GROUND_LEVEL_SCALAR, 
      USER_ANCHOR_POINT,
      MAX_SPEED,
      launchVelocity,
      elevationAngle,
      target_range,
      target_altitude,
    )
  }

  //////////////////////// Changing Angles Mouse Events ////////////////////////

  function mouseDown(e: React.MouseEvent<HTMLCanvasElement, MouseEvent>) {
    canvasMouseDownEvent.current?.mouseDown(
      e, elevationAngle, launchVelocity, USER_ANCHOR_POINT, MAX_SPEED
    )
  }

  function mouseMove(e: React.MouseEvent<HTMLCanvasElement, MouseEvent>) {
    if (!canvasRef || (!canvasRef.current)) return;
    const container = canvasRef.current.parentNode as HTMLDivElement; 

    const horizScroll = container.scrollLeft
    if (cannonClick.current) {
    if (!angleInputRef.current) return;
      const angularDisplacement = calculateAngularDisplacement(
        e.pageX + horizScroll, 
        e.pageY, 
        click_x.current, 
        click_y.current, 
        clickedBehindPivot.current,
        canvasRef.current,
        elevationAngle,
        USER_ANCHOR_POINT
      );

      click_x.current = e.pageX + horizScroll;
      click_y.current = e.pageY;
      if (elevationAngle + angularDisplacement > 90) {
        setElevationAngle(90)
      } else if (elevationAngle + angularDisplacement < 0) {
        setElevationAngle(0)
      } else {
        setElevationAngle(elevationAngle + angularDisplacement);
      }
      angleInputRef.current.value = (Math.round(elevationAngle * 1000) / 1000).toString();

    } else if (sliderClick.current) {
      if (!velocityInputRef.current) return;
      if (!positionAndSizesInterfaceRef.current) return;
      const mouse_x = e.pageX + horizScroll;
      const mouse_y = e.pageY;

      const xDisplacement = (mouse_x  - click_x.current) * window.devicePixelRatio;
      const velocityPerPixel = MAX_SPEED / (velocitySliderInfo.pixel_width * positionAndSizesInterfaceRef.current.getGrowthFactorVelocity());
      
      click_x.current = mouse_x;
      click_y.current = mouse_y;

      if (launchVelocity + xDisplacement * velocityPerPixel > MAX_SPEED) {
        setLaunchVelocity(MAX_SPEED)
      } else if (launchVelocity + xDisplacement * velocityPerPixel < 0) {
        setLaunchVelocity(0)
      } else {
        setLaunchVelocity(launchVelocity + xDisplacement * velocityPerPixel);
      }

      velocityInputRef.current.value = (Math.round(launchVelocity * 1000) / 1000).toString();
    } 
    else if (heightArrowClick.current) {
      if (!heightInputRef.current) return;
      const mouse_x = e.pageX + horizScroll;
      const mouse_y = e.pageY;

      const yDisplacement = (mouse_y - click_y.current) * window.devicePixelRatio;
      
      click_x.current = mouse_x;
      click_y.current = mouse_y;
      
      window.scrollTo({top: mouse_y - canvasRef.current.height * 0.1 * 2, behavior: "smooth"})

      if (USER_ANCHOR_POINT[1] * canvasRef.current.height + yDisplacement < 0.1 * canvasRef.current.height) {
        setUserAnchorPoint([CANNON_HORIZONTAL_SCALAR, 0.1]);
      } else if (USER_ANCHOR_POINT[1] * canvasRef.current.height + yDisplacement > GROUND_LEVEL_SCALAR * canvasRef.current.height) {
        setUserAnchorPoint([CANNON_HORIZONTAL_SCALAR, GROUND_LEVEL_SCALAR]);
      } else {
        setUserAnchorPoint([CANNON_HORIZONTAL_SCALAR, USER_ANCHOR_POINT[1] + yDisplacement / canvasRef.current.height])
      }

      const conversionRate = calculateConversionRate(canvasRef.current, USER_ANCHOR_POINT, MAX_RANGE);
      const metreHeight = ((GROUND_LEVEL_SCALAR - USER_ANCHOR_POINT[1]) * canvasRef.current.height) / conversionRate;
      heightInputRef.current.value = metreHeight.toString();
    }
  }

  function mouseUp() {
    cannonClick.current = false;
    sliderClick.current = false;
    heightArrowClick.current = false;
  }
  
  ///////////////////////////////////////////////////////////////////////////////


  return (
  <>
    
    <div id="container">
      <canvas ref={canvasRef} 
        id="canvas" 
        onMouseDown={(e) => mouseDown(e)}
        onMouseUp={() => mouseUp()}
        onMouseMove={(e) => mouseMove(e)}
      >

        <>
        <img 
          src={grassImg}
          alt="grass"
          ref={foregroundRef}
        />

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
          src={velocityBarImg}
          alt="velocityBar"
          ref={velocityBarRef}
        />
        <img
          src={velocitySliderImg}
          alt="velocitySlider"
          ref={velocitySliderRef}
        />

        <img
          src={heightScaleImg}
          alt="heightScale"
          ref={heightScaleRef}
        />
        <img
          src={heightArrowImg}
          alt="heightArrow"
          ref={heightArrowRef}
        />

        <img
          src={targetImg}
          alt="target"
          ref={targetRef}
        />
        </>

      </canvas>

      {readyToDraw && canvasRef.current && 
        <InputPanel 
          setElevationAngle={setElevationAngle} 
          setLaunchVelocity={setLaunchVelocity} 
          setUserAnchorPoint={setUserAnchorPoint}
          MAX_SPEED={MAX_SPEED} 
          angleInputRef={angleInputRef} 
          velocityInputRef={velocityInputRef}
          heightInputRef={heightInputRef}
          canvas={canvasRef.current}
          USER_ANCHOR_PONT={USER_ANCHOR_POINT}
          MAX_HORIZONTAL_RANGE={MAX_RANGE}
          CANNON_HORIZONTAL_SCALAR={CANNON_HORIZONTAL_SCALAR}
          GROUND_LEVEL_SCALAR={GROUND_LEVEL_SCALAR}
        />
      }

      {readyToDraw && 
        <FireButton 
          fireCannon={() => fireCannon(
            (canvasRef.current) as HTMLCanvasElement, 
            USER_ANCHOR_POINT, 
            launchVelocity, 
            elevationAngle, 
            GROUND_LEVEL_SCALAR, 
            MAX_RANGE, 
            width
          )} 
        />
      }

    </div>
  </>
    
  )
}
import { RefObject, useEffect, useRef, useState } from "react"
import useWindowSize from "../resizingHook.tsx"

import "./CSS/Canvas.css"

import { 
  getCannonInfo, 
  getForegroundInfo, 
  getHeightBarInfo, 
  getHolsterInfo,
  getTargetInfo,
  getVelocitySliderInfo,
  isLandscape
} from "../../processingFunctions/drawingFunctions.tsx"

import grassImg from "../../images/foregrounds/grassFlat.png"

import cannonImg from "../../images/Cannons/Cannonv2/Cannon_v2.0_body.png"

import holsterImg from "../../images/Cannons/Cannonv2/Cannon_v2.0_holster.png"

import velocityBarImg from "../../images/velocity/velocityBar.png"
import velocitySliderImg from "../../images/velocity/velocitySlider.png"

import heightScaleImg from "../../images/height/heightBar.png"
import heightArrowImg from "../../images/height/heightIndicator.png"

import targetImg from "../../images/targets/trainingTarget.png"



import FireButton from "./FireButton.tsx";
import InputPanel from "./InputPanel.tsx";
import { fireCannon } from "../../processingFunctions/fireCannon.tsx";
import { CanvasPositionAndSizes } from "../../OOP/CanvasPositionAndSizes.tsx";
import { DrawingImages } from "../../OOP/DrawingImages.tsx"
import { CanvasMouseDown } from "../../OOP/canvasMouseEvents/CanvasMouseDown.tsx"
import { CanvasMouseMove } from "../../OOP/canvasMouseEvents/CanvasMouseMove.tsx"
import { CanvasImagePreloader } from "../../OOP/CanvasImagePreloader.tsx"
import InteractiveMap from "./InteractiveMap.tsx"
import { fix_dpi } from "../fixDPI.tsx"
import { calculateScrollScalar } from "../../processingFunctions/scrollScalarCalculation.tsx"
import { GROUND_LEVEL_SCALAR } from "../../globalConstants/groundLevelScalar.tsx"
import { UserGameAction } from "../../states/userGameActions/UserGameAction.tsx"
import { Firing } from "../../states/userGameActions/Firing.tsx"
import { Scrolling } from "../../states/userGameActions/Scrolling.tsx"
import { Idle } from "../../states/userGameActions/Idle.tsx"
import { LoadingImages } from "../../states/userGameActions/LoadingImages.tsx"
import { Restarting } from "../../states/userGameActions/Restarting.tsx"


interface CanvasProps {
  MAX_RANGE: number,
  target_range: number,
  target_altitude: number,
  userStateRef: RefObject<UserGameAction>,
  gameStateRef: RefObject<GameState>
  setStateChangeTrigger: React.Dispatch<React.SetStateAction<number>>
}
// TODO: ensure target_range <= MAX_HORIZONTAL_RANGE
export default function Canvas({MAX_RANGE, target_range, target_altitude, userStateRef, gameStateRef, setStateChangeTrigger}: CanvasProps) {
  // Positioning Constants
  const [CANNON_HORIZONTAL_SCALAR, setCannonHorizontalScalar] = useState(isLandscape() ? 0.5: 0.8);

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

  const foregroundInfo = getForegroundInfo("grass");
  const cannonInfo = getCannonInfo("v2");
  const holsterInfo = getHolsterInfo("holster_v1")
  const velocitySliderInfo = getVelocitySliderInfo("velocity_slider");
  const heightBarInfo = getHeightBarInfo("height_bar");
  const targetInfo = getTargetInfo("practice_target");


  // Cannon State Variables
  const [elevationAngle, setElevationAngle] = useState(0);
  const [launchVelocity, setLaunchVelocity] = useState(0)

  // User state variables
  // const cannonClick = useRef(false);
  // const sliderClick = useRef(false);
  // const heightArrowClick = useRef(false);

  const click_x = useRef<number>(0);
  const click_y = useRef<number>(0);
  const clickedBehindPivot = useRef<number>(1);

  // For class instances
  const positionAndSizesInterfaceRef = useRef<CanvasPositionAndSizes>(null);
  const drawingInterfaceRef = useRef<DrawingImages>(null);

  const canvasMouseDownEvent = useRef<CanvasMouseDown>(null);
  const canvasMouseMoveEvent = useRef<CanvasMouseMove>(null);

  const imagePreloader = new CanvasImagePreloader();


  useEffect(() => {
    if (isLandscape()) {
      setUserAnchorPoint([0.5, USER_ANCHOR_POINT[1]])

    } else {
      setUserAnchorPoint([0.8, USER_ANCHOR_POINT[1]])

    }

  }, [width, height]);

  useEffect(() => {
    if (userStateRef.current instanceof Restarting) {
      setElevationAngle(0);
      setLaunchVelocity(0);
      setUserAnchorPoint([0.5, 0.8]);
      (canvasRef.current?.parentElement as HTMLDivElement).scrollTo({
        left: 0
      })
      userStateRef.current = new Idle();
    }
  })

  //////////////////////// Canvas Loading //////////////////////////////////////
  
  const imageArray: string[] = [
    grassImg, 
    holsterImg, 
    cannonImg, 
    velocityBarImg, 
    velocitySliderImg, 
    heightScaleImg, 
    heightArrowImg, 
    targetImg
  ]
  
  // useEffect(() => {
  //   if (!userStateRef.current.requiresReDrawing()) return;
  //   imagePreloader.loadImages(imageArray, () => {
  //     drawEnvironmentFromCanvas();
  //   })
  // });

  // useEffect(() => {
  //   imagePreloader.loadImages(imageArray, () => {
  //     drawEnvironmentFromCanvas();
  //   })
  // }, [width, height]);

  useEffect(() => {
    if (userStateRef.current instanceof LoadingImages) {
      imagePreloader.loadImages(imageArray, () => {
        drawEnvironmentFromCanvas();
      })
    }
  }, [])

  //////////////////////// Canvas Drawing //////////////////////////////////////

  useEffect(() => {
    // let dpi = window.devicePixelRatio;
    const canvas = canvasRef.current
    if (canvas) fix_dpi(canvas);
  }, [width, height]);


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
      positionAndSizesInterfaceRef.current = new CanvasPositionAndSizes(
        canvasRef.current, 
        foregroundInfo,
        cannonInfo, 
        holsterInfo, 
        velocitySliderInfo, 
        heightBarInfo,
        targetInfo, 
        MAX_RANGE
      );

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
          // cannonClick,
          clickedBehindPivot,
          // sliderClick,
          // heightArrowClick,
          userStateRef,
          click_x,
          click_y
        )

        canvasMouseMoveEvent.current = new CanvasMouseMove(
          positionAndSizesInterfaceRef.current,
          // cannonClick,
          clickedBehindPivot,
          // sliderClick,
          // heightArrowClick,
          userStateRef,
          click_x,
          click_y
        )
      }
    }
  }, [cannonInfo, holsterInfo, velocitySliderInfo, MAX_RANGE])

  useEffect(() => {
    drawEnvironmentFromCanvas();
  }, [GROUND_LEVEL_SCALAR, 
    USER_ANCHOR_POINT,
    MAX_SPEED,
    launchVelocity,
    elevationAngle,
    width, height,
    CANNON_HORIZONTAL_SCALAR
  ])

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

  useEffect(() => {
    if (canvasRef.current && canvasRef.current.parentElement) {

      gameStateRef.current = [
        elevationAngle, 
        launchVelocity, 
        USER_ANCHOR_POINT[1], 
        calculateScrollScalar(canvasRef.current)
      ]
      setStateChangeTrigger(x => x ^ 1);
    }
  }, [elevationAngle, launchVelocity, USER_ANCHOR_POINT])

  //////////////////////// Changing Angles Mouse Events ////////////////////////

  function mouseDown(e: React.MouseEvent<HTMLCanvasElement, MouseEvent>) {
    canvasMouseDownEvent.current?.mouseDown(
      e, positionAndSizesInterfaceRef.current!, elevationAngle, launchVelocity, USER_ANCHOR_POINT, MAX_SPEED
    )
  }

  function mouseMove(e: React.MouseEvent<HTMLCanvasElement, MouseEvent>) {
    if (angleInputRef.current && velocityInputRef.current && heightInputRef.current) {
      canvasMouseMoveEvent.current?.mouseMove(
        e,
        elevationAngle,
        launchVelocity,
        USER_ANCHOR_POINT,
        MAX_SPEED,
        CANNON_HORIZONTAL_SCALAR,
        GROUND_LEVEL_SCALAR,
        angleInputRef as RefObject<HTMLInputElement>,
        velocityInputRef as RefObject<HTMLInputElement>,
        heightInputRef as RefObject<HTMLInputElement>,
        setElevationAngle,
        setLaunchVelocity,
        setUserAnchorPoint,
        setStateChangeTrigger
      )
    }
  }

  function mouseUp() {
    // cannonClick.current = false;
    // sliderClick.current = false;
    // heightArrowClick.current = false;
    userStateRef.current = new Idle();
  }
  
  ///////////////////////////////////////////////////////////////////////////////

  return (
    <>
      
      <div id="container" onScroll={() => {
        if (canvasRef.current && !(userStateRef.current instanceof Firing)) {
          userStateRef.current = new Scrolling();
          gameStateRef.current = [
            elevationAngle, launchVelocity, USER_ANCHOR_POINT[1], calculateScrollScalar(canvasRef.current)
          ]
          setStateChangeTrigger(x => x ^ 1);
        }
      }}>
        <canvas ref={canvasRef} 
          id="canvas" 
          onMouseDown={(e) => mouseDown(e)}
          onMouseUp={() => mouseUp()}
          onMouseMove={(e) => mouseMove(e)}
        >
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
        </canvas>

        {canvasRef.current &&

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
            positioningAndSizesInterface={(positionAndSizesInterfaceRef.current)!}
            userStateRef={userStateRef}
            setStateChangeTrigger={setStateChangeTrigger}
          />
        }

        {canvasRef.current && canvasRef.current.parentElement && positionAndSizesInterfaceRef.current &&      
          <InteractiveMap 
            parentCanvasRef={canvasRef as RefObject<HTMLCanvasElement>}
            pivotCoords={positionAndSizesInterfaceRef.current.getPivotPosition(USER_ANCHOR_POINT)} 
            targetCoords={positionAndSizesInterfaceRef.current.getTargetPivot(
              GROUND_LEVEL_SCALAR, USER_ANCHOR_POINT, target_altitude, target_range
            )}        
            gameStateRef={gameStateRef}
          />}

        { 
          <FireButton 
            fireCannon={() => fireCannon(
              (positionAndSizesInterfaceRef.current)!,
              USER_ANCHOR_POINT, 
              launchVelocity, 
              elevationAngle, 
              GROUND_LEVEL_SCALAR, 
              width,
              gameStateRef,
              userStateRef,
              setStateChangeTrigger
            )} 
          />
        }

      </div>
    </>
  )
}
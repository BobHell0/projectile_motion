import { FiredAtTarget } from "./FiredAtTarget";
import { TutorialState } from "./TutorialState";

export class ToFireAtTarget extends TutorialState {
  public completeDialogue(): TutorialState {
    return this;
  }
  
  public checkIfCompletedTask(): TutorialState {
    if (this.completedTaskHelper()) {
      return new FiredAtTarget(this.getUserState(), this.getGameState(), this.getSetCompletedDialogue());
    } else {
      return this;
    }
  }

  public completedTaskHelper() {
    const gameState = this.getGameState();
    const userState = this.getUserState();
    console.log(`In completed Task Helper: userState = ${userState.current}`)
    return (
      userState.current === "idle" && 
      gameState.current[0] === 45 && 
      gameState.current[1] === 70 && 
      gameState.current[2] === 0.8
    )
  }
}
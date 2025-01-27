import { DraggingCannon } from "../userGameActions/DraggingCannon";
import { DraggedCannon } from "./DraggedCannon";
import { TutorialState } from "./TutorialState";

export class ToDragCannon extends TutorialState {
  public completeDialogue(): TutorialState {
    return this;
  }
  public checkIfCompletedTask(): TutorialState {
    if (this.completedTaskHelper()) {
      return new DraggedCannon(this.getUserState(), this.getGameState(), this.getSetCompletedDialogue());
    } else {
      return this;
    }
  }

  public completedTaskHelper(): boolean {
    return (
      this.getUserState().current instanceof DraggingCannon && 
      this.getGameState().current[0] >= 50
    );
  }

}
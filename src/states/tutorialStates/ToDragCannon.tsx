import { DraggedCannon } from "./DraggedCannon";
import { TutorialState } from "./TutorialState";

export class ToDragCannon extends TutorialState {
  public completeDialogue(): TutorialState {
    return this;
  }
  public checkIfCompletedTask(): TutorialState {
    if (this.completedTaskHelper()) {
      return new DraggedCannon(this.getUserState(), this.getGameState());
    } else {
      return this;
    }
  }

  private completedTaskHelper(): boolean {
    return this.getUserState() === "draggingCannon" && this.getGameState()[0] >= 50;
  }

}
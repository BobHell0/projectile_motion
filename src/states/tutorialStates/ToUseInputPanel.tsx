import { TutorialState } from "./TutorialState";
import { UsedInputPanel } from "./UsedInputPanel";

export class ToUseInputPanel extends TutorialState {
  public completeDialogue(): TutorialState {
    return this;
  }
  public checkIfCompletedTask(): TutorialState {
    if (this.completedTaskHelper()) {
      return new UsedInputPanel(this.getUserState(), this.getGameState(), this.getSetCompletedDialogue());
    } else {
      return this;
    }
  }

  private completedTaskHelper() {
    return  this.getUserState().current === "inputPanelVelocity" &&  this.getGameState().current[1] === 40
  }
}
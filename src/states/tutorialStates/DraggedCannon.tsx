import { JSX } from "react";
import { TutorialDialogueState } from "./TutorialDialogueState";
import { DraggingVelocityInstructions } from "./DraggingVelocityInstructions";
import { TutorialState } from "./TutorialState";

import GeneralPaddy_neutral from "../../images/characters/GeneralPaddy/GeneralPaddy_neutral.png"
import Dialogue from "../../components/dialogue/Dialogue";

export class DraggedCannon extends TutorialDialogueState {

  getDialogue(): JSX.Element {
    return <Dialogue
    name="General Paddy"
    speeches={[
      "Well done.",
    ]}
    expressions={[
      GeneralPaddy_neutral,
    ]} 
    orderOfExpressions={[0]}
    setCompletedDialogue={this.getSetCompletedDialogue()}

  />
  }
  
  completeDialogue(): TutorialState {
    return new DraggingVelocityInstructions(this.getUserState(), this.getGameState(), this.getSetCompletedDialogue());
  }
  checkIfCompletedTask(): TutorialState {
    return this;
  }

}
import { JSX } from "react";
import { TutorialDialogueState } from "./TutorialDialogueState";
import { CompletedTutorial } from "./CompletedTutorial";
import { TutorialState } from "./TutorialState";
import Dialogue from "../../components/dialogue/Dialogue";

import GeneralPaddy_neutral from "../../images/characters/GeneralPaddy/GeneralPaddy_neutral.png"
import GeneralPaddy_angry from "../../images/characters/GeneralPaddy/GeneralPaddy_angry.png"
import UnknownAgent from "../../images/characters/UnknownAgent1.png"

export class Conclusion extends TutorialDialogueState {
  getDialogue(): JSX.Element {
    return <Dialogue
      names={[
        "General Paddy", "General Paddy",
        "Covert Operator",
        "General Paddy", "General Paddy"
      ]} 
      speeches={[
        // character is General Paddy
        "Congratulations. You are now ready to carry out your duties as a projectile motion specialist.",
        "You will be sent to our covert base of operations and you should receive your first mission in 2 to 4 weeks-",
        // character is Unknown Agent
        "General! We have reported sightings of Doctor Flame trying to rob the jewellery store again",
        // character is General Paddy
        "Damnit!",
        "Buckle up kid, looks like you're going to have to put your new skills to the test..."
      ]} 
      expressions={[GeneralPaddy_neutral, GeneralPaddy_angry, UnknownAgent]} 
      orderOfExpressions={[0, 0, 2, 1, 0]} 
      setCompletedDialogue={this.getSetCompletedDialogue()}    
    />
  }

  completeDialogue(): TutorialState {
    return new CompletedTutorial(this.getUserState(), this.getGameState(), this.getSetCompletedDialogue());
  }
  checkIfCompletedTask(): TutorialState {
    return this;
  } 
}
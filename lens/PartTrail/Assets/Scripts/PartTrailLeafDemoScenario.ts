/** Reproducible simulated interaction demo. No assertions, no mutation except real SIK triggers. */
import {Scenario} from "Leaf.lspkg/Scenarios/scenario/Scenario";
import {DefaultLeafInteractor} from "Leaf.lspkg/Interactors/interactor/DefaultLeafInteractor";
import {sleep} from "Leaf.lspkg/Utils/common/Utils";
import {target} from "./PartTrailLeafInteractor";
@component
export class PartTrailLeafDemoScenario extends Scenario {
  async run():Promise<void>{
    const hand=new DefaultLeafInteractor();
    const tap=async(name:string,pause=600):Promise<void>=>{await hand.trigger(target(name));await sleep(pause);};
    await sleep(2500);
    await tap("SessionMenu");await tap("RestartSession");await tap("RestartSession",1500);
    await tap("PrimaryAction",1500);await tap("PrimaryAction",1500);
    for(let i=0;i<4;i++){await tap("SelectPart"+i,800);await tap("SelectWell"+i,800);await tap("PrimaryAction",1500);}
    await tap("ReturnParts",5000);
    await tap("PickupPart0",3000);
    await tap("PickupPart3",2200);await tap("PrimaryAction",3000);
    await tap("PauseResume",2500);await tap("PauseResume",2000);
    await tap("UndoAction",2500);
    for(let i=3;i>=0;i--){await tap("PickupPart"+i,1800);await tap("PrimaryAction",2200);}
    await sleep(3000);
    await tap("RestartSession",1800);await tap("RestartSession",2500);
  }
}

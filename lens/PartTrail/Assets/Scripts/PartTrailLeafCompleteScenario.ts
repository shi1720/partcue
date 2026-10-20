import {Scenario} from "Leaf.lspkg/Scenarios/scenario/Scenario";
import {expect} from "Leaf.lspkg/Utils/common/Expect";
import {PartTrailLeafInteractor,snapshot,text,cueEnabled,available,selectors} from "./PartTrailLeafInteractor";
@component
export class PartTrailLeafCompleteScenario extends Scenario {
  async run():Promise<void>{
    const ui=new PartTrailLeafInteractor();await ui.recordFour();await ui.beginReturn();
    for(let i=3;i>=0;i--)await ui.returnPart(i);
    const complete=snapshot();expect(complete.phase).toBe("complete");
    expect(complete.returnedCount).toBe(complete.parts.length);expect(text("TaskTitle")).toBe("All parts accounted for");expect(cueEnabled()).toBe(false);selectors(false,false);expect(available("PrimaryAction")).toBe(false);expect(available("PickupPart0")).toBe(false);expect(available("RestartSession")).toBe(true);
    await ui.tap("RestartSession");expect(snapshot()).toEqual(complete);expect(available("CancelRestart")).toBe(true);
    await ui.tap("RestartSession");const reset=snapshot();
    expect(reset.phase).toBe("setup");expect(reset.parts.length).toBe(complete.parts.length-complete.parts.length);
    expect(reset.returnedCount).toBe(complete.returnedCount-complete.returnedCount);expect(cueEnabled()).toBe(false);
    expect(text("TaskProgress").includes("0 / 4 removals recorded")).toBe(true);
  }
}

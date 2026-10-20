import {Scenario} from "Leaf.lspkg/Scenarios/scenario/Scenario";
import {expect} from "Leaf.lspkg/Utils/common/Expect";
import {sleep} from "Leaf.lspkg/Utils/common/Utils";
import {PartTrailLeafInteractor,snapshot,text,cueEnabled,available,selectors} from "./PartTrailLeafInteractor";
@component
export class PartTrailLeafPauseUndoScenario extends Scenario {
  async run():Promise<void>{
    const ui=new PartTrailLeafInteractor();await ui.recordFour();await ui.beginReturn();await ui.returnPart(3);
    const before=snapshot(),nextTitle=text("TaskTitle");await ui.tap("PauseResume");
    expect(snapshot().phase).toBe("paused");expect(snapshot().returnedCount).toBe(before.returnedCount);expect(cueEnabled()).toBe(false);
    selectors(false,false);expect(available("PrimaryAction")).toBe(false);expect(available("PickupPart2")).toBe(false);
    expect(available("UndoAction")).toBe(false);expect(available("SessionMenu")).toBe(false);
    const paused=snapshot();await sleep(400);expect(snapshot()).toEqual(paused);
    await ui.tap("PauseResume");expect(snapshot().phase).toBe("returning");expect(text("TaskTitle")).toBe(nextTitle);expect(cueEnabled()).toBe(true);
    expect(available("PickupPart2")).toBe(true);expect(snapshot().returnedCount).toBe(before.returnedCount);
    await ui.tap("UndoAction");expect(snapshot().returnedCount).toBe(before.returnedCount-1);
    expect(text("TaskTitle")).toBe("Return Inner module");expect(cueEnabled()).toBe(true);expect(available("PickupPart3")).toBe(true);
  }
}

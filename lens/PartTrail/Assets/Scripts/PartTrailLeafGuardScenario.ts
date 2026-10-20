import {Scenario} from "Leaf.lspkg/Scenarios/scenario/Scenario";
import {expect} from "Leaf.lspkg/Utils/common/Expect";
import {PartTrailLeafInteractor,snapshot,text,cueEnabled,available} from "./PartTrailLeafInteractor";
@component
export class PartTrailLeafGuardScenario extends Scenario {
  async run():Promise<void>{
    const ui=new PartTrailLeafInteractor();await ui.recordFour();await ui.beginReturn();
    const before=snapshot();await ui.tap("PickupPart0");
    expect(snapshot()).toEqual(before);
    expect(text("TaskFeedback").includes("Expected Inner module")).toBe(true);expect(text("TaskFeedback").includes("Well 4")).toBe(true);
    await ui.tap("PrimaryAction");expect(snapshot()).toEqual(before);
    await ui.tap("PickupPart3");const selected=snapshot();
    expect(selected.returnedCount).toBe(before.returnedCount);expect(selected.pendingReturnId).toBe(selected.parts[selected.parts.length-1].id);
    expect(available("ConfirmCount")).toBe(false);await ui.tap("SessionMenu");expect(available("ConfirmCount")).toBe(true);
    await ui.tap("ConfirmCount");await ui.tap("PrimaryAction");expect(snapshot()).toEqual(selected);
    await ui.tap("ConfirmCount");await ui.tap("SessionMenu");expect(available("ConfirmCount")).toBe(false);
    await ui.tap("PrimaryAction");
    expect(snapshot().returnedCount).toBe(before.returnedCount+1);expect(text("TaskTitle")).toBe("Return Lid");expect(cueEnabled()).toBe(true);
    const once=snapshot();await ui.tap("PrimaryAction");expect(snapshot()).toEqual(once);
  }
}

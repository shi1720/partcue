import {Scenario} from "Leaf.lspkg/Scenarios/scenario/Scenario";
import {expect} from "Leaf.lspkg/Utils/common/Expect";
import {PartTrailLeafInteractor,snapshot,text} from "./PartTrailLeafInteractor";
@component
export class PartCueLeafStaleSelectionScenario extends Scenario {
  async run():Promise<void>{
    const ui=new PartTrailLeafInteractor();await ui.recordFour();await ui.beginReturn();
    const before=snapshot();expect(before.pendingReturnId).toBe(null);
    await ui.tap("PickupPart3");
    const selected=snapshot();expect(selected.pendingReturnId).toBe(before.parts[before.parts.length-1].id);
    expect(selected.returnedCount).toBe(before.returnedCount);
    await ui.tap("PickupPart0");
    const cleared=snapshot();
    expect(cleared.pendingReturnId).toBe(null);expect(cleared.returnedCount).toBe(before.returnedCount);
    expect(cleared.parts).toEqual(before.parts);
    expect(cleared.events[cleared.events.length-1].type).toBe("return-deselected");
    expect(text("TaskFeedback").includes("Expected Inner module")).toBe(true);
    expect(text("TaskFeedback").includes("Select it again before confirming")).toBe(true);
    await ui.tap("PrimaryAction");expect(snapshot()).toEqual(cleared);
    expect(text("TaskFeedback").includes("Select Inner module first")).toBe(true);
    await ui.tap("PickupPart3");expect(snapshot().returnedCount).toBe(before.returnedCount);
    await ui.tap("PrimaryAction");
    const once=snapshot();expect(once.returnedCount).toBe(before.returnedCount+1);
    expect(once.pendingReturnId).toBe(null);expect(text("TaskTitle")).toBe("Return Lid");
    await ui.tap("PrimaryAction");expect(snapshot()).toEqual(once);
  }
}

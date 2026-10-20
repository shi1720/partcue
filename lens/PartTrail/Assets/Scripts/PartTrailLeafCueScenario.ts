import {Scenario} from "Leaf.lspkg/Scenarios/scenario/Scenario";
import {expect} from "Leaf.lspkg/Utils/common/Expect";
import {sleep} from "Leaf.lspkg/Utils/common/Utils";
import {PartTrailLeafInteractor,object,snapshot,text,cueEnabled} from "./PartTrailLeafInteractor";
@component
export class PartTrailLeafCueScenario extends Scenario {
  async run():Promise<void>{
    const ui=new PartTrailLeafInteractor();await ui.recordFour();const before=snapshot();await ui.beginReturn();
    expect(snapshot().returnedCount).toBe(before.returnedCount);
    expect(text("TaskTitle")).toBe("Return Inner module");expect(text("TaskInstruction").includes("Well 4")).toBe(true);
    expect(cueEnabled()).toBe(true);
    expect(object("ActiveOriginRing").isEnabledInHierarchy).toBe(true);
    expect(object("ActivePickupRing").isEnabledInHierarchy).toBe(true);
    expect(object("ActiveReturnPath").getChildrenCount()).toBeGreaterThan(0);
    const marker=object("ReturnDirectionMarker0"),a=marker.getTransform().getLocalPosition();
    await sleep(400);const b=marker.getTransform().getLocalPosition();expect(b.sub(a).length).toBeGreaterThan(0.01);
  }
}

import {Scenario} from "Leaf.lspkg/Scenarios/scenario/Scenario";
import {expect} from "Leaf.lspkg/Utils/common/Expect";
import {PartTrailLeafInteractor,snapshot,text,cueEnabled} from "./PartTrailLeafInteractor";
@component
export class PartTrailLeafRecordScenario extends Scenario {
  async run():Promise<void>{
    const ui=new PartTrailLeafInteractor();await ui.recordFour();
    expect(text("TaskTitle")).toBe("Record teardown");
    expect(text("SimulationLabel")).toBe("SIMULATED BENCH / MANUAL MARKING");
    expect(new Set(snapshot().parts.map(p=>JSON.stringify(p.trayCm))).size).toBe(snapshot().parts.length);
    expect(cueEnabled()).toBe(false);
  }
}

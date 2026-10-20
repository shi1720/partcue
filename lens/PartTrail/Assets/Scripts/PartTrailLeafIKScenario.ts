import {Scenario} from "Leaf.lspkg/Scenarios/scenario/Scenario";
import {expect} from "Leaf.lspkg/Utils/common/Expect";
import {sleep} from "Leaf.lspkg/Utils/common/Utils";
import {createIKInteractor} from "Leaf.lspkg/Interactors/interactor/ik/visualizer/BitmojiAvatar";
import {PartTrailLeafInteractor,snapshot,target,available} from "./PartTrailLeafInteractor";
@component
export class PartTrailLeafIKScenario extends Scenario {
  async run():Promise<void>{
    const setup=new PartTrailLeafInteractor();await setup.recordFour();await setup.beginReturn();
    const ik=createIKInteractor({avatar:{debugOverlay:false},body:{fallback:undefined}});
    await ik.ready;await sleep(400);
    const tap=async(name:string):Promise<void>=>{
      const button=target(name);
      print("[PartCue IK routing] "+name+" = "+(ik.right.isIndirect(button)?"far-field ray":"direct reach"));
      await ik.trigger(button);await sleep(450);
    };
    const before=snapshot();await tap("PickupPart3");expect(snapshot().returnedCount).toBe(before.returnedCount);
    expect(snapshot().pendingReturnId).toBe(before.parts[before.parts.length-1].id);
    await tap("PrimaryAction");expect(snapshot().returnedCount).toBe(before.returnedCount+1);
    expect(available("PickupPart3")).toBe(false);
  }
}

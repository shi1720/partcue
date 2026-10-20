/** Additive LEAF driver. Real UIKit and tray SIK interactions only; snapshots are read-only.
 * Verified source names: PartTrail/Main; PartSelectors, TraySelectors; PrimaryAction, ReturnParts,
 * PauseResume, UndoAction, RestartSession, SessionMenu, ConfirmCount, ChangeSelection;
 * SelectPart0..3, SelectWell0..3 (recording); PickupPart0..3 (real tray return hit volumes);
 * TaskTitle, TaskProgress, TaskFeedback, SimulationLabel; ActiveCuePair, ActiveOriginRing,
 * ActivePickupRing, ActiveReturnPath, ReturnDirectionMarker0. */
import {DefaultLeafInteractor} from "Leaf.lspkg/Interactors/interactor/DefaultLeafInteractor";
import {findInteractableByName} from "Leaf.lspkg/Interactors/InteractableUtils";
import {findSceneObjectByName,sleep} from "Leaf.lspkg/Utils/common/Utils";
import {expect} from "Leaf.lspkg/Utils/common/Expect";
import {PartTrailMain} from "./PartTrailMain";
import {Session} from "./PartTrailCore";
import {PARTS,WELLS} from "./PartTrailSceneContracts";
export function object(name:string):SceneObject {
  const value=findSceneObjectByName(name);if(!value)throw new Error("Missing confirmed scene object: "+name);return value;
}
export function snapshot():Session {
  const main=object("PartTrail").getComponent(PartTrailMain.getTypeName()) as PartTrailMain;
  if(!main)throw new Error("PartTrailMain not attached to PartTrail");return main.getSnapshot();
}
export function text(name:string):string {const c=object(name).getComponent("Component.Text") as Text;if(!c)throw new Error("Text absent: "+name);return c.text;}
export function target(name:string,enabled=true) {
  const t=findInteractableByName(name,undefined,enabled);if(!t)throw new Error("Missing "+(enabled?"enabled ":"")+"SIK Interactable: "+name);return t;
}
export function available(name:string):boolean{return !!findInteractableByName(name,undefined,true);}
export function cueEnabled():boolean {return object("ActiveCuePair").enabled;}
export function selectors(part:boolean,tray:boolean):void {
  expect(object("PartSelectors").enabled).toBe(part);expect(object("TraySelectors").enabled).toBe(tray);
}
export class PartTrailLeafInteractor extends DefaultLeafInteractor {
  async tap(name:string):Promise<void>{await this.trigger(target(name));await sleep(350);}
  async resetBench():Promise<void>{
    await sleep(1500);
    if(snapshot().phase==="paused")await this.tap("PauseResume");
    const prior=snapshot(),seq=prior.eventSeq;
    if(!available("RestartSession"))await this.tap("SessionMenu");
    await this.tap("RestartSession");
    if(snapshot().eventSeq===seq)await this.tap("RestartSession");
    const reset=snapshot();expect(reset.phase).toBe("setup");
    expect(reset.parts.length).toBe(prior.parts.length-prior.parts.length);
    expect(reset.returnedCount).toBe(prior.returnedCount-prior.returnedCount);
    expect(cueEnabled()).toBe(false);selectors(false,false);expect(available("PrimaryAction")).toBe(true);
  }
  async startRecording():Promise<void>{
    await this.tap("PrimaryAction");expect(snapshot().phase).toBe("setup");
    await this.tap("PrimaryAction");expect(snapshot().phase).toBe("recording");
    selectors(true,false);expect(available("PrimaryAction")).toBe(false);
  }
  async recordFour():Promise<void>{
    await this.resetBench();await this.startRecording();
    for(let i=0;i<PARTS.length;i++){
      const before=snapshot();selectors(true,false);expect(available("PrimaryAction")).toBe(false);
      await this.tap("SelectPart"+i);selectors(false,true);expect(available("PrimaryAction")).toBe(false);
      if(i===0){await this.tap("ChangeSelection");selectors(true,false);await this.tap("SelectPart0");}
      await this.tap("SelectWell"+i);selectors(false,false);expect(available("PrimaryAction")).toBe(true);
      if(i===0){await this.tap("ChangeSelection");selectors(false,true);expect(available("PrimaryAction")).toBe(false);await this.tap("SelectWell0");}
      await this.tap("PrimaryAction");
      const after=snapshot();expect(after.parts.length).toBe(before.parts.length+1);
      expect(after.parts[i].id).toBe(PARTS[i].id);expect(after.parts[i].label).toBe(PARTS[i].label);
      expect(after.parts[i].originCm).toEqual(PARTS[i].originCm);expect(after.parts[i].trayCm).toEqual(WELLS[i]);
      expect(text("TaskProgress").includes(after.parts.length+" / 4 removals recorded")).toBe(true);
    }
    selectors(false,false);expect(available("ReturnParts")).toBe(true);
  }
  async beginReturn():Promise<void>{
    await this.tap("ReturnParts");expect(snapshot().phase).toBe("returning");
    selectors(false,false);expect(available("PrimaryAction")).toBe(true);
    expect(available("ReturnParts")).toBe(false);expect(available("RestartSession")).toBe(false);
    expect(available("ConfirmCount")).toBe(false);expect(available("PickupPart3")).toBe(true);
  }
  async returnPart(index:number):Promise<void>{
    const before=snapshot();await this.tap("PickupPart"+index);
    expect(snapshot().returnedCount).toBe(before.returnedCount);await this.tap("PrimaryAction");
    expect(snapshot().returnedCount).toBe(before.returnedCount+1);expect(available("PickupPart"+index)).toBe(false);
  }
}

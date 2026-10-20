/** Coordinates UI intents, pure core commands, geometry and local SFX. Core is the sole sequence authority. No web/server imports. */
import {applyCommand,createSession,nextPart,progress,serializeSession,Command,Session} from "./PartTrailCore";
import {PARTS,WELLS,BenchView} from "./PartTrailSceneContracts";
import {PartTrailBenchUI} from "./PartTrailBenchUI";
import {PartTrailBenchController} from "./PartTrailBenchController";
import {PartTrailAudioController} from "./PartTrailAudioController";
@component
export class PartTrailMain extends BaseScriptComponent {
  @ui.label("PartCue — paired pickup and origin guidance")
  @input @hint("Passive UIKit view") ui:PartTrailBenchUI;
  @input @hint("Procedural articulated bench") bench:PartTrailBenchController;
  @input @hint("World anchored parent of bench and UI") workRoot:SceneObject;
  @input @hint("Tracked world camera used only to set the initial manual bench") camera:Camera;
  @input @hint("Subtle feedback volume") @widget(new SliderWidget(0,1,0.05)) sfxVolume:number=0.28;
  @input @hint("Bench below the initial eye level, cm; 40 gives a clearer top surface") @widget(new SliderWidget(25,60,1)) benchDropCm:number=40;
  private state:Session;
  private selectedPart=-1;private selectedWell=-1;private benchSet=false;private locked=false;private restartConfirm=false;
  private feedback="Original demonstration geometry";
  private confirmCount=1;private hintElapsed=0;
  private sessionOpen=false;
  private audio:PartTrailAudioController;
  public snapshotText="";
  onAwake():void {
    this.createEvent("UpdateEvent").bind(()=>this.updateHint());
    this.createEvent("OnStartEvent").bind(()=>{
      if(!this.ui||!this.bench||!this.workRoot||!this.camera){console.error("PartTrail references missing");return;}
      this.state=createSession({id:"partcue-preview",title:"PartCue simulated bench"},this.now());
      this.audio=new PartTrailAudioController(this.sceneObject,this.sfxVolume);
      this.ui.onIntent.add(i=>this.intent(i.type,i.index));
      this.bench.onPartSelected.add(index=>this.intent("part",index));
      const ready=this.createEvent("DelayedCallbackEvent");ready.bind(()=>{this.render();console.log("PartTrail ready: SIMULATED BENCH / MANUAL MARKING");});ready.reset(0.2);
    });
  }
  private now():number {return Math.max(Date.now(),this.state?this.state.updatedAt+1:0);}
  private command(cmd:Command):boolean {
    const r=applyCommand(this.state,cmd,this.now());
    if(r.ok===false){
      if(cmd.type==="selectReturn"&&r.error.code==="WRONG_PART"){
        if(this.state.pendingReturnId!==null){
          const cleared=applyCommand(this.state,{type:"deselectReturn"},this.now());
          if(cleared.ok===true)this.state=cleared.state;
        }
        this.selectedPart=-1;this.confirmCount=1;
      }
      this.feedback=r.error.code==="WRONG_COUNT"?"Recorded count is 1. Check quantity; progress unchanged.":r.error.code==="CONFIRM_REQUIRED"?"Select "+nextPart(this.state).label+" first, then confirm count 1.":r.error.message+" "+r.error.recovery;this.audio.play("error");this.render();return false;
    }
    this.state=r.state;return true;
  }
  private intent(type:string,index?:number):void {
    if(!this.state)return;
    if(this.state.phase==="paused"&&type!=="pause"){this.feedback="Paused. Resume the session first.";this.audio.play("error");this.render();return;}
    if(type==="session"){this.sessionOpen=!this.sessionOpen;this.render();return;}
    if(type==="back"&&this.state.phase==="recording"){if(this.selectedWell>=0)this.selectedWell=-1;else this.selectedPart=-1;this.feedback="Choose the marking again.";this.render();return;}
    if(type==="restart"){
      if(!this.restartConfirm){this.restartConfirm=true;this.feedback="Clear this trail? Confirm restart or keep session.";}
      else {this.command({type:"reset"});this.selectedPart=-1;this.selectedWell=-1;this.benchSet=false;this.locked=false;this.restartConfirm=false;this.sessionOpen=false;this.confirmCount=1;this.feedback="Every part has a way home.";}
      this.render();return;
    }
    if(type==="cancelRestart"){this.restartConfirm=false;this.sessionOpen=false;this.feedback="Session kept.";this.render();return;}
    if(type==="count"&&this.state.phase==="returning"){this.confirmCount=this.confirmCount===1?2:1;this.feedback="Confirm quantity: "+this.confirmCount+". Check against the recorded count.";this.render();return;}
    if(type==="reposition"&&!this.locked&&(this.state.phase==="setup"||this.state.phase==="recording")){this.setBench();this.render();return;}
    if(type==="part"){
      if(this.state.phase==="recording"){
        if(this.state.parts.some(p=>p.id===PARTS[index].id)){this.feedback="Already recorded. Choose a part still on the device.";this.audio.play("error");}
        else {this.selectedPart=index;this.feedback=PARTS[index].label+" origin marked. Choose its well.";}
      } else if(this.state.phase==="returning"){
        if(this.command({type:"selectReturn",partId:PARTS[index].id})){this.selectedPart=index;this.feedback="Selected. Return to cyan, then confirm.";}
        else {const p=nextPart(this.state);const w=this.wellIndex(p.trayCm);this.feedback="Expected "+p.label+" • Well "+(w+1)+". Progress unchanged. Select it again before confirming.";}
      }
    } else if(type==="well"&&this.state.phase==="recording"){
      if(this.state.parts.some(p=>this.wellIndex(p.trayCm)===index)){this.feedback="Well "+(index+1)+" is occupied. Choose an empty well.";this.audio.play("error");}
      else {this.selectedWell=index;this.feedback="Well "+(index+1)+" marked. Record when ready.";}
    } else if(type==="primary"){
      if(this.state.phase==="setup"){
        if(!this.benchSet){
          this.setBench();
        }else if(this.command({type:"start"})){this.feedback="Select part → select empty well → Record removal.";}
      } else if(this.state.phase==="recording"){
        if(this.selectedPart<0||this.selectedWell<0){this.feedback="Select a part and an empty tray well first.";this.audio.play("error");}
        else {
          const p=PARTS[this.selectedPart];
          if(this.command({type:"recordPart",part:{id:p.id,label:p.label,count:1,note:"Manually marked on simulated bench",originCm:{...p.originCm},trayCm:{...WELLS[this.selectedWell]}}})){
            this.locked=true;this.feedback="Recorded "+p.label+" ×1 → Well "+(this.selectedWell+1)+". Bench locked.";this.audio.play("record");this.selectedPart=-1;this.selectedWell=-1;
          }
        }
      } else if(this.state.phase==="returning"){
        const p=nextPart(this.state);
        if(this.command({type:"confirmReturn",partId:p.id,count:this.confirmCount})){
          const complete=this.isComplete();
          this.feedback=complete?"All parts accounted for. Manual confirmations complete.":"Returned "+p.label+" ×1. Next pair is active.";
          this.audio.play(complete?"complete":"return");this.selectedPart=-1;this.confirmCount=1;
        }
      }
    } else if(type==="return"){
      if(this.command({type:"beginReturn"})){this.selectedPart=-1;this.selectedWell=-1;this.sessionOpen=false;this.feedback="Pinch the amber tray part → return to cyan.";}
    } else if(type==="pause"){
      const resume=this.state.phase==="paused";
      if(this.command({type:resume?"resume":"pause"})){this.selectedPart=-1;this.feedback=resume?"Resumed the same next pair. Select it again to confirm.":"Paused. Work cues hidden; actions blocked.";}
    } else if(type==="undo"){
      if(this.command({type:this.state.phase==="recording"?"undoRemoval":"undoReturn"})){this.selectedPart=-1;this.selectedWell=-1;this.feedback="Previous action undone. Trail recomputed.";}
    }
    this.render();
  }
  private wellIndex(v:{x:number,y:number,z:number}):number {return WELLS.findIndex(w=>w.x===v.x&&w.z===v.z);}
  private setBench():void {
    const tr=this.camera.getTransform(),p=tr.getWorldPosition(),f=tr.getWorldRotation().multiplyVec3(new vec3(0,0,-1));
    const horizontal=new vec3(f.x,0,f.z).normalize();
    this.workRoot.getTransform().setWorldPosition(p.add(horizontal.uniformScale(100)).add(new vec3(0,-this.benchDropCm,0)));
    this.workRoot.getTransform().setWorldRotation(quat.angleAxis(Math.atan2(-horizontal.x,-horizontal.z),vec3.up()));
    this.benchSet=true;this.feedback="Bench set. First recording locks placement.";
  }
  private updateHint():void {
    if(!this.state||!this.ui)return;
    this.hintElapsed+=getDeltaTime();if(this.hintElapsed<0.25)return;this.hintElapsed=0;
    if(this.state.phase!=="returning"){this.ui.showDirectionHint("");return;}
    const p=nextPart(this.state),w=this.workRoot.getTransform().getWorldTransform().multiplyPoint(new vec3(p.trayCm.x,6,p.trayCm.z));
    const tr=this.camera.getTransform(),local=tr.getWorldRotation().invert().multiplyVec3(w.sub(tr.getWorldPosition()));
    const out=local.z>=0||Math.abs(Math.atan2(local.x,-local.z))>0.4||Math.abs(Math.atan2(local.y,-local.z))>0.42;
    this.ui.showDirectionHint(out?(local.x<0?"← ":"→ ")+"Active pair · Well "+(this.wellIndex(p.trayCm)+1):"");
  }
  private isComplete():boolean {return this.state.phase==="complete";}
  public getSnapshot():Session {return JSON.parse(serializeSession(this.state)) as Session;}
  private render():void {
    const s=this.state,p=nextPart(s),n=progress(s),isReturn=s.phase==="returning",recording=s.phase==="recording";
    const occupied=WELLS.map((_,i)=>{const part=s.parts.find(x=>this.wellIndex(x.trayCm)===i);return part?part.label:"";});
    const v:BenchView={phase:s.phase,title:s.phase==="complete"?"All parts accounted for":s.phase==="paused"?"Trail paused":isReturn?"Return "+p.label:recording?"Record teardown":"PartCue",
      instruction:isReturn?"Well "+(this.wellIndex(p.trayCm)+1)+" → origin · ×1":recording?(this.selectedPart<0?"Choose the removed part":this.selectedWell<0?"Choose an empty well":"Record this removal"):s.phase==="setup"?"Every part has a way home.":s.phase==="paused"?"Resume the same pair":"Manual confirmations complete",
      progress:recording||s.phase==="setup"?s.parts.length+" / 4 removals recorded":n.returnedGroups+" / "+n.totalGroups+" returned · "+n.remainingPieces+" remaining",
      feedback:this.feedback,primary:s.phase==="setup"?(this.benchSet?"Start teardown":"Set bench"):recording?"Record removal":"Confirm returned ×"+this.confirmCount,
      primaryEnabled:s.phase==="setup"||recording||isReturn,returnEnabled:recording&&s.parts.length>0,pauseEnabled:recording||isReturn||s.phase==="paused",undoEnabled:(recording&&s.parts.length>0)||((isReturn||s.phase==="complete")&&s.returnedCount>0),
      selectedPart:this.selectedPart,selectedWell:this.selectedWell,occupied,partLabels:PARTS.map(x=>x.label),benchSet:this.benchSet,locked:this.locked,restartConfirm:this.restartConfirm,
      activeLabel:p?p.label:"",activeWell:p?this.wellIndex(p.trayCm):-1,cueVisible:isReturn,confirmCount:this.confirmCount,sessionOpen:this.sessionOpen};
    this.ui.render(v);this.bench.render(s);
    if(p)this.ui.positionCueLabels(new vec3(p.originCm.x,p.originCm.y,p.originCm.z),new vec3(p.trayCm.x,p.trayCm.y,p.trayCm.z));
    this.snapshotText=serializeSession(s);
    console.log("PartTrail "+s.phase+" recorded="+s.parts.length+" returned="+s.returnedCount+" next="+(p?p.id:"none")+" pending="+s.pendingReturnId);
  }
}

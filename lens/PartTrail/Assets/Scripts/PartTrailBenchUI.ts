/** specs-build-ui surface: passive UIKit view. Authored roots stay editable. Emits intents; never owns session state. */
import Event from "SpectaclesInteractionKit.lspkg/Utils/Event";
import {BackPlate} from "SpectaclesUIKit.lspkg/Scripts/BackPlate";
import {Button} from "SpectaclesUIKit.lspkg/Scripts/Components/Button/Button";
import {ElementContent} from "SpectaclesUIKit.lspkg/Scripts/Components/Content/ElementContent";
import {FlexLayout} from "SpectaclesUIKit.lspkg/Scripts/Components/Layout2D/Flex/FlexLayout";
import {FlexItem} from "SpectaclesUIKit.lspkg/Scripts/Components/Layout2D/Flex/FlexItem";
import {FlexAlign,FlexAlignSelf,FlexDirection,FlexJustify} from "SpectaclesUIKit.lspkg/Scripts/Components/Layout2D/Flex/FlexTypes";
import {BenchView} from "./PartTrailSceneContracts";
const ICONS={check:requireAsset('../Icons/check_circle.png') as Texture,record:requireAsset('../Icons/radio_button_checked.png') as Texture,pause:requireAsset('../Icons/pause.png') as Texture,play:requireAsset('../Icons/play_arrow.png') as Texture,undo:requireAsset('../Icons/undo.png') as Texture,restart:requireAsset('../Icons/restart_alt.png') as Texture};
const TYPE_SCALE={Title1:{size:105,weight:700},Title2:{size:93,weight:700},HeadlineXL:{size:62,weight:700},Headline1:{size:54,weight:700},Headline2:{size:48,weight:700},Subheadline:{size:41,weight:700},Button:{size:39,weight:500},Callout:{size:39,weight:700},Body:{size:39,weight:500},Caption:{size:38,weight:500}};
type TextRole=keyof typeof TYPE_SCALE;
@component
export class PartTrailBenchUI extends BaseScriptComponent {
  @ui.label("PartCue — phase-focused UIKit view")
  @input @hint("World attached task and permanent simulation label") taskCard:SceneObject;
  @input @hint("Recording-only part selection") partPanel:SceneObject;
  @input @hint("Recording-only tray marking") trayPanel:SceneObject;
  @input @hint("One primary action with small contextual controls") toolbar:SceneObject;
  @input @hint("Cyan origin label") originLabel:SceneObject;
  @input @hint("Amber pickup label") pickupLabel:SceneObject;
  @input @hint("Conditional out-of-view hint") directionHint:SceneObject;
  @input @hint("Specs role typography scale") @widget(new SliderWidget(0.8,1.5,0.05)) textScale:number=1.15;
  public onIntent=new Event<{type:string,index?:number}>();
  private title:Text;private instruction:Text;private progress:Text;private feedback:Text;
  private originText:Text;private pickupText:Text;private directionText:Text;
  private partButtons:Button[]=[];private wellButtons:Button[]=[];
  private toolsContent:SceneObject;private signature="";private pending:BenchView;private rebuildFrames=0;
  private toolbarPlate:BackPlate;
  onAwake():void {
    if(!this.taskCard||!this.partPanel||!this.trayPanel||!this.toolbar)return;
    const card=this.labelLayout(this.taskCard,46,10);
    this.textRow(card,"BrandLabel","PartCue · Every part has a way home.",44,1.6,"Subheadline");
    const simulation=this.textRow(card,"SimulationLabel","SIMULATED BENCH / MANUAL MARKING",44,1.5,"Caption");simulation.textFill.color=new vec4(0.4,1,1,1);
    this.title=this.textRow(card,"TaskTitle","PartCue",44,2.2,"HeadlineXL");
    const status=this.row(card,44,1.7);
    this.instruction=this.textRow(status,"TaskInstruction","Set bench to begin",27,1.7,"Body");
    this.progress=this.textRow(status,"TaskProgress","0 / 4 removals recorded",16,1.7,"Subheadline");
    this.feedback=this.textRow(card,"TaskFeedback","Original demonstration geometry",44,2,"Caption");
    const parts=this.panel(this.partPanel,24,15);
    this.textRow(parts,"PartsHeader","1 · MARK THE REMOVED PART",22,1.6,"Subheadline");
    for(let r=0;r<2;r++){const row=this.row(parts,22,6);for(let c=0;c<2;c++){
      const i=r*2+c,[b]=this.button(row,"SelectPart"+i,["Short screw","Long screw","Lid","Inner module"][i],10.6,6,ICONS.record,"part",i);this.partButtons.push(b);
    }}
    const wells=this.panel(this.trayPanel,20,15);
    this.textRow(wells,"WellsHeader","2 · MARK AN EMPTY WELL",18,1.6,"Subheadline");
    for(let r=0;r<2;r++){const row=this.row(wells,18,6);for(let c=0;c<2;c++){
      const i=r*2+c,[b]=this.button(row,"SelectWell"+i,"Well "+(i+1),8.6,6,ICONS.record,"well",i);this.wellButtons.push(b);
    }}
    this.toolbar.createComponent("Component.Canvas");
    this.toolbarPlate=this.toolbar.createComponent(BackPlate.getTypeName()) as BackPlate;this.toolbarPlate.size=new vec2(48,7);
    this.toolbarPlate.onInitialized.add(()=>{this.toolbarPlate.interactionPlane.nearFieldDepth=3;this.toolbarPlate.interactionPlane.physicalZoneDepth=1;});
    const origin=this.labelLayout(this.originLabel,18,3);this.originText=this.textRow(origin,"OriginCueLabel","ORIGIN",18,3,"Callout");this.originText.textFill.color=new vec4(0.3,1,1,1);
    const pickup=this.labelLayout(this.pickupLabel,18,3);this.pickupText=this.textRow(pickup,"PickupCueLabel","PICKUP",18,3,"Callout");this.pickupText.textFill.color=new vec4(1,0.8,0.3,1);
    if(this.directionHint){const hint=this.labelLayout(this.directionHint,24,3);this.directionText=this.textRow(hint,"BenchDirectionHint","",24,3,"Callout");this.directionHint.enabled=false;}
    // Retain the clicked SIK target until release and hover-exit settle across real frames.
    this.createEvent("UpdateEvent").bind(()=>{if(this.rebuildFrames>0&&--this.rebuildFrames===0)this.buildTools(this.pending);});
  }
  render(v:BenchView):void {
    if(!this.title)return;
    this.title.text=v.title;this.instruction.text=v.instruction;this.progress.text=v.progress;this.feedback.text=v.feedback;
    const marking=v.phase==="recording"&&!v.restartConfirm;
    this.partPanel.enabled=marking&&v.selectedPart<0&&v.occupied.filter(x=>x.length>0).length<4;
    this.trayPanel.enabled=marking&&v.selectedPart>=0&&v.selectedWell<0;
    this.partButtons.forEach((b,i)=>{b.inactive=v.occupied.includes(v.partLabels[i]);});
    this.wellButtons.forEach((b,i)=>{b.inactive=!!v.occupied[i];b.sceneObject.enabled=!v.occupied[i];});
    this.originLabel.enabled=v.cueVisible;this.pickupLabel.enabled=v.cueVisible;
    this.originText.text="ORIGIN · "+v.activeLabel;this.pickupText.text="PICKUP "+(v.activeWell+1)+" · "+v.activeLabel;
    this.pending=v;
    this.toolbar.getTransform().setLocalPosition(new vec3(0,v.phase==="recording"?-23:-9,18));
    const key=[v.phase,v.selectedPart,v.selectedWell,v.sessionOpen,v.restartConfirm,v.benchSet,v.returnEnabled,v.undoEnabled,v.confirmCount].join("|");
    if(key!==this.signature){this.signature=key;this.rebuildFrames=4;}
  }
  private buildTools(v:BenchView):void {
    if(this.toolsContent)this.toolsContent.destroy();
    this.toolsContent=this.obj(this.toolbar,"ContextActions",new vec3(0,0,0.6));
    this.toolbarPlate.size=new vec2(48,v.sessionOpen?14:7);
    const column=this.makeFlex(this.toolsContent,FlexDirection.Column,48,v.sessionOpen?14:7,0.8);
    const action=this.row(column,48,6);
    if(v.restartConfirm){
      this.button(action,"RestartSession","Confirm restart",20,6,ICONS.restart,"restart");
      this.button(action,"CancelRestart","Keep session",18,6,ICONS.check,"cancelRestart");return;
    }
    if(v.phase==="complete"){
      this.button(action,"RestartSession","New session",22,6,ICONS.restart,"restart");
      if(v.undoEnabled)this.button(action,"UndoAction","Undo return",13,6,ICONS.undo,"undo");return;
    }
    if(v.phase==="paused"){this.button(action,"PauseResume","Resume",22,6,ICONS.play,"pause");return;}
    if(v.phase==="returning"){
      this.button(action,"PrimaryAction",v.primary,22,6,ICONS.check,"primary");
      this.button(action,"PauseResume","Pause",8,6,ICONS.pause,"pause");
      if(v.undoEnabled)this.button(action,"UndoAction","Undo",7,6,ICONS.undo,"undo");
    }else if(v.phase==="setup"){
      this.button(action,"PrimaryAction",v.primary,22,6,ICONS.check,"primary");
    }else{
      if(v.selectedWell>=0)this.button(action,"PrimaryAction","Record removal",17,6,ICONS.record,"primary");
      if(v.selectedPart>=0)this.button(action,"ChangeSelection","Change marking",13,6,ICONS.undo,"back");
      if(v.returnEnabled&&v.selectedPart<0)this.button(action,"ReturnParts","Return parts",16,6,ICONS.check,"return");
      this.button(action,"PauseResume","Pause",8,6,ICONS.pause,"pause");
      if(v.undoEnabled&&v.selectedPart<0)this.button(action,"UndoAction","Undo",7,6,ICONS.undo,"undo");
    }
    this.button(action,"SessionMenu",v.sessionOpen?"Close":"Session",7,6,ICONS.restart,"session");
    if(v.sessionOpen){const menu=this.row(column,46,6);
      this.button(menu,"RestartSession","New session",17,6,ICONS.restart,"restart");
      if(v.phase==="returning")this.button(menu,"ConfirmCount","Count "+v.confirmCount,12,6,ICONS.check,"count");
      if(!v.locked)this.button(menu,"RepositionBench","Re-place",12,6,ICONS.record,"reposition");
    }
  }
  positionCueLabels(origin:vec3,pickup:vec3):void {
    if(!this.originLabel)return;
    this.originLabel.getTransform().setLocalPosition(new vec3(-12,-1,12));
    this.pickupLabel.getTransform().setLocalPosition(new vec3(14,-1,12));
  }
  showDirectionHint(text:string):void {if(this.directionHint){this.directionHint.enabled=text.length>0;if(this.directionText)this.directionText.text=text;}}
  private obj(parent:SceneObject,name:string,position?:vec3):SceneObject {const o=global.scene.createSceneObject(name);o.setParent(parent);if(position)o.getTransform().setLocalPosition(position);return o;}
  private liftInZ(o:SceneObject,z:number):void {const p=o.getTransform().getLocalPosition();o.getTransform().setLocalPosition(new vec3(p.x,p.y,p.z+z));}
  private makeFlex(parent:SceneObject,direction:FlexDirection,w:number,h:number,gap=0.6):SceneObject {
    const o=this.obj(parent,"Flex");this.liftInZ(o,0.02);
    const f=o.createComponent(FlexLayout.getTypeName()) as FlexLayout;f.autoDiscoverItemsOnStart=false;
    const item=o.createComponent(FlexItem.getTypeName()) as FlexItem;item.overrideWidth=w;item.overrideHeight=h;
    f.onInitialized.add(()=>{f.width=w;f.height=h;f.direction=direction;f.justifyContent=FlexJustify.Center;f.alignItems=FlexAlign.Center;if(direction===FlexDirection.Row)f.columnGap=gap;else f.rowGap=gap;});return o;
  }
  private child(parent:SceneObject,name:string,w:number,h:number,build:(o:SceneObject)=>void):SceneObject {
    const o=this.obj(parent,name);this.liftInZ(o,0.02);const item=o.createComponent(FlexItem.getTypeName()) as FlexItem;item.overrideWidth=w;item.overrideHeight=h;item.flexShrink=0;item.alignSelf=FlexAlignSelf.Center;build(o);
    const f=parent.getComponent(FlexLayout.getTypeName()) as FlexLayout;if(f)f.addItems([item]);return o;
  }
  private panel(root:SceneObject,w:number,h:number):SceneObject {
    root.createComponent("Component.Canvas");const plate=root.createComponent(BackPlate.getTypeName()) as BackPlate;plate.size=new vec2(w,h);plate.style="default";
    // Compact near-field zones prevent neighboring bench panels intercepting a target ray.
    plate.onInitialized.add(()=>{plate.interactionPlane.nearFieldDepth=3;plate.interactionPlane.physicalZoneDepth=1;});
    const content=this.obj(root,"Content",new vec3(0,0,0.6));return this.makeFlex(content,FlexDirection.Column,w-1,h-1,0.4);
  }
  private labelLayout(root:SceneObject,w:number,h:number):SceneObject {root.createComponent("Component.Canvas");return this.makeFlex(root,FlexDirection.Column,w,h,0);}
  private row(parent:SceneObject,w:number,h:number):SceneObject {let result:SceneObject;this.child(parent,"Row",w,h,o=>{result=this.makeFlex(o,FlexDirection.Row,w,h,0.6);});return result;}
  private applyTextRole(t:Text,role:TextRole):void {t.size=TYPE_SCALE[role].size*this.textScale;(t as Text & {weight?:number}).weight=TYPE_SCALE[role].weight;}
  private textRow(parent:SceneObject,name:string,value:string,w:number,h:number,role:TextRole):Text {
    let t:Text;this.child(parent,name,w,h,o=>{t=o.createComponent("Component.Text") as Text;t.text=value;t.depthTest=true;this.applyTextRole(t,role);t.horizontalAlignment=HorizontalAlignment.Center;t.verticalAlignment=VerticalAlignment.Center;t.horizontalOverflow=name==="TaskFeedback"?HorizontalOverflow.Wrap:HorizontalOverflow.Overflow;t.verticalOverflow=VerticalOverflow.Overflow;t.layoutRect=Rect.create(-w/2,w/2,-h/2,h/2);t.textFill.color=new vec4(1,1,1,1);});return t;
  }
  private button(parent:SceneObject,name:string,label:string,w:number,h:number,icon:Texture,type:string,index?:number):[Button,ElementContent] {
    let b:Button,ec:ElementContent;
    this.child(parent,name,w,h,o=>{
      b=o.createComponent(Button.getTypeName()) as Button;b.setVariant({theme:"SnapOS3",shape:"Rectangle",style:"Primary"});b.size=new vec3(w,h,1);
      const labelRoot=this.obj(o,"ButtonLabel",new vec3(0,0,0.08));ec=labelRoot.createComponent(ElementContent.getTypeName()) as ElementContent;ec.sizeOverride=new vec2(w-1,h-0.5);ec.text=label;ec.textSize=TYPE_SCALE.Button.size*this.textScale;ec.leadingIcon=icon;ec.leadingIconSize=1.2;ec.spacing=0.3;ec.paddingLeft=0.3;ec.paddingRight=0.3;
      b.onTriggerUp.add(()=>this.onIntent.invoke({type,index}));
    });return[b,ec];
  }
}

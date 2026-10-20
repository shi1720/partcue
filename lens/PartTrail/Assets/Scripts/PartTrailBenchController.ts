/** Owns procedural articulated demo geometry and cue animation. Inputs are authored roots + vertex material. No sequence decisions or text/UI. */
import {Session,nextPart} from "./PartTrailCore";
import {PARTS,WELLS} from "./PartTrailSceneContracts";
import {PartTrailGeometry as G} from "./PartTrailGeometry";
import Event from "SpectaclesInteractionKit.lspkg/Utils/Event";
import {Interactable} from "SpectaclesInteractionKit.lspkg/Components/Interaction/Interactable/Interactable";
@component
export class PartTrailBenchController extends BaseScriptComponent {
  @ui.label("PartCue — original simulated mechanical bench")
  @input @hint("Local vertex-color material from mesh-builder-scripting package") material:Material;
  @input @hint("Authored enclosure shell root") enclosure:SceneObject;
  @input @hint("Authored four-well tray root") tray:SceneObject;
  @input @hint("Independent short screw root") shortScrew:SceneObject;
  @input @hint("Independent long screw root") longScrew:SceneObject;
  @input @hint("Independent service lid root") lid:SceneObject;
  @input @hint("Independent inner module root") module:SceneObject;
  @input @hint("Authored active cue root") cues:SceneObject;
  @input @hint("Part movement duration in seconds") @widget(new SliderWidget(0.15,1,0.05)) moveSeconds:number=0.38;
  @input @hint("Travel rate of the directional markers") @widget(new SliderWidget(0.1,1,0.05)) cueSpeed:number=0.35;
  private roots:SceneObject[]=[];
  public onPartSelected=new Event<number>();
  private pickups:SceneObject[]=[];
  private pickupShapes:BoxShape[]=[];
  private targets:vec3[]=[];
  private originRing:SceneObject;
  private pickupRing:SceneObject;
  private route:SceneObject;
  private stems:SceneObject;
  private markers:SceneObject[]=[];
  private from:vec3;private to:vec3;private t=0;private paused=false;
  private activeKey="";
  onAwake():void {
    this.createEvent("OnStartEvent").bind(()=>this.build());
    this.createEvent("UpdateEvent").bind(()=>this.update());
  }
  private build():void {
    if(!this.material||!this.enclosure||!this.tray||!this.shortScrew||!this.cues){console.error("PartTrail bench references missing");return;}
    const shell:[number,number,number,number]=[0.46,0.64,0.72,1],edge:[number,number,number,number]=[0.7,0.88,0.94,1];
    const g=new G().box(0,0.45,0,10,0.45,7,shell);
    g.box(-10.5,3,0,0.5,3,8,edge).box(10.5,3,0,0.5,3,8,edge).box(0,3,-7.5,10,3,0.5,shell).box(0,3,7.5,10,3,0.5,shell);
    // Original small service opening on a larger enclosure; lid fits its tray well at real scale.
    g.box(4.7,5.2,-1,4.2,0.5,5.4,shell);
    for(let i=0;i<7;i++)g.box(4.7,5.8,-4+i,3.2,0.13,0.13,edge);
    for(const x of [-7,7])g.lathe([[0.5,0.9],[1.15,0.9],[1.15,5.9],[0.5,5.9],[0.5,0.9]],edge,32,x,5);
    g.mount(this.enclosure,"EnclosureShellMesh",this.material);
    const tray=new G().box(0,0,0,8.6,0.4,8.6,[0.4,0.55,0.7,1]);
    for(const x of [-8.8,0,8.8])tray.box(x,0.7,0,0.2,0.8,9,edge);
    for(const z of [-8.8,0,8.8])tray.box(0,0.7,z,9,0.8,0.2,edge);
    tray.mount(this.tray,"FourWellTrayMesh",this.material);
    this.roots=[this.shortScrew,this.longScrew,this.lid,this.module];
    // Six-centimeter well footprints. Raised back-row volumes remain targetable by a shallow hand ray.
    this.roots.forEach((root,i)=>{
      const target=global.scene.createSceneObject("PickupPart"+i);target.setParent(this.sceneObject);
      const collider=target.createComponent("Physics.ColliderComponent") as ColliderComponent;
      collider.fitVisual=false;const shape=Shape.createBoxShape();shape.size=new vec3(6,2.4,6);collider.shape=shape;
      const interactable=target.createComponent(Interactable.getTypeName()) as Interactable;
      interactable.onTriggerEnd.add(()=>this.onPartSelected.invoke(i));
      interactable.onHoverEnter.add(()=>root.getTransform().setLocalScale(new vec3(1.03,1.03,1.03)));
      interactable.onHoverExit.add(()=>root.getTransform().setLocalScale(vec3.one()));
      this.pickups.push(target);this.pickupShapes.push(shape);target.enabled=false;
    });
    for(let k=0;k<2;k++){
      const h=k===0?2.2:3.6;
      const screw=new G().lathe([[0,-h+0.5],[0.25,-h+0.5],[0.34,-h+0.15],[0.34,-0.15],[0.8,-0.15],[0.8,0.45],[0.65,0.55],[0,0.55]],[0.82,0.9,1,1]);
      // Recessed drive slot plus visible collars distinguish long from short.
      screw.box(0,0.57,0,0.55,0.025,0.09,[0.22,0.42,0.52,1]);
      screw.mount(this.roots[k],k===0?"ShortScrewMesh":"LongScrewMesh",this.material);
    }
    const lid=new G().box(0,0,0,3.6,0.4,3.6,[0.78,0.89,0.95,1]);
    for(let i=-2;i<=2;i++)lid.box(i,0.44,0,0.09,0.04,2.7,[0.38,0.69,0.8,1]);
    lid.mount(this.lid,"ServiceLidMesh",this.material);
    const module=new G().box(0,0,0,2.9,1.4,2.9,[0.42,0.87,0.72,1]).box(0,1.55,0,1.65,0.15,1.65,edge);
    for(let i=-2;i<=2;i++)module.box(i,0,2.98,0.13,0.8,0.15,[1,0.8,0.38,1]);
    module.mount(this.module,"InnerModuleMesh",this.material);
    this.targets=PARTS.map(p=>new vec3(p.originCm.x,p.originCm.y,p.originCm.z));
    this.originRing=new G().ring(3,0.22,[0.25,1,1,1]).mount(this.cues,"ActiveOriginRing",this.material);
    this.pickupRing=new G().ring(3,0.22,[1,0.75,0.2,1]).mount(this.cues,"ActivePickupRing",this.material);
    this.route=global.scene.createSceneObject("ActiveReturnPath");this.route.setParent(this.cues);
    this.stems=global.scene.createSceneObject("CueLocationStems");this.stems.setParent(this.cues);
    for(let i=0;i<3;i++){
      const marker=global.scene.createSceneObject("ReturnDirectionMarker"+i);marker.setParent(this.cues);
      const head=new G().lathe([[0,-0.7],[0.4,-0.7],[0,0.65]],[1,0.9,0.5,1],16).mount(marker,"DirectionArrowHead",this.material);
      head.getTransform().setLocalRotation(quat.fromEulerAngles(Math.PI/2,0,0));
      this.markers.push(marker);
    }
    this.cues.enabled=false;
    console.log("PartTrail procedural bench ready: 22x16x6cm enclosure, 18x18cm tray, four articulated parts");
  }
  render(state:Session):void {
    if(this.roots.length===0)return;
    this.paused=state.phase==="paused";
    this.targets=PARTS.map(p=>{
      const i=state.parts.findIndex(x=>x.id===p.id),r=state.parts[i];
      const placed=i>=0&&i<state.parts.length-state.returnedCount;
      this.pickups[PARTS.indexOf(p)].enabled=state.phase==="returning"&&placed;
      if(placed){const k=PARTS.indexOf(p),back=r.trayCm.z<0;this.pickups[k].getTransform().setLocalPosition(new vec3(r.trayCm.x,back?6.4:3.2,r.trayCm.z));this.pickupShapes[k].size=new vec3(6,back?6:2.4,6);}
      const v=placed?r.trayCm:p.originCm;
      // Screw shafts rest horizontally in the tray; no geometry rescaling.
      const k=PARTS.indexOf(p);this.roots[k].getTransform().setLocalRotation(placed&&k<2?quat.fromEulerAngles(0,0,Math.PI/2):quat.quatIdentity());
      return new vec3(v.x,v.y+(placed?(k===2?0.4:k===3?1.4:0.85):0),v.z);
    });
    const p=nextPart(state),visible=state.phase==="returning"&&p!==null;
    this.cues.enabled=visible;
    if(!visible){this.activeKey="";return;}
    this.from=new vec3(p.trayCm.x,6,p.trayCm.z);
    this.to=new vec3(p.originCm.x,7,p.originCm.z);
    this.originRing.getTransform().setLocalPosition(this.to);this.pickupRing.getTransform().setLocalPosition(this.from);
    if(this.activeKey!==p.id){this.activeKey=p.id;this.buildRoute();
      while(this.stems.getChildrenCount())this.stems.getChild(0).destroy();
      new G().box(this.to.x,(this.to.y+p.originCm.y)/2,this.to.z,0.055,(this.to.y-p.originCm.y)/2,0.055,[0.25,1,1,1]).mount(this.stems,"OriginLocationStem",this.material);
      new G().box(this.from.x,(this.from.y+p.trayCm.y)/2,this.from.z,0.055,(this.from.y-p.trayCm.y)/2,0.055,[1,0.75,0.2,1]).mount(this.stems,"PickupLocationStem",this.material);
    }
  }
  private point(t:number):vec3 {
    return vec3.lerp(this.from,this.to,t).add(new vec3(0,Math.sin(t*Math.PI)*5,0));
  }
  private buildRoute():void {
    while(this.route.getChildrenCount())this.route.getChild(0).destroy();
    for(let i=0;i<24;i++){
      const a=this.point(i/24),b=this.point((i+1)/24),d=b.sub(a);
      const s=new G().box(0,0,0,0.065,0.065,d.length/2,[0.7,0.95,1,1]).mount(this.route,"ReturnRouteSegment"+i,this.material);
      s.getTransform().setLocalPosition(vec3.lerp(a,b,0.5));s.getTransform().setLocalRotation(quat.lookAt(d,vec3.up()));
    }
  }
  private update():void {
    if(this.paused||this.roots.length===0)return;
    const a=Math.min(1,getDeltaTime()*6/this.moveSeconds);
    this.roots.forEach((r,i)=>r.getTransform().setLocalPosition(vec3.lerp(r.getTransform().getLocalPosition(),this.targets[i],a)));
    if(!this.cues.enabled||!this.from)return;
    this.t=(this.t+getDeltaTime()*this.cueSpeed)%1;
    this.markers.forEach((o,i)=>{const t=(this.t+i/3)%1;o.getTransform().setLocalPosition(this.point(t));o.getTransform().setLocalRotation(quat.lookAt(this.point(Math.min(1,t+0.01)).sub(this.point(Math.max(0,t-0.01))),vec3.up()));});
  }
}

/** Authored semantic names, original demonstration dimensions, and view contracts. No sequence decisions. */
export const PARTS = [
  {id:"short-screw",label:"Short screw",originCm:{x:-19,y:6,z:5},size:[1.6,2.645,1.6]},
  {id:"long-screw",label:"Long screw",originCm:{x:-5,y:6,z:5},size:[1.6,4.045,1.6]},
  {id:"lid",label:"Lid",originCm:{x:-15,y:5.7,z:-1},size:[7.2,0.88,7.2]},
  {id:"module",label:"Inner module",originCm:{x:-15,y:2.4,z:-1},size:[5.8,3.1,6.03]},
];
export const WELLS = [
  {x:9.8,y:1.5,z:4.3},{x:18.2,y:1.5,z:4.3},
  {x:9.8,y:1.5,z:-4.3},{x:18.2,y:1.5,z:-4.3}
];
export interface BenchView {
  phase:string; title:string; instruction:string; progress:string; feedback:string;
  primary:string; primaryEnabled:boolean; returnEnabled:boolean; pauseEnabled:boolean;
  undoEnabled:boolean; selectedPart:number; selectedWell:number; occupied:string[];
  partLabels:string[]; benchSet:boolean; locked:boolean; restartConfirm:boolean;
  activeLabel:string; activeWell:number; cueVisible:boolean;
  confirmCount:number;
  sessionOpen:boolean;
}
export const ASSET_MANIFEST = {
  backend:"meshbuilder", backendReason:"Build selected local MeshBuilder under delegated implementation decisions so each original mechanical part remains articulated.",
  meshes:["EnclosureShell","ShortScrew","LongScrew","ServiceLid","InnerModule","FourWellTray","OriginRing","PickupRing","ReturnPath"],
  sfx:["PartTrailRecord.wav","PartTrailError.wav","PartTrailReturn.wav","PartTrailComplete.wav"],
  icons:["check_circle.png","radio_button_checked.png","pause.png","play_arrow.png","undo.png","restart_alt.png"],
  ui_modules:["PartTrailBenchUI.ts"],
};

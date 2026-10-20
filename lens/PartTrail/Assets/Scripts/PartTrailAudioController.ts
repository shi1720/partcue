/** Local feedback playback only. No music, microphone, network, or sequence state. */
const TRACKS = [
 requireAsset('../GeneratedSFX/PartTrailRecord.wav') as AudioTrackAsset,
 requireAsset('../GeneratedSFX/PartTrailError.wav') as AudioTrackAsset,
 requireAsset('../GeneratedSFX/PartTrailReturn.wav') as AudioTrackAsset,
 requireAsset('../GeneratedSFX/PartTrailComplete.wav') as AudioTrackAsset
];
export class PartTrailAudioController {
 private channels:AudioComponent[]=[];
 constructor(root:SceneObject,volume:number){
  this.channels=TRACKS.map(track=>{const a=root.createComponent('Component.AudioComponent') as AudioComponent;a.audioTrack=track;a.volume=volume;a.playbackMode=Audio.PlaybackMode.LowLatency;return a;});
 }
 play(cue:'record'|'error'|'return'|'complete'):void {const a=this.channels[['record','error','return','complete'].indexOf(cue)];a.stop(false);a.play(1);}
}

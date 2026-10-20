/** Local MeshBuilder backend. Closed CCW solids; units are centimeters. No UI or state authority. */
type Color = [number,number,number,number];
export class PartTrailGeometry {
  private builder = new MeshBuilder([{name:"position",components:3},{name:"normal",components:3,normalized:true},{name:"color",components:4}]);
  private indices:number[]=[];
  private vi=0;
  constructor(){this.builder.topology=MeshTopology.Triangles;this.builder.indexType=MeshIndexType.UInt16;}
  box(cx:number,cy:number,cz:number,hw:number,hh:number,hd:number,c:Color):this {
    const x0=cx-hw,x1=cx+hw,y0=cy-hh,y1=cy+hh,z0=cz-hd,z1=cz+hd;
    this.face([[x1,y0,z0],[x1,y1,z0],[x1,y1,z1],[x1,y0,z1]],[1,0,0],c);
    this.face([[x0,y0,z1],[x0,y1,z1],[x0,y1,z0],[x0,y0,z0]],[-1,0,0],c);
    this.face([[x0,y1,z0],[x0,y1,z1],[x1,y1,z1],[x1,y1,z0]],[0,1,0],c);
    this.face([[x0,y0,z1],[x0,y0,z0],[x1,y0,z0],[x1,y0,z1]],[0,-1,0],c);
    this.face([[x0,y0,z1],[x1,y0,z1],[x1,y1,z1],[x0,y1,z1]],[0,0,1],c);
    this.face([[x1,y0,z0],[x0,y0,z0],[x0,y1,z0],[x1,y1,z0]],[0,0,-1],c);
    return this;
  }
  private face(p:number[][],n:number[],c:Color):void {
    const v:number[]=[];p.forEach(a=>v.push(...a,...n,...c));this.builder.appendVerticesInterleaved(v);
    this.indices.push(this.vi,this.vi+1,this.vi+2,this.vi,this.vi+2,this.vi+3);this.vi+=4;
  }
  /** Smooth lathe around Y; profile traverses bottom to top. Includes closed end caps. */
  lathe(profile:number[][],c:Color,segments=32,cx=0,cz=0):this {
    for(let j=0;j<profile.length-1;j++){
      const [r0,y0]=profile[j],[r1,y1]=profile[j+1];
      const dr=r1-r0,dy=y1-y0,len=Math.sqrt(dr*dr+dy*dy)||1;
      for(let i=0;i<segments;i++){
        const a=i*Math.PI*2/segments,b=(i+1)*Math.PI*2/segments;
        const p=[[cx+r0*Math.cos(a),y0,cz+r0*Math.sin(a)],[cx+r1*Math.cos(a),y1,cz+r1*Math.sin(a)],[cx+r1*Math.cos(b),y1,cz+r1*Math.sin(b)],[cx+r0*Math.cos(b),y0,cz+r0*Math.sin(b)]];
        const ns=[[dy*Math.cos(a)/len,-dr/len,dy*Math.sin(a)/len],[dy*Math.cos(a)/len,-dr/len,dy*Math.sin(a)/len],[dy*Math.cos(b)/len,-dr/len,dy*Math.sin(b)/len],[dy*Math.cos(b)/len,-dr/len,dy*Math.sin(b)/len]];
        const v:number[]=[];p.forEach((pos,k)=>v.push(...pos,...ns[k],...c));this.builder.appendVerticesInterleaved(v);
        this.indices.push(this.vi,this.vi+1,this.vi+2,this.vi,this.vi+2,this.vi+3);this.vi+=4;
      }
    }
    return this;
  }
  ring(radius:number,tube:number,c:Color):this {
    const n=64,m=8;
    for(let i=0;i<n;i++) for(let j=0;j<m;j++){
      const ps:number[][]=[],ns:number[][]=[];
      for(const [u,v] of [[i,j],[i,j+1],[i+1,j+1],[i+1,j]]){
        const a=u*2*Math.PI/n,b=v*2*Math.PI/m,r=radius+tube*Math.cos(b);
        ps.push([r*Math.cos(a),tube*Math.sin(b),r*Math.sin(a)]);
        ns.push([Math.cos(b)*Math.cos(a),Math.sin(b),Math.cos(b)*Math.sin(a)]);
      }
      const data:number[]=[];ps.forEach((p,k)=>data.push(...p,...ns[k],...c));this.builder.appendVerticesInterleaved(data);
      this.indices.push(this.vi,this.vi+1,this.vi+2,this.vi,this.vi+2,this.vi+3);this.vi+=4;
    }
    return this;
  }
  mount(parent:SceneObject,name:string,material:Material):SceneObject {
    const o=global.scene.createSceneObject(name);o.setParent(parent);
    const v=o.createComponent("Component.RenderMeshVisual") as RenderMeshVisual;
    this.builder.appendIndices(this.indices);v.mesh=this.builder.getMesh();v.mainMaterial=material;this.builder.updateMesh();return o;
  }
}

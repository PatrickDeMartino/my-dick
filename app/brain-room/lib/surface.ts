import * as T from 'three';
/** Deterministic fibre detail shared by the playable rigs. */
export function furMaterial(color:number){
  const w=256,h=256,data=new Uint8Array(w*h*4);
  for(let y=0;y<h;y++)for(let x=0;x<w;x++){
    const strand=Math.sin(x*2.7+Math.sin(y*.09+x*.13)*1.8),fine=Math.sin(x*13.7+y*7.31)*Math.sin(x*4.3-y*2.17);
    const value=Math.round(211+strand*22+fine*18),i=(y*w+x)*4;
    data[i]=data[i+1]=data[i+2]=value;data[i+3]=255;
  }
  const map=new T.DataTexture(data,w,h);map.wrapS=map.wrapT=T.RepeatWrapping;
  map.magFilter=T.LinearFilter;map.minFilter=T.LinearMipmapLinearFilter;map.generateMipmaps=true;map.needsUpdate=true;
  map.colorSpace=T.SRGBColorSpace;map.repeat.set(3,2);
  return new T.MeshPhysicalMaterial({color,map,bumpMap:map,bumpScale:.012,roughness:.92,sheen:.6,sheenColor:new T.Color(color),sheenRoughness:.9});
}
export function cowHide(){
  const w=512,h=256,data=new Uint8Array(w*h*4),spots=[[.13,.38,.11,.21],[.34,.61,.12,.2],[.58,.35,.14,.17],[.78,.62,.13,.23],[.95,.24,.08,.13]];
  for(let y=0;y<h;y++)for(let x=0;x<w;x++){
    const u=x/w,v=y/h;let d=10;
    for(const [cx,cy,rx,ry] of spots){const dx=Math.min(Math.abs(u-cx),1-Math.abs(u-cx))/rx,dy=(v-cy)/ry;d=Math.min(d,Math.hypot(dx,dy)+.1*Math.sin(u*61+v*39)+.06*Math.sin(v*93-u*21));}
    const blend=T.MathUtils.smoothstep(d,.96,1.035),i=(y*w+x)*4,grain=Math.sin(x*3.17+y*7.3)*2;
    data[i]=28+blend*206+grain;data[i+1]=27+blend*201+grain;data[i+2]=31+blend*187+grain;data[i+3]=255;
  }
  const map=new T.DataTexture(data,w,h);map.wrapS=T.RepeatWrapping;map.colorSpace=T.SRGBColorSpace;
  map.magFilter=T.LinearFilter;map.minFilter=T.LinearMipmapLinearFilter;map.generateMipmaps=true;map.needsUpdate=true;
  return new T.MeshPhysicalMaterial({map,roughness:.83,sheen:.3,sheenColor:new T.Color(0xd3c9b9)});
}

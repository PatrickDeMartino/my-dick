import {mergeGeometries} from "three/examples/jsm/utils/BufferGeometryUtils.js";
import * as T from 'three';

/** Floating rock, spiral turf, mushrooms and mineral shards adapted to the
 * selector's scale from the grokMADEthis game's island shapes and reference art. */
export function buildLaunchIsland(){
  const group=new T.Group();group.name='Grok launch island';
  const colors=[0x772ab2,0xcb48c0,0x40c9c0,0xeb9043,0x8249cc,0x6dc543];
  const materials=colors.map(color=>new T.MeshStandardMaterial({color,flatShading:true,roughness:.73,emissive:color,emissiveIntensity:.08}));
  const rock=new T.CylinderGeometry(.88,.16,.85,28,4).toNonIndexed();
  const position=rock.getAttribute('position'),tints=[];
  for(let i=0;i<position.count;i+=3){const color=new T.Color(colors[(Math.floor(i/3)*7)%colors.length]).multiplyScalar(.45+.3*((i*13%17)/17));for(let j=0;j<3;j++)tints.push(color.r,color.g,color.b);}
  rock.setAttribute('color',new T.Float32BufferAttribute(tints,3));rock.computeVertexNormals();
  const cliff=new T.Mesh(rock,new T.MeshStandardMaterial({vertexColors:true,flatShading:true,roughness:.8}));cliff.position.y=-.43;group.add(cliff);
  const deck=new T.Mesh(new T.CylinderGeometry(.9,.87,.035,48),materials[0]);group.add(deck);
  // Concentric tessellated ribbons make a psychedelic spiral in actual geometry.
  const tiles:T.BufferGeometry[][]=Array.from({length:6},()=>[]);
  for(let r=0;r<12;r++)for(let s=0;s<48;s++){
    const a=s/48*Math.PI*2,b=(s+1)/48*Math.PI*2,inner=r/12*.89,outer=(r+1)/12*.89;
    const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute([Math.cos(a)*inner,.024,Math.sin(a)*inner,Math.cos(b)*outer,.024,Math.sin(b)*outer,Math.cos(a)*outer,.024,Math.sin(a)*outer,Math.cos(a)*inner,.024,Math.sin(a)*inner,Math.cos(b)*inner,.024,Math.sin(b)*inner,Math.cos(b)*outer,.024,Math.sin(b)*outer],3));geo.computeVertexNormals();
    tiles[(Math.floor(s/4)+r*2)%colors.length].push(geo);
  }
  tiles.forEach((geos,i)=>{const merged=mergeGeometries(geos);if(merged)group.add(new T.Mesh(merged,materials[i]));geos.forEach(g=>g.dispose());});
  const stemMat=new T.MeshStandardMaterial({color:0x8355b0,flatShading:true});
  for(const [x,z,h,r] of [[-.66,-.25,.7,.27],[.63,-.34,.42,.2],[-.5,.45,.24,.14]]){
    const stem=new T.Mesh(new T.CylinderGeometry(.025,.048,h,8),stemMat);stem.position.set(x,h/2,z);group.add(stem);
    const cap=new T.Mesh(new T.SphereGeometry(r,16,8,0,Math.PI*2,0,Math.PI/2),materials[1]);cap.position.set(x,h,z);cap.scale.y=.65;group.add(cap);
    for(let j=0;j<4;j++){const ring=new T.Mesh(new T.TorusGeometry(r*(.2+j*.2),.012,4,24),materials[(j+2)%6]);ring.rotation.x=Math.PI/2;ring.position.set(x,h+Math.sqrt(Math.max(0,r*r-(r*(.2+j*.2))**2))*.65,z);group.add(ring);}
  }
  for(const [x,z] of [[.6,.3],[-.75,.12],[.2,-.7]])for(let i=0;i<4;i++){
    const h=.12+(i===0?.4:i*.05);const shard=new T.Mesh(new T.ConeGeometry(h*.16,h,5),materials[i===0?2:4]);shard.position.set(x+Math.sin(i*2)*.065,h/2,z+Math.cos(i*2)*.065);shard.rotation.z=Math.sin(i)*.22;group.add(shard);
  }
  const edgeMaterial=new T.MeshBasicMaterial({color:0xe09bff,transparent:true,opacity:.3});
  const ring=new T.Mesh(new T.TorusGeometry(.9,.012,6,64),edgeMaterial);ring.rotation.x=Math.PI/2;ring.position.y=.025;group.add(ring);
  const underglow=new T.MeshBasicMaterial({color:0x70f9d5,transparent:true,opacity:.2});const lower=new T.Mesh(new T.TorusGeometry(.59,.02,6,48),underglow);lower.rotation.x=Math.PI/2;lower.position.y=-.55;group.add(lower);
  // One material group per palette, instead of hundreds of independent draw calls.
  return {group,edgeMaterial,underglow};
}

export function cosmicOcean(){
  const retro=typeof document!=='undefined'?new T.TextureLoader().load('/media/psychedelic-earth-texture-v1.png'):new T.DataTexture(new Uint8Array([90,20,150,255]),1,1);retro.wrapS=retro.wrapT=T.RepeatWrapping;if(typeof document==='undefined')retro.needsUpdate=true;
  return new T.ShaderMaterial({uniforms:{retro:{value:retro},time:{value:0},style:{value:0}},vertexShader:`varying vec3 p;varying vec3 n;varying vec4 clipPosition;void main(){p=normalize(position);n=normal;clipPosition=projectionMatrix*modelViewMatrix*vec4(position,1.);gl_Position=clipPosition;}`,
    fragmentShader:`varying vec3 p;varying vec3 n;varying vec4 clipPosition;uniform float time;uniform float style;uniform sampler2D retro;
    vec3 rainbow(float x){return .5+.5*cos(6.28318*(vec3(0.,.33,.67)+x));}
    void main(){float t=time*.13;float w=sin(p.x*13.+sin(p.y*12.+t)*2.8+p.z*5.);float bands=sin(w*3.+p.y*19.+t)*.5+.5;
      vec3 color=mix(vec3(.12,.025,.28),vec3(.1,.45,.56),smoothstep(.15,.65,bands));color=mix(color,vec3(.68,.09,.47),smoothstep(.55,.94,bands));
      if(style>.5&&style<1.5){float flow=sin(p.x*8.+sin(p.z*10.-t)*2.)+sin(p.y*9.+cos(p.x*7.+t)*2.);color=rainbow(flow*.3+t*.09)*(.65+.35*sin(flow*4.));}
      if(style>1.5&&style<2.5){float cells=sin(p.x*18.+t)*sin(p.y*16.-t)+sin(p.z*19.+t*.7);float edges=pow(1.-abs(sin(cells*3.)),7.);color=mix(vec3(.025,.03,.13),rainbow(cells*.2+t*.04),edges);color+=vec3(.04,.2,.23)*(.5+.5*sin(cells*7.));}
      if(style>2.5){float ripple=sin(length(p.xy+vec2(sin(t)*.25,cos(t*.7)*.3))*36.-t*3.+sin(p.z*11.)*2.);color=mix(vec3(.23,.015,.31),vec3(1.,.36,.08),smoothstep(-.6,.6,ripple));color=mix(color,vec3(.12,.85,.67),pow(max(0.,ripple),8.));}
      if(style>3.5){vec2 uv=clipPosition.xy/clipPosition.w*.5+.5;vec3 c=texture2D(retro,uv*vec2(1.35,1.)).rgb;float l=dot(c,vec3(.2126,.7152,.0722));c=mix(vec3(l),c,1.28);c=pow(max(c,vec3(0.)),vec3(1.13));c*=.95+.075*sin(time*.55)+.035*sin(time*.31+uv.x*7.);gl_FragColor=vec4(c,1.);return;}
      float light=.55+.45*max(0.,dot(normalize(n),normalize(vec3(-2.,2.,3.))));gl_FragColor=vec4(color*light,1.);}`});
}

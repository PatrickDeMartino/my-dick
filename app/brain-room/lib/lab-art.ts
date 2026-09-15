import * as T from 'three';
export function textTexture(lines:string[],ink='#182728',paper='#e7e8db'){
  if(typeof document==='undefined')return new T.DataTexture(new Uint8Array([235,238,220,255]),1,1);
  const c=document.createElement('canvas');c.width=1024;c.height=512;const x=c.getContext('2d')!;
  x.fillStyle=paper;x.fillRect(0,0,1024,512);x.fillStyle=ink;x.textAlign='left';x.textBaseline='middle';
  lines.forEach((line,i)=>{x.font=i===0?'bold 45px monospace':'34px monospace';x.fillText(line,46,65+i*75,932);});
  const t=new T.CanvasTexture(c);t.colorSpace=T.SRGBColorSpace;return t;
}
export function screenTexture(){
 if(typeof document==='undefined')return textTexture(['BONGO / NEURAL LINK',':)']);
 const c=document.createElement('canvas');c.width=1024;c.height=512;const x=c.getContext('2d')!;x.fillStyle='#071b20';x.fillRect(0,0,1024,512);x.fillStyle='#a2ff8b';x.textAlign='center';x.font='bold 34px monospace';x.fillText('BONGO / NEURAL LINK',512,62);
 for(const eyeX of [390,614]){x.fillRect(eyeX-27,133,54,66);x.fillRect(eyeX-15,122,30,13);}x.strokeStyle='#a2ff8b';x.lineWidth=18;x.lineCap='square';x.beginPath();x.moveTo(351,251);x.lineTo(378,289);x.lineTo(427,316);x.lineTo(597,316);x.lineTo(646,289);x.lineTo(673,251);x.stroke();
 x.font='28px monospace';x.fillText('WELCOME, LITTLE MIND.',512,410);x.font='22px monospace';x.fillText('KEYBOARD TO CONNECT',512,462);const t=new T.CanvasTexture(c);t.colorSpace=T.SRGBColorSpace;return t;
}

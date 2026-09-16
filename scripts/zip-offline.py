"""Create and verify the portable Windows archive without copying junctions or local saves."""
from pathlib import Path
import os,sys,zipfile,hashlib,json
root=Path(sys.argv[1]).resolve(); output=Path(sys.argv[2]).resolve()
if root.name!='triptotropicNEWo69' or output.parent!=root.parent: raise SystemExit('Use the named delivery folder and its parent')
count=0
with zipfile.ZipFile(output,'w',compression=zipfile.ZIP_DEFLATED,compresslevel=5,allowZip64=True,strict_timestamps=False) as archive:
    archive.writestr(root.name+'/Data/',b'')
    for current,dirs,files in os.walk(root,followlinks=False):
        dirs[:]=[d for d in dirs if d not in {'.git','.wrangler','.vinext','.next','work','Data'} and not os.path.islink(os.path.join(current,d)) and not os.path.isjunction(os.path.join(current,d))]
        for name in files:
            file=Path(current)/name
            if file.is_symlink() or name.endswith('.tsbuildinfo'): continue
            archive.write(file,root.name+'/'+file.relative_to(root).as_posix());count+=1
            if count%5000==0: print(f'{count} files packed',flush=True)
with zipfile.ZipFile(output) as archive:
    for needed in ['App/Triptotropic.exe','App/resources/app/main.cjs','Site/dist/server/index.js','Site/public/brain-room/brain-room.glb','Guide/START HERE.html','Tools/node.exe','Tools/dependency-links.json']:
        if root.name+'/'+needed not in archive.namelist(): raise RuntimeError('Missing '+needed)
    bad=archive.testzip()
    if bad: raise RuntimeError('CRC failure: '+bad)
h=hashlib.sha256()
with output.open('rb') as f:
    for part in iter(lambda:f.read(8*1024*1024),b''):h.update(part)
info={'file':output.name,'files':count,'bytes':output.stat().st_size,'sha256':h.hexdigest()}
output.with_suffix('.sha256.txt').write_text(h.hexdigest()+'  '+output.name+'\n')
print(json.dumps(info),flush=True)



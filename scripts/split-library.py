from pypdf import PdfReader,PdfWriter
from pathlib import Path
from io import BytesIO
import logging
logging.getLogger('pypdf').setLevel(logging.ERROR)
import json
for name in ['mkultra','flight']:
    reader=PdfReader('work/library-originals/'+name+'.pdf');root=Path('public/library')/name;root.mkdir(parents=True,exist_ok=True);parts=[]
    def save(first,last):
        writer=PdfWriter()
        for i in range(first,last):writer.add_page(reader.pages[i],excluded_keys=['/Annots','/B'])
        writer.compress_identical_objects(remove_duplicates=True,remove_unreferenced=True);out=BytesIO();writer.write(out);data=out.getvalue()
        if len(data)>7500000 and last-first>1:
            middle=(first+last)//2;save(first,middle);save(middle,last);return
        filename=f'pages-{first+1:04}-{last:04}.pdf';(root/filename).write_bytes(data);parts.append({'file':f'/library/{name}/{filename}','first':first+1,'last':last,'bytes':len(data)})
    for first in range(0,len(reader.pages),20):save(first,min(first+20,len(reader.pages)))
    (root/'manifest.json').write_text(json.dumps({'pages':len(reader.pages),'parts':parts},indent=2))
    print(name,len(reader.pages),'pages',len(parts),'parts',flush=True)


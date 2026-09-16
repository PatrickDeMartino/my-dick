from pathlib import Path
from pypdf import PdfReader,PdfWriter
from PIL import Image
import io
root=Path('public/library/flight')
before=after=0
for file in sorted(root.glob('*.pdf')):
    original=file.stat().st_size;before+=original
    reader=PdfReader(file);writer=PdfWriter();writer.append(reader,excluded_fields=['/Annots','/B'])
    seen=set();changed=0
    for page in writer.pages:
        for image in page.images:
            ref=image.indirect_reference
            key=(ref.idnum,ref.generation) if ref else image.name
            if key in seen:continue
            seen.add(key)
            try:
                pil=image.image
                if pil.width*pil.height<160000:continue
                pil=pil.convert('RGB');pil.thumbnail((1700,1700),Image.Resampling.LANCZOS)
                image.replace(pil,quality=78,optimize=True);changed+=1
            except Exception as error:
                print('Kept original image',file.name,image.name,str(error)[:80],flush=True)
    writer.compress_identical_objects(remove_duplicates=True,remove_unreferenced=True)
    target=io.BytesIO();writer.write(target);data=target.getvalue()
    if len(data)<original:file.write_bytes(data)
    after+=file.stat().st_size
    print(file.name,original,'->',file.stat().st_size,changed,flush=True)
print('TOTAL',before,'->',after,flush=True)

"""Original PartCue cover graphics, with an honest cropped actual-preview inset."""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont
import hashlib,json
ROOT=Path(__file__).resolve().parents[1]
REPO=ROOT
SOURCE=REPO/'docs/evidence/lens-return.png'
CREAM='#f7f3eb'; NAVY='#132b36'; CORAL='#ec705c'; CYAN='#66e1dd'; INK='#203b45'; MUTED='#65747a'
REG='/System/Library/Fonts/Supplemental/Arial.ttf'
BOLD='/System/Library/Fonts/Supplemental/Arial Bold.ttf'
S=2

def create(size,target):
    w,h=size; im=Image.new('RGB',(w*S,h*S),CREAM); d=ImageDraw.Draw(im)
    def box(b,fill,r=0,outline=None,width=1):
        b=tuple(int(v*S) for v in b)
        if r: d.rounded_rectangle(b,r*S,fill=fill,outline=outline,width=width*S)
        else: d.rectangle(b,fill=fill,outline=outline,width=width*S)
    def txt(x,y,s,n=24,bold=False,c=INK):
        f=ImageFont.truetype(BOLD if bold else REG,int(n*S))
        d.text((x*S,y*S),s,font=f,fill=c)
    if w==1280:
        lx=52; top=48
        card=(563,48,1232,672); imgbox=(579,101,1216,596)
        brand=59; tagline=49
        box((lx,top,lx+59,top+59),CORAL,15)
        txt(lx+17,top+7,'P',40,True,NAVY); txt(lx+77,top-1,'PartCue',brand,True)
        txt(lx,142,'REMEMBER THE WAY BACK',15,True,MUTED)
        txt(lx,207,'Every part has',tagline,True)
        txt(lx,265,'a way home.',tagline,True)
        box((lx,349,lx+56,355),CORAL,3)
        txt(lx,384,'Spatial memory',29)
        txt(lx,421,'for your teardown.',29)
        box((lx,502,493,503),'#d4dcd6')
        txt(lx,530,'Shivam Gupta',28,True)
        txt(lx,570,'Created with AI assistance',18,c=MUTED)
        txt(lx,638,'PICK UP. RETURN. CONTINUE.',14,True,MUTED)
        fsz=16; label_y=617; mode_y=644
    else:
        lx=64;top=77
        card=(720,77,1436,922); imgbox=(740,147,1416,672)
        brand=69; tagline=61
        box((lx,top,lx+70,top+70),CORAL,18)
        txt(lx+21,top+9,'P',47,True,NAVY);txt(lx+93,top,'PartCue',brand,True)
        txt(lx,199,'REMEMBER THE WAY BACK',18,True,MUTED)
        txt(lx,295,'Every part',tagline,True)
        txt(lx,368,'has a way',tagline,True)
        txt(lx,441,'home.',tagline,True)
        box((lx,548,lx+70,555),CORAL,3)
        txt(lx,593,'Spatial memory',36)
        txt(lx,640,'for your teardown.',36)
        box((lx,744,635,745),'#d4dcd6')
        txt(lx,783,'Shivam Gupta',34,True)
        txt(lx,832,'Created with AI assistance',22,c=MUTED)
        txt(lx,918,'PICK UP. RETURN. CONTINUE.',17,True,MUTED)
        fsz=19; label_y=782; mode_y=823
    box(card,NAVY,22)
    txt(card[0]+25,card[1]+19,'THE WAY BACK, IN VIEW',16 if w==1280 else 19,True,CYAN)
    src=Image.open(SOURCE).convert('RGB')
    # Remove only empty outer margins; retain all product content and controls.
    crop=(141,445,1430,1447)
    src=src.crop(crop)
    x1,y1,x2,y2=imgbox
    src=src.resize(((x2-x1)*S,(y2-y1)*S),Image.Resampling.LANCZOS)
    im.paste(src,(x1*S,y1*S))
    if w!=1280:
        txt(card[0]+25,710,'AMBER PICKUP  →  CYAN ORIGIN',24,True,CYAN)
    txt(card[0]+25,label_y,'Actual Lens Studio preview · Simulated bench',fsz,c=CREAM)
    if w==1280:
        txt(card[0]+25,mode_y,'Four authored parts · predefined origins · SIK replay',15,c='#c4d5d7')
    else:
        txt(card[0]+25,mode_y,'Four authored parts · predefined origins',18,c='#c4d5d7')
        txt(card[0]+25,mode_y+29,'Manual marking · SIK replay',18,c='#c4d5d7')
    im=im.resize(size,Image.Resampling.LANCZOS)
    target.parent.mkdir(parents=True,exist_ok=True)
    im.save(target,optimize=True)
    return {'file':str(target.relative_to(REPO)),'width':w,'height':h,'source_crop_px':crop,'sha256':hashlib.sha256(target.read_bytes()).hexdigest()}

items=[create((1280,720),REPO/'demo/partcue-thumbnail.png'),create((1500,1000),REPO/'docs/evidence/partcue-cover.png')]
(REPO/'demo/cover-provenance.json').write_text(json.dumps({'source':str(SOURCE.relative_to(REPO)),'source_sha256':hashlib.sha256(SOURCE.read_bytes()).hexdigest(),'method':'Original Pillow-composed graphic; actual screenshot inset cropped only to remove empty outer margins, no product pixels fabricated or recolored.','outputs':items},indent=2)+'\n')
print(json.dumps(items,indent=2))

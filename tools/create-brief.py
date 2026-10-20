#!/usr/bin/env python3
"""Build the five-page PartCue brief with reportlab.

Install: python3 -m pip install -r requirements-docs.txt
Draft: python3 tools/create-brief.py --output /tmp/PartCue-Brief-Draft.pdf
Verified: python3 tools/create-brief.py --software-tests 32 --leaf-passed 6 \
    --verified --lens-image docs/evidence/lens-return.png

Run from any directory. Relative --output and --lens-image paths resolve against
this repository's root, not the shell working directory. The --verified flag must
only be used after the current Lens design, scenario rerun, and capture are checked.
Images are used as supplied; this tool does not synthesize runtime evidence.
"""
from pathlib import Path
import argparse
from datetime import date
from reportlab.pdfgen import canvas
from reportlab.lib.colors import HexColor
from reportlab.lib.utils import ImageReader
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import Paragraph
from reportlab.lib.styles import ParagraphStyle

ROOT = Path(__file__).resolve().parents[1]
parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
parser.add_argument('--output', default='PartCue-Project-Brief.pdf', help='PDF output path (relative to repository root)')
parser.add_argument('--lens-image', help='Actual Lens Studio capture, used as supplied (relative to repository root)')
parser.add_argument('--software-tests', type=int, default=31, help='Observed passing software-test count')
parser.add_argument('--leaf-passed', type=int, default=6, help='Observed passing LEAF count')
parser.add_argument('--leaf-total', type=int, default=6, help='Total required LEAF scenarios')
parser.add_argument('--verified', action='store_true', help='Current design and final scenario rerun/capture are verified')
parser.add_argument('--date', default='2026-10-20', help='Evidence snapshot date, ISO YYYY-MM-DD')
args = parser.parse_args()
if args.software_tests < 0 or not 0 <= args.leaf_passed <= args.leaf_total:
    parser.error('Test counts must be nonnegative, with passed LEAF <= total LEAF')
try:
    SNAPSHOT = date.fromisoformat(args.date)
except ValueError:
    parser.error('--date must use YYYY-MM-DD')
def repo_path(value):
    path = Path(value).expanduser()
    return path.resolve() if path.is_absolute() else (ROOT / path).resolve()
OUT = repo_path(args.output)
LENS_IMAGE = repo_path(args.lens_image) if args.lens_image else None
if LENS_IMAGE and not LENS_IMAGE.is_file():
    parser.error('--lens-image does not exist')
if args.verified and (not LENS_IMAGE or args.leaf_passed != args.leaf_total):
    parser.error('--verified requires an actual --lens-image and all LEAF scenarios passing')
OUT.parent.mkdir(parents=True, exist_ok=True)

# Prefer native fonts; use standard PDF fonts on hosts with no suitable TTFs.
FONT_MAP = {'Sans':'Helvetica','SansB':'Helvetica-Bold','Serif':'Times-Roman','SerifI':'Times-Italic'}
font_sets = [
    (Path('/System/Library/Fonts/Supplemental'), ['Arial.ttf','Arial Bold.ttf','Georgia.ttf','Georgia Italic.ttf']),
    (Path('/usr/share/fonts/truetype/dejavu'), ['DejaVuSans.ttf','DejaVuSans-Bold.ttf','DejaVuSerif.ttf','DejaVuSerif-Italic.ttf']),
    (Path('C:/Windows/Fonts'), ['arial.ttf','arialbd.ttf','georgia.ttf','georgiai.ttf']),
]
for folder, filenames in font_sets:
    if all((folder / fn).is_file() for fn in filenames):
        for alias, filename in zip(FONT_MAP, filenames):
            pdfmetrics.registerFont(TTFont(alias, str(folder / filename)))
        FONT_MAP = {alias:alias for alias in FONT_MAP}
        pdfmetrics.registerFontFamily('Sans',normal='Sans',bold='SansB',italic='Sans',boldItalic='SansB')
        break
W,H=595.276,841.89
BG=HexColor('#FAF8F2'); NAVY=HexColor('#172F42'); MUTED=HexColor('#596C75')
CORAL=HexColor('#D86B53'); CYAN=HexColor('#16858E'); LINE=HexColor('#D7DEDA'); PALE=HexColor('#EAF0EC')
c=canvas.Canvas(str(OUT),pagesize=(W,H))
c.setTitle('PartCue | Every part has a way home')
c.setAuthor('Shivam Gupta')
c.setSubject('Product, commercial hypotheses, and evidence snapshot - '+SNAPSHOT.isoformat())

def p(text,x,y,w=499,size=11,leading=16,color=NAVY,font='Sans'):
    style=ParagraphStyle('p',fontName=FONT_MAP.get(font,font),fontSize=size,leading=leading,textColor=color,spaceAfter=0)
    q=Paragraph(text,style)
    _,height=q.wrap(w,H)
    assert y-height>=50, (text[:50],y,height)
    q.drawOn(c,x,y-height)
    return y-height
def text(t,x,y,size=11,font='Sans',color=NAVY):
    c.setFillColor(color);c.setFont(FONT_MAP.get(font,font),size);c.drawString(x,y,t)
def rule(y,x=48,w=499):
    c.setStrokeColor(LINE);c.setLineWidth(.6);c.line(x,y,x+w,y)
def label(t,x,y,color=CORAL): text(t.upper(),x,y,8.3,'SansB',color)
def base(n,section):
    c.setFillColor(BG);c.rect(0,0,W,H,fill=1,stroke=0)
    label('PartCue / '+section,48,802,NAVY)
    rule(787)
    rule(43)
    text('SHIVAM GUPTA  /  LEARN AR WITH SPECS',48,27,7.2,'SansB',MUTED)
    text(f'{SNAPSHOT:%d %b %Y}     {n:02d} / 05'.upper(),430,27,7.2,'Sans',MUTED)
def title(kicker,heading,deck=None):
    label(kicker,48,751)
    y=p(heading,48,731,499,31,37,font='Serif')
    if deck:y=p(deck,48,y-17,490,11.5,17,color=MUTED)
    return y
def box(x,y,w,h,fill=PALE):
    c.setFillColor(fill);c.roundRect(x,y-h,w,h,9,fill=1,stroke=0)
def smallrow(num,heading,body,y):
    c.setFillColor(CORAL);c.circle(61,y-12,12,fill=1,stroke=0)
    text(num,57,y-15,9,'SansB',BG)
    text(heading,85,y-7,12,'SansB')
    end=p(body,85,y-19,450,10.7,15.5,MUTED)
    return end-25
def link(title,url,x,y,w=499):
    return p(f'<link href="{url}" color="#16858E"><u>{title}</u></link>',x,y,w,9,13)

# 1 / Story. The actual capture receives a larger frame than the diagram draft.
base(1,'the idea')
label('A spatial memory for the repair bench',48,753)
if LENS_IMAGE:
    text('PartCue',46,687,56,'Serif')
    text('Every part has a way home.',48,643,26,'SerifI')
    p('Two similar screws remain. Which one came from here?',48,619,499,13,18,MUTED)
    box(48,587,499,438)
    label('Actual Lens Studio preview / simulated bench / manual marking',65,567,CYAN)
    capture = ImageReader(str(LENS_IMAGE))
    iw, ih = capture.getSize()
    scale = min(465 / iw, 394 / ih)
    dw, dh = iw * scale, ih * scale
    c.drawImage(capture,48+(499-dw)/2,160+(394-dh)/2,dw,dh,mask='auto')
    p('Record a part, then follow the paired tray-to-origin cue when returning it.',48,135,499,10,15)
    rule(109)
    label('Creator / product owner',48,93,MUTED)
    text('Shivam Gupta',48,72,14,'SansB')
    text('AI-assisted implementation',315,74,9,'Sans',MUTED)
else:
    text('PartCue',46,686,56,'Serif')
    p('Every part has<br/>a way home.',48,655,490,30,35,font='SerifI')
    p('The fault is fixed. Two similar screws remain.<br/>Which one came from here?',48,558,490,14,21,MUTED)
    # Original vector drawing - explicitly a concept diagram.
    box(48,477,499,242)
    label('Concept diagram / not a Lens screenshot',65,455,CYAN)
    text('SAVED ORIGIN',76,420,8,'SansB',MUTED)
    text('RECORDED TRAY',373,420,8,'SansB',MUTED)
    c.setFillColor(BG);c.setStrokeColor(NAVY);c.setLineWidth(1)
    c.roundRect(77,288,171,113,13,fill=1,stroke=1)
    c.roundRect(95,306,135,76,7,fill=0,stroke=1)
    for x,y in [(106,371),(218,371),(106,316),(218,316)]:
        c.setStrokeColor(CYAN);c.circle(x,y,5,fill=0,stroke=1)
    c.setFillColor(CYAN);c.circle(218,371,8,fill=0,stroke=1)
    c.setStrokeColor(NAVY);c.roundRect(369,288,133,113,10,fill=0,stroke=1)
    for i,(x,y) in enumerate([(383,344),(443,344),(383,299),(443,299)]):
        c.setFillColor(BG if i!=1 else HexColor('#F6D9CC'));c.setStrokeColor(LINE)
        c.roundRect(x,y,46,43,5,fill=1,stroke=1)
        text(str(i+1),x+6,y+29,7,'SansB',MUTED)
        c.setStrokeColor(CORAL if i==1 else MUTED);c.setLineWidth(2)
        c.line(x+21,y+10,x+27,y+20);c.line(x+22,y+22,x+30,y+17)
    c.setStrokeColor(CYAN);c.setLineWidth(2)
    path=c.beginPath();path.moveTo(459,367);path.curveTo(380,414,294,414,225,374);c.drawPath(path)
    c.setFillColor(CYAN);path=c.beginPath();path.moveTo(225,374);path.lineTo(237,376);path.lineTo(232,385);path.close();c.drawPath(path,fill=1,stroke=0)
    text('One recorded relationship.',77,267,9,'SansB',CYAN)
    text('Shown where it matters.',285,267,9,'Sans',MUTED)
    p('Record the origin and tray location during teardown. On return, a spatial cue connects the next recorded part to its saved origin.',48,209,499,11.5,17)
    rule(145)
    label('Creator / product owner',48,123,MUTED)
    text('Shivam Gupta',48,102,14,'SansB')
    text('AI-assisted implementation',48,84,9,'Sans',MUTED)
    box(315,130,232,57,HexColor('#F4E5DA'))
    p('<b>Your teardown. Your sequence.</b><br/>One active cue beside the work.',329,117,205,9,13)
c.showPage()

# 2 / Experience
base(2,'the experience')
y=title('The core interaction','Remember the way back.','A local record of what the user actually removed - not an AI-generated repair procedure.')
y-=32
y=smallrow('1','Mark the removal','Select the origin, choose an empty tray well, and confirm. Store the part label, quantity, locations, and removal order.',y)
y=smallrow('2','Follow one pair','Return mode reverses the confirmed removal log. Select the highlighted tray target; a directional path connects pickup to the saved origin.',y)
y=smallrow('3','Confirm, correct, continue','A wrong selection preserves progress. One active confirmation stays beside the task. Phase-specific controls recede; pause, resume, and undo preserve context.',y)
y=smallrow('4','Finish with a reconciled log','Completion means every recorded group has a user-confirmed return. It does not certify assembly, safety, or device function.',y)
rule(y+5)
y=p('Why glasses?',48,y-16,499,20,25,font='Serif')
y=p('The useful information is a relationship between two places on the bench. Keeping that relationship beside the work could reduce looking away to reconstruct photographs or notes.',48,y-11,499,11,16)
y-=22
box(48,y,499,114)
label('Scope / simulated bench and manual marking',63,y-21,CYAN)
p('A clearly labeled <b>simulated bench / manual marking</b> uses standard mouse-driven pinch interactions. Camera recognition, automatic screw measurement, persistent spatial anchors, and hardware comfort are outside this demonstration.',63,y-34,468,10.3,15)
c.showPage()

# 3 / Economics
base(3,'the business hypothesis')
y=title('A product must earn its place','Start at the repair bench.','Independent repair shops and repair classrooms are the proposed first customers. Occasional home repair is a secondary free-use segment.')
y-=30
box(48,y,499,109,NAVY)
text('$20',65,y-49,37,'Serif',BG)
text('/ active bench / month',167,y-43,13,'SansB',BG)
p('Unvalidated price experiment. Bring your own supported glasses.<br/>A free single-session mode would let users evaluate the workflow.',65,y-65,465,10,15,HexColor('#D6E6E7'))
y-=139
label('Illustrative monthly contribution / every figure is an assumption',48,y)
y-=20
rows=[('Subscription revenue','$20.00'),('Payment fee: assumed 3% + $0.30','- $0.90'),('Optional text storage and transfer','- $0.50'),('Support: 10 minutes at $12/hour','- $2.00')]
for name,val in rows:
    text(name,48,y,10.5);text(val,483,y,10.5,'SansB');rule(y-11);y-=35
text('Contribution before other costs',48,y,12,'SansB');text('$16.60',477,y,13,'SansB',CYAN)
y-=23
y=p('This is illustrative arithmetic, not a margin forecast. It excludes hardware, development, acquisition, sales, taxes, refunds, fleet management, insurance, and other business costs. Early support cost could be much higher.',48,y,499,9.7,14,MUTED)
y-=27
label('Customer-side test',48,y)
y=p('<b>60 net minutes saved each month</b> would cover the software price at an assumed $20/hour labor value. That excludes glasses and onboarding. Net savings must count time spent marking and correcting the log.',48,y-14,499,12,18)
y-=24
label('The hypothesis can fail',48,y)
p('If recording overhead exceeds recall savings, or users prefer labeled mats and bags, simplify the capture flow or stop this wedge. No customer demand or time saving has been established.',48,y-14,499,10.5,15.5,MUTED)
c.showPage()

# 4 / Evidence and validation
base(4,'evidence before scale')
y=title('A narrow advantage to prove','The reverse log already exists.','PartCue must earn its place through spatial pickup-to-origin cues, not claim invention of teardown journals or reverse checklists.')
y-=23
competitors=[
('01  Direct reverse-checklist baseline','KanadeK/parttrail describes local teardown capture, quantities, tray locations, portable JSON, and reverse reassembly. The README is primary evidence; its runtime has not been tested here.'),
('02  iFixit mats and trays','Writable mats already preserve screw locations cheaply. Observed US prices: $19.95 for Magnetic Project Mat; $36.95 for FixMat. A subscription must justify itself.'),
('03  PTC Vuforia / TeamViewer Frontline','Enterprise AR guidance, capture, assembly, and inspection workflows are established. Our specific paired spatial cue is a hypothesis to validate, not an exclusive-feature claim.')]
for head,body in competitors:
    text(head,48,y,11,'SansB');y=p(body,48,y-12,499,10,14.5,MUTED)-20
rule(y+5)
label('Pilot proposal / not yet conducted',48,y-14)
y=p('Five technicians. Matched battery-free fixtures. Counterbalanced trials with usual methods, a plain reverse checklist, and PartCue spatial mode. Count all recording and correction time.',48,y-29,499,10.5,15.5)
y-=17
for n,t in [('01','No unreported origin or quantity mismatch in the final fixture check.'),('02','At least 10% lower median total time than usual methods; spatial mode must also beat the plain reverse checklist without reducing accuracy.'),('03','Four of five complete a second session unaided and prefer another use.'),('04','Three of five accept a $20/bench/month paid pilot offer.')]:
    text(n,48,y-8,8,'SansB',CORAL)
    y=p(t,73,y+1,474,10,14)-9
y=p('A small pilot gives directional evidence. There is no established moat. Better alignment recovery, workflow fit, and earned trust remain possible future advantages.',48,y-4,499,9.4,13.5,MUTED)
y-=18
label('Primary references / research snapshot: '+SNAPSHOT.strftime('%d %B %Y'),48,y)
y=link('KanadeK/parttrail: primary README','https://github.com/KanadeK/parttrail/blob/main/README.md',48,y-13,499)
y=link('iFixit Magnetic Project Mat','https://www.ifixit.com/products/magnetic-project-mat',48,y-3,245)
link('iFixit FixMat','https://www.ifixit.com/products/fixmat',310,y+13,237)
y=link('PTC Vuforia: AR work instructions','https://www.ptc.com/en/technologies/augmented-reality/work-instructions',48,y-3,245)
link('TeamViewer Frontline','https://www.teamviewer.com/en-us/products/frontline/',310,y+13,237)
c.showPage()

# 5 / Honest status and close
base(5,'build and submission status')
if args.verified:
    heading='A working Lens.<br/>Evidence over claims.'
    deck='The actual Lens runs in Lens Studio preview. Final design observations and scenario results are recorded separately from companion software tests.'
else:
    heading='Working baseline.<br/>Final checks pending.'
    deck='The Lens baseline runs and its scenarios passed. Direct tray selection and phase-based UI are being refined; the final design needs a fresh scenario run and capture.'
y=title('Evidence snapshot / '+SNAPSHOT.strftime('%d %B %Y'),heading,deck)
y-=21
box(48,y,499,99,NAVY)
text(str(args.software_tests),65,y-40,31,'Serif',BG);text('SOFTWARE TESTS',65,y-59,8,'SansB',HexColor('#B4D7D8'))
text(f'{args.leaf_passed}/{args.leaf_total}',233,y-40,31,'Serif',BG);text('LEAF '+('FINAL' if args.verified else 'BASELINE'),233,y-59,8,'SansB',HexColor('#B4D7D8'))
text('CHECKED' if args.verified else 'PENDING',400,y-39,18,'Serif',BG);text('FINAL DESIGN',400,y-59,8,'SansB',HexColor('#B4D7D8'))
text('Automated software checks and manual browser QA are separate from Lens validation.',65,y-83,8.5,'Sans',BG)
y-=122
label('Observed in the companion browser flow',48,y)
y=p('Four-part record/return; wrong-part and quantity rejection; pause, resume, undo, and completion. Account registration, save/reload/load, multi-tab conflict handling, valid import with a new ID, and invalid import preserving the job.',48,y-14,499,10.2,14.5)
y-=18
label('Lens implementation and verification',48,y)
if args.verified:
    lens_detail='Built through CLAD and official Lens Studio MCP. The final preview demonstrates direct tray selection, one active paired cue, phase-based controls, and correction paths. The passing scenario count above refers to this checked design.'
else:
    lens_detail='Built through CLAD and official Lens Studio MCP. Six baseline LEAF scenarios passed. The design pass adds direct tray selection and phase-specific controls. Its results must be rerun before claiming final acceptance.'
y=p(lens_detail,48,y-14,499,10.2,14.5)
y-=18
label('What remains unproven',48,y)
y=p('The scene is an authored simulated bench with manual marking. There is no camera recognition or automatic installation verification. Glasses comfort, physical tracking, measured time savings, and willingness to pay require device and user studies. Companion and Lens do not automatically synchronize.',48,y-14,499,10.2,14.5)
y-=21
text('Before submission',48,y,20,'Serif');y-=26
for t in [
    'Retain final Lens capture, clean runtime logs, and scenario results.',
    'Push final project files and planning to the <link href="https://github.com/shi1720/partcue" color="#16858E"><u>public PartCue repository</u></link>.',
    'Record the actual preview; publish a YouTube demo under three minutes.',
    'Check submission copy against the final evidence and official rules.'
]:
    c.setStrokeColor(CYAN);c.setLineWidth(.9);c.rect(49,y-8,8,8,stroke=1,fill=0)
    y=p(t,69,y+2,478,10,14)-11
y-=3
rule(y)
y=p('The promise is simple. The proof must be real.',48,y-17,499,19,25,font='SerifI')
c.showPage()
c.save()
print(OUT)

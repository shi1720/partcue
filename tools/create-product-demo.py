#!/usr/bin/env python3
"""Compose PartCue's narrated product demo from verified native and browser media.

No capture is synthesized, cropped, accelerated, or modified in place. The native
opening is source 0..71 continuously; the spatial excerpt is 123..143.7. Browser
CDP change frames retain their original timestamps, including unchanged-page dwell.
A required edit plan selects real intervals whose total is exactly 54.875 seconds.
Explicit capture endedAt is preferred. --allow-mtime-stop permits older manifests'
filesystem modification time as an approximate capture stop; this is recorded in
the edit provenance. An interval outside the captured bounds is always refused.

Dependencies: Python 3.10+, Pillow>=10, ffmpeg/ffprobe with libx264, and the sibling
create-demo.py (shared font, wrapping, hashing, media validation helpers). No APIs,
network, display, model, downloaded font or video-editing application is needed.

Example (run from the repository):
  python3 tools/create-product-demo.py --plan ../../work/product-web-edit.json \\
    --output demo/partcue-demo-v2.mp4 --allow-mtime-stop
  python3 tools/create-product-demo.py --plan edit.json --validate-only

Edit plan version 1:
 {"version":1, "browserClips":[
   {"manifest":"capture/manifest.json", "start":0, "end":9.5,
    "title":"A separate companion.", "body":"Actual browser capture.",
    "eyebrow":"BROWSER / CAPTURED EXCERPT"}
 ]}
Manifest paths resolve relative to the plan, media defaults relative to this repo.
Clip start/end are seconds relative to the first recorded CDP frame. Browser clips
must sum to 54.875s, preserving real elapsed time at 1x. Manifest frames must remain
inside the manifest directory. Unchanged zero-frame recordings may explicitly name unchangedFromManifest; these
use the last actual viewport and must visibly say RESULT HELD. No interval may
extend beyond the genuine unchanged recording.

Outputs: chosen .mp4 and sibling .srt and .edit.json. Refuses existing outputs
unless --overwrite is explicit; raw inputs, captures, script, fonts and narration
are protected even with --overwrite. A full FFmpeg decode is required before
atomic publication. This verifies media integrity, not the truth of source claims.
"""
from __future__ import annotations

import argparse
from bisect import bisect_right
from datetime import datetime, timezone
import importlib.util
import json
import math
import os
import re
from pathlib import Path
import shutil
import sys
import tempfile

from PIL import Image, ImageDraw, ImageFont

HERE = Path(__file__).resolve().parent
REPO = HERE.parent
_spec = importlib.util.spec_from_file_location("partcue_demo_helpers", HERE / "create-demo.py")
if not _spec or not _spec.loader:
    raise SystemExit("The sibling create-demo.py is required.")
h = importlib.util.module_from_spec(_spec)
sys.modules[_spec.name] = h
_spec.loader.exec_module(h)
W, H, FPS, LENGTH = 1920, 1080, 30, 156.5
WEB_START, WEB_END, SPATIAL_END = 71.0, 125.875, 146.575
CREAM, NAVY, INK = "#F5F3EC", "#101E2A", "#14232C"
MUTED, CORAL, CYAN, AMBER = "#65716F", "#FC6B4F", "#35EEE3", "#FFB44D"
WHITE = "#F8FCF8"
NATIVE_RECT = (40, 132, 1040, 894)
WEB_RECT = (40, 112, 1338, 928)
NATIVE_CARD = (1130, 132, 750, 894)
WEB_CARD = (1414, 112, 466, 929)


def say(value):
    print(value, flush=True)


def number(value, label):
    return h.numeric(value, label)


def read_json(path):
    if not path.is_file() or path.stat().st_size > 8_000_000:
        raise h.DemoError(f"Missing or oversized JSON: {path}")
    try:
        return json.loads(path.read_text())
    except (ValueError, OSError) as exc:
        raise h.DemoError(f"Cannot read JSON {path}: {exc}") from exc


def epoch(value, label):
    if isinstance(value, (int, float)) and not isinstance(value, bool):
        result = float(value)
        # CDP timestamps are seconds; accept JS Date milliseconds only explicitly.
        if result > 100_000_000_000:
            result /= 1000
        if math.isfinite(result) and result > 0:
            return result
    if isinstance(value, str):
        try:
            return datetime.fromisoformat(value.replace("Z", "+00:00")).timestamp()
        except ValueError:
            pass
    raise h.DemoError(f"{label} must be an epoch timestamp or ISO date.")


def safe_relative(root, value, label):
    if not isinstance(value, str) or not value or Path(value).is_absolute():
        raise h.DemoError(f"{label} must be a relative path.")
    path = (root / value).resolve()
    if not path.is_relative_to(root.resolve()) or not path.is_file():
        raise h.DemoError(f"{label} escapes its directory or is missing: {value}")
    return path


def capture(path, allow_mtime, unchanged_from=None):
    data = read_json(path)
    if data.get("error") or data.get("actionError"):
        raise h.DemoError(f"Capture reports an error and cannot be evidence: {path}")
    frames = data.get("frames")
    if not isinstance(frames, list):
        raise h.DemoError(f"Capture frames must be an array: {path}")
    seed_source = None
    if not frames:
        if unchanged_from is None or data.get("startedAt") is None or data.get("endedAt") is None:
            raise h.DemoError(f"Unchanged capture needs explicit times and unchangedFromManifest: {path}")
        prior = capture(unchanged_from, allow_mtime)
        seed_source = prior["frames"][-1][1]
        # An explicit editorial result hold uses the last actual viewport. It is
        # visibly labeled RESULT HELD, and never pretends to show an interaction.
        frames = [{"timestamp":epoch(data["startedAt"],"unchanged capture start"),"file":seed_source.name}]

    result, previous, dimensions = [], -math.inf, None
    for index, frame in enumerate(frames):
        if not isinstance(frame, dict):
            raise h.DemoError("Capture frame must be an object.")
        timestamp = epoch(frame.get("timestamp"), "frame timestamp")
        if timestamp < previous:
            raise h.DemoError(f"Capture timestamps go backwards: {path}")
        image = seed_source if seed_source is not None else safe_relative(path.parent, frame.get("file"), "capture frame")
        with Image.open(image) as im:
            size = im.size
            im.verify()
        if dimensions is None:
            dimensions = size
        if size != dimensions:
            raise h.DemoError(f"Capture changes dimensions: {path}")
        # At equal timestamps the most recent change is the displayed frame.
        if result and timestamp == previous:
            result[-1] = (timestamp, image)
        else:
            result.append((timestamp, image))
        previous = timestamp
    stop_value = data.get("endedAt", data.get("stoppedAt", data.get("captureEndedAt")))
    if stop_value is not None:
        stop, method = epoch(stop_value, "capture endedAt"), "explicit capture stop"
    elif allow_mtime:
        stop, method = path.stat().st_mtime, "manifest filesystem mtime (approximate capture stop)"
    else:
        raise h.DemoError(f"Capture lacks endedAt: {path}. Supply explicit stop metadata or --allow-mtime-stop.")
    if stop < result[-1][0] - 0.005 or stop - result[0][0] > 600:
        raise h.DemoError(f"Capture stop does not bound the frames plausibly: {path}")
    stop = max(stop, result[-1][0])
    if stop <= result[0][0]:
        raise h.DemoError(f"Capture has no positive elapsed interval: {path}")
    return {"path": path, "frames": result, "start": result[0][0], "stop": stop,
            "duration": stop - result[0][0], "dimensions": dimensions, "stopMethod": method,
            "unchangedSeed": str(Path(unchanged_from.parent.name) / unchanged_from.name) if unchanged_from else None}


def load_plan(path, allow_mtime):
    data = read_json(path)
    if data.get("version") != 1 or not isinstance(data.get("browserClips"), list):
        raise h.DemoError("Edit plan must have version 1 and browserClips.")
    cache, clips, cursor = {}, [], WEB_START
    for i, item in enumerate(data["browserClips"]):
        if not isinstance(item, dict):
            raise h.DemoError("Each browser clip must be an object.")
        value = item.get("manifest")
        if not isinstance(value, str):
            raise h.DemoError("Every browser clip needs a manifest path.")
        manifest = (path.parent / value).resolve()
        if manifest not in cache:
            seed_value = item.get("unchangedFromManifest")
            seed = (path.parent / seed_value).resolve() if isinstance(seed_value,str) else None
            if seed and "RESULT HELD" not in str(item.get("eyebrow","")):
                raise h.DemoError("An unchanged seeded view must be visibly labeled RESULT HELD.")
            cache[manifest] = capture(manifest, allow_mtime, seed)
        cap = cache[manifest]
        start = number(item.get("start", 0), f"clip {i} start")
        end = number(item.get("end", cap["duration"]), f"clip {i} end")
        if end <= start or end > cap["duration"] + 0.005:
            raise h.DemoError(f"Clip {i} lies outside captured duration {cap['duration']:.3f}s.")
        end = min(end, cap["duration"])
        title = h.text(item.get("title"), "browser title", 65)
        body = h.text(item.get("body"), "browser body", 280)
        eyebrow = h.text(item.get("eyebrow", "BROWSER / CAPTURED EXCERPT"), "browser eyebrow", 50)
        clips.append({"capture": cap, "start": start, "end": end, "globalStart": cursor,
                      "globalEnd": cursor + end-start, "title": title, "body": body, "eyebrow": eyebrow})
        cursor += end-start
    if abs(cursor-WEB_END) > 0.002:
        raise h.DemoError(f"Browser excerpts total {cursor-WEB_START:.3f}s; exactly {WEB_END-WEB_START:.3f}s required.")
    return clips, list(cache.values())


def quote_concat(path):
    # ffconcat quoting, not shell quoting. Files are never passed through a shell.
    return "'" + str(path).replace("'", "'\\''") + "'"


def capture_concat(clip, directory, index):
    cap = clip["capture"]
    a, b = cap["start"]+clip["start"], cap["start"]+clip["end"]
    frames = cap["frames"]
    times = [f[0] for f in frames]
    current = max(0, bisect_right(times, a)-1)
    intervals = []
    while current < len(frames):
        ts, image = frames[current]
        next_ts = frames[current+1][0] if current+1 < len(frames) else cap["stop"]
        lo, hi = max(a, ts), min(b, next_ts)
        if hi > lo:
            intervals.append((image, hi-lo))
        if next_ts >= b:
            break
        current += 1
    if not intervals or abs(sum(d for _, d in intervals)-(b-a)) > .005:
        raise h.DemoError("Cannot reconstruct the full selected capture interval.")
    path = directory / f"browser-{index:02d}.ffconcat"
    lines = ["ffconcat version 1.0"]
    for image, duration in intervals:
        lines += ["file " + quote_concat(image), "option framerate 1000", f"duration {duration:.9f}"]
    lines += ["file " + quote_concat(intervals[-1][0]), "option framerate 1000"]
    path.write_text("\n".join(lines) + "\n")
    return path


def card_at(t, clips):
    native = [
        (0, 5.5, "01 / SPATIAL MEMORY", "Every part has a way home.", "After an interruption, similar parts can turn reassembly into a guessing game.", CORAL),
        (5.5, 10, "ACTUAL LENS STUDIO PREVIEW", "Your work. Your record.", "A simulated bench with four authored parts and predefined origins.", CYAN),
        (10, 24, "MANUAL TEARDOWN", "Choose. Place. Record.", "Select the part and tray well, then explicitly record each removal.", AMBER),
        (24, 35, "RETURN / LAST OUT, FIRST BACK", "Pickup and origin. Together.", "Amber marks the tray pickup. Cyan marks its recorded origin. A wrong selection cannot advance.", CYAN),
        (35, 42, "RECOVERY / PAUSE + RESUME", "An interruption is expected.", "Pause clears the cues. Resume restores the same next part.", CYAN),
        (42, 49, "RECOVERY / UNDO", "A correction keeps context.", "Undo restores the previous return. Confirmation advances the record once.", AMBER),
        (49, 61, "RETURN / USER CONFIRMATIONS", "One part at a time.", "The path clears when all four recorded returns are confirmed. Physical installation is not verified.", CYAN),
        (61, 71, "SESSION CONTROL", "Restart deliberately.", "A confirmation protects the active record. Lens sessions and companion records remain separate.", CORAL),
    ]
    for start, end, eye, title, body, accent in native:
        if start <= t < end:
            return eye, title, body, accent
    if t < WEB_END:
        for clip in clips:
            if clip["globalStart"] <= t < clip["globalEnd"] + .00001:
                return clip["eyebrow"], clip["title"], clip["body"], CORAL
    if t < SPATIAL_END:
        return ("03 / WORLD SPACE", "The next test is the bench.",
                "Continuous camera movement in the actual preview.\n\nA measured pilot must beat mats, photos and a reverse checklist, including recording time.\n\nGlasses comfort and physical alignment still need device testing.", CYAN)
    return ("PARTCUE / TRY THE COMPANION", "Every part has a way home.",
            "partcue.web.app\n\nCreated by Shivam Gupta with AI assistance.\n\nFollow your own record, one part at a time.", CORAL)


def normalize_captions(captions):
    """Attach timing-token punctuation to its preceding readable caption.

    Kokoro token times may put sentence punctuation into the following chunk or
    into its own 150ms chunk. Punctuation is not spoken, so preserve word cue
    times; merge an empty punctuation-only interval into the preceding cue.
    Never drop or reorder a spoken word, or silently discard an orphan mark.
    """
    cleaned = []
    for original in captions:
        if not isinstance(original, dict):
            raise h.DemoError("Each caption must be an object.")
        cue = dict(original)
        cue["start"] = number(cue.get("start"), "caption start")
        cue["end"] = number(cue.get("end"), "caption end")
        if cue["end"] <= cue["start"]:
            raise h.DemoError("A caption must have positive duration.")
        value = h.text(cue.get("text"), "caption text", 220)
        match = re.match(r"^([,.;:!?…]+)\s*(.*)$", value, flags=re.DOTALL)
        if match:
            if not cleaned:
                raise h.DemoError("Caption punctuation has no preceding sentence.")
            mark, value = match.groups()
            previous = cleaned[-1]
            if not previous["text"].endswith(mark):
                previous["text"] = previous["text"].rstrip() + mark
            if not value:
                previous["end"] = max(previous["end"], cue["end"])
                continue
        cue["text"] = value
        cleaned.append(cue)
    return cleaned


def font(path, size):
    return ImageFont.truetype(str(path), size)


def lines(draw, text, fnt, x, y, width, color, leading):
    for paragraph in text.split("\n"):
        if not paragraph:
            y += leading*.5
            continue
        for line in h.wrapped(draw, paragraph, fnt, width):
            draw.text((x,y), line, font=fnt, fill=color)
            y += leading
    return y


def overlay(path, t, clips, captions, regular, bold):
    im = Image.new("RGBA", (W,H), CREAM)
    d = ImageDraw.Draw(im)
    isweb = WEB_START <= t < WEB_END
    rect, panel = (WEB_RECT,WEB_CARD) if isweb else (NATIVE_RECT,NATIVE_CARD)
    vx,vy,vw,vh = rect
    px,py,pw,ph = panel
    d.rectangle((vx,vy,vx+vw-1,vy+vh-1), fill=(0,0,0,0))
    # Brand and persistent, legible source/voice disclosures.
    d.rounded_rectangle((40,29,76,65), radius=10, fill=CORAL)
    d.text((50,30), "P", font=font(bold,25), fill=NAVY)
    d.text((90,26), "PartCue", font=font(bold,34), fill=NAVY)
    phase = "WEB COMPANION / CAPTURED EXCERPTS" if isweb else ("LENS STUDIO / CONTINUOUS SPATIAL EXCERPT" if t>=WEB_END and t<SPATIAL_END else "LENS STUDIO / ACTUAL PREVIEW")
    if t>=SPATIAL_END:
        phase="LENS STUDIO / CAPTURED RETURN VIEW"
    d.text((340,37), phase, font=font(bold,18), fill=MUTED)
    d.text((40,1052), "Manual simulated bench  •  Four authored parts  •  No automatic recognition", font=font(regular,18), fill=MUTED)
    label="Synthetic AI guide  •  Stock voice"
    d.text((W-40-d.textlength(label,font=font(regular,18)),1052),label,font=font(regular,18),fill=MUTED)
    d.rounded_rectangle((px,py,px+pw,py+ph),radius=26,fill=NAVY)
    eyebrow,title,body,accent=card_at(t,clips)
    pad=34 if isweb else 44
    left, width=px+pad,pw-2*pad
    d.rounded_rectangle((left,py+38,left+56,py+44),radius=3,fill=accent)
    y=py+69
    y=lines(d,eyebrow,font(bold,16 if isweb else 20),left,y,width,accent,24 if isweb else 29)
    y+=27
    y=lines(d,title,font(bold,36 if isweb else 52),left,y,width,WHITE,43 if isweb else 60)
    y+=30
    y=lines(d,body,font(regular,22 if isweb else 29),left,y,width,"#C2CFCC",31 if isweb else 40)
    caption = next((c["text"] for c in captions if c["start"] <= t < c["end"]), "")
    # A fixed caption zone avoids obscuring any captured controls.
    cap_top=py+ph-(265 if isweb else 235)
    if y>cap_top-30:
        raise h.DemoError(f"Card overflows at {t:.3f}s; simplify its copy.")
    d.line((left,cap_top-18,left+width,cap_top-18),fill="#34464B",width=2)
    d.text((left,cap_top),"GUIDE",font=font(bold,14 if isweb else 17),fill=accent)
    cap_end=lines(d,caption,font(regular,23 if isweb else 31),left,cap_top+30,width,WHITE,31 if isweb else 41)
    if cap_end>py+ph-25:
        raise h.DemoError(f"Caption overflows at {t:.3f}s.")
    im.save(path)


def make_overlays(directory, clips, captions, regular, bold):
    bounds={0.0,LENGTH,5.5,10.0,24.0,35.0,42.0,49.0,61.0,WEB_START,WEB_END,SPATIAL_END}
    for clip in clips:
        bounds.update([clip["globalStart"],clip["globalEnd"]])
    for c in captions:
        bounds.update([c["start"],c["end"]])
    times=sorted(t for t in bounds if 0<=t<=LENGTH)
    result=["ffconcat version 1.0"]
    last=None
    for i,(a,b) in enumerate(zip(times,times[1:])):
        if b-a<.0001:
            continue
        last=directory/f"overlay-{i:03d}.png"
        overlay(last,(a+b)/2,clips,captions,regular,bold)
        result.extend(["file "+quote_concat(last),"option framerate 1000",f"duration {b-a:.9f}"])
    result.extend(["file "+quote_concat(last),"option framerate 1000"])
    path=directory/"overlays.ffconcat"
    path.write_text("\n".join(result)+"\n")
    return path


def main():
    p=argparse.ArgumentParser(description=__doc__,formatter_class=argparse.RawDescriptionHelpFormatter)
    p.add_argument("--plan",required=True,type=Path)
    p.add_argument("--output",type=Path,default=REPO/"demo/partcue-demo-v2.mp4")
    p.add_argument("--native",type=Path,default=REPO/"demo/raw/partcue-workflow-final.mp4")
    p.add_argument("--spatial",type=Path,default=REPO/"demo/raw/partcue-spatial.mp4")
    p.add_argument("--closing-image",type=Path,default=REPO/"docs/evidence/lens-return.png")
    p.add_argument("--narration",type=Path,default=REPO/"demo/partcue-guide-v2.wav")
    p.add_argument("--narration-manifest",type=Path,default=REPO/"demo/narration-v2.json")
    p.add_argument("--font",type=Path)
    p.add_argument("--bold-font",type=Path)
    p.add_argument("--ffmpeg",default="ffmpeg")
    p.add_argument("--ffprobe",default="ffprobe")
    p.add_argument("--allow-mtime-stop",action="store_true")
    p.add_argument("--overwrite",action="store_true")
    p.add_argument("--validate-only",action="store_true")
    p.add_argument("--scratch",type=Path,help="Temporary working directory parent, outside deliverables.")
    args=p.parse_args()
    ffmpeg,ffprobe=h.executable(args.ffmpeg,"ffmpeg"),h.executable(args.ffprobe,"ffprobe")
    plan=args.plan.resolve()
    clips,captures=load_plan(plan,args.allow_mtime_stop)
    native,spatial,closing,narration,nmanifest=[f.resolve() for f in (args.native,args.spatial,args.closing_image,args.narration,args.narration_manifest)]
    nm=read_json(nmanifest)
    captions=nm.get("captions")
    if not isinstance(captions,list) or not captions:
        raise h.DemoError("Narration manifest needs captions.")
    captions=normalize_captions(captions)
    previous=0
    for i,c in enumerate(captions):
        a,b=number(c.get("start"),"caption start"),number(c.get("end"),"caption end")
        h.text(c.get("text"),"caption text",220)
        if a<previous-.005 or b<=a or b>LENGTH:
            raise h.DemoError("Captions overlap or exceed the video.")
        previous=b
    nmedia,smedia,amedia=h.probe(native,ffprobe,True),h.probe(spatial,ffprobe,True),h.probe(narration,ffprobe)
    if nmedia.duration<71 or smedia.duration<143.7 or not amedia.audio or abs(amedia.duration-LENGTH)>.05:
        raise h.DemoError("Source duration does not satisfy the fixed demo timeline.")
    if nm.get("combinedAudioSha256") and h.sha256(narration)!=nm["combinedAudioSha256"]:
        raise h.DemoError("Narration differs from its provenance manifest.")
    with Image.open(closing) as im:
        im.verify()
    regular,bold=Path(h.font_file(args.font)),Path(h.font_file(args.bold_font,True))
    protected={native,spatial,closing,narration,nmanifest,plan,regular,bold,HERE/"create-demo.py",Path(__file__).resolve()}
    for cap in captures:
        protected.add(cap["path"])
        protected.update(f for _,f in cap["frames"])
    output=args.output.resolve()
    if output.suffix.lower()!=".mp4":
        raise h.DemoError("Output must have .mp4 extension.")
    targets=[output,output.with_suffix(".srt"),output.with_suffix(".edit.json")]
    for target in targets:
        if target in protected or (target.exists() and any(os.path.samefile(target,x) for x in protected)):
            raise h.DemoError("An output aliases a protected input.")
        if target.exists() and not args.overwrite and not args.validate_only:
            raise h.DemoError(f"Refusing existing output: {target}; use --overwrite.")
    plan_data=read_json(plan)
    report={"editPlanSha256":h.sha256(plan),"captureCommit":plan_data.get("captureCommit"),"currentDeploymentCommit":plan_data.get("currentDeploymentCommit"),"captureNote":plan_data.get("captureNote"),"captionPolicy":"Sentence punctuation attaches to the preceding cue; standalone punctuation intervals extend that cue. Spoken words and word-cue start times are preserved.","version":2,"product":"PartCue","duration":LENGTH,"dimensions":[W,H],"fps":FPS,
            "creator":"Shivam Gupta","voice":"Synthetic stock AI guide; no voice cloning",
            "timebaseNote":"Original elapsed timing resampled to 30fps; each edit boundary is quantized to the nearest frame (at most 1/60s). No playback speed change.",
            "sourceRules":["Native opening 0..71 continuous at 1x", "Full browser viewport; captured excerpts at 1x", "Spatial source 123..143.7 continuous at 1x", "Closing captured return image, explicitly labeled"],
            "inputs":{"native":{"file":native.name,"sha256":h.sha256(native)},"spatial":{"file":spatial.name,"sha256":h.sha256(spatial)},"closing":{"file":closing.name,"sha256":h.sha256(closing)},"narration":{"file":narration.name,"sha256":h.sha256(narration)},"narrationManifest":{"file":nmanifest.name,"sha256":h.sha256(nmanifest)}},
            "browserClips":[{"capture":c["capture"]["path"].parent.name,"manifestSha256":h.sha256(c["capture"]["path"]),"frameCount":len(c["capture"]["frames"]),"dimensions":c["capture"]["dimensions"],"captureStopMethod":c["capture"]["stopMethod"],"unchangedResultSeed":c["capture"]["unchangedSeed"],"capturedDuration":c["capture"]["duration"],"sourceStart":c["start"],"sourceEnd":c["end"],"outputStart":c["globalStart"],"outputEnd":c["globalEnd"],"title":c["title"]} for c in clips]}
    if args.validate_only:
        say(json.dumps(report,indent=2));return
    output.parent.mkdir(parents=True,exist_ok=True)
    if args.scratch:
        args.scratch.mkdir(parents=True,exist_ok=True)
    with tempfile.TemporaryDirectory(prefix="partcue-product-demo-",dir=args.scratch) as tmp:
        directory=Path(tmp).resolve()
        overlay_file=make_overlays(directory,clips,captions,regular,bold)
        browser_inputs=[]
        for i,clip in enumerate(clips):
            say(f"Reconstructing actual browser excerpt {i+1}/{len(clips)} at original timing")
            source=capture_concat(clip,directory,i)
            video=directory/f"browser-{i:02d}.mp4"
            h.run([ffmpeg,"-hide_banner","-loglevel","error","-y","-f","concat","-safe","0","-i",str(source),"-t",f"{clip['end']-clip['start']:.9f}","-vf",f"fps={FPS},format=yuv420p","-an","-c:v","libx264","-preset","fast","-crf","16",str(video)],"Browser frame reconstruction",180)
            browser_inputs.append(video)
        command=[ffmpeg,"-hide_banner","-loglevel","error","-y","-i",str(native)]
        for video in browser_inputs:
            command += ["-i",str(video)]
        si=1+len(browser_inputs);ci=si+1;oi=ci+1;ai=oi+1
        command += ["-i",str(spatial),"-loop","1","-framerate",str(FPS),"-i",str(closing),"-f","concat","-safe","0","-i",str(overlay_file),"-i",str(narration)]
        sections=[(0,0,71,NATIVE_RECT,2130)]
        sections += [(i+1,0,c["end"]-c["start"],WEB_RECT,round(c["globalEnd"]*FPS)-round(c["globalStart"]*FPS)) for i,c in enumerate(clips)]
        sections += [(si,123,143.7,NATIVE_RECT,621),(ci,0,LENGTH-SPATIAL_END,NATIVE_RECT,298)]
        graph=[]
        for i,(idx,start,end,rect,frame_count) in enumerate(sections):
            x,y,w,height=rect
            graph.append(f"[{idx}:v]trim=start={start:.9f}:end={end:.9f},setpts=PTS-STARTPTS,scale={w}:{height}:force_original_aspect_ratio=decrease:force_divisible_by=2:flags=lanczos,pad={w}:{height}:(ow-iw)/2:(oh-ih)/2:color={NAVY},setsar=1,fps={FPS},tpad=stop_mode=clone:stop_duration=0.034,trim=end_frame={frame_count},setpts=N/({FPS}*TB),pad={W}:{H}:{x}:{y}:color={CREAM}[c{i}]")
        graph.append("".join(f"[c{i}]" for i in range(len(sections)))+f"concat=n={len(sections)}:v=1:a=0[footage]")
        graph.append(f"[{oi}:v]setpts=PTS-STARTPTS,format=rgba[graphics]")
        graph.append("[footage][graphics]overlay=0:0:eof_action=repeat:shortest=0,format=yuv420p[final]")
        graph.append(f"[{ai}:a]atrim=duration={LENGTH},asetpts=PTS-STARTPTS,apad=whole_dur={LENGTH},alimiter=limit=0.96:level=false[audio]")
        filter_file=directory/"filters.txt";filter_file.write_text(";\n".join(graph))
        encoded=directory/"product-demo.mp4"
        command += ["-filter_complex",filter_file.read_text(),"-map","[final]","-map","[audio]","-t",str(LENGTH),"-c:v","libx264","-preset","medium","-crf","18","-pix_fmt","yuv420p","-r",str(FPS),"-c:a","aac","-b:a","192k","-ar","48000","-ac","2","-movflags","+faststart","-map_metadata","-1","-metadata","title=PartCue | Every part has a way home","-metadata","artist=Shivam Gupta","-metadata","comment=Actual Lens Studio and hosted companion captures. Manual simulated bench. Synthetic stock AI guide.",str(encoded)]
        say("Encoding the 156.5-second product demo")
        h.run(command,"Product demo encoding",1800)
        media=h.probe(encoded,ffprobe,True)
        if (media.width,media.height)!=(W,H) or abs(media.duration-LENGTH)>.1 or not media.audio:
            raise h.DemoError("Encoded output failed dimensions, duration or audio validation.")
        say("Decoding every output frame and audio packet")
        h.run([ffmpeg,"-v","error","-xerror","-i",str(encoded),"-f","null","-"],"Full final decode",300)
        report["output"]={"file":output.name,"sha256":h.sha256(encoded),"duration":media.duration,"fullDecodePassed":True}
        report["createdAt"]=datetime.now(timezone.utc).isoformat()
        srt=directory/"product-demo.srt";srt.write_text(h.srt_text(captions))
        provenance=directory/"product-demo.edit.json";provenance.write_text(json.dumps(report,indent=2)+"\n")
        for src,dst in zip((encoded,srt,provenance),targets):
            # Temp storage can live on a different filesystem; copy then atomic replace.
            staged=dst.with_name(dst.name+".partial")
            try:
                shutil.copyfile(src,staged);os.replace(staged,dst)
            finally:
                if staged.exists():staged.unlink()
    say(json.dumps(report["output"],indent=2))


if __name__=="__main__":
    try:
        main()
    except (h.DemoError,OSError,ValueError,KeyError) as exc:
        raise SystemExit(f"Product demo error: {exc}")

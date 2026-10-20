#!/usr/bin/env python3
"""Compose a PartCue demo from ACTUAL Lens Studio footage; never fabricate footage.

Dependencies: Python 3.10+, Pillow 10+, ffmpeg/ffprobe with libx264. No drawtext,
subtitles filter, downloaded fonts, GUI, network, or API credentials are needed.

Quick start (paths may contain spaces):
  python3 tools/create-demo.py --input raw-preview.mp4 --output demo.mp4
  python3 tools/create-demo.py --write-template timeline.json
  python3 tools/create-demo.py --input raw.mp4 --output demo.mp4 \
    --timeline timeline.json --audio narration.wav --audio-kind human

Timeline version 1: optional title, tagline, clips, cards, captions. Clip start/end
are seconds in the RAW input. Card/caption start/end are seconds in the EDITED
output. Clips remain chronological and non-overlapping unless individually marked
"replay": true; those segments are visibly labeled REPLAY. There are no speed
changes. Uncut footage is the default. --start/--end select one raw
range and cannot be combined with timeline clips. Cards and captions are never
inferred from a script: align them to actions actually visible in the footage.

Example:
  {"version": 1, "clips": [{"start": 2, "end": 14}],
   "cards": [{"start": 0, "end": 12, "eyebrow": "MANUAL MARKING",
              "title": "A place for this part.",
              "body": "The captured preview shows the recorded origin and tray.",
              "accent": "cyan"}],
   "captions": [{"start": 0.5, "end": 5,
                 "text": "Every mark and return confirmation is manual."}]}

Outputs: chosen .mp4, sibling .srt, sibling .edit.json, and .timeline.json with
normalized edit timings. Existing outputs are refused unless --overwrite is
explicit. The raw input, narration, timeline and font files can NEVER be replaced.
The default edition is silent; --raw-audio keeps captured source audio. Supplied
--audio requires --audio-kind human|ai-guide. AI-guide audio is permanently labeled
synthetic and must not imitate a person. --mix-raw-audio retains source sound cues
under supplied narration at --sfx-volume (default 0.3). This tool does not
synthesize narration. Square input uses a taller layout with side captions so
the actual preview remains large and no product content is cropped or covered.

Use --test-only ONLY for disposable synthetic smoke tests: it replaces the
product disclosure with an unmistakable TEST ONLY label. Such files are not demo
evidence. The tool verifies media integrity, not the truth of the supplied footage.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import math
import os
from pathlib import Path
import shutil
import subprocess
import sys
import tempfile
from dataclasses import dataclass
from typing import Any

try:
    from PIL import Image, ImageDraw, ImageFont
except ImportError:
    raise SystemExit("Pillow is required. Install it with: python3 -m pip install 'Pillow>=10'")

WIDTH, HEIGHT, FPS, MAX_SECONDS = 1920, 1080, 30, 179.0
CREAM = "#F5F3EC"
NAVY = "#101E2A"
INK = "#14232C"
MUTED = "#5B6967"
CORAL = "#FC6B4F"
CYAN = "#35EEE3"
AMBER = "#FFB44D"
WHITE = "#F8FCF8"
ACCENTS = {"coral": CORAL, "cyan": CYAN, "amber": AMBER}
VIDEO = (48, 164, 1320, 742)
SIDEBAR = (1400, 164, 472, 742)
SQUARE_LAYOUT = False


class DemoError(Exception):
    """A user-correctable media or edit problem."""


@dataclass(frozen=True)
class Media:
    duration: float
    width: int | None
    height: int | None
    audio: bool
    video: bool
    audio_duration: float | None = None


def numeric(value: Any, label: str, minimum: float = 0) -> float:
    if isinstance(value, bool) or not isinstance(value, (int, float)):
        raise DemoError(f"{label} must be a number of seconds.")
    if not math.isfinite(value) or value < minimum:
        raise DemoError(f"{label} must be finite and at least {minimum}.")
    return float(value)


def text(value: Any, label: str, maximum: int, allow_empty: bool = False) -> str:
    if not isinstance(value, str):
        raise DemoError(f"{label} must be text.")
    value = value.strip()
    if (not value and not allow_empty) or len(value) > maximum:
        raise DemoError(f"{label} must contain {'0' if allow_empty else '1'}–{maximum} characters.")
    if any(ord(c) < 32 and c != "\n" for c in value):
        raise DemoError(f"{label} contains an unsupported control character.")
    return value


def object_keys(value: Any, keys: set[str], label: str) -> dict:
    if not isinstance(value, dict):
        raise DemoError(f"{label} must be an object.")
    extra = set(value) - keys
    if extra:
        raise DemoError(f"{label} contains unsupported fields: {', '.join(sorted(extra))}.")
    return value


def executable(value: str, label: str) -> str:
    resolved = shutil.which(value)
    if not resolved:
        raise DemoError(f"{label} was not found. Install ffmpeg/ffprobe or provide --{label} PATH.")
    return resolved


def run(command: list[str], label: str, timeout: int = 60) -> subprocess.CompletedProcess:
    try:
        result = subprocess.run(command, capture_output=True, text=True, timeout=timeout, check=False)
    except subprocess.TimeoutExpired as error:
        raise DemoError(f"{label} timed out after {timeout} seconds. No raw file was modified.") from error
    except OSError as error:
        raise DemoError(f"Could not run {label}: {error}") from error
    if result.returncode:
        details = (result.stderr or result.stdout).strip()[-4000:]
        raise DemoError(f"{label} failed:\n{details}")
    return result


def probe(path: Path, ffprobe: str, require_video: bool = False) -> Media:
    if not path.is_file() or path.stat().st_size == 0:
        raise DemoError(f"Media input is missing or empty: {path}")
    result = run([ffprobe, "-v", "error", "-show_streams", "-show_format", "-of", "json", str(path)], "ffprobe", 30)
    try:
        data = json.loads(result.stdout)
        streams = data.get("streams", [])
        videos = [s for s in streams if s.get("codec_type") == "video" and not s.get("disposition", {}).get("attached_pic")]
        audio_streams = [s for s in streams if s.get("codec_type") == "audio"]
        audio = bool(audio_streams)
        stream = videos[0] if videos else None
        candidates = [data.get("format", {}).get("duration")]
        if stream:
            candidates.insert(0, stream.get("duration"))
        else:
            candidates.extend(s.get("duration") for s in streams if s.get("codec_type") == "audio")
        duration = next(float(v) for v in candidates if v not in (None, "N/A") and math.isfinite(float(v)) and float(v) > 0)
        width = int(stream["width"]) if stream else None
        height = int(stream["height"]) if stream else None
        audio_candidates = ([audio_streams[0].get("duration"), data.get("format", {}).get("duration")] if audio else [])
        audio_duration = next((float(v) for v in audio_candidates if v not in (None, "N/A") and math.isfinite(float(v)) and float(v) > 0), None)
    except (ValueError, KeyError, TypeError, StopIteration) as error:
        raise DemoError(f"Cannot determine a valid duration and dimensions for {path.name}.") from error
    if require_video and (not stream or not width or not height):
        raise DemoError(f"{path.name} does not contain a decodable video stream.")
    return Media(duration, width, height, audio, bool(stream), audio_duration)


def load_json(path: Path) -> dict:
    if not path.is_file() or path.stat().st_size > 250_000:
        raise DemoError("Timeline file is missing or exceeds 250 KB.")
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except (OSError, UnicodeError, json.JSONDecodeError) as error:
        raise DemoError(f"Could not read the timeline as UTF-8 JSON: {error}") from error


def normalize_timeline(data: Any, media: Media, start: float | None, end: float | None) -> tuple[dict, int]:
    data = object_keys(data, {"version", "title", "tagline", "clips", "cards", "captions"}, "Timeline")
    if type(data.get("version", 1)) is not int or data.get("version", 1) != 1:
        raise DemoError("Unsupported timeline version; expected 1.")
    title = text(data.get("title", "PartCue"), "Title", 24)
    tagline = text(data.get("tagline", "Every part has a way home."), "Tagline", 64)
    if "clips" in data and (start is not None or end is not None):
        raise DemoError("Use timeline clips OR --start/--end, not both.")
    clips = data.get("clips", [{"start": 0 if start is None else start, "end": media.duration if end is None else end}])
    if not isinstance(clips, list) or not 1 <= len(clips) <= 60:
        raise DemoError("Timeline clips must contain 1–60 source ranges.")
    clean_clips = []
    previous_end = 0.0
    duration = 0.0
    for index, clip in enumerate(clips):
        clip = object_keys(clip, {"start", "end", "replay"}, f"Clip {index + 1}")
        replay = clip.get("replay", False)
        if not isinstance(replay, bool):
            raise DemoError(f"Clip {index + 1} replay must be true or false.")
        a = numeric(clip.get("start"), f"Clip {index + 1} start")
        b = numeric(clip.get("end"), f"Clip {index + 1} end")
        if b <= a or b > media.duration + .025:
            raise DemoError(f"Clip {index + 1} must have start < end and remain within the {media.duration:.3f}s raw video.")
        if a < previous_end - .000001 and not replay:
            raise DemoError("Source clips must remain chronological and non-overlapping. Explicitly mark any intentional repeated excerpt with replay: true; it will be visibly labeled.")
        if b - a < 1 / FPS:
            raise DemoError(f"Clip {index + 1} is shorter than one {FPS}fps output frame.")
        clean_clips.append({"start": a, "end": min(b, media.duration), **({"replay": True} if replay else {})})
        if not replay:
            previous_end = b
        duration += min(b, media.duration) - a
    frames = math.floor((duration + .000001) * FPS)
    duration = frames / FPS
    if not 1 <= frames or duration > MAX_SECONDS:
        raise DemoError(f"The edited video must be 1 frame–{MAX_SECONDS:g}s (strictly under 3 minutes); this edit is {duration:.3f}s.")
    result = {"version": 1, "title": title, "tagline": tagline, "clips": clean_clips, "cards": [], "captions": []}
    default_cards = [{"start": 0, "end": duration, "eyebrow": "SPATIAL REPAIR MEMORY", "title": "Your teardown.\nA way back.", "body": "Actual Lens Studio preview. Every mark and return confirmation is manual.", "accent": "cyan"}]
    for kind, maximum, allowed in [("cards", 60, {"start", "end", "eyebrow", "title", "body", "accent"}), ("captions", 150, {"start", "end", "text"})]:
        entries = data.get(kind, default_cards if kind == "cards" else [])
        if not isinstance(entries, list) or len(entries) > maximum or (kind == "cards" and not entries):
            raise DemoError(f"{kind} must be an array of {'1' if kind == 'cards' else '0'}–{maximum} entries.")
        previous_end = 0.0
        for index, entry in enumerate(entries):
            entry = object_keys(entry, allowed, f"{kind}[{index}]")
            a = numeric(entry.get("start"), f"{kind}[{index}].start")
            b = numeric(entry.get("end"), f"{kind}[{index}].end")
            # Quantize all visible/SRT changes to an output frame for reliable sync.
            a = round(a * FPS) / FPS
            b = round(b * FPS) / FPS
            if a < previous_end - .000001 or b <= a or b > duration + 1 / FPS + .000001:
                raise DemoError(f"{kind}[{index}] must be ordered, non-overlapping, and within the {duration:.3f}s edited output.")
            b = min(b, duration)
            if b <= a:
                raise DemoError(f"{kind}[{index}] falls after the final output frame.")
            cleaned = {"start": a, "end": b}
            if kind == "cards":
                cleaned.update(eyebrow=text(entry.get("eyebrow", "LENS STUDIO PREVIEW"), "Card eyebrow", 36), title=text(entry.get("title"), "Card title", 90), body=text(entry.get("body", ""), "Card body", 260, True), accent=entry.get("accent", "cyan"))
                if not isinstance(cleaned["accent"], str) or cleaned["accent"] not in ACCENTS:
                    raise DemoError("Card accent must be coral, cyan, or amber.")
            else:
                cleaned["text"] = text(entry.get("text"), "Caption", 220)
            result[kind].append(cleaned)
            previous_end = b
    return result, frames


def font_file(explicit: str | None, bold: bool = False) -> str:
    if explicit:
        candidates = [explicit]
    else:
        name = "Arial Bold.ttf" if bold else "Arial.ttf"
        candidates = [
            f"/System/Library/Fonts/Supplemental/{name}",
            f"/Library/Fonts/{name}",
            f"/usr/share/fonts/truetype/dejavu/DejaVuSans{'-Bold' if bold else ''}.ttf",
            f"/usr/share/fonts/truetype/liberation2/LiberationSans-{'Bold' if bold else 'Regular'}.ttf",
            f"C:/Windows/Fonts/{'arialbd' if bold else 'arial'}.ttf",
            f"DejaVuSans{'-Bold' if bold else ''}.ttf",
        ]
    for candidate in candidates:
        try:
            loaded = ImageFont.truetype(candidate, 24)
            return str(getattr(loaded, "path", candidate))
        except OSError:
            continue
    raise DemoError("No scalable local font was found. Provide --font-regular PATH and --font-bold PATH to installed TTF/OTF fonts.")


def wrapped(draw: ImageDraw.ImageDraw, value: str, font: ImageFont.FreeTypeFont, width: int) -> list[str]:
    lines = []
    for paragraph in value.split("\n"):
        if not paragraph:
            lines.append("")
            continue
        current = ""
        for word in paragraph.split():
            if draw.textlength(word, font=font) > width:
                raise DemoError("An overlay contains a word too wide to fit. Use shorter words or insert spaces.")
            candidate = f"{current} {word}".strip()
            if current and draw.textlength(candidate, font=font) > width:
                lines.append(current)
                current = word
            else:
                current = candidate
        lines.append(current)
    return lines


def draw_lines(draw: ImageDraw.ImageDraw, lines: list[str], x: int, y: int, font: ImageFont.FreeTypeFont, color: str, leading: int) -> int:
    for line in lines:
        draw.text((x, y), line, font=font, fill=color, anchor="lt")
        y += leading
    return y


def overlay_image(path: Path, timeline: dict, card: dict | None, caption: dict | None, card_index: int, regular: str, bold: str, edition: str, test_only: bool, replay: bool = False) -> None:
    image = Image.new("RGBA", (WIDTH, HEIGHT), CREAM)
    draw = ImageDraw.Draw(image)
    f = lambda size: ImageFont.truetype(regular, size)
    b = lambda size: ImageFont.truetype(bold, size)
    vx, vy, vw, vh = VIDEO
    sx, sy, sw, sh = SIDEBAR
    # The transparent rectangle exposes ONLY the decoded real source video.
    draw.rounded_rectangle((vx - 2, vy - 2, vx + vw + 2, vy + vh + 2), radius=8, fill="#C8D0C7")
    draw.rectangle((vx, vy, vx + vw - 1, vy + vh - 1), fill=(0, 0, 0, 0))
    draw.rounded_rectangle((sx, sy, sx + sw, sy + sh), radius=18, fill=NAVY)
    draw.rounded_rectangle((48, 44, 108, 104), radius=16, fill=CORAL)
    draw.text((65, 52), "P", font=b(45), fill=INK, anchor="lt")
    draw.text((126, 47), timeline["title"], font=b(45), fill=INK, anchor="lt")
    title_width = draw.textlength(timeline["title"], font=b(45))
    draw.text((int(145 + title_width), 58), timeline["tagline"], font=f(28), fill=MUTED, anchor="lt")
    heading = "PARTCUE  /  ACTUAL LENS STUDIO PREVIEW AND WEB COMPANION"
    if replay:
        heading = "REPLAY  /  EXCERPT FROM THE SAME CAPTURED LENS STUDIO FOOTAGE"
    if test_only:
        heading = "TEST ONLY  /  SYNTHETIC INPUT  /  NOT PRODUCT EVIDENCE"
    draw.text((48, 116), heading, font=b(17), fill=MUTED if not test_only else "#B53521", anchor="lt")
    credit = "Shivam Gupta · Built with AI assistance"
    credit_width = draw.textlength(credit, font=f(20))
    draw.text((int(WIDTH - 48 - credit_width), 66), credit, font=f(20), fill=MUTED, anchor="lt")
    if test_only:
        draw.rectangle((vx + 12, vy + 12, vx + 366, vy + 65), fill=CORAL)
        draw.text((vx + 30, vy + 25), "TEST ONLY · NOT A DEMO", font=b(23), fill=INK, anchor="lt")
    accent = ACCENTS[card["accent"]] if card else CYAN
    draw.rectangle((sx + 30, sy + 34, sx + 86, sy + 39), fill=accent)
    count = f"{card_index + 1:02d} / {len(timeline['cards']):02d}" if card else "PARTCUE"
    draw.text((sx + sw - 115, sy + 29), count, font=f(19), fill="#A0B8BB", anchor="lt")
    if card:
        draw.text((sx + 30, sy + 76), card["eyebrow"].upper(), font=b(17), fill=accent, anchor="lt")
        chosen = None
        for size in (48, 45, 42, 39, 36):
            title_font, body_font = b(size), f(27 if size >= 42 else 25)
            title_lines = wrapped(draw, card["title"], title_font, sw - 60)
            body_lines = wrapped(draw, card["body"], body_font, sw - 60)
            title_height = len(title_lines) * (size + 9)
            body_height = len(body_lines) * (body_font.size + 12)
            if len(title_lines) <= 5 and title_height + body_height + 30 <= sh - (450 if SQUARE_LAYOUT else 294):
                chosen = (title_font, body_font, title_lines, body_lines)
                break
        if not chosen:
            raise DemoError(f"Card {card_index + 1} is too long for a readable sidebar. Shorten its title or body.")
        title_font, body_font, title_lines, body_lines = chosen
        y = draw_lines(draw, title_lines, sx + 30, sy + 122, title_font, WHITE, title_font.size + 9)
        draw_lines(draw, body_lines, sx + 30, y + 26, body_font, "#BED0D0", body_font.size + 12)
    draw.line((sx + 30, sy + sh - 150, sx + sw - 30, sy + sh - 150), fill="#354A54", width=1)
    draw.ellipse((sx + 31, sy + sh - 122, sx + 39, sy + sh - 114), fill=CYAN)
    draw.text((sx + 52, sy + sh - 128), "Saved origin", font=f(20), fill="#D4E3E1", anchor="lt")
    draw.ellipse((sx + 31, sy + sh - 86, sx + 39, sy + sh - 78), fill=AMBER)
    draw.text((sx + 52, sy + sh - 92), "Tray position", font=f(20), fill="#D4E3E1", anchor="lt")
    draw.text((sx + 30, sy + sh - 42), edition, font=f(15), fill="#A7BDC0", anchor="lt")
    if caption:
        caption_font = f(29 if SQUARE_LAYOUT else 31)
        lines = wrapped(draw, caption["text"], caption_font, sw - 76 if SQUARE_LAYOUT else WIDTH - 160)
        if len(lines) > (4 if SQUARE_LAYOUT else 2):
            raise DemoError("A caption needs too many readable lines. Split it into shorter timed captions.")
        caption_box = (sx + 24, sy + sh - 312, sx + sw - 24, sy + sh - 168) if SQUARE_LAYOUT else (48, 928, 1872, 1014)
        draw.rounded_rectangle(caption_box, radius=10, fill="#1C3541" if SQUARE_LAYOUT else NAVY)
        start_y = caption_box[1] + (144 - len(lines) * 34) / 2 if SQUARE_LAYOUT else 945 if len(lines) == 1 else 937
        for line in lines:
            width = draw.textlength(line, font=caption_font)
            center = sx + sw / 2 if SQUARE_LAYOUT else WIDTH / 2
            draw.text((center - width / 2, start_y), line, font=caption_font, fill=WHITE, anchor="lt")
            start_y += 34 if SQUARE_LAYOUT else 37
    else:
        if SQUARE_LAYOUT:
            draw_lines(draw, ["Spatial memory of", "your own teardown."], sx + 30, sy + sh - 290, f(27), "#BED0D0", 38)
        else:
            draw.text((48, 956), "Spatial memory of your own teardown.", font=f(25), fill=MUTED, anchor="lt")
    disclosure = "ACTUAL LENS STUDIO PREVIEW  ·  SIMULATED INPUT  ·  MANUAL MARKING  ·  NO AUTOMATIC RECOGNITION"
    if test_only:
        disclosure = "TEST ONLY  ·  SYNTHETIC INPUT  ·  NOT A PRODUCT DEMO  ·  NOT SUBMISSION EVIDENCE"
    draw.line((48, 1032, 1872, 1032), fill="#CCD4CA", width=1)
    draw.text((48, 1048), disclosure, font=b(17), fill=MUTED if not test_only else "#B53521", anchor="lt")
    if edition.startswith("AI guide"):
        label = "SYNTHETIC GUIDE NARRATION"
        width = draw.textlength(label, font=b(15))
        draw.text((WIDTH - 48 - width, 1049), label, font=b(15), fill="#B53521", anchor="lt")
    image.save(path, "PNG", optimize=True)


def overlays(directory: Path, timeline: dict, frames: int, regular: str, bold: str, edition: str, test_only: bool) -> Path:
    points = {0, frames}
    for kind in ("cards", "captions"):
        for cue in timeline[kind]:
            points.update((round(cue["start"] * FPS), round(cue["end"] * FPS)))
    manifest = ["ffconcat version 1.0"]
    clip_times = []
    elapsed = 0.0
    for clip in timeline["clips"]:
        clip_times.append((elapsed, elapsed + clip["end"] - clip["start"], clip.get("replay", False)))
        elapsed += clip["end"] - clip["start"]
        points.add(min(frames, round(elapsed * FPS)))
    points = sorted(points)
    cache: dict[tuple[int, int, bool], Path] = {}
    last_path = None
    for a, b in zip(points, points[1:]):
        if b <= a:
            continue
        t = a / FPS
        card_index = next((i for i, cue in enumerate(timeline["cards"]) if cue["start"] <= t < cue["end"]), -1)
        caption_index = next((i for i, cue in enumerate(timeline["captions"]) if cue["start"] <= t < cue["end"]), -1)
        replay = next((item[2] for item in clip_times if item[0] <= t < item[1]), False)
        key = (card_index, caption_index, replay)
        if key not in cache:
            path = directory / f"overlay-{len(cache):03d}.png"
            overlay_image(path, timeline, timeline["cards"][card_index] if card_index >= 0 else None, timeline["captions"][caption_index] if caption_index >= 0 else None, card_index, regular, bold, edition, test_only, replay)
            cache[key] = path
        path = cache[key]
        # All paths here are internally generated simple file names.
        manifest.extend([f"file '{path.name}'", f"duration {(b - a) / FPS:.9f}"])
        last_path = path
    manifest.append(f"file '{last_path.name}'")
    path = directory / "overlays.ffconcat"
    path.write_text("\n".join(manifest) + "\n", encoding="utf-8")
    return path


def srt_text(captions: list[dict]) -> str:
    def stamp(seconds: float) -> str:
        milliseconds = round(seconds * 1000)
        hours, remainder = divmod(milliseconds, 3_600_000)
        minutes, remainder = divmod(remainder, 60_000)
        secs, ms = divmod(remainder, 1000)
        return f"{hours:02d}:{minutes:02d}:{secs:02d},{ms:03d}"
    return "\n\n".join(f"{index + 1}\n{stamp(cue['start'])} --> {stamp(cue['end'])}\n{cue['text']}" for index, cue in enumerate(captions)) + ("\n" if captions else "")


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for block in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(block)
    return digest.hexdigest()


def command_graph(timeline: dict, frames: int, raw_audio: bool, narration: bool, audio_start: float, sfx_volume: float) -> tuple[str, str | None]:
    clips = timeline["clips"]
    count = len(clips)
    duration = frames / FPS
    graph = []
    for i, clip in enumerate(clips):
        clip_duration = clip["end"] - clip["start"]
        graph.append(f"[{i}:v:0]trim=duration={clip_duration:.9f},setpts=PTS-STARTPTS,scale={VIDEO[2]}:{VIDEO[3]}:force_original_aspect_ratio=decrease:force_divisible_by=2,pad={VIDEO[2]}:{VIDEO[3]}:(ow-iw)/2:(oh-ih)/2:color=0x101E2A,setsar=1,fps={FPS}[v{i}]")
        if raw_audio:
            graph.append(f"[{i}:a:0]atrim=duration={clip_duration:.9f},asetpts=PTS-STARTPTS,aresample=48000,aformat=sample_fmts=fltp:channel_layouts=stereo[a{i}]")
    if count > 1:
        graph.append("".join(f"[v{i}]" + (f"[a{i}]" if raw_audio else "") for i in range(count)) + f"concat=n={count}:v=1:a={1 if raw_audio else 0}[edited]" + ("[captured]" if raw_audio else ""))
    else:
        graph.append("[v0]null[edited]")
        if raw_audio:
            graph.append("[a0]anull[captured]")
    graph.append(f"[edited]pad={WIDTH}:{HEIGHT}:{VIDEO[0]}:{VIDEO[1]}:color=0xF5F3EC[base]")
    graph.append(f"[{count}:v:0]fps={FPS},setpts=PTS-STARTPTS[graphics]")
    graph.append("[base][graphics]overlay=0:0:eof_action=repeat:format=auto,format=yuv420p[final]")
    audio = None
    if raw_audio:
        graph.append(f"[captured]volume={sfx_volume if narration else 1:.6f},apad,atrim=duration={duration:.9f}[sourceaudio]")
        audio = "sourceaudio"
    if narration:
        graph.append(f"[{count + 1}:a:0]atrim=start={audio_start:.9f}:end={audio_start + duration:.9f},asetpts=PTS-STARTPTS,aresample=48000,aformat=sample_fmts=fltp:channel_layouts=stereo,apad,atrim=duration={duration:.9f}[narration]")
        audio = "narration"
    if raw_audio and narration:
        graph.append(f"[sourceaudio][narration]amix=inputs=2:duration=longest:normalize=0,alimiter=limit=0.95,atrim=duration={duration:.9f}[audio]")
        audio = "audio"
    return ";\n".join(graph), audio


def template() -> dict:
    return {"version": 1, "title": "PartCue", "tagline": "Every part has a way home.", "clips": [{"start": 0, "end": 12}], "cards": [{"start": 0, "end": 12, "eyebrow": "MANUAL MARKING", "title": "Your teardown.\nA way back.", "body": "Replace this copy with a concise description of the action actually visible in these captured frames.", "accent": "cyan"}], "captions": [{"start": 0, "end": 5, "text": "Every mark and return confirmation is manual."}, {"start": 5, "end": 12, "text": "Align narration and captions with actions captured in the actual Lens Studio preview."}]}


def main() -> int:
    global VIDEO, SIDEBAR, SQUARE_LAYOUT
    parser = argparse.ArgumentParser(description="Polished 1080p PartCue demo compositor using real Lens Studio footage.", formatter_class=argparse.RawDescriptionHelpFormatter, epilog=__doc__)
    parser.add_argument("--input", type=Path, help="Actual raw Lens Studio preview recording")
    parser.add_argument("--output", type=Path, help="New MP4 output; raw input is never overwritten")
    parser.add_argument("--timeline", type=Path, help="Version 1 JSON edit/card/caption timeline")
    parser.add_argument("--start", type=float, help="Single-clip start in raw seconds")
    parser.add_argument("--end", type=float, help="Single-clip end in raw seconds")
    group = parser.add_mutually_exclusive_group()
    group.add_argument("--audio", type=Path, help="Supplied narration; must cover the edited duration")
    group.add_argument("--raw-audio", action="store_true", help="Keep source audio, trimmed with its source clips")
    parser.add_argument("--audio-kind", choices=["human", "ai-guide"], help="Required for --audio; ai-guide is permanently labeled synthetic")
    parser.add_argument("--audio-start", type=float, default=0, help="Offset into supplied narration; default 0")
    parser.add_argument("--mix-raw-audio", action="store_true", help="Mix captured source SFX under supplied --audio narration")
    parser.add_argument("--sfx-volume", type=float, default=.3, help="Source SFX gain when mixed under narration; 0–1, default .3")
    parser.add_argument("--font-regular", help="Optional installed TTF/OTF font path")
    parser.add_argument("--font-bold", help="Optional installed bold TTF/OTF font path")
    parser.add_argument("--ffmpeg", default="ffmpeg", help="ffmpeg executable path")
    parser.add_argument("--ffprobe", default="ffprobe", help="ffprobe executable path")
    parser.add_argument("--preset", default="medium", choices=["ultrafast", "superfast", "veryfast", "faster", "fast", "medium", "slow"], help="libx264 encoding preset; default medium")
    parser.add_argument("--crf", default=18, type=int, choices=range(14, 26), metavar="14–25", help="Video quality; lower is higher quality, default 18")
    parser.add_argument("--overwrite", action="store_true", help="Explicitly replace generated output/sidecars, never inputs")
    parser.add_argument("--test-only", action="store_true", help="Watermark disposable synthetic smoke tests; never submission evidence")
    parser.add_argument("--write-template", type=Path, help="Write an editable timeline scaffold and exit without creating a video")
    args = parser.parse_args()
    if args.write_template:
        if args.write_template.exists():
            raise DemoError("Template destination already exists; choose a new file name.")
        args.write_template.parent.mkdir(parents=True, exist_ok=True)
        args.write_template.write_text(json.dumps(template(), indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
        print(f"Timeline scaffold written: {args.write_template}. Retiming to actual captured actions is required.")
        return 0
    if args.input is None or args.output is None:
        parser.error("--input and --output are required unless using --write-template")
    source = args.input.expanduser().resolve()
    output = args.output.expanduser().resolve()
    if output.suffix.lower() != ".mp4":
        raise DemoError("Output must use an .mp4 extension.")
    ffmpeg, ffprobe = executable(args.ffmpeg, "ffmpeg"), executable(args.ffprobe, "ffprobe")
    media = probe(source, ffprobe, True)
    SQUARE_LAYOUT = media.width / media.height < 1.3
    if SQUARE_LAYOUT:
        VIDEO, SIDEBAR = (48, 140, 1040, 876), (1120, 140, 752, 876)
    else:
        VIDEO, SIDEBAR = (48, 164, 1320, 742), (1400, 164, 472, 742)
    data = load_json(args.timeline) if args.timeline else {"version": 1}
    timeline, frames = normalize_timeline(data, media, args.start, args.end)
    duration = frames / FPS
    if args.audio and not args.audio_kind:
        raise DemoError("--audio requires --audio-kind human or ai-guide so narration is labeled honestly.")
    if args.audio_kind and not args.audio:
        raise DemoError("--audio-kind is only used with supplied --audio.")
    if args.mix_raw_audio and not args.audio:
        raise DemoError("--mix-raw-audio requires supplied --audio narration.")
    sfx_volume = numeric(args.sfx_volume, "SFX volume")
    if sfx_volume > 1:
        raise DemoError("SFX volume must be between 0 and 1.")
    audio_start = numeric(args.audio_start, "Audio start")
    if not args.audio and audio_start:
        raise DemoError("--audio-start requires --audio.")
    narration = args.audio.expanduser().resolve() if args.audio else None
    if narration:
        audio_media = probe(narration, ffprobe)
        if not audio_media.audio:
            raise DemoError("Supplied narration has no audio stream.")
        available_audio = audio_media.audio_duration or audio_media.duration
        if audio_start + duration > available_audio + .05:
            raise DemoError(f"Narration covers only {max(0, available_audio - audio_start):.3f}s, but the edit is {duration:.3f}s. Record longer narration or shorten the edit.")
    include_raw_audio = args.raw_audio or args.mix_raw_audio
    if include_raw_audio and not media.audio:
        raise DemoError("The raw video has no audio stream; omit --raw-audio for a silent edition.")
    regular, bold = font_file(args.font_regular), font_file(args.font_bold, True)
    sidecars = [output.with_suffix(".srt"), output.with_suffix(".edit.json"), output.with_suffix(".timeline.json")]
    destinations = [output, *sidecars]
    protected = {source, *(p.expanduser().resolve() for p in [args.timeline, args.audio] if p), *(Path(p).expanduser().resolve() for p in [regular, bold] if Path(p).is_file())}
    for path in destinations:
        if path in protected:
            raise DemoError(f"A generated output would replace an input file: {path}. Choose another output name.")
        if path.exists() and path.is_file() and any(os.path.samefile(path, p) for p in protected if p.is_file()):
            raise DemoError("A generated output is a hard link to an input; choose another output name.")
        if path.exists() and (not args.overwrite or not path.is_file()):
            raise DemoError(f"Output already exists: {path}. Use another name or explicit --overwrite for generated files.")
    output.parent.mkdir(parents=True, exist_ok=True)
    edition = "AI guide narration · synthetic" if args.audio_kind == "ai-guide" else "Supplied human voiceover" if narration else "Captured source audio" if args.raw_audio else "Silent captioned edition"
    if args.mix_raw_audio:
        edition += " + source SFX"
    # All intermediates live beside the final destination and are removed on failure.
    with tempfile.TemporaryDirectory(prefix=".partcue-compose-", dir=output.parent) as scratch:
        directory = Path(scratch)
        overlay_manifest = overlays(directory, timeline, frames, regular, bold, edition, args.test_only)
        graph, audio = command_graph(timeline, frames, include_raw_audio, bool(narration), audio_start, sfx_volume)
        graph_path = directory / "filters.txt"
        graph_path.write_text(graph, encoding="utf-8")
        temporary_output = directory / "composed.mp4"
        command = [ffmpeg, "-hide_banner", "-loglevel", "error", "-nostdin", "-y"]
        # Independently seek each source excerpt: replay does not queue an entire
        # decoded take in RAM, and no generated frames replace product footage.
        for clip in timeline["clips"]:
            command.extend(["-ss", f"{clip['start']:.9f}", "-t", f"{clip['end'] - clip['start']:.9f}", "-i", str(source)])
        command.extend(["-f", "concat", "-safe", "0", "-i", str(overlay_manifest)])
        if narration:
            command.extend(["-i", str(narration)])
        command.extend(["-filter_complex", graph, "-map", "[final]"])
        if audio:
            command.extend(["-map", f"[{audio}]", "-c:a", "aac", "-b:a", "192k", "-ar", "48000"])
        else:
            command.append("-an")
        command.extend(["-c:v", "libx264", "-preset", args.preset, "-crf", str(args.crf), "-pix_fmt", "yuv420p", "-r", str(FPS), "-frames:v", str(frames), "-t", f"{duration:.9f}", "-movflags", "+faststart", "-map_metadata", "-1", "-metadata", f"title={timeline['title']} | {timeline['tagline']}", "-metadata", "artist=Shivam Gupta", "-metadata", f"comment={'TEST ONLY - synthetic input - not a product demo' if args.test_only else 'Actual Lens Studio preview; simulated input; manual marking; built with AI assistance'}. {edition}.", str(temporary_output)])
        print(f"Composing {frames} frames / {duration:.3f}s at {WIDTH}×{HEIGHT}; {edition}.", flush=True)
        run(command, "ffmpeg composition", 900)
        rendered = probe(temporary_output, ffprobe, True)
        if rendered.width != WIDTH or rendered.height != HEIGHT or rendered.duration >= 180 or abs(rendered.duration - duration) > .15:
            raise DemoError("Encoded output failed resolution/duration verification; it was not published.")
        if rendered.audio != bool(audio):
            raise DemoError("Encoded output has unexpected audio presence; it was not published.")
        # Decode the complete result: a valid header alone is not sufficient QA.
        run([ffmpeg, "-v", "error", "-nostdin", "-i", str(temporary_output), "-f", "null", "-"], "final video decode verification", 300)
        record = {"schema_version": 1, "product": "PartCue", "creator": "Shivam Gupta", "built_with_ai_assistance": True, "test_only": args.test_only, "source": {"name": source.name, "sha256": sha256(source), "duration_seconds": media.duration, "width": media.width, "height": media.height}, "source_clips": timeline["clips"], "output": {"name": output.name, "sha256": sha256(temporary_output), "width": WIDTH, "height": HEIGHT, "fps": FPS, "frames": frames, "duration_seconds": rendered.duration, "audio_edition": edition}, "narration": {"name": narration.name, "sha256": sha256(narration), "start_seconds": audio_start, "kind": args.audio_kind} if narration else None, "fonts": {"regular": Path(regular).name, "bold": Path(bold).name}, "ffmpeg_version": run([ffmpeg, "-version"], "ffmpeg version").stdout.splitlines()[0], "disclosure": "Synthetic smoke test; not submission evidence." if args.test_only else "Actual supplied Lens Studio footage; simulated input; manual marks and confirmations. Composition does not validate a physical repair.", "caption_count": len(timeline["captions"]), "audio_mix": {"preserve_source_audio": include_raw_audio, "source_gain": sfx_volume if narration else 1, "narration_gain": 1 if narration else 0}, "encoding": {"codec": "libx264", "preset": args.preset, "crf": args.crf, "pixel_format": "yuv420p", "layout": "square" if SQUARE_LAYOUT else "landscape", "video_box": VIDEO}, "verified_full_decode": True}
        staged_sidecars = []
        for destination, content in [(sidecars[0], srt_text(timeline["captions"])), (sidecars[1], json.dumps(record, indent=2, ensure_ascii=False) + "\n"), (sidecars[2], json.dumps(timeline, indent=2, ensure_ascii=False) + "\n")]:
            staged = directory / destination.name
            staged.write_text(content, encoding="utf-8")
            staged_sidecars.append((staged, destination))
        # The video and sidecars become visible only after successful encoding/QA.
        # Recheck refusal semantics in case another process created an output.
        if not args.overwrite and any(path.exists() for path in destinations):
            raise DemoError("An output appeared while rendering. Choose another output name; nothing was overwritten.")
        for staged, destination in staged_sidecars:
            os.replace(staged, destination)
        os.replace(temporary_output, output)
    print(f"Created {'TEST ONLY artifact' if args.test_only else 'captioned edit'}: {output}")
    print(f"Captions: {sidecars[0]}\nEdit provenance: {sidecars[1]}\nNormalized timeline: {sidecars[2]}")
    if not timeline["captions"]:
        print("Note: no timed caption entries were supplied; the SRT is intentionally empty. Add a timeline aligned to captured actions.")
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except (DemoError, OSError) as error:
        print(f"Demo composition stopped: {error}", file=sys.stderr)
        raise SystemExit(2)

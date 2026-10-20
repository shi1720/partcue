# PartCue demo package

[Watch the public YouTube demo](https://www.youtube.com/watch?v=Z9rPXUwUdnw) · [Local MP4](partcue-demo.mp4) · [Verbatim script](../docs/video-script.md)

The final master is **152 seconds, 1920×1080, 30 fps**. It contains a continuous 71-second Lens workflow and a separate continuous 21-second viewpoint check. Intro and closing excerpts carry a persistent REPLAY label. Source footage is native Lens Studio preview, with four authored parts, predefined origins and SIK input replay. Every confirmation is explicit.

The voice is a generic synthetic guide, not Shivam Gupta's voice. No cloning was used. The video labels this permanently. Original product SFX are mixed under the guide. The script also includes an optional first-person intro for Shivam to record himself.

| File | Purpose |
| --- | --- |
| [partcue-demo.mp4](partcue-demo.mp4) | Finished submission video |
| [partcue-demo.srt](partcue-demo.srt) | 31 timed narration captions; also burned into the video sidebar |
| [partcue-thumbnail.png](partcue-thumbnail.png) | Actual-product thumbnail |
| [partcue-guide.wav](partcue-guide.wav) | Complete timed guide, including silence between sections |
| [narration-segments.json](narration-segments.json) and [voiceover.txt](voiceover.txt) | Exact spoken words |
| [narration-provenance.json](narration-provenance.json) | Pinned local model/tool, licenses, waveform hashes and bounds |
| [narration-schedule.json](narration-schedule.json) | Section starts and durations; sentence caption times are estimates within aligned sections |
| [capture-provenance.json](capture-provenance.json) | Native capture hashes, revision boundary and source-master construction |
| [partcue-edit-plan.json](partcue-edit-plan.json) | Explicit source excerpts, cards and captions |
| [partcue-demo.edit.json](partcue-demo.edit.json) | Output hash, encoder settings and successful full-decode check |

## Reproduce the composition

The native source captures and concatenated source master are distributed as assets of the [preview release](https://github.com/shi1720/partcue/releases/tag/v1.0.0). They are excluded from the source checkout's `demo/raw/` folder to keep routine clones smaller. The master joins the complete final workflow capture, then the complete spatial capture, using FFmpeg's concat demuxer and stream copy. The edit plan selects explicit ranges from that master; no footage is generated.

Install Python 3.10+, FFmpeg with libx264, and the pinned `requirements-video.txt`. Download `partcue-source-master.mp4`, then run from the repository root:

```sh
python3 tools/create-demo.py \
  --input /absolute/path/to/partcue-source-master.mp4 \
  --output /absolute/path/to/new-partcue-demo.mp4 \
  --timeline demo/partcue-edit-plan.json \
  --audio demo/partcue-guide.wav --audio-kind ai-guide \
  --mix-raw-audio --sfx-volume 0.3
```

The tool refuses to overwrite inputs, checks edit bounds and readable text, enforces a duration below three minutes, labels synthetic narration and replay, and verifies a full media decode. Rendering on another font/platform may change encoded bytes; the supplied provenance identifies this release's exact output.

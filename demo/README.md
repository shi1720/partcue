# PartCue product demo

[Public video](https://www.youtube.com/watch?v=BVofj69YVnA) · [Final MP4](partcue-product-demo.mp4) · [Exact script](voiceover-v2.txt) · [Captions](partcue-product-demo.srt)

The current master is **156.500 seconds, 1920×1080, 30 fps**. It combines actual Lens Studio preview recordings with captured excerpts from the hosted companion. The first 71 seconds show a continuous native workflow. The spatial viewpoint excerpt is also native footage. Captured browser interactions demonstrate sign-in, recording, saving, reload/restoration, JSON export/import and invalid-file rejection. Excerpts and held results are labelled. No product screen is synthesized.

The Lens demonstrates four authored parts and predefined origins with manual marking and explicit quantity confirmation. Recorded hand interactions use an actual SIK replay scenario. The Lens and browser maintain separate sessions. Physical installation and camera recognition are not verified.

The guide is Kokoro's generic `af_heart` stock voice, with no cloning or reference recording. The video and description disclose synthetic narration. There are 57 cleaned timed cues, burned into the sidebar and supplied for YouTube closed captions. Narration runs at normal generated speed, with no clipped samples. A separate ASR check found no omitted words; this is not a human listening review.

| File | Purpose |
| --- | --- |
| [partcue-product-demo.mp4](partcue-product-demo.mp4) | Current product demonstration |
| [partcue-product-demo.srt](partcue-product-demo.srt) | Timed English captions |
| [partcue-product-demo.edit.json](partcue-product-demo.edit.json) | Source ranges, capture provenance, output hash and full-decode result |
| [partcue-guide-v2.wav](partcue-guide-v2.wav) | Timed stock-voice guide |
| [narration-v2.json](narration-v2.json) | Spoken text, cue timing and generation metadata |
| [narration-v2-asr.json](narration-v2-asr.json) | Independent transcript comparison |
| [partcue-thumbnail.png](partcue-thumbnail.png) | Product thumbnail using an actual Lens capture |
| [cover-provenance.json](cover-provenance.json) | Capture crop and image hashes |
| [youtube-description-v2.txt](youtube-description-v2.txt) | Published description and chapters |

## Reproduce

`tools/create-product-demo.py` composes the current edit from the native captures and browser screencast manifests recorded in its provenance. The [v1.1 release](https://github.com/shi1720/partcue/releases/tag/v1.1.0) provides `PartCue-Browser-Captures.zip` plus the two native MP4s. Extract the capture archive into `demo/raw/browser/` and place the native files in `demo/raw/`. The native captures are excluded from routine Git clones and are distributed as release assets. Browser manifests and changed-frame images are recording inputs, not application source. Restore exact source stop timestamps and compose with the portable plan:

```sh
python3 demo/raw/browser/restore-capture-times.py
python3 tools/create-product-demo.py --plan demo/product-web-edit.json --output demo/reproduced-product-demo.mp4 --allow-mtime-stop
```

The restore helper checks capture hashes before changing file timestamps. `product-web-edit.recorded.json` retains the original recorded plan; the portable plan changes only manifest paths. Run `python3 tools/create-product-demo.py --help` for all supported paths. It refuses errored captures and input overwrites, fits complete viewports, preserves real elapsed time and fully decodes the rendered video before replacing the output.

Kokoro model, voice and environment versions are documented in [the narration notice](../docs/licenses/Kokoro-Narration-Notice.md). The original `partcue-demo.mp4`, Piper guide and v1.0 edit manifests are retained as clearly separate archived assets. They are not the current submission video.

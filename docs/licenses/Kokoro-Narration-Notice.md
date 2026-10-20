# Kokoro narration provenance

The v2 product guide uses the publisher stock `af_heart` preset from `hexgrad/Kokoro-82M`, rendered locally with `kokoro` 0.9.4 at normal speed. It uses no reference audio and performs no voice cloning. The synthetic guide does not impersonate Shivam Gupta.

The [publisher model card](https://huggingface.co/hexgrad/Kokoro-82M) identifies the model as Apache-2.0. The [upstream inference package](https://github.com/hexgrad/kokoro) uses Apache-2.0. The included license, model card, voice reference and JSON provenance preserve the inspected source and exact hashes. Model weights and the Python environment are not distributed in this repository.

The original script is in `demo/voiceover-v2.txt`. The scheduled audio is `demo/partcue-guide-v2.wav`. `demo/narration-v2.json` records stock voice, model revision, generated audio hashes, segment timing and caption timing. The caption word times come from predicted synthesis durations and require audiovisual review.

The final narration describes a manually marked simulation with four authored parts and predefined origins, plus a separate companion. It claims no camera recognition, automatic physical inspection, or automatic synchronization between the Lens and companion.

## Independent ASR sanity check

The exact scheduled WAV also passed a local transcription comparison using [SYSTRAN faster-whisper](https://github.com/SYSTRAN/faster-whisper) 1.2.1 with the publisher's `Systran/faster-whisper-small.en` model, CPU INT8 and no script prompt. The public result is in `demo/narration-v2-asr.json`. All 381 reference words were retained after recognizing the expected brand spelling variant `Part Q`. The remaining ASR difference is `glass's` for `glasses`. The raw strict word error rate is 1.31%; brand-aware comparison is 0.26%. These are ASR agreement measurements, not a naturalness score or a finding that the audio contains those errors. Lens, cyan, tray, Shivam and Gupta were recognized. The longest measured low-energy interval was 1.98 seconds at a -45 dBFS threshold. Human listening remains the way to assess cadence and accent.

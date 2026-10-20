# Optional local sound regeneration

The four ready-to-use WAVs are included in `Assets/GeneratedSFX/`. Opening, compiling,
testing, or running the Lens does **not** require this generator, Node, or a CLAD tools path.

To deliberately regenerate the sounds, install the CLAD `build-sfx` skill, then point
`CLAD_SFX_TOOLS` at its absolute `skills/build-sfx/tools` directory:

```sh
CLAD_SFX_TOOLS="/absolute/path/to/ls-clad/skills/build-sfx/tools" \
  node Assets/BuildTools/gen_sfx_parttrail.cjs
```

The directory must provide CLAD's CommonJS audio engine. The generator validates the
environment path before touching any WAV. It uses the local algorithmic presets and
writes directly into `Assets/GeneratedSFX/`, relative to this file, with no account or
network access. Regeneration replaces the included WAVs; it is never a build step.

The internal `PartTrail` filenames are retained to preserve existing Lens asset UUIDs
and references. The visible product name is **PartCue**.

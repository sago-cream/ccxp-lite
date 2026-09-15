# README demo generation

The animated SVG is generated from four static PNGs and two page captions by
`scripts/build_readme_comparisons.ts`. It embeds the images, captions, and CSS
animation in one self-contained file. No browser, login, or network access is
needed to regenerate it.

## Rebuild the current demo

From the repository root, after `bun install`:

```sh
bun run build:readme-comparisons
```

Inputs, in playback order:

| Caption  | Original                  | With ccxpLite            |
| -------- | ------------------------- | ------------------------ |
| Login    | `demo/original/login.png` | `demo/sidebar/login.png` |
| Homepage | `demo/original/main.png`  | `demo/sidebar/main.png`  |

Output: `demo/comparison/showcase.svg`, displayed at the top of `README.md`.
Replace an input PNG and rerun the command. Do not edit the generated SVG manually.
Identical inputs and options produce byte-identical output.

## Use different images or captions

```sh
bun run build:readme-comparisons \
  --first-original demo/original/login.png \
  --first-updated demo/sidebar/login.png \
  --first-caption 'Login' \
  --second-original demo/original/main.png \
  --second-updated demo/sidebar/main.png \
  --second-caption 'Homepage' \
  --output demo/comparison/showcase.svg
```

All options are optional; the example shows the defaults. Paths are relative to
where the command runs. Use `--help` to list the options.

Images must be valid PNGs with an 8:5 aspect ratio. Different resolutions are fine:
all four are fitted to a 1600 × 1000 canvas without cropping. The caption row adds
64 pixels above the image. Captions automatically get `(original)` and
`(w/ ccxpLite)` suffixes and are escaped as XML text.

The 18-second loop uses a 0.9-second tilted wipe for each comparison and a
0.4-second blur crossfade between pages, including the loop boundary. Reduced
motion shows a static split of the second page. These timings and styles live in
the generator's CSS template.

## Refresh live captures

`bun run capture --sidebar-home` builds the packaged Chrome extension and opens
the live site in the dedicated capture browser. Sign in, arrange the sidebar
homepage, and press Enter in the capture terminal. Then update the source image:

```sh
cp assets/showcase/readme/sidebar-main.png demo/sidebar/main.png
bun run build:readme-comparisons
```

Review captures for personal information before publishing. The original PNGs
remain the legacy comparison inputs; generating the SVG does not recapture them.

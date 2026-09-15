import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

import { parseArgs } from "node:util";
import { PNG } from "pngjs";

const { values } = parseArgs({
  args: process.argv.slice(2),
  options: {
    "first-original": { type: "string", default: "docs/assets/login-original.png" },
    "first-updated": { type: "string", default: "docs/assets/login-ccxplite.png" },
    "first-caption": { type: "string", default: "Login" },
    "second-original": { type: "string", default: "docs/assets/homepage-original.png" },
    "second-updated": { type: "string", default: "docs/assets/homepage-ccxplite.png" },
    "second-caption": { type: "string", default: "Homepage" },
    output: { type: "string", default: "docs/assets/showcase.svg" },
    help: { type: "boolean", short: "h" },
  },
});

if (values.help === true) {
  console.log(`Generate one animated SVG from four 8:5 PNG images.

bun run build:readme-comparisons [options]

  --first-original PATH   First page before (default: docs/assets/login-original.png)
  --first-updated PATH    First page after (default: docs/assets/login-ccxplite.png)
  --first-caption TEXT    First page label (default: Login)
  --second-original PATH  Second page before (default: docs/assets/homepage-original.png)
  --second-updated PATH   Second page after (default: docs/assets/homepage-ccxplite.png)
  --second-caption TEXT   Second page label (default: Homepage)
  --output PATH           Output SVG (default: docs/assets/showcase.svg)

Paths are relative to the current directory. Captions gain (original) and
(w/ ccxpLite) suffixes. No browser or live capture is needed.`);
  process.exit(0);
}

function escapeXml(value: string) {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
}

const screens = [
  {
    stage: "login",
    title: escapeXml(values["first-caption"]),
    original: values["first-original"],
    updated: values["first-updated"],
  },
  {
    stage: "main",
    title: escapeXml(values["second-caption"]),
    original: values["second-original"],
    updated: values["second-updated"],
  },
];
const outputPath = path.resolve(values.output);

function embedded(source: string) {
  const bytes = readFileSync(path.resolve(source));
  const { width, height } = PNG.sync.read(bytes);
  if (width * 5 !== height * 8) {
    throw new Error(`${source}: expected an 8:5 PNG, received ${width}x${height}.`);
  }
  return `data:image/png;base64,${bytes.toString("base64")}`;
}

const frames = screens.map(
  ({ stage, original, updated }) => `<g class="frame ${stage}">
    <image width="1600" height="1000" href="${embedded(original)}"/>
    <image class="reveal" width="1600" height="1000" href="${embedded(updated)}"/>
    <g class="divider">
      <path d="M128 0 L0 1000" stroke="#202735" stroke-opacity=".2" stroke-width="10"/>
      <path d="M128 0 L0 1000" stroke="white" stroke-width="4"/>
    </g>
  </g>`,
);

const captions = screens.map(
  ({ stage, title }) => `<g class="frame ${stage}">
    <text class="caption-original" x="28" y="41">${title} (original)</text>
    <text class="caption-ours" x="28" y="41">${title} (w/ ccxpLite)</text>
  </g>`,
);

// Embed the existing captures so the SVG works in README image elements. Both source sets are 8:5;
// preserve the entire frame without cropping.
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="1064" viewBox="0 0 1600 1064" role="img" aria-labelledby="title desc">
  <title id="title">Original CCXP to ccxpLite: ${screens.map((screen) => screen.title).join(" and ")}</title>
  <desc id="desc">Two page comparisons play in sequence. A tilted divider reveals sidebar mode from left to right, with a brief blur crossfade between pages. Reduced motion shows a static second-page split.</desc>
  <style>
    .frame { animation: page-change 18s ease-in-out infinite; }
    .reveal { clip-path: polygon(0 0, -2% 0, -10% 100%, 0 100%); animation: reveal 18s ease-in-out infinite; }
    .divider { transform: translateX(-160px); animation: sweep 18s ease-in-out infinite; }
    .caption-original { animation: caption-original 18s steps(1, end) infinite; }
    .caption-ours { animation: caption-ours 18s steps(1, end) infinite; }
    .caption-static { display: none; }
    .main, .main .reveal, .main .divider, .main .caption-original, .main .caption-ours { animation-delay: -9s; }
    @keyframes caption-original {
      0%, 50%, 100% { visibility: visible; }
      13.5% { visibility: hidden; }
    }
    @keyframes caption-ours {
      0%, 50%, 100% { visibility: hidden; }
      13.5% { visibility: visible; }
    }
    @keyframes page-change {
      0%, 47.777778%, 100% { opacity: 1; filter: blur(0px); }
      50%, 97.777778% { opacity: 0; filter: blur(4px); }
    }
    @keyframes reveal {
      0%, 11%, 50.000001%, 100% { clip-path: polygon(0 0, -2% 0, -10% 100%, 0 100%); }
      16%, 50% { clip-path: polygon(0 0, 118% 0, 110% 100%, 0 100%); }
    }
    @keyframes sweep {
      0%, 11%, 50.000001%, 100% { transform: translateX(-160px); }
      16%, 50% { transform: translateX(1760px); }
    }
    @media (prefers-reduced-motion: reduce) {
      .frame { animation: none; filter: none; }
      .caption-original, .caption-ours { display: none; animation: none; }
      .caption-static { display: inline; }
      .login { opacity: 0; }
      .main { opacity: 1; }
      .reveal { animation: none; clip-path: polygon(0 0, 54% 0, 46% 100%, 0 100%); }
      .divider { animation: none; transform: translateX(736px); }
    }
  </style>
  <rect width="1600" height="1064" fill="white"/>
  <svg y="64" width="1600" height="1000" viewBox="0 0 1600 1000" overflow="hidden">
    ${frames.join("\n")}
  </svg>
  <rect width="1600" height="64" fill="#eeeeee"/>
  <path d="M0 63.5 H1600" stroke="#c5c5c5"/>
  <g font-family="system-ui, sans-serif" font-size="24" font-weight="500" fill="#111111">
    ${captions.join("\n")}
    <text class="caption-static" x="28" y="41">${screens[1]?.title} (w/ ccxpLite / original)</text>
  </g>
</svg>
`;
mkdirSync(path.dirname(outputPath), { recursive: true });
writeFileSync(outputPath, svg);
console.log(`Built animated comparison: ${outputPath}`);

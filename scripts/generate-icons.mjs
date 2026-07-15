// One-time generator for PWA icons. Run with: node scripts/generate-icons.mjs
import sharp from "sharp";
import { mkdir } from "fs/promises";
import { fileURLToPath } from "url";

const ICON_SVG = `
<svg width="512" height="512" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
  <rect width="512" height="512" fill="#171717"/>
  <path d="M256 388 C256 388 112 300 112 202 C112 154 150 116 198 116 C224 116 248 129 256 152 C264 129 288 116 314 116 C362 116 400 154 400 202 C400 300 256 388 256 388 Z"
        fill="none" stroke="#ffffff" stroke-width="18" stroke-linejoin="round" stroke-linecap="round"/>
  <polyline points="150,238 196,238 214,190 248,290 276,220 294,238 362,238"
            fill="none" stroke="#ffffff" stroke-width="16" stroke-linecap="round" stroke-linejoin="round"/>
</svg>
`;

const outDir = new URL("../public/icons/", import.meta.url);
await mkdir(outDir, { recursive: true });

const targets = [
  { size: 192, file: "icon-192.png" },
  { size: 512, file: "icon-512.png" },
  { size: 180, file: "apple-touch-icon.png" },
];

for (const { size, file } of targets) {
  const outPath = fileURLToPath(new URL(file, outDir));
  await sharp(Buffer.from(ICON_SVG)).resize(size, size).png().toFile(outPath);
  console.log(`Wrote ${file} (${size}x${size})`);
}

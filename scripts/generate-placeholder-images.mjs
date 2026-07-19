// One-off generator for placeholder vehicle photos.
//
// public/images/ was missing entirely, so every vehicle in lib/vehicles-db.ts
// pointed at a 404'd photo. We don't have licensed rights to real manufacturer
// photography, so this renders simple flat-illustration placeholders (brand
// colour + car silhouette + brand/model label) instead.
import puppeteer from "puppeteer";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR = path.join(__dirname, "..", "public", "images");
fs.mkdirSync(OUT_DIR, { recursive: true });

const PALETTE = [
  ["#2563eb", "#1e3a8a"], // blue
  ["#f97316", "#9a3412"], // orange
  ["#dc2626", "#7f1d1d"], // red
  ["#0d9488", "#134e4a"], // teal
  ["#7c3aed", "#4c1d95"], // violet
  ["#16a34a", "#14532d"], // green
  ["#0891b2", "#164e63"], // cyan
  ["#475569", "#1e293b"], // slate
  ["#db2777", "#831843"], // pink
  ["#ca8a04", "#713f12"], // amber
];

function colorFor(brand) {
  let hash = 0;
  for (const ch of brand) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
  return PALETTE[hash % PALETTE.length];
}

const VEHICLES = [
  { file: "byd_dolphin.png", brand: "BYD", model: "Dolphin", type: "Hatchback", isEV: true },
  { file: "byd_atto1.png", brand: "BYD", model: "Atto 1", type: "SUV", isEV: true },
  { file: "byd_atto3.png", brand: "BYD", model: "Atto 3", type: "SUV", isEV: true },
  { file: "byd_seal.png", brand: "BYD", model: "Seal", type: "Sedan", isEV: true },
  { file: "citroen_ec3.png", brand: "Citroen", model: "E-C3", type: "Hatchback", isEV: true },
  { file: "kia_ev9.png", brand: "KIA", model: "EV9", type: "SUV", isEV: true },
  { file: "tata_punch_ev.png", brand: "Tata", model: "Punch EV", type: "SUV", isEV: true },
  { file: "xpeng_g6.png", brand: "XPENG", model: "G6", type: "SUV", isEV: true },
  { file: "tata_tiago_ev.png", brand: "Tata", model: "Tiago EV", type: "Hatchback", isEV: true },
  { file: "tata_nexon_ev.png", brand: "Tata", model: "Nexon EV", type: "SUV", isEV: true },
  { file: "wuling_bingo.png", brand: "Wuling", model: "Bingo", type: "Hatchback", isEV: true },
  { file: "seres_3.png", brand: "Seres", model: "Seres 3", type: "SUV", isEV: true },
  { file: "baw_e7_pro.png", brand: "BAW", model: "E7 Pro", type: "Hatchback", isEV: true },
  { file: "avatr_11.png", brand: "Avatr", model: "Avatr 11", type: "SUV", isEV: true },
  { file: "byd_atto2.png", brand: "BYD", model: "Atto 2", type: "SUV", isEV: true },
  { file: "fortuner.png", brand: "Toyota", model: "Fortuner", type: "SUV", isEV: false },
  { file: "honda_city.png", brand: "Honda", model: "City", type: "Sedan", isEV: false },
  { file: "suzuki_swift.png", brand: "Suzuki", model: "Swift", type: "Hatchback", isEV: false },
  { file: "hyundai_creta.png", brand: "Hyundai", model: "Creta", type: "SUV", isEV: false },
  { file: "kia_sonet.png", brand: "Kia", model: "Sonet", type: "SUV", isEV: false },
  { file: "used_nissan_leaf.png", brand: "Nissan", model: "Leaf EV", type: "Hatchback", isEV: true },
  { file: "used_byd_atto3.png", brand: "BYD", model: "Atto 3", type: "SUV", isEV: true },
  { file: "used_mg_zs_ev.png", brand: "MG", model: "ZS EV", type: "SUV", isEV: true },
  { file: "used_hyundai_kona.png", brand: "Hyundai", model: "Kona", type: "SUV", isEV: true },
];

// Generic flat side-profile car silhouette, shared across body types — this
// is a schematic placeholder, not a stand-in for real product photography.
const CAR_PATH =
  "M40,180 L70,180 C74,155 96,138 128,138 L168,138 C182,120 205,108 232,108 L330,108 " +
  "C362,108 390,124 406,150 L452,152 C470,153 484,165 486,180 L486,192 L40,192 Z " +
  "M40,180 A18,18 0 1 0 76,180 A18,18 0 1 0 40,180 Z " +
  "M410,180 A18,18 0 1 0 446,180 A18,18 0 1 0 410,180 Z";

function svgFor({ brand, model, type, isEV, colors }) {
  const [light, dark] = colors;
  return `
  <svg width="800" height="450" viewBox="0 0 800 450" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="${light}" />
        <stop offset="100%" stop-color="${dark}" />
      </linearGradient>
    </defs>
    <rect width="800" height="450" fill="url(#bg)" />
    <circle cx="640" cy="90" r="150" fill="#ffffff" opacity="0.06" />
    <circle cx="120" cy="380" r="110" fill="#000000" opacity="0.08" />
    <g transform="translate(150,120) scale(1.05)">
      <path d="${CAR_PATH}" fill="#ffffff" opacity="0.92" />
      <rect x="150" y="145" width="150" height="2" fill="${dark}" opacity="0.25" />
    </g>
    ${isEV ? `<rect x="640" y="36" width="120" height="34" rx="17" fill="#ffffff" opacity="0.92" />
    <text x="700" y="59" text-anchor="middle" font-family="Arial, sans-serif" font-size="16" font-weight="700" fill="${dark}">ELECTRIC</text>` : ""}
    <text x="40" y="358" font-family="Georgia, serif" font-size="46" font-weight="700" fill="#ffffff">${brand}</text>
    <text x="40" y="398" font-family="Arial, sans-serif" font-size="26" font-weight="500" fill="#ffffff" opacity="0.85">${model} · ${type}</text>
  </svg>`;
}

const html = (svg) => `<!doctype html><html><head><style>
  html,body{margin:0;padding:0;}
</style></head><body>${svg}</body></html>`;

async function main() {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.setViewport({ width: 800, height: 450 });

  for (const v of VEHICLES) {
    const svg = svgFor({ ...v, colors: colorFor(v.brand) });
    await page.setContent(html(svg));
    const outPath = path.join(OUT_DIR, v.file);
    await page.screenshot({ path: outPath });
    console.log("wrote", outPath);
  }

  await browser.close();
}

main();

import fs from "fs";
import path from "path";
import sharp from "sharp";

const svg = `<svg width="512" height="512" viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect width="512" height="512" rx="115" fill="#0E1A2B" />
  <rect x="102.4" y="115.2" width="70.4" height="281.6" rx="15.4" fill="#FFFFFF" />
  <rect x="339.2" y="115.2" width="70.4" height="281.6" rx="15.4" fill="#FFFFFF" />
  <path d="M256 121.6L102.4 224V279.04L256 176.64L409.6 279.04V224L256 121.6Z" fill="#D9531E" />
  <rect x="198.4" y="249.6" width="48.6" height="48.6" rx="10.2" fill="#D9531E" />
  <rect x="265" y="249.6" width="48.6" height="48.6" rx="10.2" fill="#D9531E" />
  <rect x="198.4" y="316.2" width="48.6" height="48.6" rx="10.2" fill="#FFFFFF" />
  <rect x="265" y="316.2" width="48.6" height="48.6" rx="10.2" fill="#FFFFFF" />
</svg>`;

async function createPng(size) {
  return await sharp(Buffer.from(svg))
    .resize(size, size)
    .png()
    .toBuffer();
}

function buildIco(pngBuffers, sizes) {
  const count = pngBuffers.length;
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); // reserved
  header.writeUInt16LE(1, 2); // ICO type
  header.writeUInt16LE(count, 4); // number of images

  let offset = 6 + count * 16;
  const dirEntries = [];
  for (let i = 0; i < count; i++) {
    const s = sizes[i];
    const buf = pngBuffers[i];
    const entry = Buffer.alloc(16);
    entry[0] = s >= 256 ? 0 : s; // width (0 = 256)
    entry[1] = s >= 256 ? 0 : s; // height
    entry[2] = 0; // color palette
    entry[3] = 0; // reserved
    entry.writeUInt16LE(1, 4); // color planes
    entry.writeUInt16LE(32, 6); // bits per pixel
    entry.writeUInt32LE(buf.length, 8); // image size
    entry.writeUInt32LE(offset, 12); // image offset
    dirEntries.push(entry);
    offset += buf.length;
  }

  return Buffer.concat([header, ...dirEntries, ...pngBuffers]);
}

async function main() {
  console.log("Generating Hanbat official brand icons for Google Search & browsers...");

  // Generate PNGs at required resolutions
  const p16 = await createPng(16);
  const p32 = await createPng(32);
  const p48 = await createPng(48);
  const p96 = await createPng(96);
  const p180 = await createPng(180);
  const p192 = await createPng(192);
  const p256 = await createPng(256);
  const p512 = await createPng(512);

  // Write standalone PNG files in public & app
  fs.writeFileSync("public/icon-48.png", p48);
  fs.writeFileSync("public/icon-96.png", p96);
  fs.writeFileSync("public/icon-192.png", p192);
  fs.writeFileSync("public/icon-512.png", p512);
  fs.writeFileSync("public/apple-icon.png", p180);
  fs.writeFileSync("app/apple-icon.png", p180);
  fs.writeFileSync("app/icon.png", p192);

  // Build ICO with 16, 32, 48, 256
  const ico = buildIco([p16, p32, p48, p256], [16, 32, 48, 256]);
  fs.writeFileSync("public/favicon.ico", ico);
  fs.writeFileSync("app/favicon.ico", ico);

  console.log("✅ Successfully created: public/favicon.ico, app/favicon.ico, icon-48.png, icon-96.png, icon-192.png, icon-512.png, apple-icon.png");
}

main().catch(console.error);

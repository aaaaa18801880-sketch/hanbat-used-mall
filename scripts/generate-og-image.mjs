import sharp from "sharp";
import fs from "fs";

async function generateOgImages() {
  console.log("Generating og-image.jpg and og-image.png from main-bg2.png...");
  
  // 1200x630 JPEG (standard OG)
  await sharp("public/main-bg2.png")
    .resize(1200, 630, {
      fit: "cover",
      position: sharp.strategy.entropy,
    })
    .jpeg({ quality: 92, progressive: true })
    .toFile("public/og-image.jpg");

  // 1200x630 PNG
  await sharp("public/main-bg2.png")
    .resize(1200, 630, {
      fit: "cover",
      position: sharp.strategy.entropy,
    })
    .png({ quality: 90, compressionLevel: 8 })
    .toFile("public/og-image.png");

  console.log("✅ Successfully created public/og-image.jpg and public/og-image.png");
}

generateOgImages().catch(console.error);

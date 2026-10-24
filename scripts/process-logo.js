const sharp = require("sharp");
const path = require("path");
const fs = require("fs");

const inputPath = "/Users/vineetmishra/.gemini/antigravity/brain/1ea4acda-8224-4078-afcd-39760bb7ab8e/.user_uploaded/media_1792798284668_b3901048.png";
const outputDir = path.join(__dirname, "../public/brand");

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

async function processLogo() {
  const { data, info } = await sharp(inputPath).raw().toBuffer({ resolveWithObject: true });
  const { width, height, channels } = info;

  // New buffer with RGBA (4 channels)
  const outBuffer = Buffer.alloc(width * height * 4);

  // Background reference color (approx 254)
  const bgR = 254, bgG = 254, bgB = 254;

  for (let i = 0, j = 0; i < data.length; i += channels, j += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];

    // Maximum distance from pure white in any channel
    const dR = Math.max(0, bgR - r);
    const dG = Math.max(0, bgG - g);
    const dB = Math.max(0, bgB - b);
    const delta = Math.max(dR, dG, dB);

    let alpha = 0;
    let outR = r;
    let outG = g;
    let outB = b;

    if (delta <= 6) {
      // Pure background
      alpha = 0;
      outR = 0;
      outG = 0;
      outB = 0;
    } else if (delta >= 170) {
      // Fully opaque foreground
      alpha = 255;
    } else {
      // Semi-transparent anti-aliased edge
      // Normalize alpha between 0 and 1
      const normalizedAlpha = (delta - 6) / (170 - 6);
      alpha = Math.round(normalizedAlpha * 255);

      // Color un-matting: remove the white wash from the edge pixel
      // F = (P - (1 - a) * W) / a
      const a = normalizedAlpha;
      outR = Math.min(255, Math.max(0, Math.round((r - (1 - a) * bgR) / a)));
      outG = Math.min(255, Math.max(0, Math.round((g - (1 - a) * bgG) / a)));
      outB = Math.min(255, Math.max(0, Math.round((b - (1 - a) * bgB) / a)));
    }

    outBuffer[j] = outR;
    outBuffer[j + 1] = outG;
    outBuffer[j + 2] = outB;
    outBuffer[j + 3] = alpha;
  }

  // 1. Save full untrimmed transparent logo
  const untrimmedPath = path.join(outputDir, "vedro-logo-transparent-raw.png");
  await sharp(outBuffer, { raw: { width, height, channels: 4 } })
    .png()
    .toFile(untrimmedPath);

  // 2. Trim transparent margins with 24px balanced padding
  const trimmedPath = path.join(outputDir, "vedro-logo-transparent.png");
  await sharp(outBuffer, { raw: { width, height, channels: 4 } })
    .trim()
    .extend({
      top: 16,
      bottom: 16,
      left: 20,
      right: 20,
      background: { r: 0, g: 0, b: 0, alpha: 0 }
    })
    .png()
    .toFile(trimmedPath);

  // 3. Also generate an icon mark (the Devanagari "Ve" emblem with yellow flowers) for square icon usage
  // The emblem is from X: 52 to ~350, Y: 80 to 485
  const emblemPath = path.join(outputDir, "vedro-emblem-transparent.png");
  await sharp(outBuffer, { raw: { width, height, channels: 4 } })
    .extract({ left: 45, top: 75, width: 320, height: 420 })
    .trim()
    .extend({
      top: 16,
      bottom: 16,
      left: 16,
      right: 16,
      background: { r: 0, g: 0, b: 0, alpha: 0 }
    })
    .png()
    .toFile(emblemPath);

  // 4. Also copy to public/logo.png for standard Next.js / favicon / manifest references
  fs.copyFileSync(trimmedPath, path.join(__dirname, "../public/logo.png"));

  console.log("Generated:");
  console.log("1.", trimmedPath);
  console.log("2.", emblemPath);
  console.log("3.", path.join(__dirname, "../public/logo.png"));

  const trimmedMeta = await sharp(trimmedPath).metadata();
  console.log("Trimmed logo metadata:", trimmedMeta);
}

processLogo().catch(console.error);

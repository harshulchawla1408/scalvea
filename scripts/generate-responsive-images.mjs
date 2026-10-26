import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

const ASSETS_DIR = path.resolve('src/assets');
const OUT_DIR = path.resolve('src/assets/generated');

if (!fs.existsSync(OUT_DIR)) {
  fs.mkdirSync(OUT_DIR, { recursive: true });
}

// Configuration of image variants to generate
const IMAGE_CONFIGS = [
  // Scalvea Header Logo (Original 2809 x 829, rendered at 156x46 desktop, 130x38 mobile)
  {
    name: 'logo1',
    widths: [160, 320, 480],
    quality: 86,
    sizes: '(max-width: 1024px) 130px, 156px'
  },
  // Desktop Hero Banners (rendered full-width on desktop >= 768px)
  {
    name: 'auslap',
    widths: [1024, 1440, 1920, 2560],
    quality: 82,
    sizes: '100vw'
  },
  {
    name: 'indlap',
    widths: [1024, 1440, 1920, 2560],
    quality: 82,
    sizes: '100vw'
  },
  {
    name: 'lap1',
    widths: [1024, 1440, 1920, 2560],
    quality: 82,
    sizes: '100vw'
  },
  {
    name: 'lap2',
    widths: [1024, 1440, 1920, 2560],
    quality: 82,
    sizes: '100vw'
  },
  {
    name: 'lap4', // Original width is 1672
    widths: [768, 1024, 1440, 1672],
    quality: 82,
    sizes: '100vw'
  },
  // Mobile Hero Banners (rendered full-width on mobile < 768px)
  {
    name: 'ausmob',
    widths: [420, 640, 828, 1080],
    quality: 82,
    sizes: '100vw'
  },
  {
    name: 'indmob',
    widths: [420, 640, 828, 1080],
    quality: 82,
    sizes: '100vw'
  },
  {
    name: 'mob1',
    widths: [420, 640, 828, 1000],
    quality: 82,
    sizes: '100vw'
  },
  {
    name: 'mob2',
    widths: [420, 640, 828, 1000],
    quality: 82,
    sizes: '100vw'
  },
  {
    name: 'mob4', // Original 1170 x 1559, was 228.8 KiB
    widths: [420, 640, 828, 1080],
    quality: 80,
    sizes: '100vw'
  },
  // Puneet Campaign Posters
  {
    name: 'puneet', // Original 5120 x 2266, was 314 KiB
    widths: [768, 1200, 1600, 2000],
    quality: 82,
    sizes: '(max-width: 1280px) 100vw, 1280px'
  },
  {
    name: 'puneet-mob', // Original 1447 x 1087, was 52.9 KiB
    widths: [420, 640, 828],
    quality: 82,
    sizes: '100vw'
  },
  // Product Showcase Cards (rendered in 2-col grid, ~300-480px)
  {
    name: 'prod1', // Follicle 8
    widths: [320, 480, 640, 800],
    quality: 82,
    sizes: '(max-width: 640px) 280px, (max-width: 1024px) 380px, 480px'
  },
  {
    name: 'prod2', // Scalp-5
    widths: [320, 480, 640, 800],
    quality: 82,
    sizes: '(max-width: 640px) 280px, (max-width: 1024px) 380px, 480px'
  },
  // Below-the-fold Showcase Imagery
  {
    name: 'hero2', // Follicle 8 Science Showcase (original 1447 x 1087)
    widths: [480, 720, 1080],
    quality: 82,
    sizes: '(max-width: 768px) 100vw, 50vw'
  },
  {
    name: 'hero3', // Routine Guide Showcase (original 1535 x 1024)
    widths: [480, 720, 1080],
    quality: 82,
    sizes: '(max-width: 768px) 100vw, 50vw'
  },
  {
    name: 'scalp', // Scalp-5 Science Showcase (original 1323 x 979)
    widths: [480, 720, 1080],
    quality: 82,
    sizes: '(max-width: 768px) 100vw, 50vw'
  }
];

async function main() {
  console.log('=== GENERATING RESPONSIVE IMAGE VARIANTS ===');
  const manifests = {};

  for (const cfg of IMAGE_CONFIGS) {
    const inputPath = path.join(ASSETS_DIR, `${cfg.name}.webp`);
    if (!fs.existsSync(inputPath)) {
      console.warn(`[warn] Master image not found: ${inputPath}`);
      continue;
    }

    const meta = await sharp(inputPath).metadata();
    const originalSize = fs.statSync(inputPath).size;
    console.log(`\nProcessing ${cfg.name}.webp (${meta.width}x${meta.height}, ${(originalSize/1024).toFixed(1)} KiB)...`);

    const generatedWidths = [];
    let defaultWidth = null;
    let defaultHeight = null;

    for (const w of cfg.widths) {
      if (w > meta.width) continue; // never enlarge

      const outName = `${cfg.name}-${w}w.webp`;
      const outPath = path.join(OUT_DIR, outName);

      const targetHeight = Math.round((w / meta.width) * meta.height);

      await sharp(inputPath)
        .resize(w, targetHeight, { withoutEnlargement: true, fit: 'inside' })
        .webp({ quality: cfg.quality, effort: 6 })
        .toFile(outPath);

      const newSize = fs.statSync(outPath).size;
      const savingsPct = Math.round((1 - newSize / originalSize) * 100);
      console.log(`  ✓ ${outName}: ${w}x${targetHeight} — ${(newSize/1024).toFixed(1)} KiB (${savingsPct}% saved)`);

      generatedWidths.push({ width: w, height: targetHeight, filename: outName });

      // Choose a sensible default (e.g. median or ~800-1440px)
      if (!defaultWidth || (w <= 1440 && w >= defaultWidth)) {
        defaultWidth = w;
        defaultHeight = targetHeight;
      }
    }

    manifests[cfg.name] = {
      defaultWidth: defaultWidth || meta.width,
      defaultHeight: defaultHeight || meta.height,
      sizes: cfg.sizes,
      variants: generatedWidths
    };
  }

  // Generate TypeScript helper index file
  console.log('\nGenerating src/assets/generated/index.ts...');
  let tsCode = `/**
 * Auto-generated responsive image manifests.
 * Created by scripts/generate-responsive-images.mjs
 */\n\n`;

  // Imports
  for (const [name, data] of Object.entries(manifests)) {
    for (const v of data.variants) {
      const varId = `${name.replace(/[^a-zA-Z0-9]/g, '_')}_${v.width}w`;
      tsCode += `import ${varId} from "./${v.filename}";\n`;
    }
  }

  tsCode += `\nexport interface ResponsiveImageSet {\n  src: string;\n  srcSet: string;\n  sizes: string;\n  width: number;\n  height: number;\n}\n\n`;

  // Exports
  for (const [name, data] of Object.entries(manifests)) {
    const varExportName = `${name.replace(/-([a-z])/g, (_, c) => c.toUpperCase())}Set`;
    const defaultVar = data.variants.find(v => v.width === data.defaultWidth) || data.variants[data.variants.length - 1];
    const defaultVarId = `${name.replace(/[^a-zA-Z0-9]/g, '_')}_${defaultVar.width}w`;
    const srcSetParts = data.variants.map(v => {
      const vid = `${name.replace(/[^a-zA-Z0-9]/g, '_')}_${v.width}w`;
      return `\${${vid}} ${v.width}w`;
    }).join(', ');

    tsCode += `export const ${varExportName}: ResponsiveImageSet = {\n`;
    tsCode += `  src: ${defaultVarId},\n`;
    tsCode += `  srcSet: \`${srcSetParts}\`,\n`;
    tsCode += `  sizes: "${data.sizes}",\n`;
    tsCode += `  width: ${defaultVar.width},\n`;
    tsCode += `  height: ${defaultVar.height}\n`;
    tsCode += `};\n\n`;
  }

  fs.writeFileSync(path.join(OUT_DIR, 'index.ts'), tsCode, 'utf8');
  console.log('Done! src/assets/generated/index.ts created successfully.');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});

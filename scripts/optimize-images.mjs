import sharp from 'sharp';
import fs from 'fs/promises';
import path from 'path';

const ASSETS_DIR = path.resolve('src/assets');

async function optimizeImages() {
  const files = await fs.readdir(ASSETS_DIR);
  const webpFiles = files.filter(f => f.endsWith('.webp'));
  
  let totalSaved = 0;
  let originalSizeTotal = 0;
  
  for (const file of webpFiles) {
    const filePath = path.join(ASSETS_DIR, file);
    const tempPath = path.join(ASSETS_DIR, `optimized_${file}`);
    
    try {
      const stats = await fs.stat(filePath);
      const originalSize = stats.size;
      originalSizeTotal += originalSize;
      
      await sharp(filePath)
        .webp({ quality: 75, effort: 6 })
        .toFile(tempPath);
        
      const newStats = await fs.stat(tempPath);
      const newSize = newStats.size;
      
      if (newSize < originalSize) {
        await fs.rename(tempPath, filePath);
        const saved = originalSize - newSize;
        totalSaved += saved;
        console.log(`✅ Optimized ${file}: ${(originalSize/1024).toFixed(1)}KB -> ${(newSize/1024).toFixed(1)}KB (-${(saved/1024).toFixed(1)}KB)`);
      } else {
        await fs.unlink(tempPath);
        console.log(`ℹ️ Skipped ${file}: already optimal.`);
      }
    } catch (e) {
      console.error(`❌ Failed to optimize ${file}:`, e);
      try {
        await fs.unlink(tempPath);
      } catch {} // ignore
    }
  }
  
  console.log(`\n🎉 Total space saved: ${(totalSaved/1024/1024).toFixed(2)}MB!`);
}

optimizeImages();

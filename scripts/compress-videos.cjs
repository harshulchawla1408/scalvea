/**
 * compress-videos.cjs
 * Compresses hero.mp4 and about.mp4 using ffmpeg-static.
 * Outputs compressed versions and poster images to src/assets/
 */

const { execSync, spawnSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const ffmpeg = require('ffmpeg-static');
const assetsDir = path.resolve(__dirname, '../src/assets');

const videos = [
  {
    input: path.join(assetsDir, 'hero.mp4'),
    output: path.join(assetsDir, 'hero-opt.mp4'),
    poster: path.join(assetsDir, 'hero-poster.jpg'),
    scale: 'scale=-2:720',
    crf: '28',
    label: 'Hero Video',
  },
  {
    input: path.join(assetsDir, 'about.mp4'),
    output: path.join(assetsDir, 'about-opt.mp4'),
    poster: path.join(assetsDir, 'about-poster.jpg'),
    scale: 'scale=-2:720',
    crf: '28',
    label: 'About Video',
  },
];

function sizeMB(filePath) {
  try {
    return (fs.statSync(filePath).size / 1024 / 1024).toFixed(2) + ' MB';
  } catch {
    return 'N/A';
  }
}

for (const v of videos) {
  if (!fs.existsSync(v.input)) {
    console.warn(`⚠  Input not found: ${v.input}`);
    continue;
  }

  console.log(`\n🎬 Processing ${v.label}...`);
  console.log(`   Input:  ${sizeMB(v.input)}`);

  // Compress video
  const videoArgs = [
    '-y',
    '-i', v.input,
    '-vf', v.scale,
    '-c:v', 'libx264',
    '-preset', 'medium',
    '-crf', v.crf,
    '-an',
    '-movflags', '+faststart',
    v.output,
  ];

  const videoResult = spawnSync(ffmpeg, videoArgs, { stdio: ['ignore', 'pipe', 'pipe'] });

  if (videoResult.status !== 0) {
    console.error(`❌ Video compression failed for ${v.label}`);
    const stderr = videoResult.stderr ? videoResult.stderr.toString() : '';
    const lines = stderr.split('\n');
    console.error(lines.slice(-10).join('\n'));
    continue;
  }

  console.log(`   Output: ${sizeMB(v.output)}`);

  // Extract poster frame at 0.5s
  const posterArgs = [
    '-y',
    '-i', v.input,
    '-ss', '0.5',
    '-vframes', '1',
    '-vf', 'scale=-2:720',
    '-q:v', '3',
    v.poster,
  ];

  const posterResult = spawnSync(ffmpeg, posterArgs, { stdio: ['ignore', 'pipe', 'pipe'] });

  if (posterResult.status !== 0) {
    console.error(`❌ Poster extraction failed for ${v.label}`);
  } else {
    console.log(`   Poster: ${sizeMB(v.poster)}`);
  }

  console.log(`✅ ${v.label} done.`);
}

console.log('\n🎉 Video compression complete.');

import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const sourceSvg = path.resolve(__dirname, '../src/app/icon.svg');
const publicDir = path.resolve(__dirname, '../public');
const appDir = path.resolve(__dirname, '../src/app');

const iconConfigs = [
  { name: 'apple-icon.png', size: 180, dir: appDir },
  { name: 'icon-192x192.png', size: 192, dir: publicDir },
  { name: 'icon-512x512.png', size: 512, dir: publicDir },
];

[publicDir, appDir].forEach(dir => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
});


iconConfigs.forEach(({ name, size, dir }) => {
  const outputPath = path.join(dir, name);
  
  sharp(sourceSvg)
    .resize(size, size)
    .toFormat('png')
    .toFile(outputPath, (err, info) => {
      if (err) {
        console.error(`Error generating ${name}:`, err);
      } else {
        console.log(`Successfully generated ${name} in ${dir}`, info);
      }
    });
});
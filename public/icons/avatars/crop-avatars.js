// crop-avatars.js
// Run: node crop-avatars.js
// Expects: public/icons/avatars/1.png through 15.png (3x3 grids)
// Creates: public/icons/avatars/avatar-1.png through avatar-135.png

const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const srcDir = path.join(__dirname, 'public', 'icons', 'avatars');
const outDir = srcDir;

async function cropGrid(file, gridIndex) {
  const meta = await sharp(file).metadata();
  const w = meta.width;
  const h = meta.height;
  
  // Circle centers in a 3x3 grid
  const cx = [w/6, w/2, 5*w/6];
  const cy = [h/6, h/2, 5*h/6];
  
  // Crop size: slightly smaller than cell to avoid neighbors
  const cropSize = Math.floor(Math.min(w, h) / 3 * 0.82);
  const half = Math.floor(cropSize / 2);
  
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 3; c++) {
      const num = (gridIndex - 1) * 9 + r * 3 + c + 1;
      const left = Math.max(0, Math.round(cx[c] - half));
      const top = Math.max(0, Math.round(cy[r] - half));
      // Make sure we don't exceed image bounds
      const actualW = Math.min(cropSize, w - left);
      const actualH = Math.min(cropSize, h - top);
      
      const outFile = path.join(outDir, 'avatar-' + num + '.png');
      await sharp(file)
        .extract({ left, top, width: actualW, height: actualH })
        .resize(128, 128)
        .toFile(outFile);
      console.log('Created: avatar-' + num + '.png');
    }
  }
}

async function run() {
  let total = 0;
  for (let i = 1; i <= 15; i++) {
    const file = path.join(srcDir, i + '.png');
    if (fs.existsSync(file)) {
      console.log('Processing grid ' + i + '...');
      await cropGrid(file, i);
      total += 9;
    } else {
      console.log('Skipping ' + i + '.png (not found)');
    }
  }
  console.log('\nDone! Created ' + total + ' avatars.');
}

run().catch(err => console.error('Error:', err));

import sharp from 'sharp';
import { readdirSync, statSync, unlinkSync, existsSync } from 'fs';
import { join, extname, basename } from 'path';

const dir = 'public';
const files = readdirSync(dir).filter(f => ['.png','.jpg','.jpeg'].includes(extname(f).toLowerCase()));

let totalBefore = 0, totalAfter = 0;

for (const file of files) {
  const src = join(dir, file);
  const webpName = basename(file, extname(file)) + '.webp';
  const dest = join(dir, webpName);
  const before = statSync(src).size;
  totalBefore += before;

  try {
    await sharp(src)
      .webp({ quality: 82, effort: 6 })
      .toFile(dest);

    const after = statSync(dest).size;
    totalAfter += after;
    console.log(`✓ ${file} → ${webpName}: ${(before/1024).toFixed(0)}KB → ${(after/1024).toFixed(0)}KB (-${Math.round((1-after/before)*100)}%)`);
  } catch(e) {
    totalAfter += before;
    console.error(`✗ ${file}: ${e.message}`);
  }
}

console.log(`\nTotal: ${(totalBefore/1024/1024).toFixed(2)}MB → ${(totalAfter/1024/1024).toFixed(2)}MB (-${Math.round((1-totalAfter/totalBefore)*100)}%)`);

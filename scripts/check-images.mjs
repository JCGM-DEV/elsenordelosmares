import { readFileSync, existsSync } from 'fs';

const data = JSON.parse(readFileSync('src/data/story.json', 'utf8'));
const missing = [];
const noImage = [];

for (const [id, node] of Object.entries(data.nodes)) {
  if (!node.image && !node.video) {
    noImage.push(id);
  } else if (node.image && !existsSync('public/' + node.image)) {
    missing.push({ id, img: node.image });
  }
}

if (missing.length === 0) console.log('ALL REFERENCED IMAGES EXIST ✓');
else missing.forEach(m => console.log(`MISSING: ${m.id} -> ${m.img}`));

if (noImage.length > 0) {
  console.log('\nNODES WITH NO IMAGE:');
  noImage.forEach(id => console.log('  ' + id));
}

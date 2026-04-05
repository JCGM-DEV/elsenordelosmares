import { readFileSync } from 'fs';
const data = JSON.parse(readFileSync('src/data/story.json', 'utf8'));
const byImg = {};
for (const [id, node] of Object.entries(data.nodes)) {
  if (!node.image) continue;
  if (!byImg[node.image]) byImg[node.image] = [];
  byImg[node.image].push(id);
}
for (const [img, ids] of Object.entries(byImg)) {
  if (ids.length >= 3) console.log(img + ' (' + ids.length + 'x): ' + ids.join(', '));
}

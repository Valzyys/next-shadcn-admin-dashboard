import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs';
import { join } from 'path';

function getAllFiles(dir, files = []) {
  const entries = readdirSync(dir);
  for (const entry of entries) {
    const fullPath = join(dir, entry);
    const stat = statSync(fullPath);
    if (stat.isDirectory()) {
      getAllFiles(fullPath, files);
    } else if (entry === 'page.tsx' || entry === 'page.ts') {
      files.push(fullPath);
    }
  }
  return files;
}

const files = getAllFiles('src/app');

for (const file of files) {
  let content = readFileSync(file, 'utf-8');

  if (!content.includes("export const runtime = 'edge'")) {
    continue;
  }

  content = content
    .replace(/export const runtime = 'edge';\n\n/g, '')
    .replace(/export const runtime = 'edge';\n/g, '');

  writeFileSync(file, content);
  console.log(`✅ Removed: ${file}`);
}

console.log('Done!');

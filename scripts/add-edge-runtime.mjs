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
  const content = readFileSync(file, 'utf-8');

  if (content.includes("export const runtime")) {
    console.log(`⏭ Skip: ${file}`);
    continue;
  }

  writeFileSync(file, `export const runtime = 'edge';\n\n` + content);
  console.log(`✅ Added: ${file}`);
}

console.log('Done!');

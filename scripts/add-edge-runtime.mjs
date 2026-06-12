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

  if (content.includes("export const runtime")) {
    console.log(`⏭ Skip: ${file}`);
    continue;
  }

  const runtimeLine = `export const runtime = 'edge';\n`;

  // Kalau ada "use client" atau 'use client', inject setelahnya
  const useClientMatch = content.match(/^(['"]use client['"];?\n)/m);
  if (useClientMatch) {
    content = content.replace(useClientMatch[0], `${useClientMatch[0]}\n${runtimeLine}`);
  } else {
    content = runtimeLine + '\n' + content;
  }

  writeFileSync(file, content);
  console.log(`✅ Added: ${file}`);
}

console.log('Done!');

import { readFileSync, writeFileSync } from 'fs';
import { glob } from 'glob';

const files = await glob('src/app/**/page.tsx');

for (const file of files) {
  const content = readFileSync(file, 'utf-8');
  
  if (content.includes("export const runtime")) {
    console.log(`⏭ Skip (already has runtime): ${file}`);
    continue;
  }
  
  const updated = `export const runtime = 'edge';\n\n` + content;
  writeFileSync(file, updated);
  console.log(`✅ Added edge runtime: ${file}`);
}

console.log('Done!');

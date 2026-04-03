import { build } from 'esbuild';
import { writeFileSync, readFileSync, chmodSync, mkdirSync } from 'fs';

mkdirSync('dist', { recursive: true });

await build({
  entryPoints: ['src/index.ts'],
  bundle: true,
  platform: 'node',
  target: 'node18',
  format: 'cjs',
  outfile: 'dist/index.js',
  minify: false,
  sourcemap: false,
});

const content = readFileSync('dist/index.js', 'utf-8');
writeFileSync('dist/index.js', '#!/usr/bin/env node\n' + content);
chmodSync('dist/index.js', '755');

console.log('✅ DevHive built successfully → dist/index.js');

import { execSync } from 'child_process';
import { cpSync, mkdirSync, writeFileSync, rmSync } from 'fs';

// 1. Run vite build
execSync('npx vite build', { stdio: 'inherit' });

// 2. Bundle middleware with esbuild (resolves @vercel/functions import)
execSync(
  'npx esbuild middleware.js --bundle --format=esm --platform=browser --outfile=.vercel/output/functions/_middleware.func/index.js --external:node:*',
  { stdio: 'inherit' }
);

// 3. Prepare .vercel/output
mkdirSync('.vercel/output/static', { recursive: true });

// 4. Copy dist → static
cpSync('dist', '.vercel/output/static', { recursive: true });

// 5. Write edge function config
writeFileSync('.vercel/output/functions/_middleware.func/.vc-config.json', JSON.stringify({
  runtime: 'edge',
  entrypoint: 'index.js',
}, null, 2));

// 6. Write output config with middleware route
writeFileSync('.vercel/output/config.json', JSON.stringify({
  version: 3,
  routes: [
    {
      src: '/(.*)',
      middlewarePath: '_middleware',
      continue: true,
    },
  ],
}, null, 2));

console.log('✓ Vercel Build Output API ready with bundled edge middleware');

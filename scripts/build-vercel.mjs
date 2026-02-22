import { execSync } from 'child_process';
import { cpSync, mkdirSync, writeFileSync, rmSync } from 'fs';

// 1. Run vite build
execSync('npx vite build', { stdio: 'inherit' });

// 2. Prepare .vercel/output
rmSync('.vercel/output', { recursive: true, force: true });
mkdirSync('.vercel/output/static', { recursive: true });
mkdirSync('.vercel/output/functions/_middleware.func', { recursive: true });

// 3. Copy dist → static
cpSync('dist', '.vercel/output/static', { recursive: true });

// 4. Write edge middleware function
writeFileSync('.vercel/output/functions/_middleware.func/index.js', `
export default function middleware(request) {
  const PASSWORD = process.env.SITE_PASSWORD || 'Taimoor1436';
  const auth = request.headers.get('authorization');

  if (auth) {
    const [scheme, ...rest] = auth.split(' ');
    const encoded = rest.join(' ');
    if (scheme === 'Basic' && encoded) {
      const decoded = atob(encoded);
      const idx = decoded.indexOf(':');
      const pwd = idx !== -1 ? decoded.substring(idx + 1) : decoded;
      if (pwd === PASSWORD) {
        return new Response(null, {
          headers: { 'x-middleware-next': '1' },
        });
      }
    }
  }

  return new Response('Authentication required', {
    status: 401,
    headers: {
      'WWW-Authenticate': 'Basic realm="r2t.bearplex.com"',
    },
  });
}
`);

writeFileSync('.vercel/output/functions/_middleware.func/.vc-config.json', JSON.stringify({
  runtime: 'edge',
  entrypoint: 'index.js',
}, null, 2));

// 5. Write output config with middleware route
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

console.log('✓ Vercel Build Output API ready with edge middleware');

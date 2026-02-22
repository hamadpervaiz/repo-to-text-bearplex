import { execSync } from 'child_process';
import { cpSync, mkdirSync, writeFileSync, rmSync, readdirSync, statSync } from 'fs';
import { join, extname } from 'path';

// 1. Run vite build
execSync('npx vite build', { stdio: 'inherit' });

// 2. Prepare .vercel/output
rmSync('.vercel/output', { recursive: true, force: true });
mkdirSync('.vercel/output/static', { recursive: true });

// 3. Copy dist → static (for asset files)
cpSync('dist', '.vercel/output/static', { recursive: true });

// 4. Write output config — all routes go through auth edge function,
//    except static assets which are served directly
writeFileSync('.vercel/output/config.json', JSON.stringify({
  version: 3,
  routes: [
    // Static assets bypass auth (they're referenced after page loads)
    { src: '/assets/(.*)', dest: '/assets/$1' },
    { src: '/vite\\.svg', dest: '/vite.svg' },
    { src: '/bearplex-logo\\.svg', dest: '/bearplex-logo.svg' },
    { src: '/bearplex-logo-dark\\.svg', dest: '/bearplex-logo-dark.svg' },
    { src: '/robots\\.txt', dest: '/robots.txt' },
    // Everything else goes through auth
    {
      src: '/(.*)',
      middlewarePath: '_middleware',
      continue: true,
    },
  ],
}, null, 2));

// 5. Write edge middleware (inline, no external deps)
mkdirSync('.vercel/output/functions/_middleware.func', { recursive: true });

writeFileSync('.vercel/output/functions/_middleware.func/index.js', `
var PASSWORD = process.env.SITE_PASSWORD || 'Taimoor1436';

export default function middleware(request) {
  var auth = request.headers.get('authorization');

  if (auth) {
    var parts = auth.split(' ');
    var scheme = parts[0];
    var encoded = parts.slice(1).join(' ');
    if (scheme === 'Basic' && encoded) {
      var decoded = atob(encoded);
      var idx = decoded.indexOf(':');
      var pwd = idx !== -1 ? decoded.substring(idx + 1) : decoded;
      if (pwd === PASSWORD) {
        return new Response(null, {
          headers: {
            'x-middleware-next': '1',
            'x-debug-auth': 'matched'
          }
        });
      }
    }
  }

  return new Response('Authentication required', {
    status: 401,
    headers: {
      'WWW-Authenticate': 'Basic realm="r2t.bearplex.com"'
    }
  });
}
`);

writeFileSync('.vercel/output/functions/_middleware.func/.vc-config.json', JSON.stringify({
  runtime: 'edge',
  entrypoint: 'index.js',
}, null, 2));

console.log('✓ Build complete with edge auth middleware');

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
var PASSWORD = 'Taimoor1436';

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
            'x-middleware-next': '1'
          }
        });
      }
    }
  }

  var html = '<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Access Required | BearPlex</title><style>*{margin:0;padding:0;box-sizing:border-box}body{min-height:100vh;display:flex;align-items:center;justify-content:center;background:#0a0e17;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;color:#e6edf3;padding:24px}.card{max-width:420px;width:100%;text-align:center}.icon{width:64px;height:64px;margin:0 auto 24px;border-radius:16px;background:rgba(47,129,247,.12);border:1px solid rgba(47,129,247,.2);display:flex;align-items:center;justify-content:center}.icon svg{width:28px;height:28px;color:#58a6ff}h1{font-size:24px;font-weight:700;margin-bottom:8px}p{font-size:14px;color:#8b949e;line-height:1.6;margin-bottom:16px}a{color:#58a6ff;text-decoration:none;font-weight:500}a:hover{text-decoration:underline}.btn{display:inline-flex;align-items:center;gap:8px;margin-top:8px;padding:10px 24px;background:rgba(47,129,247,.15);border:1px solid rgba(47,129,247,.3);border-radius:10px;color:#58a6ff;font-size:14px;font-weight:500;cursor:pointer;text-decoration:none}.btn:hover{background:rgba(47,129,247,.25);text-decoration:none}.sub{font-size:12px;color:#484f58;margin-top:24px}</style></head><body><div class="card"><div class="icon"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z"/></svg></div><h1>Access Required</h1><p>This tool is for internal BearPlex use. To get access, contact:</p><a class="btn" href="mailto:hamad@bearplex.com?subject=Access%20Request%20%E2%80%93%20Repo%20to%20Text"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" /></svg>hamad@bearplex.com</a><p class="sub">Repo to Text &middot; BearPlex</p></div></body></html>';

  return new Response(html, {
    status: 401,
    headers: {
      'WWW-Authenticate': 'Basic realm="r2t.bearplex.com"',
      'Content-Type': 'text/html; charset=utf-8'
    }
  });
}
`);

writeFileSync('.vercel/output/functions/_middleware.func/.vc-config.json', JSON.stringify({
  runtime: 'edge',
  entrypoint: 'index.js',
}, null, 2));

console.log('✓ Build complete with edge auth middleware');

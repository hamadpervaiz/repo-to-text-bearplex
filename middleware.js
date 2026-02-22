import { next } from '@vercel/functions';

const PASSWORD = process.env.SITE_PASSWORD || 'Taimoor1436';

export default function middleware(request) {
  const auth = request.headers.get('authorization');

  if (auth) {
    const [scheme, ...rest] = auth.split(' ');
    const encoded = rest.join(' ');
    if (scheme === 'Basic' && encoded) {
      const decoded = atob(encoded);
      const idx = decoded.indexOf(':');
      const pwd = idx !== -1 ? decoded.substring(idx + 1) : decoded;
      if (pwd === PASSWORD) {
        return next();
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

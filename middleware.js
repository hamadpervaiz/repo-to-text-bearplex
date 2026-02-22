const PASSWORD = process.env.SITE_PASSWORD || 'Taimoor1436';

export default function middleware(request) {
  const auth = request.headers.get('authorization');

  if (auth) {
    const [scheme, encoded] = auth.split(' ');
    if (scheme === 'Basic') {
      const decoded = atob(encoded);
      const [, pwd] = decoded.split(':');
      if (pwd === PASSWORD) {
        return;
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

export const config = {
  matcher: '/(.*)',
};

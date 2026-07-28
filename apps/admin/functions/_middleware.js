export async function onRequest(context) {
  const url = new URL(context.request.url);
  const pathname = url.pathname;

  // Pages réelles
  if (pathname === '/' || pathname === '/index.html' || pathname === '/dashboard.html') {
    return context.next();
  }

  // Fichiers statiques
  if (/\.(js|css|png|jpg|svg|ico|json|txt|woff2?)$/i.test(pathname)) {
    return context.next();
  }

  // Tout /dashboard/* → servir dashboard.html
  if (pathname.startsWith('/dashboard')) {
    return context.env.ASSETS.fetch(new URL('/dashboard.html', url.origin));
  }

  return context.next();
}

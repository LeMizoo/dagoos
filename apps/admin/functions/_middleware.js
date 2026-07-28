export async function onRequest(context) {
  const url = new URL(context.request.url);
  const pathname = url.pathname;

  // Ne JAMAIS intercepter les fichiers
  if (/\.(js|css|png|jpg|jpeg|svg|ico|json|txt|woff|woff2|ttf|eot|map)$/i.test(pathname)) {
    return context.next();
  }

  // Pages réelles
  if (pathname === '/' || pathname === '/index.html' || pathname === '/dashboard.html' || pathname === '/register.html') {
    return context.next();
  }

  // Dossiers statiques
  if (pathname.startsWith('/js/') || pathname.startsWith('/css/') || pathname.startsWith('/pages/') || 
      pathname.startsWith('/assets/') || pathname.startsWith('/icons/') || pathname.startsWith('/favicon.') ||
      pathname === '/config.js' || pathname === '/manifest.json' || pathname === '/_headers') {
    return context.next();
  }

  // /dashboard/* → dashboard.html
  if (pathname.startsWith('/dashboard')) {
    return context.env.ASSETS.fetch(new URL('/dashboard.html', url.origin));
  }

  return context.next();
}

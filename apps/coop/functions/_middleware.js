export async function onRequest(context) {
  const url = new URL(context.request.url);
  const pathname = url.pathname;

  // Pages OK → laisser passer
  const pages = ['/', '/index.html', '/dashboard.html', '/dashboard',
                 '/register', '/register.html',
                 '/config.js', '/favicon.svg', '/favicon.ico', '/manifest.json'];
  if (pages.includes(pathname)) return context.next();

  // Fichiers OK
  if (/\.(js|css|png|jpg|svg|ico|json|txt|woff2?)$/i.test(pathname)) return context.next();

  // Dossiers OK
  if (/^\/(pages|js|assets|icons|src)\//.test(pathname)) return context.next();

  // Slug → dashboard
  return Response.redirect(url.origin + '/dashboard.html', 302);
}

export async function onRequest(context) {
  const url = new URL(context.request.url);
  const pathname = url.pathname;

  // Pages existantes (ne pas rediriger)
  const existingPages = [
    '/', '/index.html', '/dashboard.html', '/dashboard',
    '/register', '/register.html',
    '/vitrine', '/vitrine.html',
    '/config.js', '/favicon.svg', '/favicon.ico',
    '/manifest.json'
  ];

  for (const p of existingPages) {
    if (pathname === p) return context.next();
  }

  // Fichiers statiques (js, css, images, fonts)
  if (/\.(js|css|png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|eot|json|xml|txt)$/i.test(pathname)) {
    return context.next();
  }

  // URLs avec préfixe (pages/, js/, assets/, icons/)
  if (/^\/(pages|js|assets|icons|functions|src|public|node_modules)\//.test(pathname)) {
    return context.next();
  }

  // Pour tout le reste (les slugs), servir vitrine.html
  return context.env.ASSETS.fetch(new Request(url.origin + '/vitrine.html', context.request));
}

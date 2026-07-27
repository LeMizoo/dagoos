export async function onRequest(context) {
  const url = new URL(context.request.url);
  const path = url.pathname;
  
  // Fichiers statiques et pages existantes : ne pas toucher
  const staticPaths = ['/js/', '/css/', '/pages/', '/assets/', '/favicon.ico'];
  const existingPages = ['/', '/index.html', '/dashboard.html', '/register.html', '/vitrine.html', '/dashboard'];
  
  for (const p of staticPaths) {
    if (path.startsWith(p)) return context.next();
  }
  for (const p of existingPages) {
    if (path === p) return context.next();
  }
  
  // Pour tout le reste (les slugs), servir vitrine.html
  return context.env.ASSETS.fetch(new Request(url.origin + '/vitrine.html', context.request));
}

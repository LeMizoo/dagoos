#!/usr/bin/env python3
"""
Serveur local fleet-driver avec rewrite d'URL.

Problème résolu : le serveur statique `python -m http.server` renvoie 404
sur /dashboard car le fichier réel est dashboard.html. En production
(Cloudflare Pages, Vercel, etc.), une règle de rewrite fait la conversion.
Ce script fait la même chose en local.

Utilisation :
    cd apps/fleet-driver
    python serve.py
"""
import http.server
import os
import sys

PORT = 8081


class RewriteHandler(http.server.SimpleHTTPRequestHandler):
    """Handler qui essaie d'ajouter .html si la ressource n'existe pas."""

    def do_GET(self):
        clean = self.path.split('?')[0].split('#')[0]

        # /dashboard → /dashboard.html
        # /quelque/chose → /quelque/chose.html
        # On ne touche pas : /, /fichier.ext, /chemin/avec.point/
        if clean != '/' and '.' not in os.path.basename(clean):
            possible_html = clean + '.html'
            if os.path.exists('.' + possible_html):
                self.path = possible_html
                return super().do_GET()

        return super().do_GET()

    def log_message(self, fmt, *args):
        # Logs lisibles sur stderr
        sys.stderr.write("%s - - [%s] %s\n" % (
            self.address_string(),
            self.log_date_time_string(),
            fmt % args,
        ))


if __name__ == '__main__':
    # Se placer dans le dossier du script
    os.chdir(os.path.dirname(os.path.abspath(__file__)))

    with http.server.HTTPServer(('', PORT), RewriteHandler) as httpd:
        print(f"Serving at http://localhost:{PORT}")
        print("Rewrite actif : /dashboard -> /dashboard.html")
        print("Ctrl+C pour arrêter")
        httpd.serve_forever()

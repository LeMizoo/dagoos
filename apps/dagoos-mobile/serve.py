#!/usr/bin/env python3
"""
Serveur local pour dagoos-mobile.

Problème résolu : le serveur statique `python -m http.server` renvoie 404
sur /dashboard car le fichier réel est dashboard.html. En production
(Cloudflare Pages, Vercel, etc.), une règle de rewrite fait la conversion.
Ce script fait la même chose en local.

Utilisation :
    cd apps/dagoos-mobile
    python serve.py

Puis ouvrir :
    http://localhost:8080/
"""
import http.server
import os
import sys

PORT = 8080
APP_NAME = "dagoos-mobile"


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
        sys.stderr.write("%s - - [%s] %s\n" % (
            self.address_string(),
            self.log_date_time_string(),
            fmt % args,
        ))


if __name__ == '__main__':
    os.chdir(os.path.dirname(os.path.abspath(__file__)))

    with http.server.HTTPServer(('', PORT), RewriteHandler) as httpd:
        print(f"[{APP_NAME}] Serving at http://localhost:{PORT}")
        print(f"Rewrite actif : /dashboard -> /dashboard.html")
        print("Ctrl+C pour arrêter")
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nArrêt du serveur.")

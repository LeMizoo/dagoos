import Link from 'next/link';

export default function LandingFooter() {
  return (
    <footer className="bg-gray-900 text-gray-400 py-12 text-sm">
      <div className="max-w-6xl mx-auto px-4">
        <div className="grid md:grid-cols-4 gap-8 mb-8">

          {/* Logo + description */}
          <div>
            <div className="font-display text-white font-bold text-lg mb-3">
              DAGO MOBILITY
            </div>
            <p className="text-gray-400 text-sm leading-relaxed">
              La mobilité connectée... Chez les potes, ça roule.
            </p>
          </div>

          {/* Produit */}
          <div>
            <h4 className="text-white font-semibold mb-3">Produit</h4>
            <ul className="space-y-2">
              <li>
                <a
                  href="#services-de-mobilite"
                  className="hover:text-emerald-400 transition"
                >
                  Fonctionnalités
                </a>
              </li>
              <li>
                <a
                  href="#plans"
                  className="hover:text-emerald-400 transition"
                >
                  Tarifs
                </a>
              </li>
              <li>
                <Link
                  href="/aide#faq"
                  className="hover:text-emerald-400 transition"
                >
                  FAQ
                </Link>
              </li>
            </ul>
          </div>

          {/* Entreprise */}
          <div>
            <h4 className="text-white font-semibold mb-3">Entreprise</h4>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/a-propos"
                  className="hover:text-emerald-400 transition"
                >
                  À propos
                </Link>
              </li>
              <li>
                <Link
                  href="/blog"
                  className="hover:text-emerald-400 transition"
                >
                  Blog
                </Link>
              </li>
              <li>
                <Link
                  href="/carrieres"
                  className="hover:text-emerald-400 transition"
                >
                  Carrières
                </Link>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="text-white font-semibold mb-3">Support</h4>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/aide"
                  className="hover:text-emerald-400 transition"
                >
                  Centre d'aide
                </Link>
              </li>
              <li>
                <Link
                  href="/contact"
                  className="hover:text-emerald-400 transition"
                >
                  Contact
                </Link>
              </li>
              <li>
                <Link
                  href="/statut"
                  className="hover:text-emerald-400 transition"
                >
                  Statut
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bas de page */}
        <div className="border-t border-gray-700 pt-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <p>
            © {new Date().getFullYear()} Dago Mobility. Tous droits réservés.
          </p>

          <a
            href="#top"
            className="bg-emerald-600 text-white w-10 h-10 rounded-full flex items-center justify-center hover:bg-emerald-700 transition"
            aria-label="Revenir en haut"
          >
            ↑
          </a>
        </div>
      </div>
    </footer>
  );
}

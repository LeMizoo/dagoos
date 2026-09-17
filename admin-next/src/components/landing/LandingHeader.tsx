import Image from 'next/image';
import Link from 'next/link';

export default function LandingHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-gray-200 bg-white/95 backdrop-blur-sm">
      <div className="mx-auto flex h-16 max-w-7xl items-center px-4 sm:px-6 lg:px-8">
        <Link
          href="/"
          aria-label="Dago Mobility — Accueil"
          className="inline-flex items-center transition-opacity hover:opacity-80"
        >
          <Image
            src="/b-trans.svg"
            alt="B-Trans"
            width={150}
            height={48}
            priority
            className="h-10 w-auto"
          />
        </Link>
      </div>
    </header>
  );
}

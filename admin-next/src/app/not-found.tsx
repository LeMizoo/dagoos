import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-gray-300 mb-4">404</h1>
        <p className="text-gray-500 mb-6">Page introuvable</p>
        <Link href="/dashboard" className="text-primary hover:underline text-sm">
          Retour au tableau de bord
        </Link>
      </div>
    </div>
  );
}

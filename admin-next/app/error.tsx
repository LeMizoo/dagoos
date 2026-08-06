'use client';
export default function ErrorPage({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-red-400 mb-4">Erreur</h1>
        <p className="text-gray-500 mb-6">{error.message || 'Une erreur est survenue'}</p>
        <button onClick={reset} className="px-4 py-2 bg-primary text-white rounded-lg text-sm hover:bg-blue-800">
          Réessayer
        </button>
      </div>
    </div>
  );
}

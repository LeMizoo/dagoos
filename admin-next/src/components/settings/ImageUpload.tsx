'use client';

import { useRef, useState } from 'react';
import { Upload, X, Loader2, AlertCircle } from 'lucide-react';
import { apiFetch } from '@/lib/api';

interface ImageUploadProps {
  organizationId: string;
  currentUrl: string;
  onChange: (url: string) => void;
  maxSizeMb?: number;
  className?: string;
}

const DEFAULT_MAX_SIZE = 5 * 1024 * 1024;

export default function ImageUpload({
  organizationId,
  currentUrl,
  onChange,
  maxSizeMb = 5,
  className = '',
}: ImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const maxBytes = maxSizeMb * 1024 * 1024;

  async function handleFile(file: File) {
    setError('');

    if (!file.type.startsWith('image/')) {
      setError('Fichier non supporté. Utilisez une image.');
      return;
    }

    if (file.size > maxBytes) {
      setError(
        `Image trop lourde (${Math.round(file.size / 1024)} KB). Max ${maxSizeMb} MB.`
      );
      return;
    }

    setUploading(true);

    try {
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = () => reject(reader.error);
        reader.readAsDataURL(file);
      });

      const res = await apiFetch(`/organizations/${organizationId}/upload`, {
        method: 'POST',
        body: JSON.stringify({ image: base64 }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `Erreur ${res.status}`);
      }

      const data = await res.json();
      onChange(data.url);
    } catch (err: any) {
      setError(err.message || 'Erreur lors de l\'upload');
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  }

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex gap-2 items-center flex-wrap">
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFile(file);
          }}
        />

        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="px-3 py-2 border rounded-lg text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {uploading ? (
            <>
              <Loader2 size={14} className="animate-spin" />
              Upload...
            </>
          ) : (
            <>
              <Upload size={14} />
              Choisir une image
            </>
          )}
        </button>

        {currentUrl && (
          <button
            type="button"
            onClick={() => onChange('')}
            className="px-3 py-2 border rounded-lg text-sm text-red-600 hover:bg-red-50 flex items-center gap-1"
            title="Retirer l'image"
          >
            <X size={14} />
            Retirer
          </button>
        )}
      </div>

      {error && (
        <p className="text-xs text-red-600 flex items-center gap-1">
          <AlertCircle size={12} /> {error}
        </p>
      )}

      {currentUrl && (
        <div className="mt-2 border rounded-lg overflow-hidden max-w-md">
          <img
            src={currentUrl}
            alt="Preview"
            className="w-full h-32 object-cover"
            onError={() => setError('Image inaccessible')}
          />
        </div>
      )}
    </div>
  );
}

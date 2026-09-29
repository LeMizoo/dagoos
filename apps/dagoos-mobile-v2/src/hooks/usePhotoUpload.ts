import { useCallback, useState } from 'react';
import { apiPost } from '../services/api';
import type {
  LocationService,
  PhotoUploadResponse,
} from '../types/api';

const MAX_PHOTOS = 5;
const MAX_FILE_SIZE = 5 * 1024 * 1024;
const MAX_IMAGE_WIDTH = 1920;
const JPEG_QUALITY = 0.8;

const PHOTO_ENABLED_SERVICES: LocationService[] = [
  'marchandises',
  'demenagement',
  'depannage',
  'fret',
];

const ALLOWED_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/heic',
  'image/heif',
];

function isPhotoService(
  service: LocationService | undefined
): boolean {
  return service !== undefined &&
    PHOTO_ENABLED_SERVICES.includes(service);
}

function compressImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onerror = () => {
      reject(new Error('Impossible de lire l’image'));
    };

    reader.onload = () => {
      const source = String(reader.result);

      const image = new Image();

      image.onerror = () => {
        reject(new Error('Image invalide'));
      };

      image.onload = () => {
        let width = image.width;
        let height = image.height;

        if (width > MAX_IMAGE_WIDTH) {
          const ratio = MAX_IMAGE_WIDTH / width;
          width = MAX_IMAGE_WIDTH;
          height = Math.round(height * ratio);
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const context = canvas.getContext('2d');

        if (!context) {
          reject(new Error('Impossible de préparer l’image'));
          return;
        }

        context.drawImage(image, 0, 0, width, height);

        resolve(
          canvas.toDataURL('image/jpeg', JPEG_QUALITY)
        );
      };

      image.src = source;
    };

    reader.readAsDataURL(file);
  });
}

export interface UsePhotoUploadResult {
  photos: string[];
  uploading: boolean;
  error: Error | null;
  addFiles: (
    files: File[],
    typeService: LocationService
  ) => Promise<void>;
  removePhoto: (index: number) => void;
  clearPhotos: () => void;
}

export function usePhotoUpload(): UsePhotoUploadResult {
  const [photos, setPhotos] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const addFiles = useCallback(
    async (
      files: File[],
      typeService: LocationService
    ): Promise<void> => {
      setError(null);

      if (!isPhotoService(typeService)) {
        setError(
          new Error(
            'Les photos ne sont pas disponibles pour ce service'
          )
        );
        return;
      }

      const available = MAX_PHOTOS - photos.length;

      if (available <= 0) {
        setError(
          new Error(`Maximum ${MAX_PHOTOS} photos`)
        );
        return;
      }

      const selectedFiles = files.slice(0, available);

      if (selectedFiles.length < files.length) {
        setError(
          new Error(`Maximum ${MAX_PHOTOS} photos`)
        );
      }

      setUploading(true);

      try {
        const uploadedUrls: string[] = [];

        for (const file of selectedFiles) {
          if (!ALLOWED_TYPES.includes(file.type)) {
            throw new Error(
              `Format non supporté : ${file.name}`
            );
          }

          if (file.size > MAX_FILE_SIZE) {
            throw new Error(
              `Image trop volumineuse : ${file.name}`
            );
          }

          const dataUri = await compressImage(file);

          const result = await apiPost<PhotoUploadResponse>(
            '/public/upload-photo',
            {
              image: dataUri,
              typeService,
            }
          );

          if (!result.url) {
            throw new Error(
              result.error || 'Upload photo échoué'
            );
          }

          uploadedUrls.push(result.url);
        }

        setPhotos((current) => [
          ...current,
          ...uploadedUrls,
        ]);
      } catch (err) {
        setError(
          err instanceof Error
            ? err
            : new Error(String(err))
        );
      } finally {
        setUploading(false);
      }
    },
    [photos.length]
  );

  const removePhoto = useCallback((index: number) => {
    setPhotos((current) =>
      current.filter((_, photoIndex) => photoIndex !== index)
    );
  }, []);

  const clearPhotos = useCallback(() => {
    setPhotos([]);
    setError(null);
  }, []);

  return {
    photos,
    uploading,
    error,
    addFiles,
    removePhoto,
    clearPhotos,
  };
}
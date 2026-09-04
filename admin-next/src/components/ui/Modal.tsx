'use client';
import { useEffect } from 'react';
import { X } from 'lucide-react';
import CarAnimation from './CarAnimation';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  carColor?: string;
}

const sizes = {
  sm: 'max-w-sm',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
};

export default function Modal({ open, onClose, title, children, size = 'md', carColor = '#3b82f6' }: ModalProps) {
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
      const handleEscape = (e: KeyboardEvent) => {
        if (e.key === 'Escape') onClose();
      };
      window.addEventListener('keydown', handleEscape);
      return () => {
        document.body.style.overflow = '';
        window.removeEventListener('keydown', handleEscape);
      };
    }
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Overlay avec animation */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fadeIn"
        onClick={onClose}
      />
      
      {/* Carte modale avec animation */}
      <div className={`
        relative bg-white rounded-2xl shadow-2xl w-full ${sizes[size]} mx-4 
        max-h-[90vh] overflow-y-auto
        animate-slideIn
        border border-gray-200
      `}>
        {/* En-tête */}
        <div className="sticky top-0 flex items-center justify-between p-5 border-b border-gray-200 bg-white rounded-t-2xl z-10">
          <div className="flex-1">
            <h2 className="text-lg font-bold text-gray-900 tracking-tight">{title}</h2>
            <div className="mt-1.5">
              <CarAnimation color={carColor} duration={3} />
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 hover:bg-gray-100 rounded-full transition-all duration-200 hover:rotate-90"
            aria-label="Fermer"
          >
            <X size={20} className="text-gray-500 hover:text-gray-700" />
          </button>
        </div>
        
        {/* Corps */}
        <div className="p-5">{children}</div>
      </div>

      {/* Styles d'animation */}
      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideIn {
          from { 
            transform: translateY(20px) scale(0.95); 
            opacity: 0; 
          }
          to { 
            transform: translateY(0) scale(1); 
            opacity: 1; 
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out;
        }
        .animate-slideIn {
          animation: slideIn 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}

import { RefreshCw, X } from 'lucide-react';

interface PwaUpdateBannerProps {
  visible: boolean;
  onUpdate: () => void;
  onLater: () => void;
}

export function PwaUpdateBanner({
  visible,
  onUpdate,
  onLater,
}: PwaUpdateBannerProps) {
  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="pwa-update-title"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9998,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
        background: 'rgba(0, 0, 0, 0.5)',
        backdropFilter: 'blur(4px)',
        WebkitBackdropFilter: 'blur(4px)',
      }}
    >
      <div
        style={{
          position: 'relative',
          width: 'min(360px, 90vw)',
          padding: '28px 24px',
          borderRadius: 16,
          background: 'var(--bg-surface)',
          color: 'var(--text-primary)',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
          textAlign: 'center',
        }}
      >
        <button
          type="button"
          aria-label="Fermer"
          onClick={onLater}
          style={{
            position: 'absolute',
            top: 12,
            right: 12,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 36,
            height: 36,
            border: 0,
            borderRadius: 10,
            background: 'transparent',
            color: 'var(--text-muted)',
            cursor: 'pointer',
          }}
        >
          <X size={20} strokeWidth={2} />
        </button>

        <div
          style={{
            width: 64,
            height: 64,
            margin: '0 auto 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '50%',
            background: 'var(--accent-soft)',
            color: 'var(--accent)',
          }}
        >
          <RefreshCw size={30} strokeWidth={2.2} />
        </div>

        <h2
          id="pwa-update-title"
          style={{
            margin: '0 0 8px',
            fontSize: 18,
            fontWeight: 700,
            color: 'var(--text-primary)',
          }}
        >
          Mise à jour disponible
        </h2>

        <p
          style={{
            margin: '0 0 20px',
            fontSize: 14,
            lineHeight: 1.5,
            color: 'var(--text-secondary)',
          }}
        >
          Une nouvelle version de DAGOO&apos;S est disponible.
          Mettez à jour pour profiter des dernières améliorations.
        </p>

        <div
          style={{
            display: 'flex',
            gap: 10,
            justifyContent: 'center',
          }}
        >
          <button
            type="button"
            onClick={onLater}
            style={{
              flex: 1,
              minHeight: 44,
              border: 0,
              borderRadius: 10,
              background: 'var(--bg-soft)',
              color: 'var(--text-secondary)',
              fontWeight: 600,
              fontSize: 14,
              cursor: 'pointer',
              fontFamily: 'inherit',
            }}
          >
            Plus tard
          </button>

          <button
            type="button"
            onClick={onUpdate}
            style={{
              flex: 1,
              minHeight: 44,
              border: 0,
              borderRadius: 10,
              background: 'var(--navy)',
              color: 'var(--text-on-accent)',
              fontWeight: 700,
              fontSize: 14,
              cursor: 'pointer',
              fontFamily: 'inherit',
            }}
          >
            Mettre à jour
          </button>
        </div>
      </div>
    </div>
  );
}
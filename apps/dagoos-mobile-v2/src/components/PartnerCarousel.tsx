import {
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import type { TouchEvent } from 'react';
import type { Organization } from '../types/api';
import { PartnerCard } from './PartnerCard';

interface PartnerCarouselProps {
  organizations: Organization[];
  onSelect: (organization: Organization) => void;
}

const AUTO_ROTATE_MS = 4000;
const SWIPE_THRESHOLD = 50;

export function PartnerCarousel({
  organizations,
  onSelect,
}: PartnerCarouselProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const touchStartX = useRef<number | null>(null);

  const count = organizations.length;

  const goNext = useCallback(() => {
    if (count < 2) return;

    setActiveIndex((current) => (current + 1) % count);
  }, [count]);

  const goPrevious = useCallback(() => {
    if (count < 2) return;

    setActiveIndex((current) => (current - 1 + count) % count);
  }, [count]);

  useEffect(() => {
    if (count < 2) return;

    const interval = window.setInterval(goNext, AUTO_ROTATE_MS);

    return () => {
      window.clearInterval(interval);
    };
  }, [count, goNext]);

  const handleTouchStart = (event: TouchEvent<HTMLDivElement>) => {
    touchStartX.current = event.touches[0]?.clientX ?? null;
  };

  const handleTouchEnd = (event: TouchEvent<HTMLDivElement>) => {
    if (touchStartX.current === null) return;

    const touchEndX = event.changedTouches[0]?.clientX;

    if (touchEndX === undefined) {
      touchStartX.current = null;
      return;
    }

    const deltaX = touchEndX - touchStartX.current;

    touchStartX.current = null;

    if (Math.abs(deltaX) < SWIPE_THRESHOLD) return;

    if (deltaX < 0) {
      goNext();
    } else {
      goPrevious();
    }
  };

  if (count === 0) {
    return null;
  }

  const getPosition = (index: number): number => {
    let position = index - activeIndex;

    if (position > count / 2) {
      position -= count;
    }

    if (position < -count / 2) {
      position += count;
    }

    return position;
  };

  return (
    <div className="partner-carousel">
      <button
        type="button"
        className="partner-carousel__control partner-carousel__control--previous"
        onClick={goPrevious}
        aria-label="Partenaire précédent"
      >
        <ChevronLeft size={24} aria-hidden="true" />
      </button>

      <div
        className="partner-carousel__scene"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <div className="partner-carousel__track">
          {organizations.map((organization, index) => {
            const position = getPosition(index);

            if (Math.abs(position) > 2) {
              return null;
            }

            const translateZ = -Math.abs(position) * 150;
            const angle = position * 25;
            const scale = position === 0 ? 1 : 0.85;

            return (
              <div
                key={organization.slug}
                className={`partner-carousel__item${
                  position === 0
                    ? ' partner-carousel__item--active'
                    : ''
                }`}
                style={{
                  transform: `translateX(${position * 210}px) translateZ(${translateZ}px) rotateY(${-angle}deg) scale(${scale})`,
                  zIndex: 10 - Math.abs(position),
                  opacity: Math.abs(position) > 2 ? 0 : 1,
                }}
              >
                <PartnerCard
                  organization={organization}
                  active={position === 0}
                  onClick={onSelect}
                />
              </div>
            );
          })}
        </div>
      </div>

      <button
        type="button"
        className="partner-carousel__control partner-carousel__control--next"
        onClick={goNext}
        aria-label="Partenaire suivant"
      >
        <ChevronRight size={24} aria-hidden="true" />
      </button>
    </div>
  );
}
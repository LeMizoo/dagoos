'use client';
import { useEffect, useRef, useState } from 'react';

interface AnimatedSectionProps {
  children: React.ReactNode;
  className?: string;
  animation?: 'fade-up' | 'fade-in' | 'scale-in' | 'slide-left' | 'slide-right';
}

export default function AnimatedSection({ children, className = '', animation = 'fade-up' }: AnimatedSectionProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(entry.target);
        }
      },
      { threshold: 0.1 }
    );

    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  const animations: Record<string, string> = {
    'fade-up': 'translate-y-8 opacity-0',
    'fade-in': 'opacity-0',
    'scale-in': 'scale-95 opacity-0',
    'slide-left': '-translate-x-8 opacity-0',
    'slide-right': 'translate-x-8 opacity-0',
  };

  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ease-out ${className} ${
        isVisible ? 'translate-y-0 translate-x-0 scale-100 opacity-100' : animations[animation]
      }`}
    >
      {children}
    </div>
  );
}

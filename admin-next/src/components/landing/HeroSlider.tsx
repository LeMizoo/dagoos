'use client';
import { useState, useEffect } from 'react';

const slides = [
  '/images/slide/S0001.jpg',
  '/images/slide/S0002.jpg',
  '/images/slide/S0003.jpg',
  '/images/slide/flotte-04.png',
  '/images/slide/flotte-05.png',
  '/images/slide/flotte-06.png',
];

export default function HeroSlider() {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent(prev => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  return (
    <>
      {slides.map((slide, index) => (
        <div
          key={slide}
          className="absolute inset-0 bg-cover bg-center transition-opacity duration-1000"
          style={{
            backgroundImage: `url(${slide})`,
            opacity: index === current ? 0.25 : 0,
          }}
        />
      ))}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-2 z-20">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrent(index)}
            className={`w-2.5 h-2.5 rounded-full transition-all ${
              index === current ? 'bg-secondary w-6' : 'bg-white/50 hover:bg-white/80'
            }`}
          />
        ))}
      </div>
    </>
  );
}

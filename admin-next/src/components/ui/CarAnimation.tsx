'use client';

interface CarAnimationProps {
  color?: string;
  duration?: number;
}

export default function CarAnimation({ 
  color = '#3b82f6', 
  duration = 3 
}: CarAnimationProps) {
  return (
    <div className="relative h-1.5 bg-gray-100 rounded-full overflow-hidden">
      <div 
        className="absolute top-0 left-0 h-full rounded-full"
        style={{
          animation: `carMove ${duration}s linear infinite`,
          width: '60px',
        }}
      >
        <svg 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke={color} 
          strokeWidth="2" 
          strokeLinecap="round" 
          strokeLinejoin="round"
          style={{
            width: '100%',
            height: '100%',
          }}
        >
          <path d="M5 17h-2v-6l2-5h9l4 5h1a2 2 0 0 1 2 2v4h-2" />
          <circle cx="7" cy="17" r="2" />
          <circle cx="17" cy="17" r="2" />
          <path d="M9 17h6" />
        </svg>
      </div>
      <style jsx>{`
        @keyframes carMove {
          0% { transform: translateX(-60px); opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { transform: translateX(calc(100% + 60px)); opacity: 0; }
        }
      `}</style>
    </div>
  );
}

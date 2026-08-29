import { useState, useRef } from 'react';
import { cn } from '../../utils/cn';

export default function ThreeDCard({ children, className, intensity = 10 }) {
  const [rotate, setRotate] = useState({ x: 0, y: 0 });
  const [glare, setGlare] = useState({ x: 0, y: 0, opacity: 0 });
  const containerRef = useRef(null);

  const onMouseMove = (e) => {
    if (!containerRef.current) return;
    const card = containerRef.current.getBoundingClientRect();
    const x = e.clientX - card.left;
    const y = e.clientY - card.top;
    const centerX = card.width / 2;
    const centerY = card.height / 2;
    const rotateX = ((y - centerY) / centerY) * intensity;
    const rotateY = ((centerX - x) / centerX) * intensity;

    setRotate({ x: rotateX, y: rotateY });
    setGlare({
      x: (x / card.width) * 100,
      y: (y / card.height) * 100,
      opacity: 0.15
    });
  };

  const onMouseLeave = () => {
    setRotate({ x: 0, y: 0 });
    setGlare(prev => ({ ...prev, opacity: 0 }));
  };

  return (
    <div
      ref={containerRef}
      className={cn('perspective-1000 relative', className)}
      onMouseMove={onMouseMove}
      onMouseLeave={onMouseLeave}
    >
      <div
        className="preserve-3d transition-transform duration-200 ease-out h-full w-full relative"
        style={{
          transform: `rotateX(${rotate.x}deg) rotateY(${rotate.y}deg)`,
        }}
      >
        {children}

        {/* Glare Effect */}
        <div
          className="absolute inset-0 pointer-events-none transition-opacity duration-300 rounded-[inherit]"
          style={{
            background: `radial-gradient(circle at ${glare.x}% ${glare.y}%, rgba(255,255,255,0.4) 0%, transparent 80%)`,
            opacity: glare.opacity
          }}
        />
      </div>
    </div>
  );
}

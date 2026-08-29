import { useState } from 'react';
import { cn } from '../../utils/cn';

export default function ThreeDCard({ children, className, intensity = 10 }) {
  const [rotate, setRotate] = useState({ x: 0, y: 0 });

  const onMouseMove = (e) => {
    const card = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - card.left;
    const y = e.clientY - card.top;
    const centerX = card.width / 2;
    const centerY = card.height / 2;
    const rotateX = ((y - centerY) / centerY) * intensity;
    const rotateY = ((centerX - x) / centerX) * intensity;

    setRotate({ x: rotateX, y: rotateY });
  };

  const onMouseLeave = () => {
    setRotate({ x: 0, y: 0 });
  };

  return (
    <div
      className={cn('perspective-1000', className)}
      onMouseMove={onMouseMove}
      onMouseLeave={onMouseLeave}
    >
      <div
        className="preserve-3d transition-transform duration-200 ease-out"
        style={{
          transform: `rotateX(${rotate.x}deg) rotateY(${rotate.y}deg)`,
        }}
      >
        {children}
      </div>
    </div>
  );
}

import { useMemo } from 'react';
import { cn } from '../../utils/cn';

export default function ThreeDBackground() {
  const elements = useMemo(() => [
    { size: 'w-64 h-64', color: 'bg-primary-500/10', pos: 'top-10 -left-32', delay: '0s' },
    { size: 'w-96 h-96', color: 'bg-emerald-500/10', pos: 'bottom-20 -right-48', delay: '1s' },
    { size: 'w-48 h-48', color: 'bg-blue-500/10', pos: 'top-1/2 left-1/4', delay: '0.5s' },
    { size: 'w-80 h-80', color: 'bg-indigo-500/5', pos: '-top-20 right-1/4', delay: '1.5s' },
  ], []);

  return (
    <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
       {/* Ambient Glows */}
       {elements.map((el, i) => (
         <div
           key={i}
           className={cn(
             "absolute rounded-full blur-[100px] animate-pulse-soft",
             el.size, el.color, el.pos
           )}
           style={{ animationDelay: el.delay }}
         />
       ))}

       {/* Subtle Grid / Pattern */}
       <div className="absolute inset-0 opacity-[0.05] bg-dots" />

       {/* Floating 3D Shapes (Perspective) */}
       <div className="absolute inset-0 perspective">
          <div className="absolute top-[15%] right-[5%] w-32 h-32 border border-primary-500/20 rounded-[2rem] rotate-45 animate-float preserve-3d" />
          <div className="absolute bottom-[25%] left-[5%] w-24 h-24 border border-emerald-500/20 rounded-full animate-float [animation-delay:1s] preserve-3d" />
          <div className="absolute top-1/2 right-[15%] w-16 h-16 bg-gradient-to-br from-primary-500/10 to-transparent rounded-lg rotate-12 animate-float [animation-delay:0.5s] preserve-3d shadow-xl" />
       </div>
    </div>
  );
}

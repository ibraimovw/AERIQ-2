import React, {useRef} from 'react';

interface GlassPanelProps extends React.HTMLAttributes<HTMLDivElement> {
  spotlight?: boolean;
  elevated?: boolean;
  as?: 'div' | 'section' | 'article';
}

export function GlassPanel({
  children,
  className = '',
  spotlight = false,
  elevated = false,
  as: Tag = 'div',
  onPointerMove,
  onPointerLeave,
  ...rest
}: GlassPanelProps) {
  const ref = useRef<HTMLDivElement>(null);

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (spotlight && ref.current && e.pointerType === 'mouse') {
      const rect = ref.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      ref.current.style.setProperty('--mx', `${x}px`);
      ref.current.style.setProperty('--my', `${y}px`);
      ref.current.style.setProperty('--spotlight-opacity', '1');
    }
    onPointerMove?.(e);
  };

  const handlePointerLeave = (e: React.PointerEvent<HTMLDivElement>) => {
    if (spotlight && ref.current) {
      ref.current.style.setProperty('--spotlight-opacity', '0');
    }
    onPointerLeave?.(e);
  };

  return (
    <Tag
      ref={ref}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      className={`glass-panel ${elevated ? 'glass-panel-elevated' : ''} ${
        spotlight ? 'glass-spotlight' : ''
      } rounded-2xl ${className}`}
      {...rest}
    >
      {children}
    </Tag>
  );
}

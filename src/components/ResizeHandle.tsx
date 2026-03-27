import { useRef, useEffect } from 'react';

interface ResizeHandleProps {
  onResize: (delta: number) => void;
  side: 'left' | 'right';
}

export function ResizeHandle({ onResize, side }: ResizeHandleProps) {
  const isDragging = useRef(false);
  const startX = useRef(0);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging.current) return;
      const delta = side === 'left' ? e.clientX - startX.current : startX.current - e.clientX;
      startX.current = e.clientX;
      onResize(delta);
    };

    const handleMouseUp = () => {
      isDragging.current = false;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [onResize, side]);

  const handleMouseDown = (e: React.MouseEvent) => {
    isDragging.current = true;
    startX.current = e.clientX;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
    e.preventDefault();
  };

  return (
    <div
      onMouseDown={handleMouseDown}
      className="w-[7px] cursor-col-resize bg-transparent hover:bg-primary/30 active:bg-primary/50 transition-colors flex-shrink-0"
    />
  );
}

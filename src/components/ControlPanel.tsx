import { useCallback, useEffect, useRef, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { useTheme } from '@/hooks/use-theme';
import { Moon, Sun } from 'lucide-react';

interface ControlPanelProps {
  density: number;
  setDensity: (value: number) => void;
  dotSize: number;
  setDotSize: (value: number) => void;
  color: string;
  setColor: (value: string) => void;
  position: { x: number; y: number };
  onPositionChange: (position: { x: number; y: number }) => void;
}

export const ControlPanel = ({
  density,
  setDensity,
  dotSize,
  setDotSize,
  color,
  setColor,
  onPositionChange,
}: ControlPanelProps) => {
  const panelRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  const handlePointerDown = (e: React.PointerEvent) => {
    if (!panelRef.current) return;

    // Prevent dragging when clicking on interactive elements
    const target = e.target as HTMLElement;
    const isInteractive =
      target.closest('input, button, [role="slider"]') ||
      target.hasAttribute('data-radix-collection-item') ||
      target.classList.contains('cursor-pointer');

    if (isInteractive) return;

    const rect = panelRef.current.getBoundingClientRect();
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
    setIsDragging(true);
  };

  const handlePointerMove = useCallback(
    (e: PointerEvent) => {
      if (!isDragging) return;

      const newX = e.clientX - dragOffset.x;
      const newY = e.clientY - dragOffset.y;

      // Keep panel within viewport bounds
      const maxX = window.innerWidth - 320; // panel width
      const maxY = window.innerHeight - 200; // approximate panel height

      onPositionChange({
        x: Math.max(0, Math.min(newX, maxX)),
        y: Math.max(0, Math.min(newY, maxY)),
      });
    },
    [isDragging, dragOffset.x, dragOffset.y, onPositionChange],
  );

  const handlePointerUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Add global event listeners for dragging
  useEffect(() => {
    if (isDragging) {
      document.addEventListener('pointermove', handlePointerMove);
      document.addEventListener('pointerup', handlePointerUp);

      return () => {
        document.removeEventListener('pointermove', handlePointerMove);
        document.removeEventListener('pointerup', handlePointerUp);
      };
    }
  }, [isDragging, handlePointerMove, handlePointerUp]);
  const presetColors = [
    '#ffffff', // white
    '#60a5fa', // blue
    '#a78bfa', // purple
    '#34d399', // emerald
    '#fbbf24', // amber
    '#f87171', // red
  ];

  return (
    <div
      ref={panelRef}
      onPointerDown={handlePointerDown}
      className={`bg-surface/50 backdrop-blur-sm border border-glass-border rounded-xl space-y-6 select-none touch-none ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
    >
      <div className="p-6">
        <div className="space-y-4">
          <div>
            <Label
              htmlFor="density"
              className="text-sm text-muted-foreground mb-2 block font-mono"
            >
              Density: {density}
            </Label>
            <Slider
              id="density"
              min={1}
              max={15}
              step={1}
              value={[density]}
              onValueChange={value => setDensity(value[0])}
              className="w-full"
            />
          </div>

          <div>
            <Label
              htmlFor="size"
              className="text-sm text-muted-foreground mb-2 block font-mono"
            >
              Size: {dotSize}
            </Label>
            <Slider
              id="size"
              min={1}
              max={8}
              step={0.5}
              value={[dotSize]}
              onValueChange={value => setDotSize(value[0])}
              className="w-full"
            />
          </div>

          <div>
            <Label className="text-sm text-muted-foreground mb-2 block font-mono">
              Color
            </Label>
            <div className="flex gap-2 flex-wrap">
              {presetColors.map(presetColor => (
                <button
                  key={presetColor}
                  onClick={() => setColor(presetColor)}
                  className={`w-8 h-8 rounded border-2 transition-all ${
                    color === presetColor
                      ? 'border-primary scale-110'
                      : 'border-glass-border hover:border-muted-foreground'
                  }`}
                  style={{ backgroundColor: presetColor }}
                />
              ))}
            </div>
            <input
              type="color"
              value={color}
              onChange={e => setColor(e.target.value)}
              className="mt-2 w-full h-8 rounded border border-glass-border bg-transparent cursor-pointer"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

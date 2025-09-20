import { useEffect, useState } from 'react';

import { ControlPanel } from '@/components/ControlPanel';
import { MapCanvas } from '@/components/MapCanvas';
import { StatusBar } from '@/components/StatusBar';

const Index = () => {
  const [density, setDensity] = useState(8);
  const [dotSize, setDotSize] = useState(3);
  const [color, setColor] = useState('#34d399');
  const [panelPosition, setPanelPosition] = useState({ x: 24, y: 24 });

  // Load settings from localStorage on mount
  useEffect(() => {
    const savedDensity = localStorage.getItem('worldDots_density');
    const savedDotSize = localStorage.getItem('worldDots_dotSize');
    const savedColor = localStorage.getItem('worldDots_color');
    const savedPosition = localStorage.getItem('worldDots_panelPosition');

    if (savedDensity) setDensity(Number(savedDensity));
    if (savedDotSize) setDotSize(Number(savedDotSize));
    if (savedColor) setColor(savedColor);
    if (savedPosition) setPanelPosition(JSON.parse(savedPosition));
  }, []);

  // Save settings to localStorage when they change
  useEffect(() => {
    localStorage.setItem('worldDots_density', density.toString());
  }, [density]);

  useEffect(() => {
    localStorage.setItem('worldDots_dotSize', dotSize.toString());
  }, [dotSize]);

  useEffect(() => {
    localStorage.setItem('worldDots_color', color);
  }, [color]);

  useEffect(() => {
    localStorage.setItem(
      'worldDots_panelPosition',
      JSON.stringify(panelPosition),
    );
  }, [panelPosition]);

  return (
    <div className="min-h-screen bg-background relative">
      {/* Absolute Controls Panel */}
      <div
        className="absolute z-20 w-80"
        style={{ left: panelPosition.x, top: panelPosition.y }}
      >
        <ControlPanel
          density={density}
          setDensity={setDensity}
          dotSize={dotSize}
          setDotSize={setDotSize}
          color={color}
          setColor={setColor}
          position={panelPosition}
          onPositionChange={setPanelPosition}
        />
      </div>

      {/* Fullscreen Canvas Area */}
      <div className="w-full h-screen">
        <MapCanvas density={density} dotSize={dotSize} color={color} />
      </div>

      {/* Status Bar */}
      <StatusBar />
    </div>
  );
};

export default Index;

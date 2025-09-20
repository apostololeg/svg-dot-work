import { useEffect, useRef, useState, useCallback } from 'react';
import { optimize } from 'svgo';
import worldMapSrc from '@/assets/world-map.png';
import { useOptimization } from '@/contexts/OptimizationContext';

interface MapCanvasProps {
  density: number;
  dotSize: number;
  color: string;
}

export const MapCanvas = ({
  density,
  dotSize,
  color
}: MapCanvasProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [mapImageData, setMapImageData] = useState<ImageData | null>(null);
  const [mapImage, setMapImage] = useState<HTMLImageElement | null>(null);
  const [currentSvg, setCurrentSvg] = useState<string>('');

  const {
    registerOptimizationTrigger,
    setSvgSizeKB,
    setOptimizedSizeKB,
    setCurrentSvgs,
    setIsOptimizing,
    setOptimizationProgress,
    downloadSvg
  } = useOptimization();

  // Load and analyze world map image
  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      // Create a temporary canvas to get image data
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = img.width;
      tempCanvas.height = img.height;
      const tempCtx = tempCanvas.getContext('2d');

      if (tempCtx) {
        tempCtx.drawImage(img, 0, 0);
        const imageData = tempCtx.getImageData(0, 0, img.width, img.height);
        setMapImageData(imageData);
        setMapImage(img);
      }
    };
    img.src = worldMapSrc;
  }, []);

  // Function to check if a coordinate has land (black pixel)
  const isLandAt = useCallback((x: number, y: number, canvasWidth: number, canvasHeight: number): boolean => {
    if (!mapImageData || !mapImage) {
      console.log('No map data available');
      return false;
    }

    // Convert canvas coordinates to image coordinates
    const imgX = Math.floor((x / canvasWidth) * mapImage.width);
    const imgY = Math.floor((y / canvasHeight) * mapImage.height);

    // Check bounds
    if (imgX < 0 || imgX >= mapImage.width || imgY < 0 || imgY >= mapImage.height) {
      return false;
    }

    // Get pixel data (RGBA)
    const pixelIndex = (imgY * mapImage.width + imgX) * 4;
    const red = mapImageData.data[pixelIndex];
    const green = mapImageData.data[pixelIndex + 1];
    const blue = mapImageData.data[pixelIndex + 2];
    const alpha = mapImageData.data[pixelIndex + 3];

    // Check if pixel is black (land) and not transparent
    // Black pixels have low RGB values and high alpha
    const isBlack = red < 100 && green < 100 && blue < 100;
    const isOpaque = alpha > 200;

    return isBlack && isOpaque;
  }, [mapImageData, mapImage]);

  // Function to optimize SVG using SVGO
  const optimizeSvg = useCallback(async (svgContent: string) => {
    try {
      const result = optimize(svgContent, {
        plugins: [
          'preset-default'
        ]
      });
      return result.data;
    } catch (error) {
      console.error('SVG optimization failed:', error);
      return svgContent; // Return original if optimization fails
    }
  }, []);

  // Function to generate SVG from dots and calculate original size only
  const generateSvgAndCalculateSize = useCallback((dots: Array<{x: number, y: number}>, canvasWidth: number, canvasHeight: number) => {
    const svgContent = `<svg width="${canvasWidth}" height="${canvasHeight}" xmlns="http://www.w3.org/2000/svg">
${dots.map(dot => `  <circle cx="${dot.x}" cy="${dot.y}" r="${dotSize / 2}" fill="${color}"/>`).join('\n')}
</svg>`;

    // Calculate original size in kilobytes
    const originalSizeInBytes = new Blob([svgContent]).size;
    const originalSizeInKB = originalSizeInBytes / 1024;

    // Update context with original size
    setSvgSizeKB(originalSizeInKB);
    setOptimizedSizeKB(0); // Reset optimized size

    return svgContent;
  }, [dotSize, color, setSvgSizeKB, setOptimizedSizeKB]);

  // Function to optimize an SVG and handle callbacks
  const optimizeAndExportSvg = useCallback(async (originalSvg: string) => {
    // Start optimization with progress tracking
    setIsOptimizing(true);
    setOptimizationProgress(25);
    await new Promise(resolve => setTimeout(resolve, 50));
    setOptimizationProgress(50);

    // Optimize SVG
    const optimizedSvg = await optimizeSvg(originalSvg);

    setOptimizationProgress(75);
    await new Promise(resolve => setTimeout(resolve, 50));

    const optimizedSizeInBytes = new Blob([optimizedSvg]).size;
    const optimizedSizeInKB = optimizedSizeInBytes / 1024;

    // Update context with optimized size and SVGs
    setOptimizedSizeKB(optimizedSizeInKB);
    setCurrentSvgs({ original: originalSvg, optimized: optimizedSvg });

    setOptimizationProgress(100);

    // End optimization
    setTimeout(() => setIsOptimizing(false), 200); // Small delay to show 100%

    return optimizedSvg;
  }, [optimizeSvg, setIsOptimizing, setOptimizationProgress, setOptimizedSizeKB, setCurrentSvgs]);

  // Optimization trigger function
  const triggerOptimization = useCallback(() => {
    if (currentSvg) {
      optimizeAndExportSvg(currentSvg).catch(console.error);
    }
  }, [currentSvg, optimizeAndExportSvg]);

  // Register optimization trigger with context
  useEffect(() => {
    registerOptimizationTrigger(triggerOptimization);
  }, [registerOptimizationTrigger, triggerOptimization]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !mapImageData) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * window.devicePixelRatio;
    canvas.height = rect.height * window.devicePixelRatio;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

    // Clear canvas
    ctx.clearRect(0, 0, rect.width, rect.height);

    // Set dot properties
    ctx.fillStyle = color;

    // Calculate grid spacing based on density (more density = smaller spacing)
    const spacing = Math.max(2, Math.floor(25 - density * 1.5));

    // Debug: Log map data status
    if (mapImageData && mapImage) {
      console.log(`Map loaded: ${mapImage.width}x${mapImage.height}, Canvas: ${rect.width}x${rect.height}`);
    }

    // Draw dots in a precise grid, checking each coordinate
    let dotsRendered = 0;
    let totalChecked = 0;
    const dots: Array<{x: number, y: number}> = [];

    for (let x = spacing / 2; x < rect.width; x += spacing) {
      for (let y = spacing / 2; y < rect.height; y += spacing) {
        totalChecked++;
        // Check if this coordinate has land
        if (isLandAt(x, y, rect.width, rect.height)) {
          ctx.beginPath();
          ctx.arc(x, y, dotSize / 2, 0, Math.PI * 2);
          ctx.fill();
          dots.push({x, y});
          dotsRendered++;
        }
      }
    }

    // Generate SVG and calculate size
    const svgContent = generateSvgAndCalculateSize(dots, rect.width, rect.height);
    setCurrentSvg(svgContent);

    // Update context with the original SVG
    setCurrentSvgs({ original: svgContent, optimized: svgContent });

    console.log(`Checked ${totalChecked} positions, rendered ${dotsRendered} dots`);
  }, [density, dotSize, color, mapImageData, mapImage, isLandAt, generateSvgAndCalculateSize, setCurrentSvgs]);

  return (
    <div className="relative w-full h-full flex items-center justify-center">
      <div className="relative w-full aspect-[2/1] max-h-full">
        <canvas
          ref={canvasRef}
          className="w-full h-full absolute inset-0 z-10"
          style={{ width: '100%', height: '100%' }}
        />
        {/* Optional: Show the reference map faintly in background */}
        {mapImage && (
          <img
            src={worldMapSrc}
            alt="World map reference"
            className="w-full h-full absolute inset-0 opacity-0 object-cover"
          />
        )}
      </div>
    </div>
  );
};

export default MapCanvas;

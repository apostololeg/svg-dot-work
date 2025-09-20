import {
  ReactNode,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';

import worldMapSrc from '@/assets/world-map.png';

interface SvgData {
  original: string;
  optimized: string;
}

interface OptimizationContextType {
  // SVG Data
  svgSizeKB: number;
  optimizedSizeKB: number;
  currentSvgs: SvgData | null;
  setSvgSizeKB: (size: number) => void;
  setOptimizedSizeKB: (size: number) => void;
  setCurrentSvgs: (svgs: SvgData | null) => void;

  // Mask Selection
  maskSrc: string;
  setMaskSrc: (src: string) => void;
  maskVisible: boolean;
  setMaskVisible: (visible: boolean) => void;

  // Progress State
  isOptimizing: boolean;
  optimizationProgress: number;
  setIsOptimizing: (optimizing: boolean) => void;
  setOptimizationProgress: (progress: number) => void;

  // Optimization Trigger
  triggerOptimization: () => void;
  registerOptimizationTrigger: (trigger: () => void) => void;

  // Download Function
  downloadSvg: (svgContent: string, filename: string) => void;
}

const OptimizationContext = createContext<OptimizationContextType | null>(null);

interface OptimizationProviderProps {
  children: ReactNode;
}

export const OptimizationProvider = ({
  children,
}: OptimizationProviderProps) => {
  // SVG State
  const [svgSizeKB, setSvgSizeKB] = useState<number>(0);
  const [optimizedSizeKB, setOptimizedSizeKB] = useState<number>(0);
  const [currentSvgs, setCurrentSvgs] = useState<SvgData | null>(null);

  // Mask State
  const [maskSrc, setMaskSrcState] = useState<string>(worldMapSrc);
  const [maskVisible, setMaskVisible] = useState<boolean>(false);

  // Load mask from localStorage on mount
  useEffect(() => {
    const savedMask = localStorage.getItem('svg-dot-work-mask');
    if (savedMask) {
      setMaskSrcState(savedMask);
    }
  }, []);

  const setMaskSrc = useCallback((src: string) => {
    setMaskSrcState(src);
    localStorage.setItem('svg-dot-work-mask', src);
  }, []);

  // Progress State
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [optimizationProgress, setOptimizationProgress] = useState(0);

  // Optimization Trigger
  const optimizationTriggerRef = useRef<(() => void) | null>(null);

  const registerOptimizationTrigger = useCallback((trigger: () => void) => {
    optimizationTriggerRef.current = trigger;
  }, []);

  const triggerOptimization = useCallback(() => {
    if (optimizationTriggerRef.current) {
      optimizationTriggerRef.current();
    }
  }, []);

  // Download Function
  const downloadSvg = useCallback((svgContent: string, filename: string) => {
    const blob = new Blob([svgContent], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, []);

  return (
    <OptimizationContext.Provider
      value={{
        // SVG Data
        svgSizeKB,
        optimizedSizeKB,
        currentSvgs,
        setSvgSizeKB,
        setOptimizedSizeKB,
        setCurrentSvgs,

        // Mask Selection
        maskSrc,
        setMaskSrc,
        maskVisible,
        setMaskVisible,

        // Progress State
        isOptimizing,
        optimizationProgress,
        setIsOptimizing,
        setOptimizationProgress,

        // Optimization Trigger
        triggerOptimization,
        registerOptimizationTrigger,

        // Download Function
        downloadSvg,
      }}
    >
      {children}
    </OptimizationContext.Provider>
  );
};

export const useOptimization = () => {
  const context = useContext(OptimizationContext);
  if (!context) {
    throw new Error(
      'useOptimization must be used within an OptimizationProvider',
    );
  }
  return context;
};

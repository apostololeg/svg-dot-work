import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useOptimization } from '@/contexts/OptimizationContext';
import { useTheme } from '@/hooks/use-theme';
import { Download, Moon, Sun, Zap } from 'lucide-react';

export const StatusBar = () => {
  const {
    svgSizeKB,
    optimizedSizeKB,
    isOptimizing,
    optimizationProgress,
    currentSvgs,
    triggerOptimization,
    downloadSvg,
  } = useOptimization();
  const { theme, setTheme } = useTheme();

  const handleDownload = () => {
    if (currentSvgs?.original) {
      downloadSvg(currentSvgs.original, 'world-dots.svg');
    }
  };

  const handleOptimize = () => {
    triggerOptimization();
  };

  const handleDownloadOptimized = () => {
    if (currentSvgs?.optimized) {
      downloadSvg(currentSvgs.optimized, 'world-dots-optimized.svg');
    }
  };

  const formatSize = (sizeKB: number) => {
    if (sizeKB < 1) {
      return `${Math.round(sizeKB * 1024)} B`;
    }
    if (sizeKB >= 1024) {
      return `${(sizeKB / 1024).toFixed(1)} MB`;
    }
    return `${sizeKB.toFixed(1)} KB`;
  };

  const calculateSavings = () => {
    if (svgSizeKB > 0 && optimizedSizeKB > 0) {
      const savings = svgSizeKB - optimizedSizeKB;
      const percentage = (savings / svgSizeKB) * 100;
      return { savings, percentage };
    }
    return null;
  };

  const savings = calculateSavings();
  const isOptimized = optimizedSizeKB > 0 && !isOptimizing;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-surface/30 backdrop-blur-sm border-t border-glass-border z-10">
      <div className="flex items-center justify-between px-6 py-3">
        <Button
          variant="ghost"
          size="lg"
          onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
          className="h-8 w-8 p-0"
        >
          {theme === 'light' ? (
            <Moon className="h-4 w-4" />
          ) : (
            <Sun className="h-4 w-4" />
          )}
        </Button>

        <div className="flex-1" />

        {/* Progress Bar */}
        <div className="absolute bottom-[70px] right-8 flex items-center gap-3 min-w-0 flex-1 text-sm text-green-400">
          {isOptimizing && (
            <>
              <span className="whitespace-nowrap">Optimizing...</span>
              <Progress value={optimizationProgress} className="flex-1" />
              <span className="font-mono min-w-12 text-right">
                {optimizationProgress}%
              </span>
            </>
          )}

          {optimizedSizeKB > 0 && (
            <>
              Saved:
              {savings && (
                <div className="flex items-center gap-2 text-green-400">
                  <span className="font-mono">
                    {formatSize(savings.savings)} (
                    {savings.percentage.toFixed(1)}%)
                  </span>
                </div>
              )}
            </>
          )}
        </div>

        {/* Action Buttons and Size Info */}
        <div className="flex items-center gap-6">
          {/* Action Buttons */}
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownload}
              disabled={!currentSvgs?.original}
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Original&nbsp;<b>{formatSize(svgSizeKB)}</b>
            </Button>

            {!isOptimized ? (
              <Button
                variant="default"
                size="sm"
                onClick={handleOptimize}
                disabled={!currentSvgs?.original || isOptimizing}
                className="flex items-center gap-2"
              >
                <Zap className="h-4 w-4" />
                Optimize with SVGO
              </Button>
            ) : (
              <Button
                variant="default"
                size="sm"
                onClick={handleDownloadOptimized}
                disabled={!currentSvgs?.optimized}
                className="flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                Optimized&nbsp;
                <b className="text-green-400">{formatSize(optimizedSizeKB)}</b>
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

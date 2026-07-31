import { Box } from '@mui/material';
import {
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { DASHBOARD_CANVAS_MIN_WIDTH } from '../theme/dashboardUx';

type DashboardScaleShellProps = {
  children: ReactNode;
};

/**
 * Freezes the Figma desktop canvas width and scales it down on narrower viewports
 * so the layout structure stays identical on all screen sizes.
 */
export function DashboardScaleShell({ children }: DashboardScaleShellProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [canvasHeight, setCanvasHeight] = useState<number | undefined>(undefined);

  useLayoutEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    const update = () => {
      const available = container.clientWidth;
      const nextScale = Math.min(1, available / DASHBOARD_CANVAS_MIN_WIDTH);
      setScale(nextScale);
      setCanvasHeight(canvas.offsetHeight * nextScale);
    };

    update();
    const ro = new ResizeObserver(update);
    ro.observe(container);
    ro.observe(canvas);
    return () => ro.disconnect();
  }, []);

  return (
    <Box
      ref={containerRef}
      sx={{
        width: '100%',
        overflow: 'hidden',
        height: canvasHeight ?? 'auto',
      }}
    >
      <Box
        ref={canvasRef}
        sx={{
          width: DASHBOARD_CANVAS_MIN_WIDTH,
          minWidth: DASHBOARD_CANVAS_MIN_WIDTH,
          transform: `scale(${scale})`,
          transformOrigin: 'top left',
        }}
      >
        {children}
      </Box>
    </Box>
  );
}

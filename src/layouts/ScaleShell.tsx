import { Box } from '@mui/material';
import {
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { DASHBOARD_CANVAS_MIN_WIDTH } from '@/modules/dashboard/theme/dashboardUx';

type ScaleShellProps = {
  children: ReactNode;
  /**
   * Stretch to parent height when fluid.
   * When width-scaling (< min canvas width), size the locked canvas so the
   * scaled result still fills the parent height (column-scroll layouts).
   */
  fillHeight?: boolean;
};

/** Ignore width deltas about the size of a scrollbar — prevents scale feedback loops. */
const WIDTH_HYSTERESIS_PX = 16;

/**
 * App-wide desktop canvas shell:
 * - Narrower than min width → lock layout at min width and scale down to fit
 * - Wider than min width → full fluid width (no empty right gap)
 *
 * Default mode uses negative margin so an outer scroll container can scroll
 * the full scaled content. `fillHeight` instead fills a locked parent and keeps
 * inner panes scrolling.
 */
export function ScaleShell({ children, fillHeight = false }: ScaleShellProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const lastRef = useRef({
    width: -1,
    height: -1,
    scale: 1,
    fixed: false,
    marginBottom: 0,
    canvasHeight: null as number | null,
  });
  const [scale, setScale] = useState(1);
  const [useFixedCanvas, setUseFixedCanvas] = useState(false);
  const [marginBottom, setMarginBottom] = useState(0);
  const [canvasHeight, setCanvasHeight] = useState<number | null>(null);

  useLayoutEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    const syncMarginFromCanvas = (nextScale: number, fixed: boolean) => {
      if (!fixed) {
        if (lastRef.current.marginBottom !== 0) {
          lastRef.current.marginBottom = 0;
          setMarginBottom(0);
        }
        return;
      }
      const nextMargin = Math.round(canvas.offsetHeight * (nextScale - 1));
      if (lastRef.current.marginBottom !== nextMargin) {
        lastRef.current.marginBottom = nextMargin;
        setMarginBottom(nextMargin);
      }
    };

    const clearFillCanvasHeight = () => {
      if (lastRef.current.canvasHeight != null) {
        lastRef.current.canvasHeight = null;
        setCanvasHeight(null);
      }
    };

    const syncFillScaleMetrics = (nextScale: number, availableHeight: number) => {
      if (availableHeight <= 0 || nextScale <= 0) {
        clearFillCanvasHeight();
        return;
      }
      const nextCanvasHeight = Math.max(1, Math.round(availableHeight / nextScale));
      const nextMargin = Math.round(nextCanvasHeight * (nextScale - 1));
      if (lastRef.current.canvasHeight !== nextCanvasHeight) {
        lastRef.current.canvasHeight = nextCanvasHeight;
        setCanvasHeight(nextCanvasHeight);
      }
      if (lastRef.current.marginBottom !== nextMargin) {
        lastRef.current.marginBottom = nextMargin;
        setMarginBottom(nextMargin);
      }
    };

    const applyFromSize = () => {
      const availableWidth = Math.round(container.clientWidth);
      const availableHeight = Math.round(container.clientHeight);
      if (availableWidth <= 0) return;

      const prevWidth = lastRef.current.width;
      const prevHeight = lastRef.current.height;
      const widthStable =
        prevWidth >= 0 && Math.abs(availableWidth - prevWidth) < WIDTH_HYSTERESIS_PX;
      const heightStable =
        prevHeight >= 0 && Math.abs(availableHeight - prevHeight) < WIDTH_HYSTERESIS_PX;

      if (widthStable && (!fillHeight || heightStable)) {
        if (lastRef.current.fixed) {
          if (fillHeight) syncFillScaleMetrics(lastRef.current.scale, availableHeight);
          else syncMarginFromCanvas(lastRef.current.scale, true);
        }
        return;
      }

      lastRef.current.width = availableWidth;
      lastRef.current.height = availableHeight;

      if (availableWidth >= DASHBOARD_CANVAS_MIN_WIDTH) {
        if (lastRef.current.fixed || lastRef.current.scale !== 1) {
          lastRef.current.fixed = false;
          lastRef.current.scale = 1;
          setUseFixedCanvas(false);
          setScale(1);
        }
        clearFillCanvasHeight();
        syncMarginFromCanvas(1, false);
        return;
      }

      const nextScale = availableWidth / DASHBOARD_CANVAS_MIN_WIDTH;
      if (
        !lastRef.current.fixed ||
        Math.abs(lastRef.current.scale - nextScale) > 0.001
      ) {
        lastRef.current.fixed = true;
        lastRef.current.scale = nextScale;
        setUseFixedCanvas(true);
        setScale(nextScale);
      }

      if (fillHeight) syncFillScaleMetrics(nextScale, availableHeight);
      else {
        clearFillCanvasHeight();
        syncMarginFromCanvas(nextScale, true);
      }
    };

    applyFromSize();

    const ro = new ResizeObserver(() => {
      applyFromSize();
    });
    ro.observe(container);

    const contentRo = new ResizeObserver(() => {
      if (!lastRef.current.fixed || fillHeight) return;
      syncMarginFromCanvas(lastRef.current.scale, true);
    });
    contentRo.observe(canvas);

    return () => {
      ro.disconnect();
      contentRo.disconnect();
    };
  }, [fillHeight]);

  return (
    <Box
      ref={containerRef}
      sx={{
        width: '100%',
        ...(fillHeight
          ? {
              flex: '1 1 auto',
              alignSelf: 'stretch',
              minHeight: 0,
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
            }
          : {
              overflow: 'visible',
            }),
      }}
    >
      <Box
        ref={canvasRef}
        sx={
          useFixedCanvas
            ? {
                width: DASHBOARD_CANVAS_MIN_WIDTH,
                minWidth: DASHBOARD_CANVAS_MIN_WIDTH,
                transform: `scale(${scale})`,
                transformOrigin: 'top left',
                marginBottom: `${marginBottom}px`,
                ...(fillHeight && canvasHeight != null
                  ? {
                      height: canvasHeight,
                      minHeight: canvasHeight,
                      maxHeight: canvasHeight,
                      display: 'flex',
                      flexDirection: 'column',
                      overflow: 'hidden',
                    }
                  : fillHeight
                    ? {
                        flex: 1,
                        minHeight: 0,
                        display: 'flex',
                        flexDirection: 'column',
                        overflow: 'hidden',
                      }
                    : null),
              }
            : {
                width: '100%',
                minWidth: 0,
                transform: 'none',
                marginBottom: 0,
                ...(fillHeight
                  ? {
                      flex: '1 1 auto',
                      minHeight: 0,
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      overflow: 'hidden',
                    }
                  : null),
              }
        }
      >
        {children}
      </Box>
    </Box>
  );
}

/** @deprecated Use ScaleShell — kept for existing dashboard imports. */
export const DashboardScaleShell = ScaleShell;

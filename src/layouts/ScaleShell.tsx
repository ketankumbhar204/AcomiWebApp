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
};

/** Ignore width deltas about the size of a scrollbar — prevents scale feedback loops. */
const WIDTH_HYSTERESIS_PX = 16;

/**
 * App-wide desktop canvas shell:
 * - Narrower than min width → lock layout at min width and scale down to fit
 * - Wider than min width → full fluid width (no empty right gap)
 *
 * Uses negative margin (not overflow:hidden + fixed height) so the main
 * scroll container can always scroll the full scaled content.
 */
export function ScaleShell({ children }: ScaleShellProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const lastRef = useRef({
    width: -1,
    scale: 1,
    fixed: false,
    marginBottom: 0,
  });
  const [scale, setScale] = useState(1);
  const [useFixedCanvas, setUseFixedCanvas] = useState(false);
  /** Pulls unused (unscaled) layout space back so scroll height matches visual height. */
  const [marginBottom, setMarginBottom] = useState(0);

  useLayoutEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    const syncMargin = (nextScale: number, fixed: boolean) => {
      if (!fixed) {
        if (lastRef.current.marginBottom !== 0) {
          lastRef.current.marginBottom = 0;
          setMarginBottom(0);
        }
        return;
      }
      // Net layout height = offsetHeight * scale → marginBottom = h * (scale - 1)
      const nextMargin = Math.round(canvas.offsetHeight * (nextScale - 1));
      if (lastRef.current.marginBottom !== nextMargin) {
        lastRef.current.marginBottom = nextMargin;
        setMarginBottom(nextMargin);
      }
    };

    const applyFromWidth = () => {
      const available = Math.round(container.clientWidth);
      if (available <= 0) return;

      const prevWidth = lastRef.current.width;
      if (prevWidth >= 0 && Math.abs(available - prevWidth) < WIDTH_HYSTERESIS_PX) {
        // Width stable (or scrollbar jitter) — only refresh margin from content height.
        syncMargin(lastRef.current.scale, lastRef.current.fixed);
        return;
      }
      lastRef.current.width = available;

      if (available >= DASHBOARD_CANVAS_MIN_WIDTH) {
        if (lastRef.current.fixed || lastRef.current.scale !== 1) {
          lastRef.current.fixed = false;
          lastRef.current.scale = 1;
          setUseFixedCanvas(false);
          setScale(1);
        }
        syncMargin(1, false);
        return;
      }

      const nextScale = available / DASHBOARD_CANVAS_MIN_WIDTH;
      if (
        !lastRef.current.fixed ||
        Math.abs(lastRef.current.scale - nextScale) > 0.001
      ) {
        lastRef.current.fixed = true;
        lastRef.current.scale = nextScale;
        setUseFixedCanvas(true);
        setScale(nextScale);
      }
      syncMargin(nextScale, true);
    };

    applyFromWidth();

    // Observe container only for width-driven scale. Observing the canvas for scale
    // caused transform/height updates to re-enter and flicker (zoom in/out).
    const ro = new ResizeObserver(() => {
      applyFromWidth();
    });
    ro.observe(container);

    // Content height can change after data loads — sync scaled layout margin only.
    const contentRo = new ResizeObserver(() => {
      if (!lastRef.current.fixed) return;
      syncMargin(lastRef.current.scale, true);
    });
    contentRo.observe(canvas);

    return () => {
      ro.disconnect();
      contentRo.disconnect();
    };
  }, []);

  return (
    <Box
      ref={containerRef}
      sx={{
        width: '100%',
        // Never clip here — clipping + wrong locked height was blocking page scroll.
        overflow: 'visible',
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
              }
            : {
                width: '100%',
                minWidth: 0,
                transform: 'none',
                marginBottom: 0,
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

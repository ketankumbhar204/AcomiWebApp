import { Box, useTheme } from '@mui/material';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import {
  Children,
  isValidElement,
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
} from 'react';
import { useTranslation } from 'react-i18next';
import { colors } from '@/shared/theme/colors';
import {
  bedCarouselActiveDot,
  bedCarouselAtEnd,
  bedCarouselAtStart,
  bedCarouselDotCount,
  bedCarouselHasOverflow,
  bedCarouselMaxScroll,
  bedCarouselScrollTarget,
} from '../utils/bedCarouselNav';
import { BED_CAROUSEL_GAP, bedCarouselEndInset, bedCarouselLayout } from '../utils/bedCarouselLayout';

type BedCardCarouselProps = {
  children: ReactNode;
  label?: string;
};

function prefersReducedMotion(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
}

export function BedCardCarousel({ children, label }: BedCardCarouselProps) {
  const { t } = useTranslation();
  const theme = useTheme();
  const items = Children.toArray(children);
  const outerRef = useRef<HTMLDivElement>(null);
  const scrollerRef = useRef<HTMLDivElement>(null);
  const targetRef = useRef(0);
  const programmatic = useRef(false);
  const [containerWidth, setContainerWidth] = useState(0);
  const [viewportWidth, setViewportWidth] = useState(0);
  const [contentWidth, setContentWidth] = useState(0);
  const [scrollX, setScrollX] = useState(0);

  const layout = bedCarouselLayout(containerWidth, items.length);
  const endInset = layout.overflows ? bedCarouselEndInset(viewportWidth, layout.cardWidth) : 0;
  const regionLabel = label ?? t('accommodation.beds.title', { defaultValue: 'Beds' });

  useEffect(() => {
    const outer = outerRef.current;
    const scroller = scrollerRef.current;
    if (!outer || !scroller) {
      return;
    }

    const sync = () => {
      const nextWidth = Math.round(outer.clientWidth);
      const nextViewport = Math.round(scroller.clientWidth);
      const nextContent = Math.round(scroller.scrollWidth);
      const nextScroll = scroller.scrollLeft;
      setContainerWidth((prev) => (prev === nextWidth ? prev : nextWidth));
      setViewportWidth((prev) => (prev === nextViewport ? prev : nextViewport));
      setContentWidth((prev) => (prev === nextContent ? prev : nextContent));
      setScrollX((prev) => (Math.abs(prev - nextScroll) < 0.5 ? prev : nextScroll));
      if (programmatic.current && Math.abs(scroller.scrollLeft - targetRef.current) <= 2) {
        programmatic.current = false;
      }
      if (!programmatic.current) {
        targetRef.current = scroller.scrollLeft;
      }
    };

    sync();
    const observer = new ResizeObserver(sync);
    observer.observe(outer);
    observer.observe(scroller);
    scroller.addEventListener('scroll', sync, { passive: true });
    scroller.addEventListener('scrollend', sync);

    const onWheel = (event: WheelEvent) => {
      if (!event.shiftKey || scroller.scrollWidth <= scroller.clientWidth + 1) {
        return;
      }
      event.preventDefault();
      programmatic.current = false;
      scroller.scrollBy({ left: event.deltaY });
    };
    const release = () => {
      programmatic.current = false;
      targetRef.current = scroller.scrollLeft;
    };
    scroller.addEventListener('wheel', onWheel, { passive: false });
    scroller.addEventListener('pointerdown', release);

    return () => {
      observer.disconnect();
      scroller.removeEventListener('scroll', sync);
      scroller.removeEventListener('scrollend', sync);
      scroller.removeEventListener('wheel', onWheel);
      scroller.removeEventListener('pointerdown', release);
    };
  }, [items.length, layout.cardWidth, endInset]);

  const maxScroll = bedCarouselMaxScroll(contentWidth, viewportWidth);
  const overflows = bedCarouselHasOverflow(contentWidth, viewportWidth);
  const dotCount = bedCarouselDotCount(items.length, overflows);
  const activeDot = bedCarouselActiveDot(scrollX, maxScroll, layout.stride, dotCount, items.length);
  const fade = theme.palette.background.paper;

  const scrollByCard = (direction: -1 | 1) => {
    const scroller = scrollerRef.current;
    if (!scroller) {
      return;
    }
    const max = bedCarouselMaxScroll(scroller.scrollWidth, scroller.clientWidth);
    const next = bedCarouselScrollTarget(targetRef.current, direction, layout.stride, max);
    programmatic.current = true;
    targetRef.current = next;
    scroller.scrollTo({
      left: next,
      behavior: prefersReducedMotion() ? 'auto' : 'smooth',
    });
  };

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.target !== event.currentTarget) {
      return;
    }
    if (event.key === 'ArrowRight') {
      event.preventDefault();
      scrollByCard(1);
    } else if (event.key === 'ArrowLeft') {
      event.preventDefault();
      scrollByCard(-1);
    }
  };

  return (
    <Box
      ref={outerRef}
      sx={{
        position: 'relative',
        width: '100%',
        minWidth: 0,
        maxWidth: '100%',
        contain: 'inline-size',
      }}
    >
      <Box sx={{ position: 'relative', width: '100%', minWidth: 0 }}>
      <Box
        ref={scrollerRef}
        tabIndex={0}
        role="region"
        aria-label={regionLabel}
        onKeyDown={onKeyDown}
        sx={{
          flex: '1 1 auto',
          minWidth: 0,
          display: 'flex',
          flexWrap: 'nowrap',
          alignItems: 'stretch',
          gap: `${BED_CAROUSEL_GAP}px`,
          overflowX: 'auto',
          overflowY: 'hidden',
          scrollSnapType: 'x proximity',
          WebkitOverflowScrolling: 'touch',
          overscrollBehaviorX: 'contain',
          touchAction: 'pan-x pan-y',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
          outline: 'none',
          pr: endInset > 0 ? `${endInset}px` : 0,
          '&::-webkit-scrollbar': { display: 'none' },
          '&:focus-visible': {
            outline: `2px solid ${colors.primary}`,
            outlineOffset: 2,
            borderRadius: '8px',
          },
        }}
      >
        {items.map((item, index) => (
          <Box
            key={itemKey(item, index)}
            sx={{
              flex: '0 0 auto',
              width: layout.cardWidth,
              minWidth: layout.cardWidth,
              scrollSnapAlign: 'start',
              display: 'flex',
              '& > *': { flex: 1, width: '100%', minWidth: 0, maxWidth: '100%' },
            }}
          >
            {item}
          </Box>
        ))}
      </Box>
      {overflows && !bedCarouselAtStart(scrollX) ? (
        <Box aria-hidden sx={{ ...fadeSx, left: 0, background: `linear-gradient(to right, ${fade}, transparent)` }} />
      ) : null}
      {overflows && !bedCarouselAtEnd(scrollX, maxScroll) ? (
        <Box aria-hidden sx={{ ...fadeSx, right: 0, background: `linear-gradient(to left, ${fade}, transparent)` }} />
      ) : null}
      </Box>
      {overflows ? (
          <Box
            sx={{
              mt: 1,
              px: 0.25,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <CarouselArrow
              direction="back"
              enabled={!bedCarouselAtStart(scrollX)}
              label={t('accommodation.beds.previous', { defaultValue: 'Previous beds' })}
              onClick={() => scrollByCard(-1)}
            />
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px', flex: 1, pointerEvents: 'none' }}>
              {Array.from({ length: dotCount }, (_, index) => (
                <Box
                  key={index}
                  sx={{
                    width: index === activeDot ? 7 : 5,
                    height: index === activeDot ? 7 : 5,
                    borderRadius: '50%',
                    bgcolor: index === activeDot ? colors.info : 'rgba(37, 99, 235, 0.28)',
                  }}
                />
              ))}
            </Box>
            <CarouselArrow
              direction="forward"
              enabled={!bedCarouselAtEnd(scrollX, maxScroll)}
              label={t('accommodation.beds.next', { defaultValue: 'Next beds' })}
              onClick={() => scrollByCard(1)}
            />
          </Box>
      ) : null}
    </Box>
  );
}

const fadeSx = {
  position: 'absolute',
  top: 0,
  bottom: 0,
  width: 22,
  zIndex: 3,
  pointerEvents: 'none',
} as const;

function CarouselArrow({
  direction,
  enabled,
  label,
  onClick,
}: {
  direction: 'back' | 'forward';
  enabled: boolean;
  label: string;
  onClick: () => void;
}) {
  const Icon = direction === 'back' ? ChevronLeft : ChevronRight;
  return (
    <Box
      component="button"
      type="button"
      disabled={!enabled}
      aria-label={label}
      onClick={(event) => {
        event.stopPropagation();
        event.preventDefault();
        onClick();
      }}
      sx={{
        pointerEvents: 'auto',
        width: 28,
        height: 28,
        p: 0,
        display: 'grid',
        placeItems: 'center',
        borderRadius: '50%',
        border: '1px solid rgba(37, 99, 235, 0.22)',
        bgcolor: 'rgba(255,255,255,0.9)',
        color: colors.info,
        boxShadow: '0 1px 4px rgba(15, 23, 42, 0.12)',
        cursor: enabled ? 'pointer' : 'default',
        opacity: enabled ? 1 : 0.38,
      }}
    >
      <Icon size={16} strokeWidth={2.4} />
    </Box>
  );
}

function itemKey(item: ReactNode, index: number): string {
  if (isValidElement(item) && item.key != null) {
    return String(item.key);
  }
  return `bed-card-${index}`;
}

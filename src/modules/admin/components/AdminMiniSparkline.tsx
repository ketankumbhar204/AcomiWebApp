type AdminMiniSparklineProps = {
  values: number[];
  color?: string;
  width?: number;
  height?: number;
};

/** Compact sparkline from real numeric series (no fabricated points). */
export function AdminMiniSparkline({
  values,
  color = '#22C55E',
  width = 64,
  height = 28,
}: AdminMiniSparklineProps) {
  if (values.length < 2) return null;

  const max = Math.max(...values, 1);
  const min = Math.min(...values, 0);
  const range = Math.max(max - min, 1);
  const padY = 2;
  const pts = values.map((value, index) => {
    const x = (index / (values.length - 1)) * width;
    const y = height - padY - ((value - min) / range) * (height - padY * 2);
    return `${x},${y}`;
  });
  const line = pts.join(' ');
  const area = `0,${height} ${line} ${width},${height}`;

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} aria-hidden>
      <polyline points={area} fill={`${color}22`} stroke="none" />
      <polyline
        points={line}
        fill="none"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

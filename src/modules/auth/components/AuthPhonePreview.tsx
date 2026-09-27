import { Box, Typography, useTheme } from '@mui/material';
import { LayoutDashboard, MoreHorizontal, UtensilsCrossed, Wallet } from 'lucide-react';
import { authSurfaces } from '../theme/authUx';

function MealBar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const pct = Math.round((value / max) * 100);
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.45 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <Typography sx={{ fontSize: 10, fontWeight: 600, color: '#475569' }}>{label}</Typography>
        <Typography sx={{ fontSize: 10, fontWeight: 700, color: '#0F172A' }}>
          {value}/{max}
        </Typography>
      </Box>
      <Box sx={{ height: 6, borderRadius: 99, bgcolor: '#E8EEF0', overflow: 'hidden' }}>
        <Box sx={{ width: `${pct}%`, height: '100%', bgcolor: color, borderRadius: 99 }} />
      </Box>
    </Box>
  );
}

/**
 * Decorative phone from the Figma mock.
 * Sample dashboard: Sunrise occupancy matches public OccupancyCard (96 / 18 / 6).
 */
export function AuthPhonePreview() {
  const theme = useTheme();
  const a = authSurfaces(theme.palette.mode);

  return (
    <Box
      aria-hidden
      sx={{
        display: { xs: 'none', lg: 'block' },
        position: 'absolute',
        left: { md: '38%', lg: '41%', xl: '42%' },
        top: { md: '44%', lg: '46%' },
        width: { md: 216, lg: 240 },
        transform: 'translate(-18%, -40%) rotate(-10deg)',
        zIndex: 4,
        pointerEvents: 'none',
        filter: 'drop-shadow(0 28px 44px rgba(15, 23, 42, 0.2))',
      }}
    >
      <Box
        sx={{
          borderRadius: '36px',
          bgcolor: '#FFFFFF',
          border: '3px solid #E8EEF2',
          p: '7px',
        }}
      >
        <Box
          sx={{
            borderRadius: '30px',
            bgcolor: '#F4F8F6',
            overflow: 'hidden',
            minHeight: 470,
            display: 'flex',
            flexDirection: 'column',
            position: 'relative',
          }}
        >
          <Box
            sx={{
              position: 'absolute',
              top: 9,
              left: '50%',
              transform: 'translateX(-50%)',
              width: 78,
              height: 11,
              borderRadius: 99,
              bgcolor: '#0F172A',
              zIndex: 1,
            }}
          />
          <Box sx={{ px: 1.75, pt: 2.4, pb: 0.2, display: 'flex', justifyContent: 'space-between' }}>
            <Typography sx={{ fontSize: 11, fontWeight: 600, color: '#0F172A' }}>9:41</Typography>
            <Typography sx={{ fontSize: 11, letterSpacing: '0.12em', color: '#94A3B8' }}>···</Typography>
          </Box>
          <Box sx={{ px: 1.75, pt: 0.6, pb: 1.25 }}>
            <Typography sx={{ fontSize: 18, fontWeight: 800, color: '#0F172A', letterSpacing: '-0.03em', lineHeight: 1.15 }}>
              Sunrise space
            </Typography>
            <Typography sx={{ fontSize: 11, color: '#7A8B86', mt: 0.35 }}>Today · Open</Typography>
          </Box>
          <Box
            sx={{
              mx: 1.5,
              bgcolor: '#FFFFFF',
              borderRadius: 2,
              px: 1.25,
              py: 1.15,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 1,
              boxShadow: '0 1px 8px rgba(15, 23, 42, 0.05)',
            }}
          >
            <Box component="svg" viewBox="0 0 72 72" sx={{ width: 56, height: 56 }} aria-hidden>
              <circle cx="36" cy="36" r="28" fill="none" stroke="#E8F0EC" strokeWidth="8" />
              <circle
                cx="36"
                cy="36"
                r="28"
                fill="none"
                stroke="#0F6B4C"
                strokeWidth="8"
                strokeDasharray={`${2 * Math.PI * 28 * (96 / 120)} ${2 * Math.PI * 28}`}
                strokeLinecap="round"
                transform="rotate(-90 36 36)"
              />
              <text x="36" y="40" textAnchor="middle" fontSize="13" fontWeight="700" fill="#0F6B4C">
                96
              </text>
            </Box>
            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 0.75, width: '100%' }}>
              {[
                { label: 'Occupied', value: '96', bg: '#E7F6EE', fg: '#0F6B4C' },
                { label: 'Vacant', value: '18', bg: '#E8F1FF', fg: '#2563EB' },
                { label: 'Reserved', value: '6', bg: '#FFF1E0', fg: '#D97706' },
              ].map((item) => (
                <Box
                  key={item.label}
                  sx={{
                    minWidth: 0,
                    borderRadius: '10px',
                    px: 0.5,
                    py: 0.75,
                    textAlign: 'center',
                    bgcolor: item.bg,
                    color: item.fg,
                  }}
                >
                  <Typography sx={{ fontSize: 14, fontWeight: 700, lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>
                    {item.value}
                  </Typography>
                  <Typography
                    sx={{
                      mt: 0.4,
                      fontSize: 8,
                      lineHeight: 1.2,
                      fontWeight: 500,
                      opacity: 0.8,
                      overflowWrap: 'anywhere',
                    }}
                  >
                    {item.label}
                  </Typography>
                </Box>
              ))}
            </Box>
          </Box>
          <Box
            sx={{
              mx: 1.5,
              mt: 1.1,
              bgcolor: '#FFFFFF',
              borderRadius: 2,
              p: 1.25,
              display: 'flex',
              flexDirection: 'column',
              gap: 0.9,
              boxShadow: '0 1px 8px rgba(15, 23, 42, 0.05)',
            }}
          >
            <MealBar label="Breakfast" value={42} max={50} color="#F59E0B" />
            <MealBar label="Lunch" value={38} max={50} color={a.brand} />
            <MealBar label="Dinner" value={12} max={50} color="#6366F1" />
          </Box>
          <Box
            sx={{
              mx: 1.5,
              mt: 1,
              bgcolor: '#FFFFFF',
              borderRadius: 2,
              p: 1.25,
              boxShadow: '0 1px 8px rgba(15, 23, 42, 0.05)',
            }}
          >
            <Typography sx={{ fontSize: 10, fontWeight: 700, mb: 0.55, color: '#0F172A' }}>
              Meals to prepare
            </Typography>
            {['Veg 24', 'Chicken 12', 'Dal 18'].map((row) => (
              <Typography key={row} sx={{ fontSize: 10, color: '#475569', lineHeight: 1.55 }}>
                {row}
              </Typography>
            ))}
          </Box>
          <Box sx={{ mx: 1.5, mt: 1, mb: 1.2 }}>
            <Typography sx={{ fontSize: 10, fontWeight: 700, mb: 0.4, color: '#0F172A' }}>
              Today’s menu
            </Typography>
            <Typography sx={{ fontSize: 9, color: '#64748B' }}>Breakfast · Idli, Dosa</Typography>
            <Typography sx={{ fontSize: 9, color: '#64748B' }}>Lunch · Veg Thali</Typography>
          </Box>
          <Box
            sx={{
              mt: 'auto',
              display: 'flex',
              justifyContent: 'space-around',
              py: 1.05,
              borderTop: '1px solid #E8EEF0',
              bgcolor: '#FFFFFF',
            }}
          >
            {[
              { Icon: LayoutDashboard, active: true },
              { Icon: UtensilsCrossed, active: false },
              { Icon: Wallet, active: false },
              { Icon: MoreHorizontal, active: false },
            ].map((tab, i) => (
              <Box key={i} sx={{ color: tab.active ? a.brand : '#94A3B8' }}>
                <tab.Icon size={15} strokeWidth={2.2} />
              </Box>
            ))}
          </Box>
        </Box>
      </Box>
    </Box>
  );
}

import { Box, Typography, useTheme } from '@mui/material';
import { ArrowRight, Check, Heart, ShieldCheck, type LucideIcon } from 'lucide-react';
import memberPerson from '@/assets/onboarding/member-person.png';
import ownerBuilding from '@/assets/onboarding/owner-building.png';
import ownerMeal from '@/assets/onboarding/owner-meal.png';
import { authSurfaces } from '@/modules/auth/theme/authUx';

type OnboardingChoiceCardProps = {
  icon: LucideIcon;
  title: string;
  description: string;
  benefits: string[];
  proof: string;
  onClick: () => void;
  accent: string;
  accentSoft: string;
  illustration: 'owner' | 'member';
};

export function OnboardingChoiceCard({
  icon: Icon,
  title,
  description,
  benefits,
  proof,
  onClick,
  accent,
  accentSoft,
  illustration,
}: OnboardingChoiceCardProps) {
  const theme = useTheme();
  const a = authSurfaces(theme.palette.mode);
  const BadgeIcon = illustration === 'owner' ? ShieldCheck : Heart;
  const footerBg =
    theme.palette.mode === 'dark'
      ? a.elevated
      : illustration === 'owner'
        ? '#E7F4F1'
        : '#E8F1FB';

  return (
    <Box
      component="button"
      type="button"
      onClick={onClick}
      aria-label={`${title}. ${description}`}
      sx={{
        all: 'unset',
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        flex: { lg: '1 1 auto' },
        minHeight: 'min-content',
        overflow: 'hidden',
        borderRadius: '20px',
        border: `1px solid ${a.border}`,
        bgcolor: a.surface,
        boxShadow: '0 8px 24px rgba(15, 23, 42, 0.06)',
        cursor: 'pointer',
        textAlign: 'left',
        transition: 'box-shadow 160ms ease, transform 160ms ease, border-color 160ms ease',
        '&:hover': {
          transform: 'translateY(-2px)',
          borderColor: `${accent}55`,
          boxShadow: '0 14px 32px rgba(15, 23, 42, 0.1)',
          '& .choice-arrow': { transform: 'translateX(3px)' },
        },
        '&:active': { transform: 'translateY(0)' },
        '&:focus-visible': {
          outline: `2px solid ${accent}`,
          outlineOffset: 3,
        },
      }}
    >
      <Box sx={{ p: { xs: 1.75, md: 2 }, pb: 1.1, display: 'flex', flexDirection: 'column', gap: 1.2 }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.15 }}>
          <Box
            sx={{
              width: 44,
              height: 44,
              borderRadius: '12px',
              bgcolor: accentSoft,
              color: accent,
              display: 'grid',
              placeItems: 'center',
              flexShrink: 0,
            }}
          >
            <Icon size={22} strokeWidth={2.1} />
          </Box>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography sx={{ fontSize: '1.08rem', fontWeight: 800, color: a.textPrimary, lineHeight: 1.2 }}>
              {title}
            </Typography>
            <Typography sx={{ fontSize: '0.78rem', fontWeight: 600, color: accent, mt: 0.25 }}>
              {description}
            </Typography>
          </Box>
          <Box
            className="choice-arrow"
            sx={{
              width: 36,
              height: 36,
              borderRadius: '50%',
              bgcolor: accent,
              color: '#FFFFFF',
              display: 'grid',
              placeItems: 'center',
              flexShrink: 0,
              transition: 'transform 160ms ease',
            }}
            aria-hidden
          >
            <ArrowRight size={16} strokeWidth={2.4} />
          </Box>
        </Box>

        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', sm: 'minmax(0, 1fr) auto' },
            gap: { xs: 1, sm: 1.5 },
            alignItems: 'center',
          }}
        >
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.55, minWidth: 0 }}>
            {benefits.map((benefit) => (
              <Box key={benefit} sx={{ display: 'flex', alignItems: 'flex-start', gap: 0.85 }}>
                <Box
                  sx={{
                    width: 18,
                    height: 18,
                    borderRadius: '50%',
                    bgcolor: accentSoft,
                    color: accent,
                    display: 'grid',
                    placeItems: 'center',
                    flexShrink: 0,
                    mt: '1px',
                  }}
                >
                  <Check size={11} strokeWidth={3} />
                </Box>
                <Typography sx={{ fontSize: '0.81rem', color: a.textSecondary, lineHeight: 1.35 }}>
                  {benefit}
                </Typography>
              </Box>
            ))}
          </Box>

          <Box
            sx={{
              display: { xs: 'none', sm: 'flex' },
              alignItems: 'flex-end',
              justifyContent: 'flex-end',
              gap: 0.75,
              flexShrink: 0,
              width: illustration === 'owner' ? 176 : 132,
              pointerEvents: 'none',
            }}
          >
            {illustration === 'owner' ? (
              <>
                <Box
                  component="img"
                  src={ownerBuilding}
                  alt=""
                  sx={{
                    width: 96,
                    height: 108,
                    objectFit: 'cover',
                    objectPosition: 'center bottom',
                    borderRadius: '16px',
                    overflow: 'hidden',
                    bgcolor: theme.palette.mode === 'dark' ? a.elevated : a.surface,
                  }}
                />
                <Box
                  component="img"
                  src={ownerMeal}
                  alt=""
                  sx={{
                    width: 72,
                    height: 72,
                    objectFit: 'cover',
                    borderRadius: '16px',
                    overflow: 'hidden',
                    mb: 0.5,
                    bgcolor: theme.palette.mode === 'dark' ? a.elevated : a.surface,
                  }}
                />
              </>
            ) : (
              <Box
                component="img"
                src={memberPerson}
                alt=""
                sx={{
                  width: 128,
                  height: 118,
                  objectFit: 'cover',
                  objectPosition: 'center',
                  borderRadius: '18px',
                  overflow: 'hidden',
                  bgcolor: theme.palette.mode === 'dark' ? a.elevated : a.surface,
                }}
              />
            )}
          </Box>
        </Box>
      </Box>

      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          bgcolor: footerBg,
          px: 1.5,
          py: 0.85,
          borderTop: `1px solid ${theme.palette.mode === 'dark' ? a.border : 'rgba(15, 118, 110, 0.08)'}`,
        }}
      >
        <Box sx={{ display: 'flex', flexShrink: 0 }}>
          {['A', 'R', 'S'].map((letter, i) => (
            <Box
              key={letter}
              sx={{
                width: 22,
                height: 22,
                borderRadius: '50%',
                bgcolor: i === 0 ? accent : i === 1 ? '#F59E0B' : '#6366F1',
                color: '#FFFFFF',
                fontSize: 9,
                fontWeight: 700,
                display: 'grid',
                placeItems: 'center',
                ml: i === 0 ? 0 : '-6px',
                border: `2px solid ${a.surface}`,
              }}
            >
              {letter}
            </Box>
          ))}
        </Box>
        <Typography sx={{ flex: 1, minWidth: 0, fontSize: '0.7rem', color: a.textSecondary, lineHeight: 1.35, fontWeight: 600 }}>
          {proof}
        </Typography>
        <Box
          sx={{
            width: 26,
            height: 26,
            borderRadius: '50%',
            bgcolor: a.surface,
            color: accent,
            display: 'grid',
            placeItems: 'center',
            flexShrink: 0,
            boxShadow: '0 1px 3px rgba(15, 23, 42, 0.08)',
          }}
          aria-hidden
        >
          <BadgeIcon size={13} strokeWidth={2.2} />
        </Box>
      </Box>
    </Box>
  );
}

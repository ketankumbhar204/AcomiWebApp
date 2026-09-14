import {
  Box,
  Button,
  Chip,
  IconButton,
  Link,
  Skeleton,
  Stack,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import {
  BedDouble,
  ExternalLink,
  Lock,
  MapPin,
  UserCheck,
  Users,
  UtensilsCrossed,
  X,
  type LucideIcon,
} from 'lucide-react';
import type { TFunction } from 'i18next';
import { useEffect, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { DiscoverListingImage } from '@/modules/onboarding/components/DiscoverListingImage';
import { EnquireDialog } from '@/modules/onboarding/components/EnquireDialog';
import { AMENITY_VISUAL, spaceTypeLabelKey } from '@/modules/onboarding/components/createSpace/createSpaceVisuals';
import { discoverDefaultImageUrl } from '@/modules/onboarding/utils/discoverDefaultImages';
import {
  formatListingAddress,
  formatListingPriceInr,
  hasListingLocation,
  humanizeAmenityCode,
  resolveListingMapsUrl,
} from '@/modules/onboarding/utils/listingLocation';
import { genderPolicyLabelKey } from '@/modules/onboarding/utils/spacePropertyCategory';
import { getErrorMessage } from '@/shared/api/errors';
import { spaceDiscoverApi } from '@/shared/api/spaceDiscoverApi';
import { AppDrawer } from '@/shared/components/AppDrawer';
import { ErrorState } from '@/shared/components/ErrorState';
import { colors } from '@/shared/theme/colors';
import { dashContainedButtonSx, dashOutlinedButtonSx } from '@/shared/theme/dashButtonSx';
import { spaceDashboardPath } from '@/routes/paths';
import type { AmenityAssignment, DiscoverSpaceDetailResponse } from '@/shared/types/space';

type DiscoverSpaceDetailDrawerProps = {
  spaceId: string | null;
  open: boolean;
  onClose: () => void;
  /** Continue the public-site Contact / Enquire flow after sign-in. */
  autoEnquire?: boolean;
};

type KeyDetail = {
  key: string;
  label: string;
  value: string;
  Icon: LucideIcon;
};

function amenityLabel(item: AmenityAssignment): string {
  const label = item.label?.trim();
  if (label && !label.includes('_')) return label;
  return humanizeAmenityCode(item.code) || label || item.code;
}

function listingPriceCopy(
  detail: DiscoverSpaceDetailResponse,
  t: TFunction,
): { primary: string | null; meal: string | null } {
  const starting = formatListingPriceInr(detail.startingPrice);
  if (starting) {
    const key =
      detail.priceBasis === 'PER_BED'
        ? 'spaces.findPlace.startingFromPerBed'
        : detail.priceBasis === 'PER_ROOM'
          ? 'spaces.findPlace.startingFromPerRoom'
          : 'spaces.findPlace.startingFrom';
    return { primary: t(key, { price: starting }), meal: null };
  }
  const monthly = formatListingPriceInr(detail.monthlyPrice);
  const meal = formatListingPriceInr(detail.mealPrice);
  if (monthly) {
    return {
      primary: t('spaces.findPlace.startingFrom', { price: monthly }),
      meal: meal ? t('spaces.findPlace.mealPriceLine', { price: meal }) : null,
    };
  }
  if (meal) {
    return { primary: t('spaces.findPlace.startingFromPerMeal', { price: meal }), meal: null };
  }
  return { primary: null, meal: null };
}

function KeyDetailCard({ item, textPrimary }: { item: KeyDetail; textPrimary: string }) {
  const Icon = item.Icon;
  return (
    <Box
      sx={{
        p: 1.25,
        borderRadius: '12px',
        bgcolor: colors.mintSubtle,
        minWidth: 0,
      }}
    >
      <Stack direction="row" spacing={0.75} sx={{ alignItems: 'center', mb: 0.35 }}>
        <Icon size={14} color={colors.teal} aria-hidden />
        <Typography
          sx={{
            fontSize: '0.7rem',
            fontWeight: 800,
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            color: colors.muted,
          }}
        >
          {item.label}
        </Typography>
      </Stack>
      <Typography sx={{ fontSize: '0.92rem', fontWeight: 700, color: textPrimary, lineHeight: 1.35, wordBreak: 'break-word' }}>
        {item.value}
      </Typography>
    </Box>
  );
}

function SectionLabel({ children }: { children: string }) {
  return (
    <Typography
      sx={{
        fontSize: '0.78rem',
        fontWeight: 800,
        letterSpacing: '0.06em',
        textTransform: 'uppercase',
        color: colors.muted,
        mb: 1,
      }}
    >
      {children}
    </Typography>
  );
}

export function DiscoverSpaceDetailDrawer({
  spaceId,
  open,
  onClose,
  autoEnquire = false,
}: DiscoverSpaceDetailDrawerProps) {
  const { t } = useTranslation();
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const navigate = useNavigate();
  const [enquireOpen, setEnquireOpen] = useState(false);
  const autoEnquireOpened = useRef(false);

  const detailQuery = useQuery({
    queryKey: ['spaces-discover-detail', spaceId],
    queryFn: () => spaceDiscoverApi.getDiscoverSpaceDetail(spaceId!),
    enabled: open && Boolean(spaceId),
  });

  const detail = detailQuery.data;
  const amenityItems =
    detail?.amenities?.filter((a) => a.label || a.code) ??
    (detail?.amenityLabels ?? []).map((label) => ({ code: label, label }));

  useEffect(() => {
    if (!open) {
      autoEnquireOpened.current = false;
      return;
    }
    if (!autoEnquire || !detail || detail.alreadyMember || autoEnquireOpened.current) {
      return;
    }
    autoEnquireOpened.current = true;
    setEnquireOpen(true);
  }, [autoEnquire, detail, open]);

  const genderLabel = detail?.genderPolicy
    ? t(genderPolicyLabelKey(detail.genderPolicy))
    : null;

  const formattedAddress = detail
    ? formatListingAddress({
        addressLine: detail.addressLine,
        city: detail.city,
        state: detail.state,
        pincode: detail.pincode,
        address: detail.address,
      })
    : null;
  const mapsUrl = detail
    ? resolveListingMapsUrl({
        latitude: detail.latitude,
        longitude: detail.longitude,
        mapUrl: detail.mapUrl,
      })
    : null;
  const showLocation = detail ? hasListingLocation(detail, { latitude: detail.latitude, longitude: detail.longitude, mapUrl: detail.mapUrl }) : false;
  const priceCopy = detail ? listingPriceCopy(detail, t) : { primary: null, meal: null };
  const description = detail?.description?.trim() || null;

  const keyDetails: KeyDetail[] = [];
  if (detail && genderLabel) {
    keyDetails.push({
      key: 'gender',
      label: t('spaces.findPlace.details.gender'),
      value: genderLabel,
      Icon: Users,
    });
  }
  if (detail?.sharingNotes?.trim()) {
    keyDetails.push({
      key: 'sharing',
      label: t('spaces.findPlace.details.sharing'),
      value: detail.sharingNotes.trim(),
      Icon: BedDouble,
    });
  }
  if (detail?.foodIncludedInRent) {
    keyDetails.push({
      key: 'food',
      label: t('spaces.findPlace.details.food'),
      value: t('spaces.findPlace.mealsIncluded'),
      Icon: UtensilsCrossed,
    });
  }
  if (priceCopy.meal) {
    keyDetails.push({
      key: 'meal-price',
      label: t('spaces.findPlace.details.mealPrice'),
      value: priceCopy.meal,
      Icon: UtensilsCrossed,
    });
  }

  const textPrimary = isDark ? theme.palette.text.primary : colors.textPrimary;
  const textSecondary = isDark ? theme.palette.text.secondary : colors.textSecondary;
  const border = isDark ? theme.palette.divider : colors.border;
  const canEnquire = Boolean(detail && !detail.alreadyMember && !detail.ownedByCurrentUser);

  return (
    <AppDrawer open={open} onClose={onClose} width={isMobile ? '100%' : 480}>
      <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <Stack
          direction="row"
          sx={{
            alignItems: 'center',
            justifyContent: 'space-between',
            px: 2,
            py: 1.5,
            borderBottom: `1px solid ${border}`,
          }}
        >
          <Typography sx={{ fontWeight: 800, fontSize: '1rem', color: textPrimary }} noWrap>
            {detail?.name ?? t('spaces.findPlace.detailTitle')}
          </Typography>
          <IconButton
            size="small"
            onClick={onClose}
            aria-label={t('spaces.findPlace.close')}
            sx={{ color: textSecondary }}
          >
            <X size={18} />
          </IconButton>
        </Stack>

        <Box sx={{ flex: 1, overflow: 'auto' }}>
          {detailQuery.isLoading ? (
            <Stack spacing={1.5} sx={{ p: 2 }}>
              <Skeleton variant="rounded" height={200} />
              <Skeleton variant="text" width="70%" height={28} />
              <Skeleton variant="text" width="90%" />
              <Skeleton variant="rounded" height={120} />
            </Stack>
          ) : null}

          {detailQuery.isError ? (
            <Box sx={{ p: 2 }}>
              <ErrorState
                message={getErrorMessage(detailQuery.error, t('spaces.findPlace.errorLoad'))}
                onRetry={() => void detailQuery.refetch()}
              />
            </Box>
          ) : null}

          {detail ? (
            <Stack spacing={0}>
              <Box
                sx={{
                  position: 'relative',
                  height: { xs: 200, sm: 220 },
                  bgcolor: colors.mintSubtle,
                  overflow: 'hidden',
                }}
              >
                <DiscoverListingImage
                  src={discoverDefaultImageUrl(detail.type)}
                  alt={detail.name}
                />
              </Box>

              <Stack spacing={2} sx={{ p: 2.25 }}>
                <Box>
                  <Stack direction="row" spacing={0.75} useFlexGap sx={{ flexWrap: 'wrap', mb: 1 }}>
                    <Chip
                      size="small"
                      label={t(spaceTypeLabelKey(detail.type))}
                      sx={{
                        height: 24,
                        fontWeight: 800,
                        bgcolor: colors.mintSubtle,
                        color: colors.teal,
                      }}
                    />
                    {genderLabel ? (
                      <Chip
                        size="small"
                        label={genderLabel}
                        sx={{ height: 24, fontWeight: 700, bgcolor: '#DBEAFE', color: '#2563EB' }}
                      />
                    ) : null}
                    {detail.alreadyMember ? (
                      <Chip
                        size="small"
                        icon={<UserCheck size={12} />}
                        label={t('spaces.findPlace.alreadyMember')}
                        sx={{
                          height: 24,
                          bgcolor: colors.selected,
                          color: colors.teal,
                          fontWeight: 700,
                          '& .MuiChip-icon': { color: colors.teal, ml: 0.5 },
                        }}
                      />
                    ) : null}
                  </Stack>
                  <Typography
                    sx={{
                      fontWeight: 800,
                      fontSize: '1.35rem',
                      letterSpacing: '-0.02em',
                      color: textPrimary,
                      lineHeight: 1.2,
                    }}
                  >
                    {detail.name}
                  </Typography>
                </Box>

                {priceCopy.primary ? (
                  <Typography sx={{ fontWeight: 800, fontSize: '1.15rem', color: textPrimary }}>
                    {priceCopy.primary}
                  </Typography>
                ) : null}

                {keyDetails.length > 0 ? (
                  <Box>
                    <SectionLabel>{t('spaces.findPlace.keyDetails')}</SectionLabel>
                    <Box
                      sx={{
                        display: 'grid',
                        gridTemplateColumns: '1fr 1fr',
                        gap: 1,
                      }}
                    >
                      {keyDetails.map((item) => (
                        <KeyDetailCard key={item.key} item={item} textPrimary={textPrimary} />
                      ))}
                    </Box>
                  </Box>
                ) : null}

                {description ? (
                  <Box>
                    <SectionLabel>{t('spaces.findPlace.aboutThisPlace')}</SectionLabel>
                    <Typography sx={{ fontSize: '0.95rem', color: textPrimary, lineHeight: 1.55 }}>
                      {description}
                    </Typography>
                  </Box>
                ) : null}

                {amenityItems.length > 0 ? (
                  <Box>
                    <SectionLabel>{t('spaces.findPlace.amenities')}</SectionLabel>
                    <Stack
                      direction="row"
                      spacing={0.75}
                      useFlexGap
                      sx={{ flexWrap: 'wrap' }}
                      role="list"
                      aria-label={t('spaces.findPlace.amenities')}
                    >
                      {amenityItems.map((item) => {
                        const code = item.code?.toUpperCase() ?? '';
                        const visual = code in AMENITY_VISUAL ? AMENITY_VISUAL[code as keyof typeof AMENITY_VISUAL] : null;
                        const Icon = visual?.icon;
                        const label = amenityLabel(item);
                        return (
                          <Chip
                            key={`${item.code}-${item.label}`}
                            role="listitem"
                            size="small"
                            icon={Icon ? <Icon size={13} /> : undefined}
                            label={label}
                            sx={{
                              bgcolor: visual?.tint ?? colors.surfaceSecondary,
                              color: visual?.accent ?? colors.textSecondary,
                              fontWeight: 600,
                              '& .MuiChip-icon': {
                                color: visual?.accent ?? colors.textSecondary,
                                ml: 0.5,
                              },
                            }}
                          />
                        );
                      })}
                    </Stack>
                  </Box>
                ) : null}

                {showLocation ? (
                  <Box>
                    <SectionLabel>{t('spaces.findPlace.location')}</SectionLabel>
                    {formattedAddress ? (
                      <Stack direction="row" spacing={0.75} sx={{ alignItems: 'flex-start', mb: mapsUrl ? 1 : 0 }}>
                        <MapPin size={16} style={{ flexShrink: 0, marginTop: 2, color: colors.teal }} />
                        <Typography sx={{ fontSize: '0.95rem', color: textPrimary, whiteSpace: 'pre-wrap' }}>
                          {formattedAddress}
                        </Typography>
                      </Stack>
                    ) : (
                      <Stack direction="row" spacing={0.75} sx={{ alignItems: 'flex-start', mb: mapsUrl ? 1 : 0 }}>
                        <MapPin size={16} style={{ flexShrink: 0, marginTop: 2, color: colors.teal }} />
                        <Typography sx={{ fontSize: '0.95rem', color: textSecondary }}>
                          {t('spaces.findPlace.locationAvailable')}
                        </Typography>
                      </Stack>
                    )}
                    {mapsUrl ? (
                      <Link
                        href={mapsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        underline="none"
                        aria-label={t('spaces.findPlace.openInGoogleMapsAria', { name: detail.name })}
                        sx={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 0.75,
                          fontWeight: 700,
                          fontSize: '0.92rem',
                          color: colors.teal,
                        }}
                      >
                        {t('spaces.findPlace.openInGoogleMaps')}
                        <ExternalLink size={14} aria-hidden />
                      </Link>
                    ) : null}
                  </Box>
                ) : null}

                {canEnquire ? (
                  <Box
                    sx={{
                      display: 'flex',
                      gap: 1.25,
                      alignItems: 'flex-start',
                      p: 1.5,
                      borderRadius: '14px',
                      bgcolor: colors.infoTint,
                      border: `1px solid ${colors.border}`,
                    }}
                  >
                    <Lock size={18} color={colors.info} style={{ flexShrink: 0, marginTop: 2 }} />
                    <Typography sx={{ fontSize: '0.88rem', color: textPrimary, lineHeight: 1.45 }}>
                      {t('spaces.findPlace.enquire.privacyHint')}
                    </Typography>
                  </Box>
                ) : null}
              </Stack>
            </Stack>
          ) : null}
        </Box>

        {detail ? (
          <Box
            sx={{
              p: 2,
              borderTop: `1px solid ${border}`,
              display: 'flex',
              flexDirection: 'column',
              gap: 1,
              pb: { xs: 'calc(16px + env(safe-area-inset-bottom))', sm: 2 },
            }}
          >
            {detail.alreadyMember ? (
              <Button
                fullWidth
                variant="contained"
                color="primary"
                onClick={() => {
                  onClose();
                  navigate(spaceDashboardPath(detail.spaceId));
                }}
                sx={{
                  ...dashContainedButtonSx,
                  minHeight: 46,
                  borderRadius: '12px',
                  bgcolor: colors.primaryDark,
                  '&:hover': { bgcolor: colors.primaryHover },
                }}
              >
                {t('spaces.findPlace.openDashboard')}
              </Button>
            ) : detail.ownedByCurrentUser ? (
              <Button
                fullWidth
                variant="contained"
                color="primary"
                onClick={() => setEnquireOpen(true)}
                sx={{
                  ...dashContainedButtonSx,
                  minHeight: 46,
                  borderRadius: '12px',
                  bgcolor: colors.primaryDark,
                  '&:hover': { bgcolor: colors.primaryHover },
                }}
              >
                {t('spaces.findPlace.enquire.ownCta')}
              </Button>
            ) : (
              <Button
                fullWidth
                variant="contained"
                color="primary"
                onClick={() => setEnquireOpen(true)}
                sx={{
                  ...dashContainedButtonSx,
                  minHeight: 46,
                  borderRadius: '12px',
                  bgcolor: colors.primaryDark,
                  '&:hover': { bgcolor: colors.primaryHover },
                }}
              >
                {t('spaces.findPlace.enquire.cta')}
              </Button>
            )}
            <Button
              fullWidth
              variant="outlined"
              color="primary"
              onClick={onClose}
              sx={{ ...dashOutlinedButtonSx, minHeight: 42, borderRadius: '12px' }}
            >
              {t('spaces.findPlace.close')}
            </Button>
          </Box>
        ) : null}
      </Box>
      {detail ? (
        <EnquireDialog
          open={enquireOpen}
          spaceId={detail.spaceId}
          spaceName={detail.name}
          ownedByCurrentUser={Boolean(detail.ownedByCurrentUser)}
          onClose={() => setEnquireOpen(false)}
        />
      ) : null}
    </AppDrawer>
  );
}

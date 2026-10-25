import {
  Box,
  Button,
  CircularProgress,
  IconButton,
  Skeleton,
  Stack,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { BadgeCheck, Check, Map, MapPin, Phone, X } from 'lucide-react';
import type { TFunction } from 'i18next';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { DiscoverListingImage } from '@/modules/onboarding/components/DiscoverListingImage';
import { FavoriteHeartButton } from '@/modules/onboarding/components/FavoriteHeartButton';
import { EnquireDialog } from '@/modules/onboarding/components/EnquireDialog';
import { InquirySentDetails } from '@/modules/onboarding/components/InquirySentDetails';
import { OwnerContactCard } from '@/modules/onboarding/components/OwnerContactCard';
import { PhotoRequestAction } from '@/modules/onboarding/components/PhotoRequestAction';
import { hasActualListingPhotos } from '@/shared/utils/photoRequest';
import { useIsEnquirySending } from '@/modules/onboarding/enquiryFeedback';
import { ListingInfoChips } from '@/modules/onboarding/components/ListingInfoChips';
import { AMENITY_VISUAL, spaceTypeLabelKey } from '@/modules/onboarding/components/createSpace/createSpaceVisuals';
import { discoverDefaultImageUrl } from '@/modules/onboarding/utils/discoverDefaultImages';
import {
  formatListingAddress,
  formatListingPriceInr,
  humanizeAmenityCode,
  openableMapsUrl,
} from '@/modules/onboarding/utils/listingLocation';
import { listingPriceSuffix } from '@/shared/utils/priceBasis';
import { ListingFacts, TypeChip } from '@/modules/onboarding/components/ListingFacts';
import { enquiryApi } from '@/shared/api/enquiryApi';
import { getErrorMessage } from '@/shared/api/errors';
import { spaceDiscoverApi } from '@/shared/api/spaceDiscoverApi';
import { AppDrawer } from '@/shared/components/AppDrawer';
import { ErrorState } from '@/shared/components/ErrorState';
import { useAlreadyInquired, useContactViewed } from '@/shared/hooks/useAlreadyInquired';
import { useDirectContactReveal } from '@/shared/hooks/useDirectContactReveal';
import type { OwnerContactResponse } from '@/shared/types/enquiry';
import { colors } from '@/shared/theme/colors';
import { dashContainedButtonSx } from '@/shared/theme/dashButtonSx';
import { spaceDashboardPath } from '@/routes/paths';
import type { ListingSection } from '@/shared/utils/listingInfo';
import type { AmenityAssignment, DiscoverSpaceDetailResponse } from '@/shared/types/space';

type DiscoverSpaceDetailDrawerProps = {
  spaceId: string | null;
  open: boolean;
  onClose: () => void;
  /** Continue the public-site Contact / Enquire flow after sign-in. */
  autoEnquire?: boolean;
  /** Scroll the open listing to this section. */
  focusSection?: ListingSection | null;
  /** Bumps when the same section is chosen again so the drawer scrolls again. */
  focusNonce?: number;
};

function amenityLabel(item: AmenityAssignment): string {
  const label = item.label?.trim();
  if (label && !label.includes('_')) return label;
  return humanizeAmenityCode(item.code) || label || item.code;
}

function detailPriceParts(
  detail: DiscoverSpaceDetailResponse,
  t: TFunction,
): { amount: string | null; suffix: string | null } {
  const starting = formatListingPriceInr(detail.startingPrice);
  if (starting) {
    return {
      amount: starting,
      suffix: listingPriceSuffix(t, detail.type, detail.priceBasis),
    };
  }
  const monthly = formatListingPriceInr(detail.monthlyPrice);
  if (monthly) {
    return {
      amount: monthly,
      suffix: listingPriceSuffix(t, detail.type, detail.priceBasis),
    };
  }
  const meal = formatListingPriceInr(detail.mealPrice);
  if (meal) {
    return {
      amount: meal,
      suffix: t('spaces.findPlace.mealPriceSuffix', { defaultValue: '/ meal' }),
    };
  }
  return { amount: null, suffix: null };
}

export function DiscoverSpaceDetailDrawer({
  spaceId,
  open,
  onClose,
  autoEnquire = false,
  focusSection = null,
  focusNonce = 0,
}: DiscoverSpaceDetailDrawerProps) {
  const { t } = useTranslation();
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const navigate = useNavigate();
  const [enquireOpen, setEnquireOpen] = useState(false);
  const [liveContact, setLiveContact] = useState<OwnerContactResponse | null>(null);
  const alreadyInquired = useAlreadyInquired(spaceId);
  const contactViewed = useContactViewed(spaceId);
  const sendingEnquiry = useIsEnquirySending(spaceId);
  const autoEnquireOpened = useRef(false);
  const scrollerRef = useRef<HTMLDivElement>(null);

  const detailQuery = useQuery({
    queryKey: ['spaces-discover-detail', spaceId],
    queryFn: () => spaceDiscoverApi.getDiscoverSpaceDetail(spaceId!),
    enabled: open && Boolean(spaceId),
  });

  const revealedQuery = useQuery({
    queryKey: ['revealed-contact', spaceId],
    queryFn: () => enquiryApi.revealedContact(spaceId!),
    enabled: open && Boolean(spaceId) && contactViewed && !liveContact,
  });
  const detail = detailQuery.data;
  const reveal = useDirectContactReveal(
    spaceId,
    open && Boolean(detail) && !detail?.alreadyMember && !detail?.ownedByCurrentUser,
  );
  const revealed = reveal.contact ?? liveContact ?? revealedQuery.data ?? null;
  const revealing =
    reveal.phase === 'checking' || reveal.phase === 'revealing' || reveal.phase === 'revealed';
  const amenityItems =
    detail?.amenities?.filter((a) => a.label || a.code) ??
    (detail?.amenityLabels ?? []).map((label) => ({ code: label, label }));

  useEffect(() => {
    setLiveContact(null);
  }, [spaceId]);

  useEffect(() => {
    if (!open) {
      autoEnquireOpened.current = false;
      return;
    }
    if (
      reveal.phase === 'checking' ||
      reveal.phase === 'revealing' ||
      reveal.phase === 'revealed'
    ) {
      return;
    }
    if (!autoEnquire || !detail || detail.alreadyMember || alreadyInquired || autoEnquireOpened.current) {
      return;
    }
    autoEnquireOpened.current = true;
    setEnquireOpen(true);
  }, [alreadyInquired, autoEnquire, detail, open, reveal.phase]);

  const formattedAddress = detail
    ? formatListingAddress({
        addressLine: detail.addressLine,
        city: detail.city,
        state: detail.state,
        pincode: detail.pincode,
        address: detail.address,
      })
    : null;
  const priceParts = detail ? detailPriceParts(detail, t) : { amount: null, suffix: null };
  const description = detail?.description?.trim() || null;
  const unlocked = Boolean(revealed) || contactViewed || alreadyInquired;
  const mapHref = openableMapsUrl(detail?.mapUrl);

  const scrollToSection = useCallback((section: ListingSection) => {
    const scroller = scrollerRef.current;
    const target = scroller?.querySelector<HTMLElement>(`#listing-section-${section}`);
    if (!scroller || !target) return;
    const top =
      target.getBoundingClientRect().top - scroller.getBoundingClientRect().top + scroller.scrollTop - 12;
    scroller.scrollTo({ top: Math.max(0, top), behavior: 'smooth' });
  }, []);

  useEffect(() => {
    if (!open || !focusSection || !detail) return;
    const first = window.setTimeout(() => scrollToSection(focusSection), 80);
    const second = window.setTimeout(() => scrollToSection(focusSection), 450);
    const third = window.setTimeout(() => scrollToSection(focusSection), 900);
    return () => {
      window.clearTimeout(first);
      window.clearTimeout(second);
      window.clearTimeout(third);
    };
  }, [detail, focusNonce, focusSection, open, revealed, reveal.phase, scrollToSection]);

  const textPrimary = isDark ? theme.palette.text.primary : colors.textPrimary;
  const textSecondary = isDark ? theme.palette.text.secondary : colors.textSecondary;
  const border = isDark ? theme.palette.divider : colors.border;

  return (
    <AppDrawer open={open} onClose={onClose} width={isMobile ? '100%' : 672}>
      <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <Stack
          direction="row"
          sx={{
            alignItems: 'center',
            justifyContent: 'space-between',
            px: 2.5,
            py: 2,
            borderBottom: `1px solid ${border}`,
          }}
        >
          <Typography sx={{ fontWeight: 600, fontSize: '1.125rem', color: textPrimary }} noWrap>
            {detail?.name ?? t('spaces.findPlace.detailTitle')}
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            {spaceId ? (
              <FavoriteHeartButton spaceId={spaceId} listingName={detail?.name} />
            ) : null}
          <IconButton
            size="small"
            onClick={onClose}
            aria-label={t('spaces.findPlace.close')}
            sx={{ color: textSecondary }}
          >
            <X size={20} />
          </IconButton>
          </Box>
        </Stack>

        <Box ref={scrollerRef} sx={{ flex: 1, overflow: 'auto' }}>
          {detailQuery.isLoading ? (
            <Stack spacing={1.5} sx={{ p: 2.5 }}>
              <Skeleton variant="rounded" height={200} sx={{ borderRadius: '24px' }} />
              <Skeleton variant="text" width="70%" height={28} />
              <Skeleton variant="text" width="90%" />
              <Skeleton variant="rounded" height={120} />
            </Stack>
          ) : null}

          {detailQuery.isError ? (
            <Box sx={{ p: 2.5 }}>
              <ErrorState
                message={getErrorMessage(detailQuery.error, t('spaces.findPlace.errorLoad'))}
                onRetry={() => void detailQuery.refetch()}
              />
            </Box>
          ) : null}

          {detail ? (
            <Stack spacing={0} sx={{ minHeight: '100%', p: 2.5, boxSizing: 'border-box' }}>
              <Box
                sx={{
                  position: 'relative',
                  aspectRatio: '16 / 10',
                  borderRadius: '24px',
                  overflow: 'hidden',
                  border: '1px solid rgba(0,0,0,0.05)',
                  bgcolor: '#fff',
                  boxShadow: '0 1px 2px rgba(15,23,42,0.06)',
                }}
              >
                <DiscoverListingImage
                  src={discoverDefaultImageUrl(detail.type, detail.spaceId)}
                  alt={detail.name}
                />
                {alreadyInquired ? (
                  <Box
                    sx={{
                      position: 'absolute',
                      top: 12,
                      left: 12,
                      zIndex: 1,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 0.5,
                      px: 1,
                      py: 0.5,
                      borderRadius: '6px',
                      bgcolor: '#FFEDD5',
                      color: '#C2410C',
                      border: '1px solid #FDBA74',
                      fontSize: 11,
                      fontWeight: 700,
                    }}
                  >
                    <Check size={12} />
                    {t('spaces.findPlace.inquirySent', { defaultValue: 'Inquiry sent' })}
                  </Box>
                ) : null}
              </Box>

              <Box id="listing-section-food" sx={{ mt: 2 }}>
                <ListingFacts
                  leading={<TypeChip label={t(spaceTypeLabelKey(detail.type))} />}
                  genderPolicy={detail.genderPolicy}
                  sharingNotes={detail.sharingNotes}
                  foodAvailability={detail.foodAvailability}
                  foodIncludedInRent={detail.foodIncludedInRent}
                />
              </Box>

              <Typography
                sx={{
                  mt: 1,
                  fontWeight: 600,
                  fontSize: '1.35rem',
                  letterSpacing: '-0.02em',
                  color: textPrimary,
                  lineHeight: 1.2,
                }}
              >
                {detail.name}
              </Typography>

              <Box id="listing-section-contact">
              {contactViewed || reveal.contact ? (
                <Typography sx={{ mt: 1.5, fontSize: 13, fontWeight: 700, color: '#0F6B4C' }}>
                  {t('spaces.findPlace.contactDetailsViewed', { defaultValue: 'Contact details viewed' })}
                </Typography>
              ) : null}

              <OwnerContactCard contact={revealed} mapUrl={unlocked ? detail.mapUrl : null} />
              </Box>
              {alreadyInquired ? <InquirySentDetails listingId={detail.spaceId} /> : null}

              <Box id="listing-section-address">
              {formattedAddress ? (
                <Typography
                  sx={{
                    mt: 1,
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 0.75,
                    fontSize: 13,
                    color: textSecondary,
                  }}
                >
                  <MapPin size={16} style={{ flexShrink: 0, marginTop: 2 }} aria-hidden />
                  {formattedAddress}
                </Typography>
              ) : null}
              </Box>

              <Box id="listing-section-rent">
              {priceParts.amount ? (
                <Typography sx={{ mt: 2, fontWeight: 600, fontSize: '1.35rem', color: textPrimary }}>
                  {priceParts.amount}
                  {priceParts.suffix ? (
                    <Box component="span" sx={{ ml: 0.75, fontSize: 12, fontWeight: 500, color: textSecondary }}>
                      {priceParts.suffix}
                    </Box>
                  ) : null}
                </Typography>
              ) : (
                <Typography sx={{ mt: 2, fontWeight: 500, fontSize: 15, color: textSecondary }}>
                  {t('spaces.findPlace.priceOnRequest', { defaultValue: 'Price on request' })}
                </Typography>
              )}
              </Box>

              {description ? (
                <Box sx={{ mt: 2.5 }}>
                  <Typography sx={{ fontSize: 14, fontWeight: 700, color: textPrimary }}>
                    {t('spaces.findPlace.aboutThisPlace')}
                  </Typography>
                  <Typography sx={{ mt: 1, fontSize: 13, color: textSecondary, lineHeight: 1.55 }}>
                    {description}
                  </Typography>
                </Box>
              ) : null}

              {detail.sharingNotes ? (
                <Box sx={{ mt: 2.5 }}>
                  <Typography sx={{ fontSize: 14, fontWeight: 700, color: textPrimary }}>
                    {t('spaces.findPlace.details.sharing')}
                  </Typography>
                  <Typography sx={{ mt: 1, fontSize: 13, color: textSecondary, lineHeight: 1.55 }}>
                    {detail.sharingNotes}
                  </Typography>
                </Box>
              ) : null}

              <Box id="listing-section-amenities">
              {amenityItems.length > 0 ? (
                <Box sx={{ mt: 2.5 }}>
                  <Typography sx={{ fontSize: 14, fontWeight: 700, color: textPrimary }}>
                    {t('spaces.findPlace.amenities')}
                  </Typography>
                  <Box
                    component="ul"
                    sx={{
                      mt: 1.5,
                      m: 0,
                      p: 0,
                      listStyle: 'none',
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr',
                      gap: 1,
                    }}
                  >
                    {amenityItems.map((item) => {
                      const code = item.code?.toUpperCase() ?? '';
                      const visual = code in AMENITY_VISUAL ? AMENITY_VISUAL[code as keyof typeof AMENITY_VISUAL] : null;
                      const Icon = visual?.icon;
                      const label = amenityLabel(item);
                      return (
                        <Box
                          component="li"
                          key={`${item.code}-${item.label}`}
                          sx={{ display: 'inline-flex', alignItems: 'center', gap: 1, fontSize: 12, color: textSecondary }}
                        >
                          {Icon ? <Icon size={16} color={colors.teal} aria-hidden /> : null}
                          {label}
                        </Box>
                      );
                    })}
                  </Box>
                </Box>
              ) : null}
              </Box>

              <Box sx={{ mt: 2.5 }}>
                <Typography sx={{ fontSize: '0.95rem', color: textPrimary, lineHeight: 1.5 }}>
                  <Box component="span" sx={{ fontWeight: 800 }}>
                    {t('spaces.findPlace.reviewsRatings', { defaultValue: 'Review & Ratings' })}
                    {': '}
                  </Box>
                  {t('spaces.findPlace.notAvailable', { defaultValue: 'Not available' })}
                </Typography>
                {hasActualListingPhotos([detail.listingImageUrl, detail.coverImageUrl, detail.imageUrl]) ? null : (
                  <Typography sx={{ mt: 0.75, fontSize: '0.95rem', color: textPrimary, lineHeight: 1.5 }}>
                    <Box component="span" sx={{ fontWeight: 800 }}>
                      {t('spaces.findPlace.photos', { defaultValue: 'Photos' })}
                      {': '}
                    </Box>
                    {t('spaces.findPlace.notAvailable', { defaultValue: 'Not available' })}
                  </Typography>
                )}
                <PhotoRequestAction
                  spaceId={detail.spaceId}
                  kind={detail.type === 'MESS' ? 'mess' : 'property'}
                  name={detail.name}
                  spaceType={detail.type}
                  location={formattedAddress}
                  photoUrls={[detail.listingImageUrl, detail.coverImageUrl, detail.imageUrl]}
                />
              </Box>

              <Box id="listing-section-map" sx={{ mt: 'auto', pt: 2.5 }}>
                <Box sx={{ borderRadius: '16px', bgcolor: '#EAF8F2', p: 1.25 }}>
                  {mapHref ? (
                    <Box
                      component="a"
                      href={mapHref}
                      target="_blank"
                      rel="noreferrer"
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                        width: '100%',
                        borderRadius: '12px',
                        bgcolor: '#fff',
                        px: 1,
                        py: 0.75,
                        textDecoration: 'none',
                        boxShadow: '0 1px 2px rgba(11,28,22,0.04)',
                        '&:hover': { bgcolor: '#F3FBF7' },
                      }}
                    >
                      <Box
                        sx={{
                          width: 32,
                          height: 32,
                          borderRadius: '8px',
                          bgcolor: '#E8F8EF',
                          color: '#0F6B4C',
                          display: 'grid',
                          placeItems: 'center',
                          flexShrink: 0,
                        }}
                      >
                        <Map size={16} aria-hidden />
                      </Box>
                      <Box sx={{ minWidth: 0, flex: 1 }}>
                        <Typography
                          sx={{
                            fontSize: 10,
                            fontWeight: 700,
                            letterSpacing: '0.12em',
                            textTransform: 'uppercase',
                            color: colors.muted,
                          }}
                        >
                          {t('spaces.findPlace.location', { defaultValue: 'Location' })}
                        </Typography>
                        <Typography
                          sx={{
                            fontSize: 12,
                            fontWeight: 700,
                            color: '#0F6B4C',
                            textDecoration: 'underline',
                            textUnderlineOffset: '2px',
                          }}
                        >
                          {t('spaces.findPlace.openMaps', { defaultValue: 'Open in Google Maps' })}
                        </Typography>
                      </Box>
                    </Box>
                  ) : !unlocked ? (
                    <Box
                      component="button"
                      type="button"
                      onClick={() => setEnquireOpen(true)}
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                        width: '100%',
                        border: 0,
                        borderRadius: '12px',
                        bgcolor: '#fff',
                        px: 1,
                        py: 0.75,
                        textAlign: 'left',
                        cursor: 'pointer',
                        font: 'inherit',
                        boxShadow: '0 1px 2px rgba(11,28,22,0.04)',
                        '&:hover': { bgcolor: '#F3FBF7' },
                      }}
                    >
                      <Box
                        sx={{
                          width: 32,
                          height: 32,
                          borderRadius: '8px',
                          bgcolor: '#E8F8EF',
                          color: '#0F6B4C',
                          display: 'grid',
                          placeItems: 'center',
                          flexShrink: 0,
                        }}
                      >
                        <Map size={16} aria-hidden />
                      </Box>
                      <Box sx={{ minWidth: 0, flex: 1 }}>
                        <Typography
                          sx={{
                            fontSize: 10,
                            fontWeight: 700,
                            letterSpacing: '0.12em',
                            textTransform: 'uppercase',
                            color: colors.muted,
                          }}
                        >
                          {t('spaces.findPlace.location', { defaultValue: 'Location' })}
                        </Typography>
                        <Typography sx={{ fontSize: 12, fontWeight: 700, color: '#0F6B4C' }}>
                          {t('spaces.findPlace.openMaps', { defaultValue: 'Open in Google Maps' })}
                        </Typography>
                      </Box>
                    </Box>
                  ) : null}

                  <Box sx={{ mt: mapHref || !unlocked ? 1 : 0 }}>
                    <Typography
                      sx={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 0.5,
                        mb: 1,
                        fontSize: 10,
                        fontWeight: 700,
                        letterSpacing: '0.12em',
                        textTransform: 'uppercase',
                        color: '#0F6B4C',
                      }}
                    >
                      <BadgeCheck size={14} aria-hidden />
                      {t('spaces.findPlace.infoAvailable', { defaultValue: 'Information available' })}
                    </Typography>
                    <ListingInfoChips
                      listing={detail}
                      variant="detail"
                      surface={detail.type === 'MESS' ? 'meals' : 'places'}
                      onSelect={scrollToSection}
                    />
                  </Box>
                </Box>

                {detail.alreadyMember ? (
                  <Button
                    fullWidth
                    variant="contained"
                    color="primary"
                    onClick={() => {
                      onClose();
                      navigate(spaceDashboardPath(detail.spaceId));
                    }}
                    sx={{ ...dashContainedButtonSx, mt: 2, minHeight: 44, borderRadius: '12px', bgcolor: colors.primaryDark }}
                  >
                    {t('spaces.findPlace.openDashboard')}
                  </Button>
                ) : detail.ownedByCurrentUser ? (
                  <Button
                    fullWidth
                    variant="contained"
                    color="primary"
                    onClick={() => setEnquireOpen(true)}
                    sx={{ ...dashContainedButtonSx, mt: 2, minHeight: 44, borderRadius: '12px', bgcolor: colors.primaryDark }}
                  >
                    {t('spaces.findPlace.enquire.ownCta')}
                  </Button>
                ) : reveal.phase === 'disabled' || reveal.phase === 'exhausted' || reveal.phase === 'error' ? (
                  <Typography sx={{ mt: 2, fontSize: 13, color: textSecondary }}>
                    {reveal.phase === 'exhausted'
                      ? t('spaces.findPlace.enquire.viewHereExhausted', {
                          defaultValue: 'You have used all instant contact views for today.',
                        })
                      : reveal.phase === 'error'
                        ? t('spaces.findPlace.enquire.viewHereFailed', {
                            defaultValue: 'Contact details could not be loaded. Try again.',
                          })
                        : t('spaces.findPlace.enquire.viewHereDisabled', {
                            defaultValue: 'Instant contact viewing is turned off. You can still request details.',
                          })}
                  </Typography>
                ) : null}
                {revealing || (contactViewed && !sendingEnquiry) ? null : alreadyInquired && !sendingEnquiry ? (
                  <Button
                    fullWidth
                    disabled
                    aria-disabled="true"
                    startIcon={<Check size={16} />}
                    sx={{
                      mt: 2,
                      minHeight: 44,
                      borderRadius: '12px',
                      bgcolor: '#FFEDD5',
                      color: '#C2410C',
                      border: '1px solid #FDBA74',
                      fontWeight: 700,
                      textTransform: 'none',
                      '&.Mui-disabled': { bgcolor: '#FFEDD5', color: '#C2410C', opacity: 1 },
                    }}
                  >
                    {t('spaces.findPlace.inquirySent', { defaultValue: 'Inquiry sent' })}
                  </Button>
                ) : (
                  <Button
                    fullWidth
                    variant="contained"
                    color="primary"
                    disabled={sendingEnquiry}
                    onClick={() => setEnquireOpen(true)}
                    startIcon={sendingEnquiry ? undefined : <Phone size={16} />}
                    sx={{
                      ...dashContainedButtonSx,
                      mt: 2,
                      minHeight: 44,
                      borderRadius: '12px',
                      bgcolor: colors.primary,
                      '&:hover': { bgcolor: colors.primaryHover },
                    }}
                  >
                    {sendingEnquiry ? (
                      <CircularProgress size={18} sx={{ color: colors.white }} />
                    ) : (
                      t('spaces.findPlace.getContactDetails', { defaultValue: 'Get Contact Details' })
                    )}
                  </Button>
                )}
              </Box>
            </Stack>
          ) : null}
        </Box>
      </Box>
      {detail ? (
        <EnquireDialog
          open={enquireOpen}
          spaceId={detail.spaceId}
          spaceName={detail.name}
          ownedByCurrentUser={Boolean(detail.ownedByCurrentUser)}
          onClose={() => setEnquireOpen(false)}
          onOpen={() => setEnquireOpen(true)}
          onViewedHere={(contact) => {
            setLiveContact(contact);
            setEnquireOpen(false);
          }}
        />
      ) : null}
    </AppDrawer>
  );
}

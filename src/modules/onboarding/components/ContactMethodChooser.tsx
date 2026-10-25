import { Box, ButtonBase, Typography } from '@mui/material';
import { ChevronRight, Eye, Lock, Mail, MessageCircle, Smartphone, Zap } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { InquiryQuota } from '@/shared/types/inquiryCredits';
import { canViewContactDirectly, isUnlimitedQuota, needsInquiryPayment, paidCreditsOf } from '@/shared/api/inquiryCreditsApi';

type ContactMethodChooserProps = {
  quota: InquiryQuota | null;
  packageOffer?: { amount: string; credits: number } | null;
  disabled?: boolean;
  onApp: () => void;
  onViewHere: () => void;
  onEmail: () => void;
};

function OrDivider({ label }: { label: string }) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, py: 0.25 }}>
      <Box sx={{ flex: 1, height: '1px', bgcolor: 'rgba(15,23,42,0.12)' }} />
      <Typography sx={{ fontSize: 11, fontWeight: 800, letterSpacing: 0.6, color: 'text.secondary' }}>
        {label}
      </Typography>
      <Box sx={{ flex: 1, height: '1px', bgcolor: 'rgba(15,23,42,0.12)' }} />
    </Box>
  );
}

export function ContactMethodChooser({
  quota,
  packageOffer,
  disabled,
  onApp,
  onViewHere,
  onEmail,
}: ContactMethodChooserProps) {
  const { t } = useTranslation();
  const dailyLimit = quota?.dailyFreeLimit ?? 0;
  const remainingKnown = quota != null && !isUnlimitedQuota(quota);
  const remainingToday = quota?.freeRemainingToday ?? dailyLimit;
  const paidLeft = paidCreditsOf(quota);
  const emailExhausted = needsInquiryPayment(quota);
  const showPaidRemaining = remainingKnown && remainingToday <= 0 && paidLeft > 0;
  const viewHereLimit = quota?.viewHereDailyLimit ?? 0;
  const viewHereRemaining = quota?.viewHereRemainingToday ?? 0;
  const showViewHere = canViewContactDirectly(quota);
  const showViewHereExhausted = viewHereLimit > 0 && viewHereRemaining <= 0;

  return (
    <Box sx={{ textAlign: 'center' }}>
      <Box
        sx={{
          mx: 'auto',
          mb: 1,
          width: 56,
          height: 56,
          borderRadius: '50%',
          display: 'grid',
          placeItems: 'center',
          bgcolor: '#E7F6EE',
          color: '#0F6B4C',
        }}
      >
        <MessageCircle size={22} aria-hidden />
      </Box>
      <Typography sx={{ fontSize: 17, fontWeight: 700 }}>
        {t('spaces.findPlace.enquire.chooseTitle', { defaultValue: 'Get owner contact details' })}
      </Typography>
      <Typography sx={{ mt: 0.5, fontSize: 13, color: 'text.secondary' }}>
        {t('spaces.findPlace.enquire.chooseBody', {
          defaultValue: 'Send your enquiry through ACOMI to get the owner’s contact details.',
        })}
      </Typography>

      <Box sx={{ mt: 1.5, display: 'flex', flexDirection: 'column', gap: 1, textAlign: 'left' }}>
        <ButtonBase
          disabled={disabled}
          onClick={onApp}
          sx={{
            width: '100%',
            borderRadius: '16px',
            border: '1px solid rgba(15,107,76,0.3)',
            bgcolor: '#E7F6EE',
            p: 1.5,
            justifyContent: 'flex-start',
          }}
        >
          <Box sx={{ display: 'flex', gap: 1.25, width: '100%', alignItems: 'flex-start' }}>
            <Box
              sx={{
                width: 36,
                height: 36,
                borderRadius: '10px',
                bgcolor: 'rgba(255,255,255,0.85)',
                color: '#0F6B4C',
                display: 'grid',
                placeItems: 'center',
                flexShrink: 0,
              }}
            >
              <Smartphone size={16} aria-hidden />
            </Box>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography
                component="span"
                sx={{
                  display: 'inline-flex',
                  borderRadius: 999,
                  bgcolor: '#0F6B4C',
                  color: '#fff',
                  px: 1,
                  py: 0.25,
                  fontSize: 10,
                  fontWeight: 800,
                  letterSpacing: 0.4,
                  textTransform: 'uppercase',
                }}
              >
                {t('spaces.findPlace.enquire.recommended', { defaultValue: 'Recommended' })}
              </Typography>
              <Typography sx={{ mt: 0.5, fontSize: 12, fontWeight: 700 }}>
                {t('spaces.findPlace.enquire.sendOnApp', { defaultValue: 'Send on ACOMI App' })}
              </Typography>
              <Typography sx={{ fontSize: 15, fontWeight: 800, lineHeight: 1.2 }}>
                {t('spaces.findPlace.enquire.unlimitedTitle', { defaultValue: 'Unlimited enquiries' })}
              </Typography>
              <Typography sx={{ fontSize: 14, fontWeight: 700, color: '#0F6B4C' }}>
                {t('spaces.findPlace.enquire.freeAndroid', { defaultValue: 'Free on Android!' })}
              </Typography>
              <Box sx={{ mt: 1, display: 'flex', flexWrap: 'wrap', gap: 1.5 }}>
                <Typography sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5, fontSize: 11, fontWeight: 600 }}>
                  <Zap size={12} aria-hidden />
                  {t('spaces.findPlace.enquire.benefitFast', { defaultValue: 'Fast & easy' })}
                </Typography>
                <Typography sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5, fontSize: 11, fontWeight: 600 }}>
                  <Lock size={12} aria-hidden />
                  {t('spaces.findPlace.enquire.benefitSecure', { defaultValue: 'Secure' })}
                </Typography>
                <Typography sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5, fontSize: 11, fontWeight: 600 }}>
                  <Smartphone size={12} aria-hidden />
                  {t('spaces.findPlace.enquire.benefitAnywhere', { defaultValue: 'Access anywhere' })}
                </Typography>
              </Box>
            </Box>
            <ChevronRight size={16} aria-hidden />
          </Box>
        </ButtonBase>

        <OrDivider label={t('spaces.findPlace.enquire.optionOr', { defaultValue: 'OR' })} />

        {showViewHere ? (
          <ButtonBase
            disabled={disabled}
            onClick={onViewHere}
            sx={{
              width: '100%',
              borderRadius: '16px',
              border: '1px solid #BAE6FD',
              bgcolor: '#F3F8FF',
              p: 1.5,
              justifyContent: 'flex-start',
            }}
          >
            <Box sx={{ display: 'flex', gap: 1.25, width: '100%', alignItems: 'flex-start' }}>
              <Box
                sx={{
                  width: 36,
                  height: 36,
                  borderRadius: '50%',
                  bgcolor: '#E0F2FE',
                  color: '#0369A1',
                  display: 'grid',
                  placeItems: 'center',
                  flexShrink: 0,
                }}
              >
                <Eye size={16} aria-hidden />
              </Box>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography sx={{ fontSize: 15, fontWeight: 800 }}>
                  {t('spaces.findPlace.enquire.viewHereTitle', { defaultValue: 'View contact details here' })}
                </Typography>
                <Typography sx={{ mt: 0.5, fontSize: 12, color: 'text.secondary' }}>
                  {t('spaces.findPlace.enquire.viewHereBody', {
                    defaultValue: 'See the owner’s contact details instantly on this website.',
                  })}
                </Typography>
                <Typography
                  sx={{
                    mt: 1,
                    display: 'inline-flex',
                    borderRadius: 999,
                    bgcolor: '#E0F2FE',
                    color: '#075985',
                    px: 1,
                    py: 0.25,
                    fontSize: 12,
                    fontWeight: 700,
                  }}
                >
                  {viewHereRemaining === 1
                    ? t('spaces.findPlace.enquire.viewHereRemainingOne', {
                        remaining: viewHereRemaining,
                        limit: viewHereLimit,
                        defaultValue: '{{remaining}} instant view remaining today (out of {{limit}})',
                      })
                    : t('spaces.findPlace.enquire.viewHereRemaining', {
                        remaining: viewHereRemaining,
                        limit: viewHereLimit,
                        defaultValue: '{{remaining}} instant views remaining today (out of {{limit}})',
                      })}
                </Typography>
              </Box>
              <ChevronRight size={16} aria-hidden />
            </Box>
          </ButtonBase>
        ) : null}

        {showViewHereExhausted ? (
          <Typography sx={{ borderRadius: '12px', bgcolor: '#F0F9FF', px: 1.5, py: 1, fontSize: 13, color: '#0C4A6E' }}>
            {t('spaces.findPlace.enquire.viewHereExhausted', {
              defaultValue: 'Your instant views are used for today. You can still request contact details by email.',
            })}
          </Typography>
        ) : null}

        {showViewHere || showViewHereExhausted ? (
          <OrDivider label={t('spaces.findPlace.enquire.optionOr', { defaultValue: 'OR' })} />
        ) : null}

        <ButtonBase
          disabled={disabled}
          onClick={onEmail}
          sx={{
            width: '100%',
            borderRadius: '16px',
            border: '1px solid rgba(217,119,6,0.45)',
            bgcolor: '#FFF4EC',
            p: 1.5,
            justifyContent: 'flex-start',
          }}
        >
          <Box sx={{ display: 'flex', gap: 1.25, width: '100%', alignItems: 'flex-start' }}>
            <Box
              sx={{
                position: 'relative',
                width: 36,
                height: 36,
                borderRadius: '10px',
                bgcolor: 'rgba(255,255,255,0.9)',
                color: '#B45309',
                display: 'grid',
                placeItems: 'center',
                flexShrink: 0,
                boxShadow: '0 1px 2px rgba(15,23,42,0.06)',
                border: '1px solid rgba(251,191,36,0.8)',
              }}
            >
              <Mail size={16} aria-hidden />
              {remainingKnown && !showPaidRemaining ? (
                <Box
                  sx={{
                    position: 'absolute',
                    top: -6,
                    right: -6,
                    minWidth: 20,
                    height: 20,
                    px: 0.5,
                    borderRadius: 999,
                    bgcolor: '#E11D48',
                    color: '#fff',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 10,
                    fontWeight: 800,
                  }}
                >
                  {remainingToday}
                </Box>
              ) : null}
              {showPaidRemaining ? (
                <Box
                  sx={{
                    position: 'absolute',
                    top: -6,
                    right: -6,
                    minWidth: 20,
                    height: 20,
                    px: 0.5,
                    borderRadius: 999,
                    bgcolor: '#0F6B4C',
                    color: '#fff',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 10,
                    fontWeight: 800,
                  }}
                >
                  {paidLeft}
                </Box>
              ) : null}
            </Box>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography sx={{ fontSize: 12, fontWeight: 700 }}>
                {emailExhausted
                  ? packageOffer
                    ? t('spaces.findPlace.enquire.emailCtaExhausted', {
                        count: packageOffer.credits,
                        defaultValue: 'Get {{count}} more enquiries',
                      })
                    : t('spaces.findPlace.enquire.emailCtaExhaustedPending', { defaultValue: 'Get more enquiries' })
                  : t('spaces.findPlace.enquire.emailCtaReady', { defaultValue: 'Get on email' })}
              </Typography>
              {remainingKnown ? (
                <Typography
                  sx={{
                    mt: 0.5,
                    display: 'inline-flex',
                    borderRadius: '6px',
                    bgcolor: 'rgba(254,243,199,0.9)',
                    color: '#78350F',
                    px: 0.75,
                    py: 0.25,
                    fontSize: 13,
                    fontWeight: 800,
                  }}
                >
                  {showPaidRemaining
                    ? t('spaces.findPlace.enquire.emailPaidRemaining', {
                        count: paidLeft,
                        defaultValue: '{{count}} paid enquiries left',
                      })
                    : remainingToday === 1
                      ? t('spaces.findPlace.enquire.emailRemainingOne', {
                          remaining: remainingToday,
                          limit: dailyLimit,
                          defaultValue: '{{remaining}} enquiry remaining out of {{limit}}',
                        })
                      : t('spaces.findPlace.enquire.emailRemaining', {
                          remaining: remainingToday,
                          limit: dailyLimit,
                          defaultValue: '{{remaining}} enquiries remaining out of {{limit}}',
                        })}
                </Typography>
              ) : null}
              {remainingKnown && !showPaidRemaining && !emailExhausted ? (
                <Typography sx={{ mt: 0.5, fontSize: 12, fontWeight: 700, color: 'text.secondary' }}>
                  {t('spaces.findPlace.enquire.emailDailyLimit', {
                    count: dailyLimit,
                    defaultValue: 'Only {{count}} enquiries per day',
                  })}
                </Typography>
              ) : null}
              {emailExhausted && packageOffer ? (
                <Typography sx={{ mt: 0.5, fontSize: 12, fontWeight: 700, color: 'text.secondary' }}>
                  {t('spaces.findPlace.enquire.limitCreditsCta', {
                    count: packageOffer.credits,
                    amount: packageOffer.amount,
                    defaultValue: 'Get {{count}} more enquiries · {{amount}}',
                  })}
                </Typography>
              ) : null}
              <Typography sx={{ mt: 0.75, fontSize: 12, color: 'text.secondary' }}>
                {emailExhausted
                  ? packageOffer
                    ? t('spaces.findPlace.enquire.emailExhaustedHint', {
                        amount: packageOffer.amount,
                        defaultValue: 'Pay {{amount}} on UPI, then send the screenshot on WhatsApp.',
                      })
                    : null
                  : showPaidRemaining
                    ? t('spaces.findPlace.enquire.emailPaidHint', {
                        defaultValue: 'Admin approved credits are ready to use.',
                      })
                    : t('spaces.findPlace.enquire.emailCardHint', {
                        defaultValue: 'We’ll send the owner’s contact details to your registered email.',
                      })}
              </Typography>
            </Box>
            <ChevronRight size={16} aria-hidden />
          </Box>
        </ButtonBase>
      </Box>
    </Box>
  );
}

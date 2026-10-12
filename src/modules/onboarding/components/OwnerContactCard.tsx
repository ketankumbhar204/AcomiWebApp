import { Box, Typography } from '@mui/material';
import { ExternalLink, Mail, MapPin, Phone } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { OwnerContactResponse } from '@/shared/types/enquiry';

type OwnerContactCardProps = {
  contact: OwnerContactResponse | null | undefined;
  mapUrl?: string | null;
};

/** Matches public website OwnerContactCard (sky contact panel). */
export function OwnerContactCard({ contact, mapUrl }: OwnerContactCardProps) {
  const { t } = useTranslation();
  if (!contact) return null;

  const phones = [contact.mobileNumber, contact.alternateMobileNumber, contact.additionalMobileNumber].filter(
    (value): value is string => Boolean(value && value.trim()),
  );
  const email = contact.email?.trim() ?? '';
  const name = contact.ownerName?.trim() ?? '';
  const mapHref = mapUrl?.trim() ?? '';
  const hasDetails = phones.length > 0 || email.length > 0 || name.length > 0 || mapHref.length > 0;

  return (
    <Box
      component="section"
      sx={{
        mt: 2,
        borderRadius: '16px',
        border: '1px solid #BAE6FD',
        bgcolor: '#F3F8FF',
        p: 2,
        textAlign: 'left',
      }}
    >
      <Typography
        sx={{
          fontSize: 13,
          fontWeight: 800,
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
          color: '#075985',
        }}
      >
        {t('spaces.findPlace.enquire.contactTitle', { defaultValue: 'Contact details' })}
      </Typography>
      {hasDetails ? (
        <Box sx={{ mt: 1.5, display: 'flex', flexDirection: 'column', gap: 1 }}>
          {name ? (
            <Box>
              <Typography sx={{ fontSize: 12, fontWeight: 500, color: 'text.secondary' }}>
                {t('spaces.findPlace.enquire.contactOwner', { defaultValue: 'Owner' })}
              </Typography>
              <Typography sx={{ fontWeight: 700 }}>{name}</Typography>
            </Box>
          ) : null}
          {phones.map((phone) => {
            const numeric = phone.replace(/\D/g, '');
            const whatsapp = numeric.length === 10 ? `91${numeric}` : numeric;
            return (
              <Box key={phone} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
                <Box
                  component="a"
                  href={`tel:${phone}`}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    fontWeight: 700,
                    color: 'inherit',
                    textDecoration: 'none',
                    '&:hover': { textDecoration: 'underline' },
                  }}
                >
                  <Phone size={16} color="#0369A1" aria-hidden />
                  {phone}
                </Box>
                {numeric.length >= 10 ? (
                  <Typography
                    component="a"
                    href={`https://wa.me/${whatsapp}`}
                    target="_blank"
                    rel="noreferrer"
                    sx={{
                      fontSize: 12,
                      fontWeight: 700,
                      color: '#166534',
                      bgcolor: '#DCFCE7',
                      borderRadius: '999px',
                      px: 1,
                      py: 0.25,
                      textDecoration: 'none',
                    }}
                  >
                    {t('spaces.findPlace.enquire.whatsapp', { defaultValue: 'WhatsApp' })}
                  </Typography>
                ) : null}
              </Box>
            );
          })}
          {email ? (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0 }}>
              <Mail size={16} color="#0369A1" aria-hidden />
              <Box sx={{ minWidth: 0 }}>
                <Typography sx={{ fontSize: 12, fontWeight: 500, color: 'text.secondary' }}>
                  {t('spaces.findPlace.enquire.contactEmail', { defaultValue: 'Email' })}
                </Typography>
                <Typography
                  component="a"
                  href={`mailto:${email}`}
                  sx={{
                    fontWeight: 700,
                    color: 'inherit',
                    textDecoration: 'none',
                    display: 'block',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    '&:hover': { textDecoration: 'underline' },
                  }}
                >
                  {email}
                </Typography>
              </Box>
            </Box>
          ) : null}
          {mapHref ? (
            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
              <MapPin size={16} color="#0369A1" style={{ marginTop: 2 }} aria-hidden />
              <Box>
                <Typography sx={{ fontSize: 12, fontWeight: 500, color: 'text.secondary' }}>
                  {t('spaces.findPlace.enquire.contactMap', { defaultValue: 'Map' })}
                </Typography>
                <Typography
                  component="a"
                  href={mapHref}
                  target="_blank"
                  rel="noreferrer"
                  sx={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 0.5,
                    fontWeight: 700,
                    color: '#0F6B4C',
                    textDecoration: 'underline',
                    textUnderlineOffset: '2px',
                  }}
                >
                  {t('spaces.findPlace.openMaps', { defaultValue: 'Open in Google Maps' })}
                  <ExternalLink size={14} aria-hidden />
                </Typography>
              </Box>
            </Box>
          ) : null}
        </Box>
      ) : (
        <Typography sx={{ mt: 1, fontSize: 13, color: 'text.secondary' }}>
          {t('spaces.findPlace.enquire.contactEmpty', {
            defaultValue: 'Contact details are not available for this listing yet.',
          })}
        </Typography>
      )}
    </Box>
  );
}

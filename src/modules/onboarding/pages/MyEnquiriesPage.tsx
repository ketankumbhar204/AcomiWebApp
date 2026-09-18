import { Box, Button, Chip, CircularProgress, Stack, Typography } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { enquiryApi } from '@/shared/api/enquiryApi';
import { ROUTES } from '@/routes/paths';
import { PageHeader } from '@/shared/components/PageHeader';
import type { SpaceEnquiryResponse, SpaceEnquiryStatus } from '@/shared/types/enquiry';
import { contactWasEmailed } from '@/modules/onboarding/utils/enquiryContactDelivery';

function statusKey(status: SpaceEnquiryStatus): string {
  return `spaces.enquiries.status.${status}`;
}

function hintKey(enquiry: { status: SpaceEnquiryStatus } & Partial<SpaceEnquiryResponse>): string | null {
  if (enquiry.status === 'SHARED') {
    return contactWasEmailed(enquiry as SpaceEnquiryResponse)
      ? 'spaces.enquiries.sharedHint'
      : 'spaces.enquiries.sharedInAppHint';
  }
  if (enquiry.status === 'PENDING') return 'spaces.enquiries.pendingHint';
  if (enquiry.status === 'REJECTED') return 'spaces.enquiries.rejectedHint';
  if (enquiry.status === 'EXPIRED') return 'spaces.enquiries.expiredHint';
  return null;
}

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function MyEnquiriesPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const highlightId = UUID_RE.test(params.get('id') ?? '') ? params.get('id') : null;
  const query = useQuery({
    queryKey: ['my-enquiries'],
    queryFn: () => enquiryApi.listMine({ size: 50 }),
  });

  const rows = query.data?.content ?? [];

  useEffect(() => {
    if (!highlightId) return;
    document.getElementById(`enquiry-${highlightId}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, [highlightId, rows]);

  return (
    <Box sx={{ p: { xs: 2, sm: 3 } }}>
      <PageHeader title={t('spaces.enquiries.title')} description={t('spaces.enquiries.subtitle')} />
      {query.isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
          <CircularProgress />
        </Box>
      ) : rows.length === 0 ? (
        <Typography color="text.secondary">{t('spaces.enquiries.empty')}</Typography>
      ) : (
        <Stack spacing={1.5}>
          {rows.map((row) => {
            const hint = hintKey(row);
            return (
              <Box
                id={`enquiry-${row.enquiryId}`}
                key={row.enquiryId}
                sx={{
                  p: 2,
                  borderRadius: 2,
                  border: 1,
                  borderColor: highlightId === row.enquiryId ? 'primary.main' : 'divider',
                  bgcolor: highlightId === row.enquiryId ? 'action.hover' : 'background.paper',
                }}
              >
                <Typography sx={{ fontWeight: 700 }}>{row.spaceName}</Typography>
                <Typography variant="body2" color="text.secondary">
                  {t('spaces.enquiries.requestedOn', {
                    date: new Date(row.requestedAt).toLocaleDateString(),
                  })}
                </Typography>
                <Chip size="small" label={t(statusKey(row.status))} sx={{ mt: 1 }} />
                {hint ? (
                  <Typography variant="body2" sx={{ mt: 1 }}>
                    {t(hint)}
                  </Typography>
                ) : null}
              </Box>
            );
          })}
        </Stack>
      )}
      <Button onClick={() => navigate(ROUTES.findAPlace)} sx={{ mt: 2, textTransform: 'none' }}>
        {t('spaces.findPlace.ctaFindPlace')}
      </Button>
    </Box>
  );
}

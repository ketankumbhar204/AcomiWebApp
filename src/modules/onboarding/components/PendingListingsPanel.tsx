import { Box, Button, Stack, TextField, Typography } from '@mui/material';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { mySpacesApi, type MeListing } from '@/shared/api/mySpacesApi';
import { ContentCard } from '@/shared/components/ContentCard';
import { colors } from '@/shared/theme/colors';
import { pendingHasNoPublicLink } from '@/modules/onboarding/utils/listingActions';

export function PendingListingsPanel() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState<MeListing | null>(null);
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const query = useQuery({
    queryKey: ['me-listings', 'PENDING'],
    queryFn: () => mySpacesApi.listMyListings({ status: 'PENDING' }),
  });

  const save = useMutation({
    mutationFn: async () => {
      if (!editing?.registrationId) return;
      const body = {
        addressLine: address.trim(),
        ...(editing.kind === 'MESS'
          ? { messName: name.trim() }
          : { propertyName: name.trim() }),
      };
      if (editing.kind === 'MESS') {
        await mySpacesApi.updateMessLead(editing.registrationId, body);
      } else {
        await mySpacesApi.updatePropertyLead(editing.registrationId, body);
      }
    },
    onSuccess: async () => {
      setEditing(null);
      await queryClient.invalidateQueries({ queryKey: ['me-listings', 'PENDING'] });
    },
  });

  if (query.isLoading || query.isError || !query.data?.length) {
    if (query.isError) {
      return (
        <Typography sx={{ color: colors.textSecondary, fontSize: 14 }}>
          {t('spaces.mySpaces.pendingLoadFailed', { defaultValue: 'Could not load pending listings.' })}
        </Typography>
      );
    }
    return null;
  }

  return (
    <ContentCard>
      <Stack spacing={1.25}>
        <Typography sx={{ fontWeight: 700, color: colors.textPrimary }}>
          {t('spaces.mySpaces.pendingTitle', { defaultValue: 'Pending review' })}
        </Typography>
        <Typography sx={{ color: colors.textSecondary, fontSize: 14 }}>
          {t('spaces.mySpaces.pendingHint', {
            defaultValue: 'These listings are not public until ACOMI publishes them. They use the same record after conversion.',
          })}
        </Typography>
        {query.data.map((listing) => (
          <Box
            key={listing.registrationId}
            sx={{
              border: `1px solid ${colors.border}`,
              borderRadius: 2,
              px: 1.5,
              py: 1.25,
            }}
          >
            <Typography sx={{ fontWeight: 700 }}>{listing.name}</Typography>
            <Typography sx={{ color: colors.textSecondary, fontSize: 13 }}>
              {listing.kind === 'MESS' ? 'MESS' : listing.spaceType || 'PROPERTY'}
              {' · '}
              {listing.registrationStatus || 'PENDING'}
              {listing.registrationReference ? ` · ${listing.registrationReference}` : ''}
            </Typography>
            {pendingHasNoPublicLink(listing) ? (
              <Typography sx={{ color: colors.textSecondary, fontSize: 12, mt: 0.5 }}>
                {t('spaces.mySpaces.pendingNoPublic', {
                  defaultValue: 'No public page or inventory until this listing is published.',
                })}
              </Typography>
            ) : null}
            <Button
              size="small"
              sx={{ mt: 0.5, px: 0 }}
              onClick={() => {
                setEditing(listing);
                setName(listing.name ?? '');
                setAddress(listing.address ?? '');
              }}
            >
              {t('spaces.mySpaces.editListing', { defaultValue: 'Edit listing' })}
            </Button>
          </Box>
        ))}
        {editing ? (
          <Stack spacing={1}>
            <TextField
              label={t('spaces.mySpaces.listingName', { defaultValue: 'Name' })}
              value={name}
              onChange={(event) => setName(event.target.value)}
              size="small"
            />
            <TextField
              label={t('spaces.mySpaces.listingAddress', { defaultValue: 'Address' })}
              value={address}
              onChange={(event) => setAddress(event.target.value)}
              size="small"
            />
            <Stack direction="row" spacing={1}>
              <Button variant="contained" disabled={save.isPending || !name.trim()} onClick={() => save.mutate()}>
                {t('common.save', { defaultValue: 'Save' })}
              </Button>
              <Button variant="text" onClick={() => setEditing(null)}>
                {t('common.cancel', { defaultValue: 'Cancel' })}
              </Button>
            </Stack>
            {save.isError ? (
              <Typography sx={{ color: colors.danger, fontSize: 13 }}>
                {t('spaces.mySpaces.pendingSaveFailed', { defaultValue: 'Could not save this listing.' })}
              </Typography>
            ) : null}
          </Stack>
        ) : null}
      </Stack>
    </ContentCard>
  );
}

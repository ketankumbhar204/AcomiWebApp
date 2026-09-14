import type { ReactNode } from 'react';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  List,
  ListItemButton,
  ListItemText,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { Box as BoxIcon, Link2, Search } from 'lucide-react';
import { useSnackbar } from 'notistack';
import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { adminApi } from '@/modules/admin/api/adminApi';
import { ConfirmDialog } from '@/shared/components/ConfirmDialog';
import { colors } from '@/shared/theme/colors';
import { dashContainedButtonSx, dashOutlinedButtonSx } from '@/shared/theme/dashButtonSx';
import type { AdminRegisteredUser, AdminRegistrationConvertResponse } from '@/shared/types/admin';
import { getErrorMessage } from '@/shared/api/errors';

type Kind = 'property' | 'mess';

type Props = {
  kind: Kind;
  registrationId: string;
  listingName?: string | null;
  status: string;
  testLead: boolean;
  mobileNumber?: string | null;
  linkedOwnerUserId?: string | null;
  linkedOwnerName?: string | null;
  linkedOwnerMobile?: string | null;
  ownershipStatus?: 'NOT_LINKED' | 'LINKED' | null;
  autoShareEligible?: boolean | null;
  autoShareReason?: string | null;
  convertedSpaceId?: string | null;
  onLinked: () => void;
  onConverted: (result: AdminRegistrationConvertResponse) => void;
  onDiscoveryEnabled: () => void;
};

function StatusRow({
  label,
  value,
  valueColor,
  action,
}: {
  label: string;
  value: string;
  valueColor?: string;
  action?: ReactNode;
}) {
  return (
    <Stack
      direction="row"
      spacing={1}
      sx={{ alignItems: 'center', justifyContent: 'space-between', gap: 1 }}
    >
      <Typography variant="body2" sx={{ color: colors.textSecondary, minWidth: 0 }}>
        <Box component="span" sx={{ fontWeight: 700, color: colors.textPrimary }}>
          {label}:
        </Box>{' '}
        <Box component="span" sx={{ fontWeight: 700, color: valueColor ?? colors.textPrimary }}>
          {value}
        </Box>
      </Typography>
      {action}
    </Stack>
  );
}

function maskMobile(value?: string | null): string {
  const digits = (value ?? '').replace(/\D/g, '');
  if (!digits) return '—';
  if (digits.length <= 4) return '*'.repeat(digits.length);
  return `${'*'.repeat(digits.length - 4)}${digits.slice(-4)}`;
}

function maskEmail(value?: string | null): string {
  if (!value || !value.includes('@')) {
    return value ? '***' : '—';
  }
  const at = value.indexOf('@');
  const local = value.slice(0, at);
  const domain = value.slice(at + 1);
  if (!domain) {
    return '***';
  }
  return `${local.slice(0, 1) || '*'}***@${domain}`;
}

export function AdminRegistrationConversionPanel({
  kind,
  registrationId,
  listingName,
  status,
  testLead,
  mobileNumber,
  linkedOwnerUserId,
  linkedOwnerName,
  linkedOwnerMobile,
  ownershipStatus,
  autoShareEligible,
  autoShareReason,
  convertedSpaceId,
  onLinked,
  onConverted,
  onDiscoveryEnabled,
}: Props) {
  const { t } = useTranslation();
  const { enqueueSnackbar } = useSnackbar();
  const [query, setQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState<AdminRegisteredUser[]>([]);
  const [linking, setLinking] = useState(false);
  const [pendingUser, setPendingUser] = useState<AdminRegisteredUser | null>(null);
  const [convertOpen, setConvertOpen] = useState(false);
  const [converting, setConverting] = useState(false);
  const [enableOpen, setEnableOpen] = useState(false);
  const [enabling, setEnabling] = useState(false);
  const [discoveryEnabled, setDiscoveryEnabled] = useState(false);
  const [spaceName, setSpaceName] = useState<string | null>(null);
  const [showSearch, setShowSearch] = useState(false);

  const converted = status === 'CONVERTED' || Boolean(convertedSpaceId);
  const linked = Boolean(linkedOwnerUserId) || ownershipStatus === 'LINKED';
  const searchVisible = showSearch && !linked;
  const canConvert = !converted;
  const canEnableDiscovery = converted && Boolean(convertedSpaceId) && !testLead && !discoveryEnabled;

  useEffect(() => {
    if (!convertedSpaceId) {
      return;
    }
    let active = true;
    void adminApi
      .getAdminSpace(convertedSpaceId)
      .then((space) => {
        if (!active) return;
        setDiscoveryEnabled(Boolean(space.discoverable));
        setSpaceName(space.name ?? null);
      })
      .catch(() => {
        if (active) setDiscoveryEnabled(false);
      });
    return () => {
      active = false;
    };
  }, [convertedSpaceId]);

  const handleSearch = useCallback(async () => {
    const q = query.trim();
    if (q.length < 2) {
      enqueueSnackbar(t('admin.conversion.searchMin'), { variant: 'warning' });
      return;
    }
    setSearching(true);
    try {
      const page = await adminApi.listRegisteredUsers({ q, size: 10 });
      setResults(page.content);
      if (page.content.length === 0) {
        enqueueSnackbar(t('admin.conversion.noUsersFound'), { variant: 'info' });
      }
    } catch (err) {
      enqueueSnackbar(getErrorMessage(err, t('admin.conversion.searchFailed')), {
        variant: 'error',
      });
    } finally {
      setSearching(false);
    }
  }, [enqueueSnackbar, query, t]);

  useEffect(() => {
    if (!searchVisible) return;
    const q = query.trim();
    if (q.length < 2) return;
    const handle = window.setTimeout(() => {
      void handleSearch();
    }, 400);
    return () => window.clearTimeout(handle);
  }, [handleSearch, query, searchVisible]);

  async function handleLink(userId: string) {
    setLinking(true);
    try {
      if (kind === 'property') {
        await adminApi.linkPropertyOwner(registrationId, { userId });
      } else {
        await adminApi.linkMessOwner(registrationId, { userId });
      }
      enqueueSnackbar(t('admin.conversion.ownerLinked'), { variant: 'success' });
      setResults([]);
      setShowSearch(false);
      setPendingUser(null);
      onLinked();
    } catch (err) {
      enqueueSnackbar(getErrorMessage(err, t('admin.conversion.linkFailed')), { variant: 'error' });
    } finally {
      setLinking(false);
    }
  }

  async function handleConvert() {
    setConverting(true);
    try {
      const result =
        kind === 'property'
          ? await adminApi.convertPropertyRegistration(registrationId)
          : await adminApi.convertMessRegistration(registrationId);
      enqueueSnackbar(t('admin.conversion.convertSuccess'), { variant: 'success' });
      setConvertOpen(false);
      setDiscoveryEnabled(false);
      setSpaceName(result.spaceName ?? null);
      onConverted(result);
    } catch (err) {
      enqueueSnackbar(getErrorMessage(err, t('admin.conversion.convertFailed')), {
        variant: 'error',
      });
    } finally {
      setConverting(false);
    }
  }

  async function handleEnableDiscovery() {
    if (!convertedSpaceId) return;
    setEnabling(true);
    try {
      const space = await adminApi.enableSpaceDiscovery(convertedSpaceId);
      setDiscoveryEnabled(Boolean(space.discoverable));
      setEnableOpen(false);
      enqueueSnackbar(t('admin.conversion.discoveryEnabled'), { variant: 'success' });
      onDiscoveryEnabled();
    } catch (err) {
      enqueueSnackbar(getErrorMessage(err, t('admin.conversion.discoveryFailed')), {
        variant: 'error',
      });
    } finally {
      setEnabling(false);
    }
  }

  function openSearch() {
    setQuery((mobileNumber ?? '').trim());
    setResults([]);
    setShowSearch(true);
  }

  const ownerSearch = searchVisible ? (
    <>
      <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
        {t('admin.conversion.linkOwnerHeading')}
      </Typography>
      <Typography variant="body2" color="text.secondary">
        {t('admin.conversion.linkOwnerHint')}
      </Typography>
      <Stack direction="row" spacing={1}>
        <TextField
          size="small"
          fullWidth
          label={t('admin.conversion.searchUsers')}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') void handleSearch();
          }}
        />
        <Button
          variant="outlined"
          onClick={() => void handleSearch()}
          disabled={searching}
          startIcon={searching ? <CircularProgress size={14} /> : <Search size={14} />}
          sx={{
            ...dashOutlinedButtonSx,
            minWidth: 100,
            borderColor: colors.primary,
            color: colors.teal,
          }}
        >
          {t('admin.conversion.search')}
        </Button>
      </Stack>
      {results.length > 0 ? (
        <List
          dense
          sx={{
            border: `1px solid ${colors.border}`,
            borderRadius: 1.5,
            maxHeight: 180,
            overflow: 'auto',
          }}
        >
          {results.map((user) => (
            <ListItemButton
              key={user.id}
              disabled={linking}
              onClick={() => setPendingUser(user)}
            >
              <ListItemText
                primary={user.fullName || t('admin.conversion.unnamedUser')}
                secondary={`${maskMobile(user.mobileNumber)}${
                  user.email ? ` · ${maskEmail(user.email)}` : ''
                }`}
              />
            </ListItemButton>
          ))}
        </List>
      ) : null}
    </>
  ) : null;

  return (
    <Box
      sx={{
        p: 2.25,
        borderRadius: 2.5,
        border: `1px solid ${colors.border}`,
        bgcolor: colors.surface,
        boxShadow: '0 1px 2px rgba(15, 23, 42, 0.04)',
      }}
    >
      <Stack direction="row" spacing={1} sx={{ alignItems: 'center', mb: 2 }}>
        <Box
          sx={{
            width: 36,
            height: 36,
            borderRadius: 1.5,
            bgcolor: colors.mintSubtle,
            color: colors.teal,
            display: 'grid',
            placeItems: 'center',
          }}
        >
          <BoxIcon size={18} />
        </Box>
        <Typography variant="h6" sx={{ fontWeight: 800, fontSize: '1.05rem' }}>
          {t('admin.conversion.title')}
        </Typography>
      </Stack>

      <Stack spacing={1.25} sx={{ mb: 2 }}>
        <StatusRow
          label={t('admin.conversion.ownership')}
          value={
            linked
              ? t('admin.conversion.ownerLinkedShort')
              : converted
                ? t('admin.conversion.provisionalOwner')
                : t('admin.conversion.ownerNotLinked')
          }
          valueColor={linked ? colors.success : colors.textSecondary}
          action={
            linked ? undefined : (
              <Button
                size="small"
                variant="outlined"
                startIcon={<Link2 size={14} />}
                onClick={openSearch}
                sx={{
                  ...dashOutlinedButtonSx,
                  minHeight: 32,
                  height: 32,
                  px: 1.25,
                  borderColor: colors.border,
                  color: colors.textPrimary,
                  whiteSpace: 'nowrap',
                }}
              >
                {t('admin.conversion.linkOwnerCta')}
              </Button>
            )
          }
        />
        <StatusRow
          label={t('admin.conversion.acomiOwner')}
          value={
            linked
              ? linkedOwnerName || t('admin.conversion.linkedOwnerUnknown')
              : t('admin.conversion.ownerNotLinked')
          }
        />
        {linked ? (
          <StatusRow
            label={t('admin.conversion.acomiOwnerMobile')}
            value={maskMobile(linkedOwnerMobile)}
          />
        ) : null}
        <StatusRow
          label={t('admin.conversion.registrationContact')}
          value={mobileNumber?.trim() ? mobileNumber : t('admin.conversion.nA')}
        />
        <StatusRow
          label={t('admin.conversion.spaceStatus')}
          value={
            converted ? t('admin.conversion.converted') : t('admin.conversion.notConverted')
          }
          valueColor={converted ? colors.success : colors.textPrimary}
        />
        {convertedSpaceId ? (
          <Typography variant="body2" sx={{ color: colors.textSecondary }}>
            <Box component="span" sx={{ fontWeight: 700, color: colors.textPrimary }}>
              {t('admin.conversion.spaceId')}:
            </Box>{' '}
            {spaceName ? `${spaceName} · ` : ''}
            {convertedSpaceId}
          </Typography>
        ) : null}
        <StatusRow
          label={t('admin.conversion.discoverableShort')}
          value={
            converted
              ? discoveryEnabled
                ? t('admin.common.yes')
                : t('admin.common.no')
              : t('admin.conversion.nA')
          }
        />
        {converted ? (
          <StatusRow
            label={t('admin.conversion.autoShare')}
            value={
              autoShareEligible
                ? t('admin.conversion.autoShareEligible')
                : t('admin.conversion.autoShareNotEligible')
            }
            valueColor={autoShareEligible ? colors.success : colors.textSecondary}
          />
        ) : null}
        {converted && autoShareReason && !autoShareEligible ? (
          <Typography variant="body2" sx={{ color: colors.textSecondary }}>
            {t(`admin.conversion.autoShareReasons.${autoShareReason}`, {
              defaultValue: autoShareReason,
            })}
          </Typography>
        ) : null}
        {testLead ? (
          <Alert severity="warning" sx={{ borderRadius: 2 }}>
            {t('admin.conversion.testLeadBlocked')}
          </Alert>
        ) : null}
      </Stack>

      {!converted ? (
        <Stack spacing={1.5}>
          {ownerSearch}
          <Button
            variant="contained"
            fullWidth
            disabled={!canConvert || converting}
            startIcon={converting ? <CircularProgress size={16} color="inherit" /> : <BoxIcon size={16} />}
            onClick={() => setConvertOpen(true)}
            sx={{
              ...dashContainedButtonSx,
              minHeight: 44,
              height: 44,
              fontWeight: 800,
              mt: 0.5,
            }}
          >
            {t('admin.conversion.convertCta')}
          </Button>
          <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center' }}>
            {t('admin.conversion.convertNoUserRequired')}
          </Typography>
        </Stack>
      ) : (
        <Stack spacing={1.25}>
          {ownerSearch}
          <Alert severity="info" sx={{ borderRadius: 2 }}>
            {t('admin.conversion.convertedHint')}
          </Alert>
          <Button
            variant="contained"
            fullWidth
            disabled={!canEnableDiscovery || enabling}
            onClick={() => setEnableOpen(true)}
            sx={{
              ...dashContainedButtonSx,
              minHeight: 44,
              height: 44,
              fontWeight: 800,
            }}
          >
            {enabling ? <CircularProgress size={18} color="inherit" /> : t('admin.conversion.enableDiscovery')}
          </Button>
        </Stack>
      )}

      <ConfirmDialog
        open={Boolean(pendingUser)}
        title={t('admin.conversion.linkConfirmTitle', {
          name: pendingUser?.fullName || t('admin.conversion.unnamedUser'),
          listing: listingName || spaceName || t('admin.conversion.thisListing'),
        })}
        description={t('admin.conversion.linkConfirmMessage')}
        confirmLabel={t('admin.conversion.linkOwnerCta')}
        cancelLabel={t('admin.common.cancel')}
        confirming={linking}
        onConfirm={() => {
          if (pendingUser) void handleLink(pendingUser.id);
        }}
        onClose={() => setPendingUser(null)}
      />
      <ConfirmDialog
        open={convertOpen}
        title={t('admin.conversion.convertTitle')}
        description={t('admin.conversion.convertMessage')}
        confirmLabel={t('admin.conversion.convertCta')}
        cancelLabel={t('admin.common.cancel')}
        confirming={converting}
        onConfirm={() => void handleConvert()}
        onClose={() => setConvertOpen(false)}
      />
      <ConfirmDialog
        open={enableOpen}
        title={t('admin.conversion.enableTitle')}
        description={t('admin.conversion.enableMessage')}
        confirmLabel={t('admin.conversion.enableDiscovery')}
        cancelLabel={t('admin.common.cancel')}
        confirming={enabling}
        onConfirm={() => void handleEnableDiscovery()}
        onClose={() => setEnableOpen(false)}
      />
    </Box>
  );
}

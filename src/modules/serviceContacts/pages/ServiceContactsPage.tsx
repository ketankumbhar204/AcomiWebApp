import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  MenuItem,
  Stack,
  TextField,
  Typography,
  useTheme,
} from '@mui/material';
import {
  Mail,
  MapPin,
  Pencil,
  Phone,
  Plus,
  Search,
  Trash2,
  UserRound,
  Wrench,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSnackbar } from 'notistack';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { DASHBOARD_UX, dashSurfaces } from '@/modules/dashboard/theme/dashboardUx';
import { ContentCard } from '@/shared/components/ContentCard';
import { EmptyState } from '@/shared/components/EmptyState';
import { LoadingState } from '@/shared/components/LoadingState';
import { PageContainer } from '@/shared/components/PageContainer';
import { colors } from '@/shared/theme/colors';
import { dashContainedButtonSx, dashOutlinedButtonSx } from '@/shared/theme/dashButtonSx';
import { getErrorMessage } from '@/shared/api/errors';
import { useAuthSession } from '@/shared/hooks/useAuthSession';
import { useSpaceStore } from '@/store/spaceStore';
import { serviceContactsApi } from '../api/serviceContactsApi';
import { ServiceContactFormDrawer } from '../components/ServiceContactFormDrawer';
import type { ServiceContact, ServiceContactSort } from '../types';
import { canManageServiceContacts } from '../utils/serviceContactAccess';
import { displayPhone, mailtoHref, telHref, whatsappHref } from '../utils/serviceContactLinks';

const PAGE_SIZE = 20;

export function ServiceContactsPage() {
  const { t } = useTranslation();
  const theme = useTheme();
  const s = dashSurfaces(theme.palette.mode);
  const { enqueueSnackbar } = useSnackbar();
  const queryClient = useQueryClient();
  const { userId } = useAuthSession();
  const spaces = useSpaceStore((state) => state.mySpaces);
  const canManage = canManageServiceContacts(spaces);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [category, setCategory] = useState('');
  const [spaceId, setSpaceId] = useState('');
  const [sort, setSort] = useState<ServiceContactSort>('updated');
  const [page, setPage] = useState(0);
  const [editor, setEditor] = useState<ServiceContact | null | undefined>(undefined);
  const [details, setDetails] = useState<ServiceContact | null>(null);
  const [archiveTarget, setArchiveTarget] = useState<ServiceContact | null>(null);
  const [archiving, setArchiving] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => window.clearTimeout(timer);
  }, [search]);

  const categoriesQuery = useQuery({
    queryKey: ['service-contact-categories', userId],
    queryFn: () => serviceContactsApi.categories(),
  });
  const listQuery = useQuery({
    queryKey: ['service-contacts', userId, debouncedSearch, category, spaceId, sort, page],
    queryFn: () =>
      serviceContactsApi.list({
        q: debouncedSearch || undefined,
        category: category || undefined,
        spaceId: spaceId || undefined,
        sort,
        page,
        size: PAGE_SIZE,
      }),
  });

  const contacts = listQuery.data?.content ?? [];
  const total = listQuery.data?.totalElements ?? 0;
  const filtering = Boolean(debouncedSearch || category || spaceId);
  const operatorSpaces = useMemo(
    () =>
      spaces.filter((space) =>
        ['OWNER', 'MANAGER', 'STAFF'].includes(space.membershipRole),
      ),
    [spaces],
  );

  function refresh() {
    void queryClient.invalidateQueries({ queryKey: ['service-contacts'] });
  }

  async function confirmArchive() {
    if (!archiveTarget) return;
    setArchiving(true);
    try {
      await serviceContactsApi.archive(archiveTarget.id);
      enqueueSnackbar(t('serviceContacts.archived'), { variant: 'success' });
      setArchiveTarget(null);
      if (details?.id === archiveTarget.id) setDetails(null);
      refresh();
    } catch (error) {
      enqueueSnackbar(getErrorMessage(error, t('serviceContacts.saveError')), { variant: 'error' });
    } finally {
      setArchiving(false);
    }
  }

  return (
    <PageContainer>
      <Stack spacing={2} sx={{ width: '100%', maxWidth: DASHBOARD_UX.contentMaxWidth, mx: 'auto' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 1.5, flexWrap: 'wrap' }}>
          <Box>
            <Typography component="h1" sx={{ ...DASHBOARD_UX.pageTitle, color: s.textPrimary }}>
              {t('serviceContacts.title')}
            </Typography>
            <Typography sx={{ ...DASHBOARD_UX.body, color: s.textSecondary, mt: 0.35 }}>
              {t('serviceContacts.subtitle')}
            </Typography>
          </Box>
          {canManage ? (
            <Button
              variant="contained"
              startIcon={<Plus size={16} />}
              onClick={() => setEditor(null)}
              sx={{ ...dashContainedButtonSx, bgcolor: colors.primaryDark, '&:hover': { bgcolor: colors.primaryHover } }}
            >
              {t('serviceContacts.add')}
            </Button>
          ) : null}
        </Box>

        <ContentCard>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.25}>
            <TextField
              fullWidth
              value={search}
              placeholder={t('serviceContacts.searchPlaceholder')}
              aria-label={t('serviceContacts.searchPlaceholder')}
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(0);
              }}
              slotProps={{
                input: {
                  startAdornment: (
                    <Box sx={{ display: 'flex', mr: 1 }}>
                      <Search size={16} color={s.textMuted} />
                    </Box>
                  ),
                },
              }}
            />
            <TextField
              select
              label={t('serviceContacts.category')}
              value={category}
              onChange={(event) => {
                setCategory(event.target.value);
                setPage(0);
              }}
              sx={{ minWidth: { md: 220 } }}
            >
              <MenuItem value="">{t('serviceContacts.categoryAll')}</MenuItem>
              {(categoriesQuery.data ?? []).map((item) => (
                <MenuItem key={item.code} value={item.code}>
                  {item.label}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              select
              label={t('serviceContacts.spacesLabel')}
              value={spaceId}
              onChange={(event) => {
                setSpaceId(event.target.value);
                setPage(0);
              }}
              sx={{ minWidth: { md: 200 } }}
            >
              <MenuItem value="">{t('serviceContacts.spaceAll')}</MenuItem>
              {operatorSpaces.map((space) => (
                <MenuItem key={space.spaceId} value={space.spaceId}>
                  {space.spaceName}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              select
              label={t('serviceContacts.sortName')}
              value={sort}
              aria-label={t('serviceContacts.sortUpdated')}
              onChange={(event) => setSort(event.target.value as ServiceContactSort)}
              sx={{ minWidth: { md: 180 } }}
            >
              <MenuItem value="updated">{t('serviceContacts.sortUpdated')}</MenuItem>
              <MenuItem value="name">{t('serviceContacts.sortName')}</MenuItem>
              <MenuItem value="category">{t('serviceContacts.sortCategory')}</MenuItem>
            </TextField>
          </Stack>
        </ContentCard>

        <Typography sx={{ ...DASHBOARD_UX.body, color: s.textSecondary }} role="status">
          {t('serviceContacts.count', { count: total })}
        </Typography>

        {listQuery.isLoading ? (
          <LoadingState label={t('serviceContacts.loading')} />
        ) : listQuery.isError ? (
          <ContentCard>
            <EmptyState
              title={t('serviceContacts.loadError')}
              action={
                <Button variant="outlined" onClick={() => void listQuery.refetch()} sx={dashOutlinedButtonSx}>
                  {t('serviceContacts.retry')}
                </Button>
              }
            />
          </ContentCard>
        ) : contacts.length === 0 ? (
          <ContentCard>
            <EmptyState
              icon={<Wrench size={28} color={s.textMuted} />}
              title={filtering ? t('serviceContacts.noResultsTitle') : t('serviceContacts.emptyTitle')}
              description={
                filtering ? t('serviceContacts.noResultsDescription') : t('serviceContacts.emptyDescription')
              }
              action={
                !filtering && canManage ? (
                  <Button variant="contained" startIcon={<Plus size={16} />} onClick={() => setEditor(null)}>
                    {t('serviceContacts.add')}
                  </Button>
                ) : null
              }
            />
          </ContentCard>
        ) : (
          <Box
            sx={{
              display: 'grid',
              gap: 1.5,
              gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
            }}
          >
            {contacts.map((contact) => (
              <ContactCard
                key={contact.id}
                contact={contact}
                onOpen={() => setDetails(contact)}
                onEdit={() => setEditor(contact)}
                onArchive={() => setArchiveTarget(contact)}
              />
            ))}
          </Box>
        )}

        {listQuery.data && listQuery.data.totalPages > 1 ? (
          <Stack direction="row" spacing={1}>
            <Button
              variant="outlined"
              disabled={listQuery.data.first}
              onClick={() => setPage((current) => Math.max(0, current - 1))}
              sx={dashOutlinedButtonSx}
            >
              {t('serviceContacts.previous')}
            </Button>
            <Button
              variant="outlined"
              disabled={listQuery.data.last}
              onClick={() => setPage((current) => current + 1)}
              sx={dashOutlinedButtonSx}
            >
              {t('serviceContacts.next')}
            </Button>
          </Stack>
        ) : null}
      </Stack>

      <ServiceContactFormDrawer
        open={editor !== undefined}
        contact={editor ?? null}
        categories={categoriesQuery.data ?? []}
        spaces={spaces}
        onClose={() => setEditor(undefined)}
        onSaved={() => {
          setEditor(undefined);
          refresh();
        }}
      />

      <Dialog open={Boolean(details)} onClose={() => setDetails(null)} fullWidth maxWidth="sm">
        {details ? (
          <>
            <DialogTitle>{details.businessName}</DialogTitle>
            <DialogContent>
              <Detail contact={details} />
            </DialogContent>
            <DialogActions>
              {details.canEdit ? (
                <Button
                  onClick={() => {
                    setEditor(details);
                    setDetails(null);
                  }}
                >
                  {t('serviceContacts.edit')}
                </Button>
              ) : null}
              {details.canArchive ? (
                <Button color="error" onClick={() => setArchiveTarget(details)}>
                  {t('serviceContacts.archive')}
                </Button>
              ) : null}
              <Button onClick={() => setDetails(null)}>{t('serviceContacts.cancel')}</Button>
            </DialogActions>
          </>
        ) : null}
      </Dialog>

      <Dialog open={Boolean(archiveTarget)} onClose={() => (archiving ? undefined : setArchiveTarget(null))}>
        <DialogTitle>{t('serviceContacts.archiveConfirmTitle')}</DialogTitle>
        <DialogContent>
          <Typography sx={{ ...DASHBOARD_UX.body, color: s.textSecondary }}>
            {t('serviceContacts.archiveConfirmBody')}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setArchiveTarget(null)} disabled={archiving}>
            {t('serviceContacts.cancel')}
          </Button>
          <Button color="error" variant="contained" disabled={archiving} onClick={() => void confirmArchive()}>
            {t('serviceContacts.archive')}
          </Button>
        </DialogActions>
      </Dialog>
    </PageContainer>
  );
}

function ContactCard({
  contact,
  onOpen,
  onEdit,
  onArchive,
}: {
  contact: ServiceContact;
  onOpen: () => void;
  onEdit: () => void;
  onArchive: () => void;
}) {
  const { t } = useTranslation();
  const theme = useTheme();
  const s = dashSurfaces(theme.palette.mode);
  const phone = displayPhone(contact.primaryPhone);
  const whatsapp = whatsappHref(contact.whatsappPhone || contact.primaryPhone);
  const call = telHref(contact.primaryPhone);
  const mail = mailtoHref(contact.email);

  return (
    <Box
      sx={{
        border: `1px solid ${s.border}`,
        borderRadius: `${DASHBOARD_UX.radius}px`,
        bgcolor: s.surface,
        p: 1.75,
        display: 'flex',
        flexDirection: 'column',
        gap: 1,
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 1 }}>
        <Box
          component="button"
          type="button"
          onClick={onOpen}
          sx={{
            all: 'unset',
            cursor: 'pointer',
            minWidth: 0,
            '&:focus-visible': { outline: `2px solid ${colors.primaryDark}`, borderRadius: 1 },
          }}
        >
          <Typography sx={{ ...DASHBOARD_UX.cardTitle, color: s.textPrimary }}>{contact.businessName}</Typography>
          <Typography sx={{ ...DASHBOARD_UX.body, color: s.textSecondary }}>{contact.categoryLabel}</Typography>
        </Box>
        <Stack direction="row">
          {contact.canEdit ? (
            <IconButton aria-label={t('serviceContacts.edit')} onClick={onEdit}>
              <Pencil size={16} />
            </IconButton>
          ) : null}
          {contact.canArchive ? (
            <IconButton aria-label={t('serviceContacts.archive')} onClick={onArchive}>
              <Trash2 size={16} />
            </IconButton>
          ) : null}
        </Stack>
      </Box>
      {contact.contactPersonName ? (
        <Row icon={<UserRound size={15} />} text={contact.contactPersonName} />
      ) : null}
      {phone ? <Row icon={<Phone size={15} />} text={phone} /> : null}
      {contact.spaces.length > 0 ? (
        <Typography sx={{ ...DASHBOARD_UX.body, color: s.textSecondary }}>
          {contact.spaces.map((space) => space.name).join(', ')}
        </Typography>
      ) : null}
      <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: 'wrap' }}>
        {call ? (
          <Button component="a" href={call} size="small" variant="outlined" sx={dashOutlinedButtonSx}>
            {t('serviceContacts.call')}
          </Button>
        ) : null}
        {whatsapp ? (
          <Button
            component="a"
            href={whatsapp}
            target="_blank"
            rel="noopener noreferrer"
            size="small"
            variant="outlined"
            sx={dashOutlinedButtonSx}
          >
            {t('serviceContacts.whatsapp')}
          </Button>
        ) : null}
        {mail ? (
          <Button component="a" href={mail} size="small" variant="outlined" sx={dashOutlinedButtonSx}>
            {t('serviceContacts.email')}
          </Button>
        ) : null}
      </Stack>
    </Box>
  );
}

function Detail({ contact }: { contact: ServiceContact }) {
  const { t } = useTranslation();
  const rows = [
    contact.contactPersonName ? { icon: <UserRound size={16} />, text: contact.contactPersonName } : null,
    displayPhone(contact.primaryPhone)
      ? { icon: <Phone size={16} />, text: displayPhone(contact.primaryPhone) as string }
      : null,
    displayPhone(contact.alternatePhone)
      ? { icon: <Phone size={16} />, text: displayPhone(contact.alternatePhone) as string }
      : null,
    displayPhone(contact.whatsappPhone)
      ? { icon: <Phone size={16} />, text: `${t('serviceContacts.whatsapp')} ${displayPhone(contact.whatsappPhone)}` }
      : null,
    contact.email ? { icon: <Mail size={16} />, text: contact.email } : null,
    contact.address ? { icon: <MapPin size={16} />, text: contact.address } : null,
  ].filter((row): row is { icon: JSX.Element; text: string } => row != null);

  return (
    <Stack spacing={1.25} sx={{ pt: 0.5 }}>
      <Typography>{contact.categoryLabel}</Typography>
      {rows.map((row) => (
        <Row key={row.text} icon={row.icon} text={row.text} />
      ))}
      {contact.description ? <Typography>{contact.description}</Typography> : null}
      {contact.notes ? <Typography>{contact.notes}</Typography> : null}
      <Typography>
        {contact.spaces.length > 0
          ? contact.spaces.map((space) => space.name).join(', ')
          : t('serviceContacts.noSpaces')}
      </Typography>
    </Stack>
  );
}

function Row({ icon, text }: { icon: JSX.Element; text: string }) {
  const theme = useTheme();
  const s = dashSurfaces(theme.palette.mode);
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: s.textPrimary }}>
      <Box sx={{ color: colors.primaryDark, display: 'flex' }}>{icon}</Box>
      <Typography sx={DASHBOARD_UX.body}>{text}</Typography>
    </Box>
  );
}

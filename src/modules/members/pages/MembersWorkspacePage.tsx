import {
  Avatar,
  Box,
  Button,
  Checkbox,
  CircularProgress,
  FormControl,
  Grid,
  IconButton,
  InputLabel,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Select,
  Stack,
  Tab,
  Tabs,
  Tooltip,
  Typography,
  useTheme,
} from '@mui/material';
import {
  CalendarPlus,
  Download,
  IndianRupee,
  Mail,
  MailPlus,
  MoreVertical,
  Pencil,
  Plus,
  RefreshCw,
  UserCheck,
  UserPlus,
  Users,
} from 'lucide-react';
import { useEffect, useMemo, useState, type MouseEvent } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useSnackbar } from 'notistack';
import { IconBadge } from '@/modules/dashboard/components/IconBadge';
import { DASHBOARD_UX, dashSurfaces } from '@/modules/dashboard/theme/dashboardUx';
import { ConfirmDialog } from '@/shared/components/ConfirmDialog';
import { AppDrawer } from '@/shared/components/AppDrawer';
import { DataTable, type DataTableColumn } from '@/shared/components/DataTable';
import { ErrorState } from '@/shared/components/ErrorState';
import { PageContainer } from '@/shared/components/PageContainer';
import { PageHeader } from '@/shared/components/PageHeader';
import { StatCard } from '@/shared/components/StatCard';
import { StatusChip } from '@/shared/components/StatusChip';
import type { MemberResponse, MemberStatus, PendingInvitationResponse } from '@/shared/types/member';
import type { MembershipRole } from '@/shared/types/space';
import { paymentsApi } from '@/modules/payments/api/paymentsApi';
import { usePaymentsSummary } from '@/modules/payments/hooks/usePayments';
import { useSpacePermissions } from '@/shared/hooks/useSpacePermissions';
import { isAccommodationApplicable } from '@/shared/utils/spacePermissions';
import { accommodationApi } from '@/modules/accommodation/api/accommodationApi';
import { occupancyApi } from '@/modules/accommodation/api/occupancyApi';
import { stayLabelForMember } from '@/modules/members/utils/memberListStay';
import type { StayLayoutMode } from '@/shared/utils/stayTrail';
import {
  spaceImportPeoplePath,
  spaceMemberPath,
  spaceMembersPath,
} from '@/routes/paths';
import { colors } from '@/shared/theme/colors';
import { canManagePayments, currentMonthKey } from '@/shared/utils/dashboardFinancial';
import { dashContainedButtonSx, dashFilterControlSx, dashOutlinedButtonSx } from '@/shared/theme/dashButtonSx';
import {
  addPersonNoun,
  countImportableCandidates,
  destinationForAddPersonChoice,
  shouldOfferImportChoice,
} from '../addPersonChoice';
import { AddPersonChoiceDialog } from '../components/AddPersonChoiceDialog';
import { MemberFormDrawer } from '../components/MemberFormDrawer';
import type { MemberPickerMode } from '../components/form/MemberCustomerReusePicker';
import { InviteMemberDialog } from '../components/InviteMemberDialog';
import { MemberInspector } from '../components/MemberInspector';
import {
  importCandidatesQueryKey,
  loadImportPickerItems,
} from '../hooks/useResidentImportSearch';
import {
  useMemberDetails,
  useMemberMutations,
  useMembers,
  usePendingInvitations,
} from '../hooks/useMembers';
import {
  getMemberStatusLabelKey,
  memberStatusTone,
} from '../utils/memberStatus';
import {
  MEMBER_STATUSES,
  countMemberListFilters,
  defaultMemberListFilters,
  filterAndSortMembers,
  filterPendingInvitations,
  isJoinedThisMonth,
  rolesForSpace,
  type MemberListFilterState,
  type MemberSortOption,
} from '../utils/memberListQuery';
import {
  formatDuesAmount,
  memberDuesCue,
  type MemberDuesSnapshot,
  type MemberPaymentDuesFilter,
} from '../utils/memberDues';
import { membershipRoleLabelKey } from '../utils/memberRoles';
import { ContactNumberLine, StayTrailLine } from '@/shared/components/ContactAndStayMeta';
import { formatMemberContactNumber } from '@/shared/utils/indianMobile';

type ListTab = 'members' | 'pending';

type MemberRow = MemberResponse & { id: string };
type InviteRow = PendingInvitationResponse & { id: string };

const filterControlSx = {
  ...dashFilterControlSx,
  '& .MuiInputBase-root': {
    minHeight: DASHBOARD_UX.buttonHeight,
    height: DASHBOARD_UX.buttonHeight,
    borderRadius: `${DASHBOARD_UX.buttonRadius}px`,
    ...DASHBOARD_UX.body,
  },
  '& .MuiInputLabel-root': {
    ...DASHBOARD_UX.body,
  },
} as const;

function MemberDuesLine({
  snapshot,
  onOpen,
}: {
  snapshot: MemberDuesSnapshot | undefined;
  onOpen: () => void;
}) {
  const { t } = useTranslation();
  const cue = memberDuesCue(snapshot);
  if (!cue) {
    return null;
  }
  const currency = snapshot?.currencyCode || 'INR';
  const text =
    cue.kind === 'due'
      ? t('membership.dues.pending', {
          amount: formatDuesAmount(cue.amount, currency),
          defaultValue: 'Pending: {{amount}}',
        })
      : cue.kind === 'review'
        ? t('membership.dues.review', {
            amount: formatDuesAmount(cue.amount, currency),
            defaultValue: 'Under review: {{amount}}',
          })
        : t('membership.dues.clear', { defaultValue: 'No pending dues' });
  const color = cue.kind === 'due' ? '#D97706' : cue.kind === 'review' ? '#2563EB' : colors.primaryDark;
  return (
    <Typography
      component="button"
      type="button"
      onClick={(event) => {
        event.stopPropagation();
        onOpen();
      }}
      sx={{
        ...DASHBOARD_UX.metricCaption,
        display: 'block',
        p: 0,
        border: 0,
        background: 'none',
        cursor: 'pointer',
        textAlign: 'left',
        fontWeight: 700,
        color,
      }}
    >
      {text}
    </Typography>
  );
}

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
}

type MembersKpiFocus = 'total' | 'active' | 'pending' | 'joinedThisMonth' | 'pendingPayments';

function MemberRowActions({
  onView,
  onEdit,
  onInvite,
}: {
  onView: () => void;
  onEdit: () => void;
  onInvite: () => void;
}) {
  const { t } = useTranslation();
  const [anchor, setAnchor] = useState<null | HTMLElement>(null);

  return (
    <>
      <IconButton
        size="small"
        aria-label={t('membership.workspace.columns.actions')}
        aria-haspopup="menu"
        aria-expanded={Boolean(anchor)}
        onClick={(event: MouseEvent<HTMLElement>) => {
          event.stopPropagation();
          setAnchor(event.currentTarget);
        }}
        sx={{
          width: DASHBOARD_UX.buttonHeight,
          height: DASHBOARD_UX.buttonHeight,
          borderRadius: `${DASHBOARD_UX.buttonRadius}px`,
        }}
      >
        <MoreVertical size={14} />
      </IconButton>
      <Menu
        anchorEl={anchor}
        open={Boolean(anchor)}
        onClose={() => setAnchor(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        onClick={(event) => event.stopPropagation()}
      >
        <MenuItem
          onClick={() => {
            setAnchor(null);
            onView();
          }}
        >
          <ListItemText>{t('membership.workspace.viewDetails')}</ListItemText>
        </MenuItem>
        <MenuItem
          onClick={() => {
            setAnchor(null);
            onEdit();
          }}
        >
          <ListItemIcon>
            <Pencil size={14} />
          </ListItemIcon>
          <ListItemText>{t('common.edit')}</ListItemText>
        </MenuItem>
        <MenuItem
          onClick={() => {
            setAnchor(null);
            onInvite();
          }}
        >
          <ListItemIcon>
            <Mail size={14} />
          </ListItemIcon>
          <ListItemText>{t('membership.invite.headerAction')}</ListItemText>
        </MenuItem>
      </Menu>
    </>
  );
}

function InviteRowActions({ onCancel }: { onCancel: () => void }) {
  const { t } = useTranslation();
  const [anchor, setAnchor] = useState<null | HTMLElement>(null);

  return (
    <>
      <IconButton
        size="small"
        aria-label={t('membership.workspace.columns.actions')}
        aria-haspopup="menu"
        aria-expanded={Boolean(anchor)}
        onClick={(event: MouseEvent<HTMLElement>) => {
          event.stopPropagation();
          setAnchor(event.currentTarget);
        }}
        sx={{
          width: DASHBOARD_UX.buttonHeight,
          height: DASHBOARD_UX.buttonHeight,
          borderRadius: `${DASHBOARD_UX.buttonRadius}px`,
        }}
      >
        <MoreVertical size={14} />
      </IconButton>
      <Menu
        anchorEl={anchor}
        open={Boolean(anchor)}
        onClose={() => setAnchor(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        onClick={(event) => event.stopPropagation()}
      >
        <MenuItem
          onClick={() => {
            setAnchor(null);
            onCancel();
          }}
        >
          <ListItemText>{t('membership.pending.cancel')}</ListItemText>
        </MenuItem>
      </Menu>
    </>
  );
}

export function MembersWorkspacePage() {
  const { t } = useTranslation();
  const { spaceId = '', memberId } = useParams<{ spaceId: string; memberId?: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const importPreview = useQuery({
    queryKey: importCandidatesQueryKey(spaceId),
    queryFn: () => loadImportPickerItems(spaceId, undefined, { includeUnavailable: true }),
    enabled: Boolean(spaceId),
    staleTime: 15_000,
  });
  const theme = useTheme();
  const s = dashSurfaces(theme.palette.mode);
  const { enqueueSnackbar } = useSnackbar();
  const permissions = useSpacePermissions(spaceId);
  const spaceType = permissions.space?.spaceType;
  const showStayTrail = spaceType != null && isAccommodationApplicable(spaceType);
  const staySources = useQuery({
    queryKey: ['member-stay-trails', spaceId],
    enabled: showStayTrail && Boolean(spaceId),
    staleTime: 15_000,
    queryFn: async () => {
      const [active, vacated, buildings] = await Promise.all([
        occupancyApi.listOccupancies(spaceId, { status: 'ACTIVE', size: 200 }),
        occupancyApi.listOccupancies(spaceId, { status: 'VACATED', size: 200 }),
        accommodationApi.getBuildings(spaceId),
      ]);
      return {
        occupancies: [...(active.content ?? []), ...(vacated.content ?? [])],
        buildings,
      };
    },
  });
  const stayByMemberId = useMemo(() => {
    const occupancies = staySources.data?.occupancies ?? [];
    const activeBuildings = (staySources.data?.buildings ?? []).filter((building) => building.active);
    const layoutByBuildingId = new Map<string, StayLayoutMode>(
      activeBuildings.map((building) => [building.buildingId, building.layoutMode]),
    );
    const options = {
      multipleBuildings: activeBuildings.length > 1,
      layoutByBuildingId,
    };
    const next = new Map<string, string>();
    new Set(occupancies.map((row) => row.memberId)).forEach((id) => {
      const label = stayLabelForMember(id, occupancies, options);
      if (label) {
        next.set(id, label);
      }
    });
    return next;
  }, [staySources.data]);
  const canSeeDues = canManagePayments(permissions.membershipRole);
  const duesMonth = currentMonthKey();
  const duesSummary = usePaymentsSummary(spaceId, duesMonth, canSeeDues);
  const duesMembersQuery = useQuery({
    queryKey: ['members-dues', spaceId, duesMonth],
    enabled: canSeeDues && Boolean(spaceId),
    staleTime: 15_000,
    queryFn: async () => {
      const first = await paymentsApi.getPaymentsMembers(spaceId, {
        month: duesMonth,
        page: 0,
        size: 100,
      });
      const rows = [...first.page.content];
      const extraPages = Math.min(first.page.totalPages, 10) - 1;
      if (extraPages > 0) {
        const rest = await Promise.all(
          Array.from({ length: extraPages }, (_, index) =>
            paymentsApi.getPaymentsMembers(spaceId, {
              month: duesMonth,
              page: index + 1,
              size: 100,
            }),
          ),
        );
        rest.forEach((page) => rows.push(...page.page.content));
      }
      return rows;
    },
  });

  const membersQuery = useMembers(spaceId, permissions.canManageMembers);
  const invitationsQuery = usePendingInvitations(spaceId, permissions.canManageMembers);
  const { cancelInvitation } = useMemberMutations(spaceId);
  const selectedDetails = useMemberDetails(spaceId, memberId, Boolean(memberId));

  const [listTab, setListTab] = useState<ListTab>('members');
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState<MemberListFilterState>(defaultMemberListFilters());
  const [kpiFocus, setKpiFocus] = useState<MembersKpiFocus | null>(null);
  const [formMode, setFormMode] = useState<'create' | 'edit' | null>(null);
  const [choiceOpen, setChoiceOpen] = useState(false);
  const [importableCount, setImportableCount] = useState(0);
  const [resolvingClick, setResolvingClick] = useState(false);
  const [createPickerMode, setCreatePickerMode] = useState<MemberPickerMode>('new');
  const [editTarget, setEditTarget] = useState<MemberResponse | null>(null);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [invitePrefill, setInvitePrefill] = useState<{
    mobile?: string;
    role?: MembershipRole;
    name?: string;
  }>({});
  const [cancelInviteId, setCancelInviteId] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const pageSize = 25;
  const [searchParams, setSearchParams] = useSearchParams();

  useEffect(() => {
    document.title = `${t('navigation.members')} · ${t('common.appName')}`;
  }, [t]);

  const choiceFromQuery =
    searchParams.get('addChoice') === '1' || searchParams.get('create') === '1';

  const clearChoiceQuery = () => {
    if (!choiceFromQuery) {
      return;
    }
    const next = new URLSearchParams(searchParams);
    next.delete('addChoice');
    next.delete('create');
    setSearchParams(next, { replace: true });
  };

  const closeChoice = () => {
    setChoiceOpen(false);
    clearChoiceQuery();
  };

  const startCreate = (pickerMode: MemberPickerMode) => {
    setCreatePickerMode(pickerMode);
    setEditTarget(null);
    setFormMode('create');
    setChoiceOpen(false);
    clearChoiceQuery();
  };

  const chooseAddNew = () => {
    startCreate('new');
  };

  const chooseImport = () => {
    const destination = destinationForAddPersonChoice(spaceType, 'import');
    if (destination.type === 'import-page') {
      closeChoice();
      navigate(spaceImportPeoplePath(spaceId));
      return;
    }
    startCreate(destination.pickerMode);
  };

  const applyImportDecision = async (isActive: () => boolean = () => true) => {
    const people = await queryClient.fetchQuery({
      queryKey: importCandidatesQueryKey(spaceId),
      queryFn: () => loadImportPickerItems(spaceId, undefined, { includeUnavailable: true }),
      staleTime: 15_000,
    });
    if (!isActive()) {
      return;
    }
    const count = countImportableCandidates(people);
    setImportableCount(count);
    if (shouldOfferImportChoice(count)) {
      setChoiceOpen(true);
      clearChoiceQuery();
      return;
    }
    startCreate('new');
  };

  const openAddChoice = () => {
    if (resolvingClick) {
      return;
    }
    if (importPreview.data) {
      const count = countImportableCandidates(importPreview.data);
      setImportableCount(count);
      if (shouldOfferImportChoice(count)) {
        setChoiceOpen(true);
        clearChoiceQuery();
      } else {
        startCreate('new');
      }
      return;
    }
    setResolvingClick(true);
    void applyImportDecision()
      .catch(() => {
        startCreate('new');
      })
      .finally(() => {
        setResolvingClick(false);
      });
  };

  const importablePreviewCount = countImportableCandidates(importPreview.data ?? []);
  const deepLinkSettled = choiceFromQuery && importPreview.isFetched;
  const deepLinkChoice =
    deepLinkSettled &&
    importPreview.isSuccess &&
    shouldOfferImportChoice(importablePreviewCount);
  const deepLinkForm =
    deepLinkSettled &&
    (!importPreview.isSuccess || !shouldOfferImportChoice(importablePreviewCount));

  const resolvingEntry =
    resolvingClick || (choiceFromQuery && !importPreview.isFetched && formMode == null);

  const duesByMemberId = useMemo(() => {
    const map = new Map<string, MemberDuesSnapshot>();
    (duesMembersQuery.data ?? []).forEach((item) => {
      map.set(item.memberId, {
        pending: item.pending,
        underReview: item.underReview,
        expectedCharges: item.expectedCharges,
        currencyCode: item.currencyCode,
      });
    });
    return map;
  }, [duesMembersQuery.data]);

  const filteredMembers = useMemo(
    () =>
      filterAndSortMembers(membersQuery.members, {
        search,
        filters,
        spaceType,
        duesByMemberId,
      }),
    [duesByMemberId, filters, membersQuery.members, search, spaceType],
  );

  const filteredInvites = useMemo(
    () =>
      filterPendingInvitations(invitationsQuery.invitations, {
        search,
        roles: filters.roles,
        spaceType,
      }),
    [filters.roles, invitationsQuery.invitations, search, spaceType],
  );

  const applyKpiFocus = (next: MembersKpiFocus) => {
    const clearing = kpiFocus === next;
    setKpiFocus(clearing ? null : next);
    setPage(0);
    if (clearing || next === 'total') {
      setListTab('members');
      setFilters(defaultMemberListFilters());
      return;
    }
    if (next === 'pending') {
      setListTab('pending');
      setFilters(defaultMemberListFilters());
      return;
    }
    if (next === 'active') {
      setListTab('members');
      setFilters({
        ...defaultMemberListFilters(),
        statuses: ['ACTIVE'],
      });
      return;
    }
    if (next === 'pendingPayments') {
      setListTab('members');
      setFilters({
        ...defaultMemberListFilters(),
        paymentDues: 'pending',
      });
      return;
    }
    setListTab('members');
    setFilters({
      ...defaultMemberListFilters(),
      joinedThisMonthOnly: true,
    });
  };

  const kpi = useMemo(() => {
    const all = membersQuery.members;
    return {
      total: all.length,
      active: all.filter((m) => m.status === 'ACTIVE').length,
      pending: invitationsQuery.invitations.length,
      joinedThisMonth: all.filter((m) => isJoinedThisMonth(m.createdAt)).length,
    };
  }, [invitationsQuery.invitations.length, membersQuery.members]);

  const pagedMembers = filteredMembers.slice(page * pageSize, page * pageSize + pageSize);
  const memberRows: MemberRow[] = pagedMembers.map((row) => ({ ...row, id: row.memberId }));
  const inviteRows: InviteRow[] = filteredInvites.map((row) => ({
    ...row,
    id: row.invitationId,
  }));

  const activeFilterCount = countMemberListFilters(filters, spaceType);
  const inspectorOpen = Boolean(memberId);

  const openMember = (id: string, tab?: 'payments') =>
    navigate(tab ? `${spaceMemberPath(spaceId, id)}?tab=payments` : spaceMemberPath(spaceId, id));

  const memberColumns: DataTableColumn<MemberRow>[] = [
    {
      id: 'avatar',
      header: '',
      width: 48,
      accessor: (row) => (
        <Avatar
          sx={{
            width: 32,
            height: 32,
            bgcolor: theme.palette.mode === 'dark' ? s.elevated : colors.lightGreen,
            color: colors.primaryDark,
            ...DASHBOARD_UX.badge,
          }}
        >
          {initials(row.fullName)}
        </Avatar>
      ),
    },
    {
      id: 'name',
      header: t('membership.workspace.columns.name'),
      accessor: (row) => (
        <Box sx={{ minWidth: 0, py: 0.5 }}>
          <Typography
            sx={{
              ...DASHBOARD_UX.link,
              color: s.textPrimary,
            }}
            noWrap
          >
            {row.fullName}
          </Typography>
          <Typography sx={{ ...DASHBOARD_UX.metricCaption, color: s.textMuted }} noWrap>
            {row.linkedUser
              ? t('membership.members.onAcomi')
              : t('membership.members.notOnAcomiYet')}
          </Typography>
          {row.role === 'TENANT' &&
          (row.occupancyStatus === 'ALLOCATED' || row.occupancyStatus === 'VACATED') ? (
            <StayTrailLine label={stayByMemberId.get(row.memberId)} />
          ) : null}
          {canSeeDues ? <MemberDuesLine snapshot={duesByMemberId.get(row.memberId)} onOpen={() => openMember(row.memberId, 'payments')} /> : null}
        </Box>
      ),
      sortable: true,
      primary: true,
    },
    {
      id: 'mobile',
      header: t('membership.workspace.columns.mobile'),
      accessor: (row) => <ContactNumberLine value={row.mobileNumber} />,
      primary: true,
    },
    {
      id: 'role',
      header: t('membership.workspace.columns.role'),
      accessor: (row) => {
        const contact =
          formatMemberContactNumber(row.mobileNumber) ??
          t('membership.members.mobileNotAvailable');
        return (
          <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 0.75, minWidth: 0 }}>
            <StatusChip label={t(membershipRoleLabelKey(row.role, spaceType))} tone="info" />
            <ContactNumberLine label={contact} />
          </Box>
        );
      },
    },
    {
      id: 'joined',
      header: t('membership.workspace.columns.joined'),
      accessor: (row) => new Date(row.createdAt).toLocaleDateString(),
      sortable: true,
    },
    {
      id: 'status',
      header: t('membership.workspace.columns.status'),
      accessor: (row) => (
        <StatusChip
          label={t(getMemberStatusLabelKey(row.status))}
          tone={memberStatusTone(row.status)}
        />
      ),
    },
    {
      id: 'actions',
      header: t('membership.workspace.columns.actions'),
      width: 56,
      align: 'right',
      accessor: (row) => (
        <MemberRowActions
          onView={() => openMember(row.memberId)}
          onEdit={() => {
            setEditTarget(row);
            setFormMode('edit');
          }}
          onInvite={() => {
            setInvitePrefill({
              mobile: row.mobileNumber,
              role: row.role !== 'OWNER' ? row.role : undefined,
              name: row.fullName,
            });
            setInviteOpen(true);
          }}
        />
      ),
    },
  ];

  const inviteColumns: DataTableColumn<InviteRow>[] = [
    {
      id: 'mobile',
      header: t('membership.workspace.columns.mobile'),
      accessor: (row) => <ContactNumberLine value={row.mobileNumber} />,
      primary: true,
    },
    {
      id: 'role',
      header: t('membership.workspace.columns.role'),
      accessor: (row) => (
        <StatusChip label={t(membershipRoleLabelKey(row.role, spaceType))} tone="info" />
      ),
    },
    {
      id: 'invitedBy',
      header: t('membership.workspace.invitedBy'),
      accessor: (row) => row.invitedBy,
      primary: true,
    },
    {
      id: 'sent',
      header: t('membership.details.created'),
      accessor: (row) => new Date(row.createdAt).toLocaleString(),
    },
    {
      id: 'actions',
      header: t('membership.workspace.columns.actions'),
      width: 56,
      align: 'right',
      accessor: (row) => (
        <InviteRowActions onCancel={() => setCancelInviteId(row.invitationId)} />
      ),
    },
  ];

  const handleExportPrep = () => {
    enqueueSnackbar(t('membership.workspace.exportReady'), { variant: 'info' });
  };

  const filterBar = (
    <>
      <FormControl size="small" sx={filterControlSx}>
        <InputLabel id="member-role-filter">{t('membership.roles.label')}</InputLabel>
        <Select
          labelId="member-role-filter"
          label={t('membership.roles.label')}
          multiple
          value={filters.roles}
          onChange={(e) => {
            setPage(0);
            setFilters((prev) => ({
              ...prev,
              roles: e.target.value as MembershipRole[],
            }));
          }}
          renderValue={(selected) =>
            selected.length === 0
              ? t('membership.workspace.allRoles')
              : selected.map((role) => t(`spaces.roles.${role}`)).join(', ')
          }
        >
          {rolesForSpace(spaceType).map((role) => (
            <MenuItem key={role} value={role}>
              <Checkbox checked={filters.roles.includes(role)} size="small" />
              <ListItemText primary={t(`spaces.roles.${role}`)} />
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      <FormControl size="small" sx={filterControlSx}>
        <InputLabel id="member-status-filter">
          {t('membership.workspace.columns.status')}
        </InputLabel>
        <Select
          labelId="member-status-filter"
          label={t('membership.workspace.columns.status')}
          multiple
          value={filters.statuses}
          onChange={(e) => {
            setPage(0);
            setFilters((prev) => ({
              ...prev,
              statuses: e.target.value as MemberStatus[],
            }));
          }}
          renderValue={(selected) =>
            selected.length === 0
              ? t('membership.workspace.allStatuses')
              : selected.map((status) => t(getMemberStatusLabelKey(status))).join(', ')
          }
        >
          {MEMBER_STATUSES.map((status) => (
            <MenuItem key={status} value={status}>
              <Checkbox checked={filters.statuses.includes(status)} size="small" />
              <ListItemText primary={t(getMemberStatusLabelKey(status))} />
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      <FormControl size="small" sx={filterControlSx}>
        <InputLabel id="member-sort">{t('membership.workspace.sort')}</InputLabel>
        <Select
          labelId="member-sort"
          label={t('membership.workspace.sort')}
          value={filters.sort}
          onChange={(e) => {
            setPage(0);
            setFilters((prev) => ({
              ...prev,
              sort: e.target.value as MemberSortOption,
            }));
          }}
          renderValue={(value) => {
            const labels: Record<MemberSortOption, string> = {
              name_asc: t('membership.workspace.sortNameAsc'),
              name_desc: t('membership.workspace.sortNameDesc'),
              created_desc: t('membership.workspace.sortNewest'),
              created_asc: t('membership.workspace.sortOldest'),
              role: t('membership.workspace.sortRole'),
            };
            return `${t('membership.workspace.sort')}: ${labels[value as MemberSortOption]}`;
          }}
        >
          <MenuItem value="name_asc">{t('membership.workspace.sortNameAsc')}</MenuItem>
          <MenuItem value="name_desc">{t('membership.workspace.sortNameDesc')}</MenuItem>
          <MenuItem value="created_desc">{t('membership.workspace.sortNewest')}</MenuItem>
          <MenuItem value="created_asc">{t('membership.workspace.sortOldest')}</MenuItem>
          <MenuItem value="role">{t('membership.workspace.sortRole')}</MenuItem>
        </Select>
      </FormControl>

      {canSeeDues ? (
        <FormControl size="small" sx={filterControlSx}>
          <InputLabel id="member-dues-filter">
            {t('membership.dues.filterTitle', { defaultValue: 'Payments' })}
          </InputLabel>
          <Select
            labelId="member-dues-filter"
            label={t('membership.dues.filterTitle', { defaultValue: 'Payments' })}
            value={filters.paymentDues ?? 'all'}
            onChange={(e) => {
              setPage(0);
              setFilters((prev) => ({
                ...prev,
                paymentDues: e.target.value as MemberPaymentDuesFilter,
              }));
            }}
          >
            <MenuItem value="all">{t('membership.dues.filterAll', { defaultValue: 'All members' })}</MenuItem>
            <MenuItem value="pending">
              {t('membership.dues.filterPending', { defaultValue: 'Pending payments' })}
            </MenuItem>
            <MenuItem value="clear">
              {t('membership.dues.filterClear', { defaultValue: 'No pending dues' })}
            </MenuItem>
          </Select>
        </FormControl>
      ) : null}

      {activeFilterCount > 0 ? (
        <Button
          size="small"
          onClick={() => {
            setPage(0);
            setFilters(defaultMemberListFilters());
            setKpiFocus(null);
          }}
          sx={dashOutlinedButtonSx}
        >
          {t('membership.workspace.clearFilters')}
        </Button>
      ) : null}
    </>
  );

  const toolbarActions = (
    <Stack direction="row" spacing={1} useFlexGap sx={{ alignItems: 'center', flexWrap: 'wrap' }}>
      <Button
        size="small"
        startIcon={<RefreshCw size={14} />}
        onClick={() => {
          void (listTab === 'members' ? membersQuery.reload() : invitationsQuery.reload());
          void duesSummary.reload();
          void duesMembersQuery.refetch();
        }}
        sx={dashOutlinedButtonSx}
      >
        {t('common.refresh')}
      </Button>
      <Tooltip title={t('membership.workspace.export')}>
        <IconButton
          size="small"
          aria-label={t('membership.workspace.export')}
          onClick={handleExportPrep}
          sx={{
            width: DASHBOARD_UX.buttonHeight,
            height: DASHBOARD_UX.buttonHeight,
            borderRadius: `${DASHBOARD_UX.buttonRadius}px`,
            border: `1px solid ${s.border}`,
            color: s.textSecondary,
          }}
        >
          <Download size={14} />
        </IconButton>
      </Tooltip>
    </Stack>
  );

  return (
    <PageContainer gap={0}>
      <Stack spacing={`${DASHBOARD_UX.sectionGap}px`} sx={{ width: '100%' }}>
        <PageHeader
          title={t('navigation.members')}
          description={t('membership.members.listSubtitle')}
          breadcrumbs={[{ label: t('navigation.members'), to: spaceMembersPath(spaceId) }]}
          actions={
            <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: 'wrap' }}>
              {spaceType === 'MESS' ? (
                <Button
                  variant="outlined"
                  startIcon={
                    resolvingEntry ? <CircularProgress size={14} color="inherit" /> : <UserPlus size={14} />
                  }
                  disabled={resolvingEntry}
                  onClick={openAddChoice}
                  sx={dashOutlinedButtonSx}
                >
                  {t('membership.addCustomersHub.navTitle')}
                </Button>
              ) : countImportableCandidates(importPreview.data ?? []) > 0 ? (
                <Button
                  variant="outlined"
                  startIcon={<Users size={14} />}
                  onClick={() => navigate(spaceImportPeoplePath(spaceId))}
                  sx={dashOutlinedButtonSx}
                >
                  {t('membership.importPeople.title')}
                </Button>
              ) : null}
              <Button
                variant="outlined"
                startIcon={<MailPlus size={14} />}
                onClick={() => {
                  setInvitePrefill({});
                  setInviteOpen(true);
                }}
                sx={dashOutlinedButtonSx}
              >
                {t('membership.invite.headerAction')}
              </Button>
              <Button
                variant="contained"
                startIcon={
                  resolvingEntry ? <CircularProgress size={14} color="inherit" /> : <Plus size={14} />
                }
                disabled={resolvingEntry}
                onClick={openAddChoice}
                sx={{
                  ...dashContainedButtonSx,
                  minHeight: DASHBOARD_UX.buttonHeight,
                  height: DASHBOARD_UX.buttonHeight,
                  bgcolor: colors.primaryDark,
                  '&:hover': { bgcolor: colors.primaryHover },
                }}
              >
                {t('membership.add.fab')}
              </Button>
            </Stack>
          }
        />

        {membersQuery.error ? (
          <ErrorState
            title={t('common.errors.generic')}
            message={
              membersQuery.error instanceof Error
                ? membersQuery.error.message
                : t('common.errors.generic')
            }
            onRetry={() => void membersQuery.reload()}
          />
        ) : null}

        {/* Summary KPIs — Dashboard StatCard dense */}
        <Grid container spacing={1.5}>
          <Grid size={{ xs: 6, sm: 6, md: 3 }}>
            <StatCard
              dense
              tone="success"
              label={t('membership.kpi.total')}
              value={kpi.total}
              hint={t('membership.kpi.totalHint')}
              selected={kpiFocus === 'total'}
              onClick={() => applyKpiFocus('total')}
              icon={
                <IconBadge tone="success">
                  <Users />
                </IconBadge>
              }
            />
          </Grid>
          <Grid size={{ xs: 6, sm: 6, md: 3 }}>
            <StatCard
              dense
              tone="info"
              label={t('membership.kpi.active')}
              value={kpi.active}
              hint={t('membership.kpi.activeHint')}
              selected={kpiFocus === 'active'}
              onClick={() => applyKpiFocus('active')}
              icon={
                <IconBadge tone="info">
                  <UserCheck />
                </IconBadge>
              }
            />
          </Grid>
          <Grid size={{ xs: 6, sm: 6, md: 3 }}>
            <StatCard
              dense
              tone="warning"
              label={t('membership.kpi.pending')}
              value={kpi.pending}
              hint={t('membership.kpi.pendingHint')}
              selected={kpiFocus === 'pending'}
              icon={
                <IconBadge tone="warning">
                  <Mail />
                </IconBadge>
              }
              onClick={() => applyKpiFocus('pending')}
            />
          </Grid>
          <Grid size={{ xs: 6, sm: 6, md: 3 }}>
            <StatCard
              dense
              tone="purple"
              label={t('membership.kpi.joinedThisMonth')}
              value={kpi.joinedThisMonth}
              hint={t('membership.kpi.joinedThisMonthHint')}
              selected={kpiFocus === 'joinedThisMonth'}
              onClick={() => applyKpiFocus('joinedThisMonth')}
              icon={
                <IconBadge tone="purple">
                  <CalendarPlus />
                </IconBadge>
              }
            />
          </Grid>
          {canSeeDues ? (
            <Grid size={{ xs: 12 }}>
              <StatCard
                dense
                tone="warning"
                label={t('membership.dues.summary', { defaultValue: 'Pending Payments' })}
                value={
                  duesSummary.loading
                    ? '…'
                    : duesSummary.summary?.financial.pending != null
                      ? formatDuesAmount(
                          duesSummary.summary.financial.pending,
                          duesSummary.summary.financial.currencyCode,
                        )
                      : '—'
                }
                hint={
                  duesSummary.error
                    ? t('membership.dues.loadFailed', {
                        defaultValue: 'Payment totals could not be loaded.',
                      })
                    : t('membership.dues.summaryHint', {
                        defaultValue: 'Outstanding this month',
                      })
                }
                selected={kpiFocus === 'pendingPayments'}
                onClick={() => applyKpiFocus('pendingPayments')}
                icon={
                  <IconBadge tone="warning">
                    <IndianRupee />
                  </IconBadge>
                }
              />
            </Grid>
          ) : null}
        </Grid>

        <Tabs
          value={listTab}
          onChange={(_, value: ListTab) => {
            setListTab(value);
            setPage(0);
            setKpiFocus(value === 'pending' ? 'pending' : kpiFocus === 'pending' ? null : kpiFocus);
          }}
          aria-label={t('membership.tabs.members')}
          sx={{
            minHeight: DASHBOARD_UX.buttonHeight,
            borderBottom: `1px solid ${s.border}`,
            '& .MuiTab-root': {
              minHeight: DASHBOARD_UX.buttonHeight,
              ...DASHBOARD_UX.button,
              textTransform: 'none',
              color: s.textMuted,
            },
            '& .Mui-selected': {
              color: `${colors.primaryDark} !important`,
            },
            '& .MuiTabs-indicator': {
              bgcolor: colors.primaryDark,
              height: 2,
            },
          }}
        >
          <Tab
            value="members"
            label={`${t('membership.tabs.members')} (${filteredMembers.length})`}
          />
          <Tab
            value="pending"
            label={`${t('membership.tabs.pending')} (${filteredInvites.length})`}
          />
        </Tabs>

        {listTab === 'members' ? (
          <DataTable
            columns={memberColumns}
            rows={memberRows}
            loading={membersQuery.loading}
            searchValue={search}
            onSearchChange={(value) => {
              setPage(0);
              setSearch(value);
            }}
            searchPlaceholder={t('list.search.members', {
              defaultValue: 'Search by name or mobile',
            })}
            toolbarFilters={filterBar}
            page={page}
            pageSize={pageSize}
            totalItems={filteredMembers.length}
            onPageChange={setPage}
            onRowClick={(row) => openMember(row.memberId)}
            emptyTitle={t('membership.members.emptyTitle')}
            emptyDescription={t('membership.members.emptyDescription')}
            toolbarActions={toolbarActions}
          />
        ) : (
          <DataTable
            columns={inviteColumns}
            rows={inviteRows}
            loading={invitationsQuery.loading}
            searchValue={search}
            onSearchChange={(value) => {
              setPage(0);
              setSearch(value);
            }}
            searchPlaceholder={t('list.search.members', {
              defaultValue: 'Search by name or mobile',
            })}
            toolbarFilters={
              <FormControl size="small" sx={filterControlSx}>
                <InputLabel id="invite-role-filter">{t('membership.roles.label')}</InputLabel>
                <Select
                  labelId="invite-role-filter"
                  label={t('membership.roles.label')}
                  multiple
                  value={filters.roles}
                  onChange={(e) => {
                    setFilters((prev) => ({
                      ...prev,
                      roles: e.target.value as MembershipRole[],
                    }));
                  }}
                  renderValue={(selected) =>
                    selected.length === 0
                      ? t('membership.workspace.allRoles')
                      : selected.join(', ')
                  }
                >
                  {rolesForSpace(spaceType).map((role) => (
                    <MenuItem key={role} value={role}>
                      <Checkbox checked={filters.roles.includes(role)} size="small" />
                      {role}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            }
            emptyTitle={t('membership.pending.emptyTitle')}
            emptyDescription={t('membership.pending.emptyDescription')}
            toolbarActions={toolbarActions}
          />
        )}
      </Stack>

      {/* Member detail — drawer only (no empty right panel) */}
      <AppDrawer
        open={inspectorOpen}
        onClose={() => navigate(spaceMembersPath(spaceId))}
        width={420}
      >
        {memberId ? (
          <MemberInspector
            spaceId={spaceId}
            memberId={memberId}
            initialTab={searchParams.get('tab') === 'payments' ? 'payments' : 'profile'}
            onClose={() => navigate(spaceMembersPath(spaceId))}
            onEdit={() => {
              setEditTarget(selectedDetails.member ?? null);
              setFormMode('edit');
            }}
            onInvite={() => {
              setInvitePrefill({
                mobile: selectedDetails.member?.mobileNumber,
                role:
                  selectedDetails.member?.role !== 'OWNER'
                    ? selectedDetails.member?.role
                    : undefined,
                name: selectedDetails.member?.fullName,
              });
              setInviteOpen(true);
            }}
          />
        ) : null}
      </AppDrawer>

      <AddPersonChoiceDialog
        open={choiceOpen || deepLinkChoice}
        noun={addPersonNoun(spaceType)}
        importableCount={importPreview.data ? importablePreviewCount : importableCount}
        onAddNew={chooseAddNew}
        onImportFromAnotherSpace={chooseImport}
        onClose={closeChoice}
      />

      <MemberFormDrawer
        open={formMode != null || deepLinkForm}
        mode={formMode === 'edit' ? 'edit' : 'create'}
        spaceId={spaceId}
        spaceType={spaceType}
        initialPickerMode={createPickerMode}
        member={
          formMode === 'edit' ? (editTarget ?? selectedDetails.member ?? null) : null
        }
        onClose={() => {
          setFormMode(null);
          setEditTarget(null);
          clearChoiceQuery();
        }}
        onInvite={() => {
          setFormMode(null);
          setEditTarget(null);
          clearChoiceQuery();
          setInvitePrefill({});
          setInviteOpen(true);
        }}
      />

      <InviteMemberDialog
        open={inviteOpen}
        spaceId={spaceId}
        spaceType={spaceType}
        initialMobile={invitePrefill.mobile}
        initialRole={invitePrefill.role}
        memberName={invitePrefill.name}
        onClose={() => setInviteOpen(false)}
      />

      <ConfirmDialog
        open={Boolean(cancelInviteId)}
        title={t('membership.cancel.title')}
        description={t('membership.cancel.message')}
        confirmLabel={t('membership.cancel.confirm')}
        cancelLabel={t('common.close')}
        destructive
        confirming={cancelInvitation.isPending}
        onConfirm={() => {
          if (!cancelInviteId) {
            return;
          }
          void cancelInvitation
            .mutateAsync(cancelInviteId)
            .then(() => {
              enqueueSnackbar(t('membership.invite.pending'), { variant: 'info' });
              setCancelInviteId(null);
            })
            .catch((err: unknown) => {
              enqueueSnackbar(err instanceof Error ? err.message : t('common.errors.generic'), {
                variant: 'error',
              });
            });
        }}
        onClose={() => setCancelInviteId(null)}
      />
    </PageContainer>
  );
}

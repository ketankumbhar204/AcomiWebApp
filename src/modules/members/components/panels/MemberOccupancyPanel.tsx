import { Stack, Typography, useTheme } from '@mui/material';
import { useSnackbar } from 'notistack';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { ExtendStayDialog } from '@/modules/accommodation/components/ExtendStayDialog';
import { ReviseOpenEndedRentDialog } from '@/modules/accommodation/components/ReviseOpenEndedRentDialog';
import { OccupancyActionButtons } from '@/modules/accommodation/components/OccupancyActionButtons';
import { useReservationCancellationDialog } from '@/modules/accommodation/hooks/useReservationCancellationDialog';
import { defaultMonthlyRenewalEndDate } from '@/modules/accommodation/utils/extendStay';
import { resolveOccupancyStayKind, type StayKind } from '@/modules/accommodation/utils/stayFinancialDisplay';
import {
  stayTypeDefaultLabel,
  stayTypeLabelKey,
} from '@/shared/utils/stayTypeDisplay';
import { DASHBOARD_UX, dashSurfaces } from '@/modules/dashboard/theme/dashboardUx';
import { DataTable, type DataTableColumn } from '@/shared/components/DataTable';
import { EmptyState } from '@/shared/components/EmptyState';
import { ErrorState } from '@/shared/components/ErrorState';
import { LoadingState } from '@/shared/components/LoadingState';
import { PageSection } from '@/shared/components/PageSection';
import { useSpacePermissions } from '@/shared/hooks/useSpacePermissions';
import { colors } from '@/shared/theme/colors';
import type { CurrentOccupancySummary } from '@/shared/types/member';
import { spaceOccupancyWizardPath } from '@/routes/paths';
import { MemberCurrentStayCard } from '../MemberCurrentStayCard';
import { useMemberOccupancies } from '../../hooks/useMemberDetailData';
import { hasStayContent, labeledStayLocation, readStayRecord } from '../../utils/memberStayDisplay';

type MemberOccupancyPanelProps = {
  spaceId: string;
  memberId: string;
  mode: 'current' | 'history';
  amenities?: { code: string; label: string }[] | null;
  onViewHistory?: () => void;
};

export function MemberOccupancyPanel({
  spaceId,
  memberId,
  mode,
  amenities,
  onViewHistory,
}: MemberOccupancyPanelProps) {
  const { t } = useTranslation();
  const theme = useTheme();
  const s = dashSurfaces(theme.palette.mode);
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const permissions = useSpacePermissions(spaceId);
  const [extendSession, setExtendSession] = useState<{
    occupancyId: string;
    variant: 'extend' | 'renewal';
    stayKind?: StayKind;
    initialExpectedExitDate?: string;
  } | null>(null);
  const [reviseSession, setReviseSession] = useState<{
    occupancyId: string;
    currentDailyRent?: number | null;
  } | null>(null);
  const { data, loading, error, reload } = useMemberOccupancies(spaceId, memberId);
  const { openCancelReservation, cancellationDialog } = useReservationCancellationDialog(
    spaceId,
    () => void reload(),
  );

  if (loading && !data) {
    return <LoadingState />;
  }

  if (error) {
    return (
      <ErrorState
        title={t('common.errors.generic')}
        message={error instanceof Error ? error.message : t('common.errors.generic')}
        onRetry={() => void reload()}
      />
    );
  }

  if (mode === 'current') {
    const activeSummary = (data?.currentOccupancy ?? null) as CurrentOccupancySummary | null;
    const reservedSummary = (data?.reservedOccupancy ?? null) as CurrentOccupancySummary | null;
    const currentStay = readStayRecord(data?.currentOccupancy ?? null);
    const reservedStay = hasStayContent(currentStay)
      ? null
      : readStayRecord(data?.reservedOccupancy ?? null);
    const stay = hasStayContent(currentStay)
      ? currentStay
      : hasStayContent(reservedStay)
        ? reservedStay
        : null;
    const isReservedStay =
      stay?.status === 'RESERVED' || stay?.occupancyStatus === 'RESERVED';
    // Prefer ACTIVE occupancy; otherwise the reserved row (backend keeps them separate).
    const actionOccupancy = isReservedStay
      ? reservedSummary ?? activeSummary
      : activeSummary ?? reservedSummary;

    if (!stay) {
      return (
        <Stack spacing={1.5}>
          <EmptyState
            title={t('occupancy.section.noStayTitle')}
            description={t('occupancy.section.noStayBody')}
          />
          {permissions.canManageOccupancy ? (
            <OccupancyActionButtons
              status="AVAILABLE"
              memberId={memberId}
              onAllocate={() =>
                navigate(
                  spaceOccupancyWizardPath(spaceId, 'ALLOCATE', {
                    memberId,
                  }),
                )
              }
              onReserve={() =>
                navigate(
                  spaceOccupancyWizardPath(spaceId, 'RESERVE', {
                    memberId,
                  }),
                )
              }
            />
          ) : null}
          {onViewHistory ? (
            <Typography
              component="button"
              onClick={onViewHistory}
              sx={{
                ...DASHBOARD_UX.button,
                color: colors.primaryDark,
                background: 'none',
                border: 0,
                textAlign: 'left',
                cursor: 'pointer',
                p: 0,
              }}
            >
              {t('occupancy.actions.viewHistoryShort')}
            </Typography>
          ) : null}
        </Stack>
      );
    }

    return (
      <>
      <Stack spacing={1.5}>
        <MemberCurrentStayCard
          stay={stay}
          reserved={isReservedStay}
          amenities={amenities}
          onViewHistory={onViewHistory}
        />
        {permissions.canManageOccupancy &&
        (actionOccupancy?.occupancyId || isReservedStay) ? (
          <OccupancyActionButtons
            status={isReservedStay ? 'RESERVED' : 'OCCUPIED'}
            occupancyId={actionOccupancy?.occupancyId}
            memberId={memberId}
            stayKind={resolveOccupancyStayKind(stay)}
            onMoveIn={
              isReservedStay
                ? () => {
                    if (!actionOccupancy?.occupancyId) {
                      enqueueSnackbar(t('occupancy.errors.noReserved'), {
                        variant: 'error',
                      });
                      return;
                    }
                    navigate(
                      spaceOccupancyWizardPath(spaceId, 'MOVE_IN', {
                        occupancyId: actionOccupancy.occupancyId,
                        memberId,
                        bedId: actionOccupancy.bedId ?? undefined,
                        roomId: actionOccupancy.roomId ?? undefined,
                        unitId: actionOccupancy.unitId ?? undefined,
                        buildingId: actionOccupancy.buildingId,
                      }),
                    );
                  }
                : undefined
            }
            onCancel={
              isReservedStay && actionOccupancy?.occupancyId
                ? () => openCancelReservation(actionOccupancy.occupancyId)
                : undefined
            }
            onTransfer={
              isReservedStay
                ? undefined
                : () =>
                    navigate(
                      spaceOccupancyWizardPath(spaceId, 'TRANSFER', {
                        occupancyId: actionOccupancy?.occupancyId ?? undefined,
                        memberId,
                        bedId: actionOccupancy?.bedId ?? undefined,
                        roomId: actionOccupancy?.roomId ?? undefined,
                        unitId: actionOccupancy?.unitId ?? undefined,
                        buildingId: actionOccupancy?.buildingId,
                      }),
                    )
            }
            onExtend={
              isReservedStay
                ? undefined
                : () =>
                    actionOccupancy?.occupancyId
                      ? setExtendSession({
                          occupancyId: actionOccupancy.occupancyId,
                          variant: 'extend',
                          stayKind: resolveOccupancyStayKind(stay),
                        })
                      : undefined
            }
            onReviseOpenEnded={
              isReservedStay
                ? undefined
                : () =>
                    actionOccupancy?.occupancyId
                      ? setReviseSession({
                          occupancyId: actionOccupancy.occupancyId,
                          currentDailyRent:
                            typeof stay?.rentSnapshot === 'number' ? stay.rentSnapshot : null,
                        })
                      : undefined
            }
            onRenewMonthly={
              isReservedStay ||
              stay?.stayKind === 'SHORT' ||
              resolveOccupancyStayKind(stay) === 'OPEN_ENDED'
                ? undefined
                : () =>
                    actionOccupancy?.occupancyId
                      ? setExtendSession({
                          occupancyId: actionOccupancy.occupancyId,
                          variant: 'renewal',
                          stayKind: resolveOccupancyStayKind(stay),
                          initialExpectedExitDate: defaultMonthlyRenewalEndDate(
                            stay?.expectedExitDate,
                          ),
                        })
                      : undefined
            }
            onVacate={
              isReservedStay
                ? undefined
                : () =>
                    navigate(
                      spaceOccupancyWizardPath(spaceId, 'VACATE', {
                        occupancyId: actionOccupancy?.occupancyId ?? undefined,
                        memberId,
                        bedId: actionOccupancy?.bedId ?? undefined,
                        roomId: actionOccupancy?.roomId ?? undefined,
                        unitId: actionOccupancy?.unitId ?? undefined,
                        buildingId: actionOccupancy?.buildingId,
                      }),
                    )
            }
            onViewHistory={onViewHistory}
          />
        ) : null}
      </Stack>
      <ExtendStayDialog
        open={extendSession != null}
        spaceId={spaceId}
        occupancyId={extendSession?.occupancyId ?? null}
        variant={extendSession?.variant ?? 'extend'}
        stayKind={extendSession?.stayKind}
        initialExpectedExitDate={extendSession?.initialExpectedExitDate ?? ''}
        onClose={() => setExtendSession(null)}
      />
      <ReviseOpenEndedRentDialog
        open={reviseSession != null}
        spaceId={spaceId}
        occupancyId={reviseSession?.occupancyId ?? null}
        currentDailyRent={reviseSession?.currentDailyRent}
        onClose={() => setReviseSession(null)}
      />
      {cancellationDialog}
      </>
    );
  }

  const rows =
    data?.occupancies.map((row) => ({
      ...row,
      id: row.occupancyId,
    })) ?? [];

  const columns: DataTableColumn<(typeof rows)[number]>[] = [
    {
      id: 'location',
      header: t('membership.workspace.location'),
      accessor: (row) =>
        labeledStayLocation(row, (key) => t(key)) || '—',
      primary: true,
    },
    {
      id: 'stayType',
      header: t('occupancyWizard.steps.stayType', { defaultValue: 'Stay type' }),
      accessor: (row) => {
        if (row.stayKind === 'MONTHLY' || row.stayKind === 'SHORT' || row.stayKind === 'OPEN_ENDED') {
          return t(stayTypeLabelKey(row.stayKind), {
            defaultValue: stayTypeDefaultLabel(row.stayKind),
          });
        }
        return '—';
      },
    },
    {
      id: 'status',
      header: t('dashboard.drilldown.columns.status'),
      accessor: (row) => row.status,
    },
    {
      id: 'moveIn',
      header: t('dashboard.drilldown.columns.moveIn'),
      accessor: (row) => row.moveInDate ?? '—',
      primary: true,
    },
    {
      id: 'vacated',
      header: t('membership.workspace.vacated'),
      accessor: (row) => row.vacatedAt?.slice(0, 10) ?? '—',
    },
  ];

  const historyRows =
    data?.history.map((entry) => ({
      ...entry,
      id: entry.historyId,
    })) ?? [];

  const historyColumns: DataTableColumn<(typeof historyRows)[number]>[] = [
    {
      id: 'event',
      header: t('membership.workspace.event'),
      accessor: (row) => row.eventType,
      primary: true,
    },
    {
      id: 'when',
      header: t('membership.details.created'),
      accessor: (row) => new Date(row.performedAt).toLocaleString(),
      primary: true,
    },
    {
      id: 'remarks',
      header: t('membership.workspace.remarks'),
      accessor: (row) => row.remarks ?? '—',
    },
  ];

  return (
    <Stack spacing={2}>
      <PageSection title={t('membership.workspace.occupancyHistory')}>
        <DataTable
          columns={columns}
          rows={rows}
          emptyTitle={t('membership.workspace.noOccupancy')}
          emptyDescription={t('membership.workspace.noOccupancyBody')}
        />
      </PageSection>
      <PageSection title={t('membership.workspace.occupancyEvents')}>
        {historyRows.length === 0 ? (
          <Typography sx={{ ...DASHBOARD_UX.body, color: s.textMuted }}>
            {t('membership.workspace.noOccupancyEvents')}
          </Typography>
        ) : (
          <DataTable columns={historyColumns} rows={historyRows} />
        )}
      </PageSection>
    </Stack>
  );
}

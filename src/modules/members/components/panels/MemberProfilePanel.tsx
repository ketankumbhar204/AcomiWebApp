import { Button, Stack, Typography, useTheme } from '@mui/material';
import { FileText, MapPin, Phone, ShieldCheck, StickyNote, UserRound, Wallet } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { DASHBOARD_UX, dashSurfaces } from '@/modules/dashboard/theme/dashboardUx';
import { ErrorState } from '@/shared/components/ErrorState';
import { InfoRow } from '@/shared/components/InfoRow';
import { LoadingState } from '@/shared/components/LoadingState';
import { dashOutlinedButtonSx } from '@/shared/theme/dashButtonSx';
import type { MemberDetailsResponse } from '@/shared/types/member';
import { useSpacePermissions } from '@/shared/hooks/useSpacePermissions';
import { useMemberOccupancies } from '../../hooks/useMemberDetailData';
import { membershipRoleLabelKey } from '../../utils/memberRoles';
import { memberGenderLabelKey } from '../../utils/memberGender';
import { hasStayContent, readStayRecord } from '../../utils/memberStayDisplay';
import { resolveMemberEffectiveMealBilling } from '../../utils/memberValidation';
import { MemberCurrentStayCard } from '../MemberCurrentStayCard';
import { MemberDepositSection } from '../MemberDepositSection';
import { MemberDocumentsSection } from '../MemberDocumentsSection';
import { MemberEmergencyContactDialog } from '../MemberEmergencyContactDialog';
import { MemberNotesSection } from '../MemberNotesSection';
import { ProfileDisclosure } from '../ProfileDisclosure';
import { MemberStatusDialog } from '../MemberStatusDialog';

type MemberProfilePanelProps = {
  member: MemberDetailsResponse;
  spaceId: string;
  canEdit: boolean;
  onViewHistory?: () => void;
};

function formatDate(value: string | null | undefined, missing: string): string {
  if (!value) {
    return missing;
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return date.toLocaleString();
}

export function MemberProfilePanel({
  member,
  spaceId,
  canEdit,
  onViewHistory,
}: MemberProfilePanelProps) {
  const { t } = useTranslation();
  const permissions = useSpacePermissions(spaceId);
  const theme = useTheme();
  const s = dashSurfaces(theme.palette.mode);
  const billing = resolveMemberEffectiveMealBilling(member);
  const occupancy = useMemberOccupancies(spaceId, member.memberId);
  const [statusOpen, setStatusOpen] = useState(false);
  const [emergencyOpen, setEmergencyOpen] = useState(false);
  const missing = t('membership.details.notProvided');

  const currentStay = readStayRecord(occupancy.data?.currentOccupancy ?? null);
  const reservedStay = hasStayContent(currentStay)
    ? null
    : readStayRecord(occupancy.data?.reservedOccupancy ?? null);
  const stay = hasStayContent(currentStay) ? currentStay : hasStayContent(reservedStay) ? reservedStay : null;
  const profile = member.linkedUserProfile;
  const display = (value?: string | null) => {
    const trimmed = value?.trim();
    return trimmed ? trimmed : missing;
  };

  return (
    <Stack spacing={1.5}>
      {occupancy.loading && !occupancy.data ? <LoadingState minHeight={96} /> : null}
      {occupancy.error ? (
        <ErrorState
          title={t('common.errors.generic')}
          message={
            occupancy.error instanceof Error
              ? occupancy.error.message
              : t('common.errors.generic')
          }
          onRetry={() => void occupancy.reload()}
        />
      ) : null}
      {!occupancy.loading && !occupancy.error && stay ? (
        <MemberCurrentStayCard
          stay={stay}
          reserved={stay?.status === 'RESERVED' || stay?.occupancyStatus === 'RESERVED'}
          amenities={member.assignedAmenities}
          onViewHistory={onViewHistory}
        />
      ) : null}
      {!occupancy.loading && !occupancy.error && !stay ? (
        <Stack spacing={0.5}>
          <Typography sx={{ ...DASHBOARD_UX.sectionHeading, color: s.textPrimary }}>
            {t('occupancy.section.noStayTitle')}
          </Typography>
          <Typography sx={{ ...DASHBOARD_UX.body, color: s.textMuted }}>
            {t('occupancy.section.noStayBody')}
          </Typography>
        </Stack>
      ) : null}

      <ProfileDisclosure
        title={t('settings.profile.personalSection')}
        icon={UserRound}
        defaultOpen
      >
        <InfoRow label={t('settings.profile.fullNameLabel')} value={display(profile?.fullName ?? member.fullName)} />
        <InfoRow
          label={t('membership.details.mobile')}
          value={display(profile?.mobileNumber ?? member.mobileNumber)}
        />
        <InfoRow label={t('settings.profile.emailLabel')} value={display(profile?.email)} />
        <InfoRow
          label={t('membership.details.gender')}
          value={
            (profile?.gender ?? member.gender)
              ? t(memberGenderLabelKey((profile?.gender ?? member.gender)!))
              : t('membership.gender.unspecified')
          }
        />
        <InfoRow
          label={t('settings.profile.dateOfBirthLabel')}
          value={formatDate(profile?.dateOfBirth, missing)}
        />
        <InfoRow
          label={t('membership.details.role')}
          value={t(membershipRoleLabelKey(member.role, permissions.space?.spaceType))}
        />
      </ProfileDisclosure>

      <ProfileDisclosure title={t('settings.profile.addressSection')} icon={MapPin}>
        <InfoRow
          label={t('settings.profile.permanentAddressLabel')}
          value={display(profile?.permanentAddress)}
        />
        <InfoRow label={t('settings.profile.cityLabel')} value={display(profile?.city)} />
        <InfoRow label={t('settings.profile.stateLabel')} value={display(profile?.state)} />
        <InfoRow label={t('settings.profile.pincodeLabel')} value={display(profile?.pincode)} />
      </ProfileDisclosure>

      <ProfileDisclosure
        title={t('membership.emergency.title')}
        icon={Phone}
        actions={
          canEdit ? (
            <Button size="small" onClick={() => setEmergencyOpen(true)} sx={dashOutlinedButtonSx}>
              {t('membership.emergency.edit')}
            </Button>
          ) : null
        }
      >
        <InfoRow
          label={t('membership.emergency.name')}
          value={member.emergencyContactName ?? missing}
        />
        <InfoRow
          label={t('membership.emergency.relation')}
          value={member.emergencyContactRelation ?? missing}
        />
        <InfoRow
          label={t('membership.emergency.mobile')}
          value={member.emergencyContactMobile ?? missing}
        />
      </ProfileDisclosure>

      <ProfileDisclosure title={t('settings.profile.kycSection')} icon={ShieldCheck}>
        <InfoRow
          label={t('membership.details.appStatus')}
          value={
            member.linkedUser
              ? t('membership.members.onAcomi')
              : t('membership.members.notOnAcomiYet')
          }
        />
        <InfoRow
          label={t('settings.profile.profileStatusLabel')}
          value={
            profile?.profileStatus
              ? t(`settings.profile.profileStatus.${profile.profileStatus}`)
              : missing
          }
        />
        <InfoRow
          label={t('settings.profile.kycStatusLabel')}
          value={
            profile?.kycStatus ? t(`settings.profile.kycStatus.${profile.kycStatus}`) : missing
          }
        />
        <InfoRow
          label={t('settings.profile.documentsUploadedLabel')}
          value={profile ? String(profile.documentsUploaded ?? 0) : missing}
        />
        <InfoRow
          label={t('settings.profile.profileCompletedAtLabel')}
          value={formatDate(profile?.profileCompletedAt, missing)}
        />
        <InfoRow
          label={t('membership.status.label')}
          value={t(`membership.status.${member.status}`)}
        />
        <InfoRow
          label={t('membership.status.updatedAt')}
          value={formatDate(member.statusUpdatedAt, missing)}
        />
        <InfoRow
          label={t('membership.details.mealBilling')}
          value={t(`spaces.mealBilling.types.${billing}.label`, { defaultValue: billing })}
        />
        <InfoRow
          label={t('membership.details.created')}
          value={formatDate(member.createdAt, missing)}
        />
        <InfoRow
          label={t('membership.details.updated')}
          value={formatDate(member.updatedAt, missing)}
        />
      </ProfileDisclosure>

      <ProfileDisclosure title={t('membership.detailTabs.deposit')} icon={Wallet}>
        <MemberDepositSection spaceId={spaceId} member={member} canEdit={canEdit} embedded />
      </ProfileDisclosure>

      <ProfileDisclosure title={t('membership.detailTabs.documents')} icon={FileText}>
        <MemberDocumentsSection
          spaceId={spaceId}
          memberId={member.memberId}
          canEdit={canEdit}
          embedded
        />
      </ProfileDisclosure>

      <ProfileDisclosure title={t('membership.detailTabs.notes')} icon={StickyNote}>
        <MemberNotesSection spaceId={spaceId} memberId={member.memberId} embedded />
      </ProfileDisclosure>

      {canEdit ? (
        <Stack spacing={1}>
          <Typography sx={{ ...DASHBOARD_UX.sectionHeading, color: s.textPrimary }}>
            {t('membership.details.actionsHeading')}
          </Typography>
          <Button onClick={() => setStatusOpen(true)} sx={{ ...dashOutlinedButtonSx, alignSelf: 'flex-start' }}>
            {t('membership.status.change')}
          </Button>
        </Stack>
      ) : null}

      <MemberStatusDialog
        open={statusOpen}
        spaceId={spaceId}
        memberId={member.memberId}
        currentStatus={member.status}
        onClose={() => setStatusOpen(false)}
      />

      <MemberEmergencyContactDialog
        open={emergencyOpen}
        spaceId={spaceId}
        member={member}
        onClose={() => setEmergencyOpen(false)}
      />
    </Stack>
  );
}

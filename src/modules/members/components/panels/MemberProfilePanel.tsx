import { Button, Stack, Typography, useTheme } from '@mui/material';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { DASHBOARD_UX, dashSurfaces } from '@/modules/dashboard/theme/dashboardUx';
import { InfoRow } from '@/shared/components/InfoRow';
import { PageSection } from '@/shared/components/PageSection';
import { dashOutlinedButtonSx } from '@/shared/theme/dashButtonSx';
import type { MemberDetailsResponse } from '@/shared/types/member';
import { memberGenderLabelKey } from '../../utils/memberGender';
import { resolveMemberEffectiveMealBilling } from '../../utils/memberValidation';
import { MemberDepositSection } from '../MemberDepositSection';
import { MemberDocumentsSection } from '../MemberDocumentsSection';
import { MemberEmergencyContactDialog } from '../MemberEmergencyContactDialog';
import { MemberNotesSection } from '../MemberNotesSection';
import { MemberStatusDialog } from '../MemberStatusDialog';

type MemberProfilePanelProps = {
  member: MemberDetailsResponse;
  spaceId: string;
  canEdit: boolean;
};

function formatDate(value: string | null | undefined): string {
  if (!value) {
    return '—';
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return date.toLocaleString();
}

export function MemberProfilePanel({ member, spaceId, canEdit }: MemberProfilePanelProps) {
  const { t } = useTranslation();
  const theme = useTheme();
  const s = dashSurfaces(theme.palette.mode);
  const billing = resolveMemberEffectiveMealBilling(member);
  const [statusOpen, setStatusOpen] = useState(false);
  const [emergencyOpen, setEmergencyOpen] = useState(false);

  const hasEmergency =
    Boolean(member.emergencyContactName) ||
    Boolean(member.emergencyContactRelation) ||
    Boolean(member.emergencyContactMobile);

  return (
    <Stack spacing={2}>
      <PageSection
        title={t('membership.workspace.personalInfo')}
        actions={
          canEdit ? (
            <Button size="small" onClick={() => setStatusOpen(true)} sx={dashOutlinedButtonSx}>
              {t('membership.status.change')}
            </Button>
          ) : null
        }
      >
        <InfoRow label={t('membership.details.mobile')} value={member.mobileNumber} />
        <InfoRow
          label={t('membership.details.gender')}
          value={
            member.gender
              ? t(memberGenderLabelKey(member.gender))
              : t('membership.gender.unspecified')
          }
        />
        <InfoRow label={t('membership.details.role')} value={member.role} />
        <InfoRow
          label={t('membership.status.label')}
          value={t(`membership.status.${member.status}`)}
        />
        <InfoRow
          label={t('membership.status.updatedAt')}
          value={formatDate(member.statusUpdatedAt)}
        />
        <InfoRow
          label={t('membership.details.mealBilling')}
          value={t(`spaces.mealBilling.types.${billing}.label`, {
            defaultValue: billing,
          })}
        />
        <InfoRow
          label={t('membership.details.created')}
          value={formatDate(member.createdAt)}
        />
      </PageSection>

      <PageSection
        title={t('membership.emergency.title')}
        actions={
          canEdit ? (
            <Button size="small" onClick={() => setEmergencyOpen(true)} sx={dashOutlinedButtonSx}>
              {t('membership.emergency.edit')}
            </Button>
          ) : null
        }
      >
        {hasEmergency ? (
          <>
            <InfoRow
              label={t('membership.emergency.name')}
              value={member.emergencyContactName ?? '—'}
            />
            <InfoRow
              label={t('membership.emergency.relation')}
              value={member.emergencyContactRelation ?? '—'}
            />
            <InfoRow
              label={t('membership.emergency.mobile')}
              value={member.emergencyContactMobile ?? '—'}
            />
          </>
        ) : (
          <Typography sx={{ ...DASHBOARD_UX.body, color: s.textMuted }}>
            {t('membership.emergency.empty')}
          </Typography>
        )}
      </PageSection>

      <MemberDepositSection spaceId={spaceId} member={member} canEdit={canEdit} />

      <MemberDocumentsSection
        spaceId={spaceId}
        memberId={member.memberId}
        canEdit={canEdit}
      />

      <MemberNotesSection spaceId={spaceId} memberId={member.memberId} />

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

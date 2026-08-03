import {
  Box,
  CircularProgress,
  Stack,
  TextField,
  Typography,
  useTheme,
} from '@mui/material';
import { Search } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { DASHBOARD_UX, dashSurfaces } from '@/modules/dashboard/theme/dashboardUx';
import { colors } from '@/shared/theme/colors';
import type { ResidentPickerItem } from '../../hooks/useResidentImportSearch';

export type MemberPickerMode = 'search' | 'new';

type MemberCustomerReusePickerProps = {
  query: string;
  onQueryChange: (value: string) => void;
  members: ResidentPickerItem[];
  loading: boolean;
  pickerMode: MemberPickerMode;
  onPickerModeChange: (mode: MemberPickerMode) => void;
  selectedMemberId?: string;
  onSelect: (member: ResidentPickerItem) => void;
  newMemberName: string;
  newMemberMobile: string;
  onNewMemberNameChange: (value: string) => void;
  onNewMemberMobileChange: (value: string) => void;
  newMemberErrors?: { fullName?: string; mobileNumber?: string };
  disabled?: boolean;
};

/** Mess customer reuse — search existing / create new (mobile MemberPickerStep). */
export function MemberCustomerReusePicker({
  query,
  onQueryChange,
  members,
  loading,
  pickerMode,
  onPickerModeChange,
  selectedMemberId,
  onSelect,
  newMemberName,
  newMemberMobile,
  onNewMemberNameChange,
  onNewMemberMobileChange,
  newMemberErrors,
  disabled,
}: MemberCustomerReusePickerProps) {
  const { t } = useTranslation();
  const theme = useTheme();
  const s = dashSurfaces(theme.palette.mode);

  return (
    <Box sx={{ mb: 2 }}>
      <Box
        sx={{
          display: 'flex',
          gap: 0.75,
          p: 0.5,
          mb: 1.5,
          borderRadius: `${DASHBOARD_UX.buttonRadius}px`,
          bgcolor: s.elevated,
        }}
      >
        {(
          [
            { key: 'search' as const, label: t('membership.add.memberMode.search') },
            { key: 'addNew' as const, label: t('membership.add.memberMode.addNew') },
          ] as const
        ).map((tab) => {
          const mode: MemberPickerMode = tab.key === 'search' ? 'search' : 'new';
          const active = pickerMode === mode;
          return (
            <Box
              key={tab.key}
              component="button"
              type="button"
              disabled={disabled}
              onClick={() => onPickerModeChange(mode)}
              sx={{
                flex: 1,
                border: 'none',
                cursor: disabled ? 'default' : 'pointer',
                borderRadius: `${DASHBOARD_UX.buttonRadius - 2}px`,
                bgcolor: active ? s.surface : 'transparent',
                color: active ? colors.primaryDark : s.textMuted,
                py: 1,
                px: 1,
                ...DASHBOARD_UX.button,
                boxShadow: active ? s.shadow : 'none',
              }}
            >
              {tab.label}
            </Box>
          );
        })}
      </Box>

      {pickerMode === 'search' ? (
        <Stack spacing={1.25}>
          <TextField
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            placeholder={t('membership.add.searchCustomerPlaceholder')}
            fullWidth
            disabled={disabled}
            slotProps={{
              input: {
                startAdornment: (
                  <Box sx={{ mr: 1, display: 'flex', color: s.textMuted }}>
                    <Search size={16} />
                  </Box>
                ),
              },
            }}
          />
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
              <CircularProgress size={22} />
            </Box>
          ) : members.length === 0 ? (
            <Typography sx={{ ...DASHBOARD_UX.body, color: s.textMuted, py: 1 }}>
              {t('membership.add.noReusableCustomers')}
            </Typography>
          ) : (
            members.map((member) => {
              const selected = selectedMemberId === member.memberId;
              return (
                <Box
                  key={member.memberId}
                  component="button"
                  type="button"
                  disabled={disabled}
                  onClick={() => onSelect(member)}
                  sx={{
                    textAlign: 'left',
                    cursor: disabled ? 'default' : 'pointer',
                    borderRadius: `${DASHBOARD_UX.radius}px`,
                    border: `1px solid ${selected ? colors.primary : s.border}`,
                    bgcolor: selected ? s.successTint : s.surface,
                    p: 1.5,
                    boxShadow: s.shadow,
                  }}
                >
                  <Typography sx={{ ...DASHBOARD_UX.cardTitle, color: s.textPrimary }}>
                    {member.fullName}
                  </Typography>
                  <Typography sx={{ ...DASHBOARD_UX.caption, color: s.textMuted, mt: 0.25 }}>
                    {member.mobileNumber}
                  </Typography>
                  <Typography sx={{ ...DASHBOARD_UX.caption, color: s.textSecondary, mt: 0.25 }}>
                    {member.alreadyInTargetSpace
                      ? t('membership.add.reuseCard.alreadyHere')
                      : member.sourceSpaceName
                        ? t('membership.add.reuseCard.fromSpace', {
                            space: member.sourceSpaceName,
                          })
                        : t('membership.add.reuseCard.available')}
                  </Typography>
                </Box>
              );
            })
          )}
        </Stack>
      ) : (
        <Stack spacing={1.5}>
          <Typography sx={{ ...DASHBOARD_UX.caption, color: s.textMuted }}>
            {t('membership.add.createNewHint')}
          </Typography>
          <TextField
            label={t('membership.add.fullNameLabel')}
            value={newMemberName}
            onChange={(e) => onNewMemberNameChange(e.target.value)}
            error={Boolean(newMemberErrors?.fullName)}
            helperText={newMemberErrors?.fullName}
            placeholder={t('membership.add.fullNamePlaceholder')}
            fullWidth
            required
            disabled={disabled}
          />
          <TextField
            label={t('membership.invite.mobileLabel')}
            value={newMemberMobile}
            onChange={(e) => onNewMemberMobileChange(e.target.value)}
            error={Boolean(newMemberErrors?.mobileNumber)}
            helperText={newMemberErrors?.mobileNumber}
            placeholder={t('membership.invite.mobilePlaceholder', {
              defaultValue: 'e.g. 9876543210',
            })}
            fullWidth
            required
            disabled={disabled}
            slotProps={{ htmlInput: { inputMode: 'numeric', maxLength: 10 } }}
          />
        </Stack>
      )}
    </Box>
  );
}

import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Grid,
  InputAdornment,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import {
  ArrowLeft,
  Building2,
  Calendar,
  Check,
  Crosshair,
  FileText,
  Home,
  IndianRupee,
  Lightbulb,
  Link2,
  Map,
  MapPin,
  Phone,
  Save,
  User,
} from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { adminApi } from '@/modules/admin/api/adminApi';
import { AdminNumberedFormSection } from '@/modules/admin/components/AdminNumberedFormSection';
import { AdminPropertyTypePicker } from '@/modules/admin/components/AdminPropertyTypePicker';
import { AdminSavedAddressPicker } from '@/modules/admin/components/AdminSavedAddressPicker';
import { AdminTestLeadOption } from '@/modules/admin/components/AdminTestLeadOption';
import { IndianMobileTextField } from '@/modules/admin/components/IndianMobileTextField';
import { StickyFooter, StickyFooterClearance } from '@/shared/components/StickyFooter';
import { ROUTES } from '@/routes/paths';
import { isValidIndianMobile, normalizeIndianMobileDigits } from '@/shared/utils/indianMobile';
import type { AdminCreatePropertyRegistrationRequest } from '@/shared/types/admin';
import type { SpaceType } from '@/shared/types/space';

function isValidPincode(value: string): boolean {
  return /^[1-9]\d{5}$/.test(value);
}

function isValidMapUrl(value: string): boolean {
  const trimmed = value.trim();
  return trimmed.startsWith('http://') || trimmed.startsWith('https://');
}

function optionalText(value: string): string | undefined {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

const fieldSx = {
  '& .MuiOutlinedInput-root': { borderRadius: '10px', bgcolor: '#FFFFFF' },
};

export function AdminAddPropertyPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [propertyType, setPropertyType] = useState<Exclude<SpaceType, 'MESS'>>('PG');
  const [propertyName, setPropertyName] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [alternateMobileNumber, setAlternateMobileNumber] = useState('');
  const [addressLine, setAddressLine] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [pincode, setPincode] = useState('');
  const [mapUrl, setMapUrl] = useState('');
  const [startingPrice, setStartingPrice] = useState('');
  const [availableFrom, setAvailableFrom] = useState('');
  const [testLead, setTestLead] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (mobileNumber.trim() && !isValidIndianMobile(mobileNumber)) {
      setError(t('admin.property.errors.mobile'));
      return;
    }
    if (alternateMobileNumber.trim() && !isValidIndianMobile(alternateMobileNumber)) {
      setError(t('admin.property.errors.alternateMobile'));
      return;
    }
    if (
      mobileNumber.trim() &&
      alternateMobileNumber.trim() &&
      normalizeIndianMobileDigits(mobileNumber) === normalizeIndianMobileDigits(alternateMobileNumber)
    ) {
      setError(t('admin.property.errors.alternateDifferent'));
      return;
    }
    if (pincode.trim() && !isValidPincode(pincode.trim())) {
      setError(t('admin.property.errors.pincode'));
      return;
    }
    if (mapUrl.trim() && !isValidMapUrl(mapUrl)) {
      setError(t('admin.property.errors.mapUrl'));
      return;
    }
    let price: number | undefined;
    if (startingPrice.trim()) {
      price = Number(startingPrice);
      if (!Number.isFinite(price) || price < 0) {
        setError(t('admin.property.errors.startingPrice'));
        return;
      }
    }

    const payload: AdminCreatePropertyRegistrationRequest = { propertyType };
    const name = optionalText(propertyName);
    const owner = optionalText(ownerName);
    const mobile = optionalText(mobileNumber);
    const alternateMobile = optionalText(alternateMobileNumber);
    const address = optionalText(addressLine);
    const cityValue = optionalText(city);
    const stateValue = optionalText(state);
    const pincodeValue = optionalText(pincode);
    const map = optionalText(mapUrl);
    if (name) payload.propertyName = name;
    if (owner) payload.ownerName = owner;
    if (mobile) payload.mobileNumber = mobile;
    if (alternateMobile) payload.alternateMobileNumber = alternateMobile;
    if (address) payload.addressLine = address;
    if (cityValue) payload.city = cityValue;
    if (stateValue) payload.state = stateValue;
    if (pincodeValue) payload.pincode = pincodeValue;
    if (map) payload.mapUrl = map;
    if (price !== undefined) payload.startingPrice = price;
    if (testLead) payload.testLead = true;
    if (availableFrom.trim()) {
      payload.description = `Available from: ${availableFrom.trim()}`;
    }

    setLoading(true);
    try {
      await adminApi.createPropertyRegistration(payload);
      navigate(ROUTES.adminProperties);
    } catch {
      setError(t('admin.property.saveFailed'));
    } finally {
      setLoading(false);
    }
  }

  const tips = [
    t('admin.property.tips.item1'),
    t('admin.property.tips.item2'),
    t('admin.property.tips.item3'),
    t('admin.property.tips.item4'),
    t('admin.property.tips.item5'),
  ];

  return (
    <Box component="form" onSubmit={(e) => void handleSubmit(e)} sx={{ pb: 1 }}>
      <Stack
        direction={{ xs: 'column', md: 'row' }}
        spacing={2}
        sx={{ mb: 3, justifyContent: 'space-between', alignItems: { xs: 'stretch', md: 'flex-start' } }}>
        <Box sx={{ minWidth: 0, flex: 1 }}>
          <Button
            component={RouterLink}
            to={ROUTES.adminProperties}
            startIcon={<ArrowLeft size={16} />}
            sx={{
              textTransform: 'none',
              fontWeight: 700,
              color: '#15803D',
              px: 0,
              mb: 1,
              '&:hover': { bgcolor: 'transparent', color: '#166534' },
            }}>
            {t('admin.property.backToList')}
          </Button>
          <Typography sx={{ fontWeight: 800, fontSize: { xs: 26, md: 30 }, letterSpacing: -0.5 }}>
            {t('admin.property.addHeading')}
          </Typography>
          <Typography sx={{ color: 'text.secondary', mt: 0.75, maxWidth: 560 }}>
            {t('admin.property.addSubheading')}
          </Typography>
        </Box>

        <Box
          sx={{
            display: { xs: 'none', md: 'flex' },
            alignItems: 'center',
            gap: 1.5,
            px: 2,
            py: 1.5,
            borderRadius: '14px',
            bgcolor: '#DCFCE7',
            border: '1px solid #BBF7D0',
            minWidth: 260,
            maxWidth: 300,
            flexShrink: 0,
          }}>
          <Box
            sx={{
              width: 48,
              height: 48,
              borderRadius: '12px',
              bgcolor: '#FFFFFF',
              color: '#16A34A',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}>
            <Home size={24} />
          </Box>
          <Typography sx={{ fontWeight: 700, fontSize: 13.5, color: '#14532D', lineHeight: 1.35 }}>
            {t('admin.property.heroHint')}
          </Typography>
        </Box>
      </Stack>

      {error ? (
        <Alert severity="error" sx={{ mb: 2, borderRadius: '12px' }}>
          {error}
        </Alert>
      ) : null}

      <Grid container spacing={2.5} sx={{ alignItems: 'flex-start' }}>
        <Grid size={{ xs: 12, lg: 8 }}>
          <Stack spacing={2}>
            <AdminNumberedFormSection
              step={1}
              title={t('admin.property.detailsTitle')}
              description={t('admin.property.detailsHint')}>
              <Box sx={{ gridColumn: { md: '1 / -1' } }}>
                <AdminPropertyTypePicker value={propertyType} onChange={setPropertyType} />
              </Box>
              <TextField
                label={`${t('admin.property.name')} *`}
                value={propertyName}
                onChange={(e) => setPropertyName(e.target.value)}
                placeholder={t('admin.property.namePlaceholderLong')}
                fullWidth
                size="small"
                sx={{ ...fieldSx, gridColumn: { md: '1 / -1' } }}
                slotProps={{
                  input: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <Home size={16} color="#94A3B8" />
                      </InputAdornment>
                    ),
                  },
                }}
              />
            </AdminNumberedFormSection>

            <AdminNumberedFormSection
              step={2}
              title={t('admin.common.ownerContact')}
              description={t('admin.common.ownerContactHint')}>
              <TextField
                label={t('admin.common.ownerName')}
                value={ownerName}
                onChange={(e) => setOwnerName(e.target.value)}
                fullWidth
                size="small"
                sx={{ ...fieldSx, gridColumn: { md: '1 / -1' } }}
                slotProps={{
                  input: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <User size={16} color="#94A3B8" />
                      </InputAdornment>
                    ),
                  },
                }}
              />
              <IndianMobileTextField
                label={`${t('admin.common.primaryMobile')} *`}
                value={mobileNumber}
                onChange={setMobileNumber}
                placeholder={t('admin.common.primaryMobilePlaceholder')}
                fullWidth
                size="small"
                sx={{ ...fieldSx, gridColumn: { md: '1 / -1' } }}
                startIcon={<Phone size={16} color="#94A3B8" />}
              />
              <IndianMobileTextField
                label={t('admin.common.alternateMobileLabel')}
                value={alternateMobileNumber}
                onChange={setAlternateMobileNumber}
                placeholder={t('admin.common.alternateMobilePlaceholder')}
                helperText={t('admin.property.alternateMobileHint')}
                fullWidth
                size="small"
                sx={{ ...fieldSx, gridColumn: { md: '1 / -1' } }}
                startIcon={<Phone size={16} color="#94A3B8" />}
              />
            </AdminNumberedFormSection>

            <AdminNumberedFormSection
              step={3}
              title={t('admin.common.location')}
              description={t('admin.common.locationHintProperty')}>
              <AdminSavedAddressPicker
                value={{ addressLine, city, state, pincode, mapUrl }}
                onChange={(next) => {
                  setAddressLine(next.addressLine);
                  setCity(next.city);
                  setState(next.state);
                  setPincode(next.pincode);
                  setMapUrl(next.mapUrl);
                }}
              />
              <TextField
                label={`${t('admin.common.addressLine')} *`}
                value={addressLine}
                onChange={(e) => setAddressLine(e.target.value)}
                fullWidth
                size="small"
                sx={{ ...fieldSx, gridColumn: { md: '1 / -1' } }}
                slotProps={{
                  input: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <MapPin size={16} color="#94A3B8" />
                      </InputAdornment>
                    ),
                  },
                }}
              />
              <TextField
                label={t('admin.common.city')}
                value={city}
                onChange={(e) => setCity(e.target.value)}
                fullWidth
                size="small"
                sx={fieldSx}
                slotProps={{
                  input: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <Building2 size={16} color="#94A3B8" />
                      </InputAdornment>
                    ),
                  },
                }}
              />
              <TextField
                label={t('admin.common.state')}
                value={state}
                onChange={(e) => setState(e.target.value)}
                fullWidth
                size="small"
                sx={fieldSx}
                slotProps={{
                  input: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <Map size={16} color="#94A3B8" />
                      </InputAdornment>
                    ),
                  },
                }}
              />
              <TextField
                label={t('admin.common.pincode')}
                value={pincode}
                onChange={(e) => setPincode(e.target.value)}
                fullWidth
                size="small"
                sx={fieldSx}
                slotProps={{
                  htmlInput: { maxLength: 6, inputMode: 'numeric' },
                  input: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <Crosshair size={16} color="#94A3B8" />
                      </InputAdornment>
                    ),
                  },
                }}
              />
              <TextField
                label={t('admin.property.mapLinkOptional')}
                value={mapUrl}
                onChange={(e) => setMapUrl(e.target.value)}
                placeholder={t('admin.common.mapLinkPlaceholder')}
                fullWidth
                size="small"
                sx={{ ...fieldSx, gridColumn: { md: '1 / -1' } }}
                slotProps={{
                  input: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <Link2 size={16} color="#94A3B8" />
                      </InputAdornment>
                    ),
                  },
                }}
              />
            </AdminNumberedFormSection>

            <AdminNumberedFormSection
              step={4}
              title={t('admin.common.pricingOptions')}
              description={t('admin.common.pricingOptionsHint')}>
              <TextField
                label={t('admin.property.expectedRent')}
                value={startingPrice}
                onChange={(e) => setStartingPrice(e.target.value)}
                fullWidth
                size="small"
                sx={fieldSx}
                slotProps={{
                  htmlInput: { inputMode: 'decimal' },
                  input: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <IndianRupee size={16} color="#94A3B8" />
                      </InputAdornment>
                    ),
                  },
                }}
              />
              <TextField
                label={t('admin.property.availableFrom')}
                type="date"
                value={availableFrom}
                onChange={(e) => setAvailableFrom(e.target.value)}
                fullWidth
                size="small"
                sx={fieldSx}
                slotProps={{
                  inputLabel: { shrink: true },
                  input: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <Calendar size={16} color="#94A3B8" />
                      </InputAdornment>
                    ),
                  },
                }}
              />
              <Box sx={{ gridColumn: { md: '1 / -1' } }}>
                <Alert
                  severity="warning"
                  icon={false}
                  sx={{
                    borderRadius: '12px',
                    bgcolor: '#FFF7ED',
                    color: '#9A3412',
                    border: '1px solid #FED7AA',
                    alignItems: 'flex-start',
                    '& .MuiAlert-message': { width: '100%' },
                  }}>
                  <Stack direction="row" spacing={1.25} sx={{ alignItems: 'flex-start' }}>
                    <Box
                      sx={{
                        width: 22,
                        height: 22,
                        borderRadius: '50%',
                        bgcolor: '#FDBA74',
                        color: '#9A3412',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 800,
                        fontSize: 12,
                        flexShrink: 0,
                        mt: 0.1,
                      }}>
                      i
                    </Box>
                    <Typography sx={{ fontSize: 13.5, lineHeight: 1.45 }}>
                      {t('admin.property.claimInfo')}
                    </Typography>
                  </Stack>
                </Alert>
              </Box>
              <Box sx={{ gridColumn: { md: '1 / -1' } }}>
                <AdminTestLeadOption checked={testLead} onChange={setTestLead} />
              </Box>
            </AdminNumberedFormSection>
          </Stack>
        </Grid>

        <Grid size={{ xs: 12, lg: 4 }}>
          <Stack spacing={2} sx={{ position: { lg: 'sticky' }, top: { lg: 88 } }}>
            <Box
              sx={{
                bgcolor: '#FFFFFF',
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: '14px',
                p: 2.25,
                boxShadow: '0 1px 2px rgb(15 23 42 / 0.04)',
              }}>
              <Stack direction="row" spacing={1} sx={{ alignItems: 'center', mb: 1.5 }}>
                <Box
                  sx={{
                    width: 32,
                    height: 32,
                    borderRadius: '10px',
                    bgcolor: '#FEF3C7',
                    color: '#D97706',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                  <Lightbulb size={16} />
                </Box>
                <Typography sx={{ fontWeight: 800, fontSize: 15 }}>
                  {t('admin.property.tips.title')}
                </Typography>
              </Stack>
              <Stack spacing={1.1}>
                {tips.map((tip) => (
                  <Stack key={tip} direction="row" spacing={1} sx={{ alignItems: 'flex-start' }}>
                    <Box
                      sx={{
                        width: 18,
                        height: 18,
                        borderRadius: '50%',
                        bgcolor: '#DCFCE7',
                        color: '#16A34A',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        mt: 0.15,
                      }}>
                      <Check size={11} strokeWidth={3} />
                    </Box>
                    <Typography sx={{ fontSize: 13.5, color: 'text.secondary', lineHeight: 1.45 }}>
                      {tip}
                    </Typography>
                  </Stack>
                ))}
              </Stack>
            </Box>

            <Box
              sx={{
                bgcolor: '#F0FDF4',
                border: '1px solid #BBF7D0',
                borderRadius: '14px',
                p: 2,
              }}>
              <Stack direction="row" spacing={1.25} sx={{ alignItems: 'flex-start' }}>
                <Box
                  sx={{
                    width: 32,
                    height: 32,
                    borderRadius: '10px',
                    bgcolor: '#DCFCE7',
                    color: '#16A34A',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}>
                  <FileText size={16} />
                </Box>
                <Typography sx={{ fontSize: 13.5, color: '#14532D', fontWeight: 600, lineHeight: 1.45 }}>
                  {t('admin.property.tips.helper')}
                </Typography>
              </Stack>
            </Box>
          </Stack>
        </Grid>
      </Grid>

      <StickyFooterClearance />
      <StickyFooter pin="fixed">
        <Button
          component={RouterLink}
          to={ROUTES.adminProperties}
          disabled={loading}
          variant="outlined"
          sx={{
            textTransform: 'none',
            fontWeight: 700,
            borderRadius: '10px',
            borderColor: 'divider',
            color: 'text.secondary',
          }}>
          {t('admin.common.cancel')}
        </Button>
        <Button
          type="submit"
          variant="contained"
          disabled={loading}
          startIcon={loading ? undefined : <Save size={16} />}
          sx={{
            textTransform: 'none',
            fontWeight: 700,
            borderRadius: '10px',
            bgcolor: '#22C55E',
            '&:hover': { bgcolor: '#16A34A' },
          }}>
          {loading ? <CircularProgress size={20} color="inherit" /> : t('admin.property.save')}
        </Button>
      </StickyFooter>
    </Box>
  );
}

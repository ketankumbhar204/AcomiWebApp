import { InputAdornment, TextField } from '@mui/material';
import { ChefHat, IndianRupee, MapPin, Phone, User } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { adminApi } from '@/modules/admin/api/adminApi';
import { AdminRegistrationFormLayout } from '@/modules/admin/components/AdminRegistrationFormLayout';
import { AdminSavedAddressPicker } from '@/modules/admin/components/AdminSavedAddressPicker';
import { AdminTestLeadOption } from '@/modules/admin/components/AdminTestLeadOption';
import { ROUTES } from '@/routes/paths';
import { ContentCard } from '@/shared/components/ContentCard';
import { FormSection } from '@/shared/components/FormSection';
import { isValidIndianMobile, normalizeIndianMobileDigits } from '@/shared/utils/indianMobile';
import type { AdminCreateMessRegistrationRequest } from '@/shared/types/admin';

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

const fieldSx = { '& .MuiInputBase-root': { bgcolor: 'background.paper' } };

export function AdminAddMessPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [messName, setMessName] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [alternateMobileNumber, setAlternateMobileNumber] = useState('');
  const [addressLine, setAddressLine] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [pincode, setPincode] = useState('');
  const [mapUrl, setMapUrl] = useState('');
  const [monthlyPrice, setMonthlyPrice] = useState('');
  const [mealPrice, setMealPrice] = useState('');
  const [testLead, setTestLead] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (mobileNumber.trim() && !isValidIndianMobile(mobileNumber)) {
      setError(t('admin.mess.errors.mobile'));
      return;
    }
    if (alternateMobileNumber.trim() && !isValidIndianMobile(alternateMobileNumber)) {
      setError(t('admin.mess.errors.alternateMobile'));
      return;
    }
    if (
      mobileNumber.trim() &&
      alternateMobileNumber.trim() &&
      normalizeIndianMobileDigits(mobileNumber) === normalizeIndianMobileDigits(alternateMobileNumber)
    ) {
      setError(t('admin.mess.errors.alternateDifferent'));
      return;
    }
    if (pincode.trim() && !isValidPincode(pincode.trim())) {
      setError(t('admin.mess.errors.pincode'));
      return;
    }
    if (mapUrl.trim() && !isValidMapUrl(mapUrl)) {
      setError(t('admin.mess.errors.mapUrl'));
      return;
    }

    let monthly: number | undefined;
    if (monthlyPrice.trim()) {
      monthly = Number(monthlyPrice);
      if (!Number.isFinite(monthly) || monthly < 0) {
        setError(t('admin.mess.errors.monthlyPrice'));
        return;
      }
    }
    let meal: number | undefined;
    if (mealPrice.trim()) {
      meal = Number(mealPrice);
      if (!Number.isFinite(meal) || meal < 0) {
        setError(t('admin.mess.errors.mealPrice'));
        return;
      }
    }

    const payload: AdminCreateMessRegistrationRequest = {};
    const name = optionalText(messName);
    const owner = optionalText(ownerName);
    const mobile = optionalText(mobileNumber);
    const alternateMobile = optionalText(alternateMobileNumber);
    const address = optionalText(addressLine);
    const cityValue = optionalText(city);
    const stateValue = optionalText(state);
    const pincodeValue = optionalText(pincode);
    const map = optionalText(mapUrl);
    if (name) payload.messName = name;
    if (owner) payload.ownerName = owner;
    if (mobile) payload.mobileNumber = mobile;
    if (alternateMobile) payload.alternateMobileNumber = alternateMobile;
    if (address) payload.addressLine = address;
    if (cityValue) payload.city = cityValue;
    if (stateValue) payload.state = stateValue;
    if (pincodeValue) payload.pincode = pincodeValue;
    if (map) payload.mapUrl = map;
    if (monthly !== undefined) payload.monthlyPrice = monthly;
    if (meal !== undefined) payload.mealPrice = meal;
    if (testLead) payload.testLead = true;

    setLoading(true);
    try {
      await adminApi.createMessRegistration(payload);
      navigate(ROUTES.adminMess);
    } catch {
      setError(t('admin.mess.saveFailed'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <AdminRegistrationFormLayout
      title={t('admin.mess.addHeading')}
      description={t('admin.mess.addSubheading')}
      breadcrumbs={[
        { label: t('admin.nav.mess'), to: ROUTES.adminMess },
        { label: t('admin.nav.addMess') },
      ]}
      cancelTo={ROUTES.adminMess}
      submitLabel={t('admin.mess.save')}
      loading={loading}
      error={error}
      onSubmit={(e) => void handleSubmit(e)}
    >
      <ContentCard>
        <FormSection
          title={t('admin.mess.detailsTitle')}
          description={t('admin.mess.detailsHint')}
        >
          <TextField
            label={t('admin.mess.name')}
            value={messName}
            onChange={(e) => setMessName(e.target.value)}
            placeholder={t('admin.mess.namePlaceholder')}
            fullWidth
            size="small"
            sx={{ ...fieldSx, gridColumn: { md: '1 / -1' } }}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <ChefHat size={16} />
                  </InputAdornment>
                ),
              },
            }}
          />
        </FormSection>
      </ContentCard>

      <ContentCard>
        <FormSection
          title={t('admin.common.ownerContact')}
          description={t('admin.common.ownerContactHint')}
        >
          <TextField
            label={t('admin.common.ownerName')}
            value={ownerName}
            onChange={(e) => setOwnerName(e.target.value)}
            fullWidth
            size="small"
            sx={fieldSx}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <User size={16} />
                  </InputAdornment>
                ),
              },
            }}
          />
          <TextField
            label={t('admin.common.primaryMobile')}
            value={mobileNumber}
            onChange={(e) => setMobileNumber(normalizeIndianMobileDigits(e.target.value))}
            placeholder={t('admin.common.primaryMobilePlaceholder')}
            fullWidth
            size="small"
            sx={fieldSx}
            slotProps={{
              htmlInput: { maxLength: 10, inputMode: 'numeric' },
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <Phone size={16} />
                  </InputAdornment>
                ),
              },
            }}
          />
          <TextField
            label={t('admin.common.alternateMobileLabel')}
            value={alternateMobileNumber}
            onChange={(e) => setAlternateMobileNumber(normalizeIndianMobileDigits(e.target.value))}
            placeholder={t('admin.common.alternateMobilePlaceholder')}
            helperText={t('admin.common.alternateMobileHint')}
            fullWidth
            size="small"
            sx={fieldSx}
            slotProps={{
              htmlInput: { maxLength: 10, inputMode: 'numeric' },
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <Phone size={16} />
                  </InputAdornment>
                ),
              },
            }}
          />
        </FormSection>
      </ContentCard>

      <ContentCard>
        <FormSection
          title={t('admin.common.location')}
          description={t('admin.common.locationHintMess')}
        >
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
            label={t('admin.common.addressLine')}
            value={addressLine}
            onChange={(e) => setAddressLine(e.target.value)}
            fullWidth
            size="small"
            sx={{ ...fieldSx, gridColumn: { md: '1 / -1' } }}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <MapPin size={16} />
                  </InputAdornment>
                ),
              },
            }}
          />
          <TextField label={t('admin.common.city')} value={city} onChange={(e) => setCity(e.target.value)} fullWidth size="small" sx={fieldSx} />
          <TextField label={t('admin.common.state')} value={state} onChange={(e) => setState(e.target.value)} fullWidth size="small" sx={fieldSx} />
          <TextField
            label={t('admin.common.pincode')}
            value={pincode}
            onChange={(e) => setPincode(e.target.value)}
            fullWidth
            size="small"
            sx={fieldSx}
            slotProps={{ htmlInput: { maxLength: 6, inputMode: 'numeric' } }}
          />
          <TextField
            label={t('admin.common.mapLink')}
            value={mapUrl}
            onChange={(e) => setMapUrl(e.target.value)}
            placeholder={t('admin.common.mapLinkPlaceholder')}
            fullWidth
            size="small"
            sx={{ ...fieldSx, gridColumn: { md: '1 / -1' } }}
          />
        </FormSection>
      </ContentCard>

      <ContentCard>
        <FormSection title={t('admin.common.pricingOptions')} description={t('admin.common.pricingOptionsHint')}>
          <TextField
            label={t('admin.mess.monthlyPriceLabel')}
            value={monthlyPrice}
            onChange={(e) => setMonthlyPrice(e.target.value)}
            fullWidth
            size="small"
            sx={fieldSx}
            slotProps={{
              htmlInput: { inputMode: 'decimal' },
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <IndianRupee size={16} />
                  </InputAdornment>
                ),
              },
            }}
          />
          <TextField
            label={t('admin.mess.mealPriceLabel')}
            value={mealPrice}
            onChange={(e) => setMealPrice(e.target.value)}
            fullWidth
            size="small"
            sx={fieldSx}
            slotProps={{
              htmlInput: { inputMode: 'decimal' },
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <IndianRupee size={16} />
                  </InputAdornment>
                ),
              },
            }}
          />
          <AdminTestLeadOption checked={testLead} onChange={setTestLead} />
        </FormSection>
      </ContentCard>
    </AdminRegistrationFormLayout>
  );
}

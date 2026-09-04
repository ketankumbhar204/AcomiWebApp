import { InputAdornment, TextField } from '@mui/material';
import { Building2, IndianRupee, MapPin, Phone, User } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { adminApi } from '@/modules/admin/api/adminApi';
import { AdminPropertyTypePicker } from '@/modules/admin/components/AdminPropertyTypePicker';
import { AdminRegistrationFormLayout } from '@/modules/admin/components/AdminRegistrationFormLayout';
import { AdminSavedAddressPicker } from '@/modules/admin/components/AdminSavedAddressPicker';
import { AdminTestLeadOption } from '@/modules/admin/components/AdminTestLeadOption';
import { ROUTES } from '@/routes/paths';
import { ContentCard } from '@/shared/components/ContentCard';
import { FormSection } from '@/shared/components/FormSection';
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

const fieldSx = { '& .MuiInputBase-root': { bgcolor: 'background.paper' } };

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

  return (
    <AdminRegistrationFormLayout
      title={t('admin.property.addHeading')}
      description={t('admin.property.addSubheading')}
      breadcrumbs={[
        { label: t('admin.nav.properties'), to: ROUTES.adminProperties },
        { label: t('admin.nav.addProperty') },
      ]}
      cancelTo={ROUTES.adminProperties}
      submitLabel={t('admin.property.save')}
      loading={loading}
      error={error}
      onSubmit={(e) => void handleSubmit(e)}
    >
      <ContentCard>
        <FormSection
          title={t('admin.property.detailsTitle')}
          description={t('admin.property.detailsHint')}
        >
          <AdminPropertyTypePicker value={propertyType} onChange={setPropertyType} />
          <TextField
            label={t('admin.property.name')}
            value={propertyName}
            onChange={(e) => setPropertyName(e.target.value)}
            placeholder={t('admin.property.namePlaceholder')}
            fullWidth
            size="small"
            sx={{ ...fieldSx, gridColumn: { md: '1 / -1' } }}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <Building2 size={16} />
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
          description={t('admin.common.locationHintProperty')}
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
            label={t('admin.property.startingPriceLabel')}
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

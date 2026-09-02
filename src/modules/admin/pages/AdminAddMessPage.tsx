import { InputAdornment, TextField } from '@mui/material';
import { ChefHat, IndianRupee, MapPin, Phone, User } from 'lucide-react';
import { useState } from 'react';
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
      setError('Enter a valid 10-digit mobile number, or leave it blank.');
      return;
    }
    if (alternateMobileNumber.trim() && !isValidIndianMobile(alternateMobileNumber)) {
      setError('Enter a valid 10-digit alternate mobile number, or leave it blank.');
      return;
    }
    if (
      mobileNumber.trim() &&
      alternateMobileNumber.trim() &&
      normalizeIndianMobileDigits(mobileNumber) === normalizeIndianMobileDigits(alternateMobileNumber)
    ) {
      setError('Alternate mobile number must be different from the primary mobile number.');
      return;
    }
    if (pincode.trim() && !isValidPincode(pincode.trim())) {
      setError('Enter a valid 6-digit pincode, or leave it blank.');
      return;
    }
    if (mapUrl.trim() && !isValidMapUrl(mapUrl)) {
      setError('Map link must start with http:// or https://');
      return;
    }

    let monthly: number | undefined;
    if (monthlyPrice.trim()) {
      monthly = Number(monthlyPrice);
      if (!Number.isFinite(monthly) || monthly < 0) {
        setError('Enter a valid monthly price, or leave it blank.');
        return;
      }
    }
    let meal: number | undefined;
    if (mealPrice.trim()) {
      meal = Number(mealPrice);
      if (!Number.isFinite(meal) || meal < 0) {
        setError('Enter a valid meal price, or leave it blank.');
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
      setError('Could not save mess registration.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <AdminRegistrationFormLayout
      title="Add mess lead"
      description="Create a mess registration for the admin lead list. Vendors can claim it later via the public website."
      breadcrumbs={[
        { label: 'Mess', to: ROUTES.adminMess },
        { label: 'Add mess' },
      ]}
      cancelTo={ROUTES.adminMess}
      submitLabel="Save mess lead"
      loading={loading}
      error={error}
      onSubmit={(e) => void handleSubmit(e)}
    >
      <ContentCard>
        <FormSection
          title="Mess details"
          description="Name shown in the lead list and used when matching owner claims."
        >
          <TextField
            label="Mess name"
            value={messName}
            onChange={(e) => setMessName(e.target.value)}
            placeholder="e.g. Sunrise Mess"
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
          title="Owner contact"
          description="Contact details for follow-up. Leave blank if unknown."
        >
          <TextField
            label="Owner name"
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
            label="Primary mobile number"
            value={mobileNumber}
            onChange={(e) => setMobileNumber(normalizeIndianMobileDigits(e.target.value))}
            placeholder="10-digit number"
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
            label="Alternate mobile number"
            value={alternateMobileNumber}
            onChange={(e) => setAlternateMobileNumber(normalizeIndianMobileDigits(e.target.value))}
            placeholder="Optional 10-digit number"
            helperText="Optional secondary contact. Leave blank if unknown."
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
          title="Location"
          description="Reuse a recent address or enter a new one. The same address can be used by multiple messes."
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
            label="Address line"
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
          <TextField label="City" value={city} onChange={(e) => setCity(e.target.value)} fullWidth size="small" sx={fieldSx} />
          <TextField label="State" value={state} onChange={(e) => setState(e.target.value)} fullWidth size="small" sx={fieldSx} />
          <TextField
            label="Pincode"
            value={pincode}
            onChange={(e) => setPincode(e.target.value)}
            fullWidth
            size="small"
            sx={fieldSx}
            slotProps={{ htmlInput: { maxLength: 6, inputMode: 'numeric' } }}
          />
          <TextField
            label="Google Maps link"
            value={mapUrl}
            onChange={(e) => setMapUrl(e.target.value)}
            placeholder="https://maps.google.com/..."
            fullWidth
            size="small"
            sx={{ ...fieldSx, gridColumn: { md: '1 / -1' } }}
          />
        </FormSection>
      </ContentCard>

      <ContentCard>
        <FormSection title="Pricing & options" description="Optional pricing and lead metadata.">
          <TextField
            label="Monthly price (₹)"
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
            label="Meal / tiffin price (₹)"
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

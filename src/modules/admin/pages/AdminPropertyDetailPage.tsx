import {
  Box,
  Button,
  Chip,
  CircularProgress,
  Stack,
  Typography,
} from '@mui/material';
import { useSnackbar } from 'notistack';
import { useEffect, useState } from 'react';
import { Link as RouterLink, useNavigate, useParams } from 'react-router-dom';
import { adminApi } from '@/modules/admin/api/adminApi';
import { AdminRegistrationContactEditor } from '@/modules/admin/components/AdminRegistrationContactEditor';
import { formatPropertyRegistrationSource } from '@/modules/admin/utils/adminLabels';
import { ConfirmDialog } from '@/shared/components/ConfirmDialog';
import { ROUTES } from '@/routes/paths';
import type {
  AdminUpdateRegistrationContactRequest,
  PropertyRegistrationDetail,
} from '@/shared/types/admin';

export function AdminPropertyDetailPage() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const [detail, setDetail] = useState<PropertyRegistrationDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [editingContact, setEditingContact] = useState(false);
  const [savingContact, setSavingContact] = useState(false);

  useEffect(() => {
    let active = true;
    void adminApi
      .getPropertyRegistration(id)
      .then((data) => {
        if (active) setDetail(data);
      })
      .catch(() => {
        if (active) setError('Could not load property registration.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [id]);

  async function handleDeleteConfirm() {
    setDeleting(true);
    try {
      await adminApi.deletePropertyRegistration(id);
      enqueueSnackbar('Property lead deleted.', { variant: 'success' });
      navigate(ROUTES.adminProperties);
    } catch {
      enqueueSnackbar('Could not delete property lead.', { variant: 'error' });
    } finally {
      setDeleting(false);
      setDeleteOpen(false);
    }
  }

  async function handleSaveContact(payload: AdminUpdateRegistrationContactRequest) {
    setSavingContact(true);
    try {
      const updated = await adminApi.updatePropertyRegistrationContact(id, payload);
      setDetail(updated);
      setEditingContact(false);
      enqueueSnackbar('Owner contact updated.', { variant: 'success' });
    } catch {
      enqueueSnackbar('Could not update owner contact.', { variant: 'error' });
    } finally {
      setSavingContact(false);
    }
  }

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error || !detail) {
    return (
      <Box>
        <Typography color="error">{error ?? 'Not found'}</Typography>
        <Button component={RouterLink} to={ROUTES.adminProperties} sx={{ mt: 2 }}>
          Back to list
        </Button>
      </Box>
    );
  }

  return (
    <Box>
      <Stack direction="row" sx={{ alignItems: 'center', gap: 1, mb: 2 }}>
        <Typography variant="h4" sx={{ fontWeight: 700 }}>
          {detail.propertyName}
        </Typography>
        <Chip size="small" label={formatPropertyRegistrationSource(detail.source)} />
      </Stack>
      <Stack spacing={1} sx={{ mb: 3 }}>
        <Typography><strong>Reference:</strong> {detail.reference}</Typography>
        <Typography><strong>Type:</strong> {detail.propertyType}</Typography>
        {editingContact ? (
          <AdminRegistrationContactEditor
            ownerName={detail.ownerName}
            mobileNumber={detail.mobileNumber}
            alternateMobileNumber={detail.alternateMobileNumber}
            saving={savingContact}
            onSave={(payload) => void handleSaveContact(payload)}
            onCancel={() => setEditingContact(false)}
          />
        ) : (
          <>
            <Typography><strong>Owner:</strong> {detail.ownerName}</Typography>
            <Typography><strong>Mobile:</strong> {detail.mobileNumber}</Typography>
            {detail.alternateMobileNumber ? (
              <Typography><strong>Alternate mobile:</strong> {detail.alternateMobileNumber}</Typography>
            ) : null}
            <Box>
              <Button size="small" onClick={() => setEditingContact(true)}>
                Edit contact
              </Button>
            </Box>
          </>
        )}
        <Typography><strong>Status:</strong> {detail.status}</Typography>
        <Typography><strong>Test lead:</strong> {detail.testLead ? 'Yes' : 'No'}</Typography>
        <Typography>
          <strong>Address:</strong> {detail.addressLine}, {detail.city}, {detail.state} {detail.pincode}
        </Typography>
        <Typography><strong>Starting price:</strong> ₹{detail.startingPrice}</Typography>
        {detail.claimedAt ? (
          <Typography><strong>Claimed:</strong> {new Date(detail.claimedAt).toLocaleString()}</Typography>
        ) : null}
        {detail.description ? (
          <Typography><strong>Description:</strong> {detail.description}</Typography>
        ) : null}
      </Stack>
      <Stack direction="row" spacing={1}>
        <Button component={RouterLink} to={ROUTES.adminProperties}>
          Back to list
        </Button>
        <Button color="error" variant="outlined" onClick={() => setDeleteOpen(true)}>
          Delete
        </Button>
      </Stack>
      <ConfirmDialog
        open={deleteOpen}
        title="Delete this property lead?"
        description={`${detail.propertyName}\n\nThis action will remove the registration from the Admin lead list.`}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        destructive
        confirming={deleting}
        onConfirm={() => void handleDeleteConfirm()}
        onClose={() => setDeleteOpen(false)}
      />
    </Box>
  );
}

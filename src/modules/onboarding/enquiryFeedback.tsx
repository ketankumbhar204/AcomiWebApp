import { useCallback, useSyncExternalStore } from 'react';
import { Check, X } from 'lucide-react';
import { Box, IconButton, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';

type EnquiryToast = {
  id: number;
  title: string;
  body?: string;
  tone: 'success' | 'error';
};

type EnquiryToastInput = {
  title: string;
  body?: string;
  tone?: 'success' | 'error';
};

let toasts: EnquiryToast[] = [];
let sendingIds = new Set<string>();
let snapshot = 0;
const listeners = new Set<() => void>();

function emit() {
  snapshot += 1;
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot() {
  return snapshot;
}

export function showEnquiryToast(toast: EnquiryToastInput) {
  const id = Date.now() + Math.floor(Math.random() * 1000);
  toasts = [
    ...toasts,
    { id, title: toast.title, body: toast.body, tone: toast.tone ?? 'success' },
  ];
  emit();
  window.setTimeout(() => dismissEnquiryToast(id), 7000);
}

export function dismissEnquiryToast(id: number) {
  const next = toasts.filter((toast) => toast.id !== id);
  if (next.length === toasts.length) return;
  toasts = next;
  emit();
}

export function beginEnquirySend(listingId: string) {
  if (!listingId || sendingIds.has(listingId)) return;
  sendingIds = new Set(sendingIds).add(listingId);
  emit();
}

export function endEnquirySend(listingId: string) {
  if (!sendingIds.has(listingId)) return;
  const next = new Set(sendingIds);
  next.delete(listingId);
  sendingIds = next;
  emit();
}

export function useIsEnquirySending(listingId?: string | null): boolean {
  useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  return Boolean(listingId && sendingIds.has(listingId));
}

export function useEnquiryToasts(): EnquiryToast[] {
  useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  return toasts;
}

export function EnquiryResultToast() {
  const { t } = useTranslation();
  const items = useEnquiryToasts();
  const dismiss = useCallback((id: number) => dismissEnquiryToast(id), []);
  if (items.length === 0) return null;
  return (
    <Box
      sx={{
        pointerEvents: 'none',
        position: 'fixed',
        left: 0,
        right: 0,
        bottom: 16,
        zIndex: 1600,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 1,
        px: 1.5,
      }}
    >
      {items.map((toast) => {
        const error = toast.tone === 'error';
        return (
          <Box
            key={toast.id}
            role="status"
            aria-live="polite"
            sx={{
              pointerEvents: 'auto',
              display: 'flex',
              width: '100%',
              maxWidth: 448,
              alignItems: 'flex-start',
              gap: 1.5,
              borderRadius: '16px',
              border: '1px solid',
              borderColor: error ? '#F5B4B4' : '#8FCBAB',
              bgcolor: error ? '#FDECEC' : '#D8F3E4',
              px: 2,
              py: 1.5,
              boxShadow: '0 16px 40px rgba(11,28,22,0.22)',
            }}
          >
            <Box
              sx={{
                mt: 0.25,
                display: 'inline-flex',
                height: 32,
                width: 32,
                flexShrink: 0,
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '999px',
                bgcolor: error ? '#DC2626' : '#0F6B4C',
                color: '#fff',
              }}
            >
              {error ? <X size={16} /> : <Check size={16} />}
            </Box>
            <Box sx={{ minWidth: 0, flex: 1 }}>
              <Typography sx={{ fontSize: 15, fontWeight: 700, color: '#102A22' }}>{toast.title}</Typography>
              {toast.body ? (
                <Typography sx={{ mt: 0.25, fontSize: 13, lineHeight: 1.4, color: '#3D4F48' }}>
                  {toast.body}
                </Typography>
              ) : null}
            </Box>
            <IconButton
              size="small"
              aria-label={t('common.close', { defaultValue: 'Close' })}
              onClick={() => dismiss(toast.id)}
              sx={{ color: '#5C6B66' }}
            >
              <X size={16} />
            </IconButton>
          </Box>
        );
      })}
    </Box>
  );
}

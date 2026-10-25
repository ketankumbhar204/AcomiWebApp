import { Typography } from '@mui/material';
import { useSnackbar } from 'notistack';

type Props = {
  value?: string | null;
};

/** Compact copyable business reference. Renders nothing when the API has not sent one. */
export function ReferenceCode({ value }: Props) {
  const { enqueueSnackbar } = useSnackbar();
  if (!value) {
    return null;
  }
  return (
    <Typography
      component="button"
      type="button"
      onClick={(event) => {
        event.stopPropagation();
        void navigator.clipboard.writeText(value).then(
          () => enqueueSnackbar(value, { variant: 'info' }),
          () => undefined,
        );
      }}
      sx={{
        display: 'inline-flex',
        border: 0,
        background: 'transparent',
        p: 0,
        m: 0,
        fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
        fontSize: 12,
        lineHeight: 1.4,
        letterSpacing: 0.2,
        color: 'text.secondary',
        cursor: 'pointer',
      }}
    >
      {value}
    </Typography>
  );
}

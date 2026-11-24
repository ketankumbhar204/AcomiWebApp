import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Navigate, useParams } from 'react-router-dom';
import { useSnackbar } from 'notistack';
import { spaceMembersPath } from '@/routes/paths';

/**
 * Legacy "Import Existing People" route kept so old links work.
 * Reuse now happens in the Move-in wizard (lodging) or the Mess customer form.
 */
export function ImportExistingPeoplePage() {
  const { t } = useTranslation();
  const { spaceId = '' } = useParams<{ spaceId: string }>();
  const { enqueueSnackbar } = useSnackbar();
  const notified = useRef(false);

  useEffect(() => {
    if (notified.current) {
      return;
    }
    notified.current = true;
    enqueueSnackbar(t('membership.add.choice.importPageMoved'), { variant: 'info' });
  }, [enqueueSnackbar, t]);

  return <Navigate to={spaceMembersPath(spaceId)} replace />;
}

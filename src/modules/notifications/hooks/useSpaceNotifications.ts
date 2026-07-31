import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { notificationsApi } from '@/modules/dashboard/api/notificationsApi';
import { useSpacePermissions } from '@/shared/hooks/useSpacePermissions';
import { filterTenantVisibleNotifications } from '@/shared/utils/ownerOnlyNotifications';
import { canManageNotifications } from '@/shared/utils/spaceOperator';

export function useSpaceNotifications(spaceId: string | undefined, enabled: boolean) {
  const permissions = useSpacePermissions(spaceId);
  const isOperator = canManageNotifications(permissions);
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['space-notifications', spaceId, isOperator],
    queryFn: async () => {
      const data = await notificationsApi.listNotifications(spaceId!, false);
      const visible = isOperator
        ? data.notifications
        : filterTenantVisibleNotifications(data.notifications);
      const unreadCount = isOperator
        ? data.unreadCount
        : visible.filter((n) => n.status === 'UNREAD').length;
      return { notifications: visible, unreadCount };
    },
    enabled: Boolean(enabled && spaceId),
    staleTime: 20_000,
  });

  const markReadMutation = useMutation({
    mutationFn: (notificationId: string) =>
      notificationsApi.markRead(spaceId!, notificationId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['space-notifications', spaceId] });
    },
  });

  return {
    notifications: query.data?.notifications ?? [],
    unreadCount: query.data?.unreadCount ?? 0,
    loading: query.isLoading || query.isFetching,
    error: query.error,
    reload: () => query.refetch(),
    markRead: async (notificationId: string) => markReadMutation.mutateAsync(notificationId),
    isOperator,
  };
}

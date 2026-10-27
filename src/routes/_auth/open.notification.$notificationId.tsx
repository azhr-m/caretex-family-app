import { createFileRoute, redirect } from '@tanstack/react-router'
import { getNotification, markNotificationRead } from '@/api/endpoints/account'
import { keys } from '@/api/keys'
import { SplashView } from '@/features/auth/screens/SplashScreen'
import { deepLinkTarget } from '@/lib/deepLink'
import { useSessionStore } from '@/stores/session'

/** Where a tapped push lands (the service worker opens this). Sign-in happens first via `_auth`. */
export const Route = createFileRoute('/_auth/open/notification/$notificationId')({
  loader: async ({ context, params }) => {
    const n = await getNotification(params.notificationId).catch(() => null)
    if (!n) throw redirect({ to: '/', replace: true })
    const { member, activeResidentId, setActiveResident } = useSessionStore.getState()
    const rid = n.link.residentId ?? activeResidentId ?? member?.residents[0]?.id
    if (!rid || !member?.residents.some((r) => r.id === rid)) throw redirect({ to: '/select-resident', replace: true })
    if (!n.readAt) {
      void markNotificationRead(n.id)
        .then(() =>
          Promise.all([
            context.queryClient.invalidateQueries({ queryKey: keys.notifications() }),
            context.queryClient.invalidateQueries({ queryKey: keys.notificationsCount() }),
          ]),
        )
        .catch(() => undefined)
    }
    setActiveResident(rid)
    throw redirect({ ...deepLinkTarget(n.link, rid), replace: true })
  },
  pendingComponent: SplashView,
})

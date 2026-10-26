import { Outlet, createFileRoute, redirect } from '@tanstack/react-router'
import { useIdleLock } from '@/app/idle'
import { bootstrapSession } from '@/app/session'
import { SessionLockSheet } from '@/components/app/SessionLockSheet'
import { SplashView } from '@/features/auth/screens/SplashScreen'
import { useSessionStore } from '@/stores/session'

export const Route = createFileRoute('/_auth')({
  beforeLoad: async ({ context, location }) => {
    await bootstrapSession(context.queryClient)
    const { accessToken, mustChangePassword } = useSessionStore.getState()
    if (!accessToken) throw redirect({ to: '/login', search: { redirect: location.href }, replace: true })
    if (mustChangePassword) throw redirect({ to: '/login/first-password', replace: true })
  },
  pendingComponent: SplashView,
  component: AuthLayout,
})

/** Idle timer + session lock: content is blurred and inert while the reauth sheet is open. */
function AuthLayout() {
  useIdleLock()
  const locked = useSessionStore((s) => s.locked)
  return (
    <>
      <div
        inert={locked}
        aria-hidden={locked || undefined}
        className="transition-[filter] duration-200"
        style={{ filter: locked ? 'blur(9px)' : undefined }}
      >
        <Outlet />
      </div>
      <SessionLockSheet />
    </>
  )
}

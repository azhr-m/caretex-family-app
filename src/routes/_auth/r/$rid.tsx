import { Outlet, createFileRoute, redirect, useMatches, useNavigate } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { useEffect } from 'react'
import { AppFrame } from '@/components/app/AppFrame'
import { AppHeader, AppHeaderSkeleton } from '@/components/app/AppHeader'
import { OfflineBanner } from '@/components/app/OfflineBanner'
import { ResidentSwitcherSheet } from '@/components/app/ResidentSwitcherSheet'
import { TabBar } from '@/components/app/TabBar'
import { useMember } from '@/api/queries/me'
import { notificationsCountQuery } from '@/api/queries/account'
import { dashboardQuery } from '@/api/queries/residents'
import { residentTone } from '@/lib/avatar'
import { useSessionStore } from '@/stores/session'
import { useUiStore } from '@/stores/ui'

const TABBAR_H = '72px'
const TOAST_OFFSET_TABS = '104px'

export const Route = createFileRoute('/_auth/r/$rid')({
  beforeLoad: ({ params }) => {
    const { member } = useSessionStore.getState()
    if (member && !member.residents.some((r) => r.id === params.rid)) {
      throw redirect({ to: '/select-resident', replace: true })
    }
  },
  component: ResidentShell,
})

/** Header + tab bar on tab routes (staticData.tabs); other routes render their own TopBar. */
function ResidentShell() {
  const { rid } = Route.useParams()
  const navigate = useNavigate()
  const tabs = useMatches({ select: (ms) => ms.at(-1)?.staticData.tabs === true })
  const member = useMember()
  const index = member?.residents.findIndex((r) => r.id === rid) ?? -1
  const resident = index >= 0 ? member!.residents[index] : undefined
  const openSwitcher = useUiStore((s) => s.setResidentSheetOpen)
  const setActiveResident = useSessionStore((s) => s.setActiveResident)
  const counts = useQuery({ ...dashboardQuery(rid), select: (d) => d.counts }).data
  const unread = useQuery(notificationsCountQuery()).data

  useEffect(() => setActiveResident(rid), [rid, setActiveResident])

  useEffect(() => {
    if (!tabs) return
    document.documentElement.style.setProperty('--toast-offset', TOAST_OFFSET_TABS)
    return () => {
      document.documentElement.style.removeProperty('--toast-offset')
    }
  }, [tabs])

  if (!tabs) return <Outlet key={rid} />

  return (
    <AppFrame className="h-dvh min-h-0">
      <div style={{ '--tabbar-h': TABBAR_H } as React.CSSProperties} className="flex min-h-0 flex-1 flex-col">
        {resident ? (
          <AppHeader
            resident={{
              name: resident.name,
              initials: resident.initials,
              photoUrl: resident.photoUrl,
              place: `${resident.ward} · ${resident.room}`,
              tone: residentTone(index),
            }}
            unread={unread ?? counts?.notificationsUnread ?? 0}
            onSwitch={() => openSwitcher(true)}
            onNotifications={() => void navigate({ to: '/r/$rid/notifications', params: { rid } })}
          />
        ) : (
          <AppHeaderSkeleton />
        )}
        <OfflineBanner />
        <main
          id="app-main"
          data-scroll-root
          data-scroll-restoration-id="app-main"
          className="min-h-0 flex-1 scrollbar-none overflow-x-hidden overflow-y-auto overscroll-contain px-4 pt-4 pb-7"
        >
          <Outlet key={rid} />
        </main>
        <TabBar rid={rid} badges={counts?.tabs} />
      </div>
      <ResidentSwitcherSheet rid={rid} />
    </AppFrame>
  )
}

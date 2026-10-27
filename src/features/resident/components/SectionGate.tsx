import { useQuery } from '@tanstack/react-query'
import { Link, Navigate } from '@tanstack/react-router'
import { Info, MessageSquarePlus, ShieldCheck } from 'lucide-react'
import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { useMember } from '@/api/queries/me'
import { permissionsQuery } from '@/api/queries/residents'
import type { PermissionKey } from '@/api/schemas/resident'
import { PermissionState } from '@/components/states/states'
import { Button } from '@/components/ui/button'
import { firstName } from '@/lib/names'

/** 3.8a: actions to see one's permissions or ask the social worker; the API note explains why. */
export function DeniedView({ rid, permission }: { rid: string; permission: PermissionKey }) {
  const { t } = useTranslation('states')
  const note = useQuery(permissionsQuery(rid)).data?.notes[permission]
  return (
    <PermissionState
      kind="denied"
      body={note ? `${t('permission.noPermissionBody')} ${note}` : undefined}
      actions={
        <>
          <Button asChild block>
            <Link to="/r/$rid/more/permissions" params={{ rid }} search={{ resident: rid }}>
              <ShieldCheck aria-hidden size={20} />
              {t('permission.viewMyPermissions')}
            </Link>
          </Button>
          <Button asChild variant="secondary" block>
            <Link to="/r/$rid/staff/new" params={{ rid }} search={{ dept: 'social_work' }}>
              <MessageSquarePlus aria-hidden size={20} />
              {t('permission.askSocialWorker')}
            </Link>
          </Button>
        </>
      }
    />
  )
}

/** 3.8b: ask the relevant staff, or go back to the general info. */
export function NotSharedView({ rid, permission }: { rid: string; permission: PermissionKey }) {
  const { t } = useTranslation(['states', 'resident'])
  const name = firstName(useMember()?.residents.find((r) => r.id === rid)?.name ?? '')
  const medical = permission === 'medical'
  return (
    <PermissionState
      kind="notShared"
      body={medical ? t('resident:permission.notSharedMedical', { name }) : undefined}
      actions={
        <>
          <Button asChild block>
            <Link to="/r/$rid/staff/new" params={{ rid }} search={medical ? { dept: 'doctor' } : {}}>
              <MessageSquarePlus aria-hidden size={20} />
              {medical ? t('permission.askMedical') : t('permission.askStaff')}
            </Link>
          </Button>
          {permission !== 'general' && (
            <Button asChild variant="secondary" block>
              <Link to="/r/$rid/resident/general" params={{ rid }}>
                <Info aria-hidden size={20} />
                {t('permission.backToGeneral')}
              </Link>
            </Button>
          )}
        </>
      }
    />
  )
}

/**
 * Renders the section only when the permission allows it. Denied / not shared show their state
 * without calling the section endpoint; hidden sections go back to General.
 * A 403 or `not_shared` from the endpoint itself is handled by `permissionStates`.
 */
export function SectionGate({
  rid,
  permission,
  children,
}: {
  rid: string
  permission: PermissionKey
  children: ReactNode
}) {
  const value = useQuery(permissionsQuery(rid)).data?.[permission]
  if (value === 'denied') return <DeniedView rid={rid} permission={permission} />
  if (value === 'not_shared') return <NotSharedView rid={rid} permission={permission} />
  if (value === 'hidden') return <Navigate to="/r/$rid/resident/general" params={{ rid }} replace />
  return children
}

/** QueryBoundary `permission` prop for a section. */
export const permissionStates = (rid: string, permission: PermissionKey) => ({
  denied: <DeniedView rid={rid} permission={permission} />,
  notShared: <NotSharedView rid={rid} permission={permission} />,
})

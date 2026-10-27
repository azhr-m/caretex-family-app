import { useNavigate } from '@tanstack/react-router'
import {
  ChevronRight,
  ClipboardList,
  Clock,
  FileLock,
  FolderOpen,
  KeyRound,
  Lock,
  LogOut,
  MessagesSquare,
  Monitor,
  Moon,
  Newspaper,
  PartyPopper,
  Save,
  ScanFace,
  ScrollText,
  Sun,
  type LucideIcon,
} from 'lucide-react'
import { useState } from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { isApiError } from '@/api/errors'
import { patchPreferences } from '@/api/endpoints/account'
import { useChangePassword, usePatchPreferences } from '@/api/queries/account'
import { useMember } from '@/api/queries/me'
import type { Preferences } from '@/api/schemas/me'
import { useLogout } from '@/app/session'
import { AppFrame, ScreenContent } from '@/components/app/AppFrame'
import { TopBar } from '@/components/app/TopBar'
import { DirIcon } from '@/components/common/DirIcon'
import { IconTile } from '@/components/common/IconTile'
import { Ltr } from '@/components/common/Ltr'
import { SectionHeader } from '@/components/common/SectionHeader'
import { StatusChip } from '@/components/common/StatusChip'
import { BottomSheet } from '@/components/ui/bottom-sheet'
import { Button } from '@/components/ui/button'
import { PasswordField } from '@/components/ui/fields'
import { SegmentedControl } from '@/components/ui/segmented-control'
import { toast } from '@/components/ui/toast'
import { ToggleRow } from '@/components/ui/toggle'
import { NewPasswordForm, passwordErrorKey } from '@/features/auth/components/NewPasswordForm'
import { date } from '@/lib/format'
import { firstName } from '@/lib/names'
import { useAuthFlowStore } from '@/stores/authFlow'
import { usePrefsStore, type Language, type ThemePreference } from '@/stores/prefs'

const APP_VERSION = (import.meta.env.VITE_APP_VERSION as string | undefined) ?? 'dev'

type NotificationKey = keyof Preferences['notifications']

const TOGGLES: { key: NotificationKey; icon: LucideIcon }[] = [
  { key: 'updates', icon: Newspaper },
  { key: 'inquiries', icon: MessagesSquare },
  { key: 'documents', icon: FolderOpen },
  { key: 'events', icon: PartyPopper },
  { key: 'surveys', icon: ClipboardList },
]

/** Language and theme apply locally at once; the server copy is best-effort (used for push wording). */
const syncPreference = (patch: Partial<Preferences>) => void patchPreferences(patch).catch(() => undefined)

export function SettingsScreen({ rid, view }: { rid: string; view?: 'password' }) {
  return view === 'password' ? <ChangePassword rid={rid} /> : <Settings rid={rid} />
}

function Settings({ rid }: { rid: string }) {
  const { t, i18n } = useTranslation(['settings', 'common', 'states'])
  const navigate = useNavigate()
  const member = useMember()
  const theme = usePrefsStore((s) => s.theme)
  const setLanguage = usePrefsStore((s) => s.setLanguage)
  const setTheme = usePrefsStore((s) => s.setTheme)
  const patch = usePatchPreferences()
  const changedAt = useAuthFlowStore((s) => s.changedAt)
  const [logoutOpen, setLogoutOpen] = useState(false)
  const name = firstName(member?.residents.find((r) => r.id === rid)?.name ?? '')
  const language: Language = i18n.language === 'he' ? 'he' : 'en'
  const notifications = member?.preferences.notifications

  const toggle = (key: NotificationKey, value: boolean) =>
    patch.mutate(
      { notifications: { ...notifications!, [key]: value } },
      {
        onSuccess: () => toast.success({ title: t('states:toast.saved'), body: t('states:toast.prefsUpdated') }),
        onError: () => toast.error({ title: t('notifications.saveFailed') }),
      },
    )

  return (
    <AppFrame>
      <TopBar title={t('title')} backLabel={t('common:tabs.more')} fallbackHref={`/r/${rid}/more`} />
      <ScreenContent className="flex flex-col gap-6">
        <section className="flex flex-col gap-2.5">
          <SectionHeader>{t('language')}</SectionHeader>
          <SegmentedControl
            label={t('language')}
            value={language}
            onChange={(v) => {
              setLanguage(v)
              syncPreference({ language: v })
            }}
            options={[
              { value: 'en', label: 'English', lang: 'en' },
              { value: 'he', label: 'עברית', lang: 'he' },
            ]}
          />
        </section>

        <section className="flex flex-col gap-2.5">
          <SectionHeader>{t('theme')}</SectionHeader>
          <SegmentedControl<ThemePreference>
            label={t('theme')}
            value={theme}
            onChange={(v) => {
              setTheme(v)
              syncPreference({ theme: v })
            }}
            options={[
              { value: 'light', label: t('themes.light'), icon: Sun },
              { value: 'dark', label: t('themes.dark'), icon: Moon },
              { value: 'system', label: t('themes.system'), icon: Monitor },
            ]}
          />
          <p className="text-meta text-text-2 m-0">{t('themeHelp')}</p>
        </section>

        <section className="flex flex-col gap-2.5">
          <SectionHeader>{t('notifications.title')}</SectionHeader>
          <div className="rounded-card border-border bg-surface [&>*:not(:last-child)]:border-border overflow-hidden border [&>*:not(:last-child)]:border-b">
            {TOGGLES.map((x) => (
              <ToggleRow
                key={x.key}
                icon={x.icon}
                label={t(`notifications.items.${x.key}.label`, { name })}
                description={t(`notifications.items.${x.key}.desc`)}
                checked={notifications?.[x.key] ?? false}
                onCheckedChange={(v) => toggle(x.key, v)}
              />
            ))}
            <ToggleRow
              icon={Lock}
              label={t('notifications.items.lockScreen.label')}
              description={t('notifications.items.lockScreen.desc')}
              checked={false}
              onCheckedChange={() => undefined}
              locked
            />
          </div>
        </section>

        <section className="flex flex-col gap-2.5">
          <SectionHeader>{t('security.title')}</SectionHeader>
          <div className="rounded-card border-border bg-surface [&>*:not(:last-child)]:border-border overflow-hidden border [&>*:not(:last-child)]:border-b">
            <button
              type="button"
              onClick={() => void navigate({ to: '/r/$rid/more/settings', params: { rid }, search: { view: 'password' } })}
              className="flex min-h-16 w-full items-center gap-3 px-3.5 py-3 text-start"
            >
              <IconTile icon={KeyRound} tone="slate" size={40} />
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="text-body-sm font-bold">{t('security.changePassword')}</span>
                {changedAt && (
                  <span className="text-meta text-text-2">
                    <Trans t={t} i18nKey="security.lastChanged" values={{ date: date(changedAt) }} components={{ ltr: <Ltr /> }} />
                  </span>
                )}
              </span>
              <DirIcon icon={ChevronRight} size={20} className="text-text-2" />
            </button>
            <SoonRow icon={ScanFace} label={t('security.faceId')} />
            <SoonRow icon={FileLock} label={t('security.privacy')} />
            <SoonRow icon={ScrollText} label={t('security.terms')} />
          </div>
        </section>

        <Button variant="danger" block icon={LogOut} onClick={() => setLogoutOpen(true)}>
          {t('logout.button')}
        </Button>
        <p className="text-tag text-text-2 m-0 text-center">
          {t('common:more.version')} <Ltr>{APP_VERSION}</Ltr>
        </p>
      </ScreenContent>
      <LogoutSheet open={logoutOpen} onOpenChange={setLogoutOpen} />
    </AppFrame>
  )
}

function SoonRow({ icon, label }: { icon: LucideIcon; label: string }) {
  return (
    <div className="flex min-h-16 items-center gap-3 px-3.5 py-3">
      <IconTile icon={icon} tone="slate" size={40} />
      <span className="text-body-sm min-w-0 flex-1 font-bold">{label}</span>
      <StatusChip status="coming_soon" icon={Clock} size="sm" />
    </div>
  )
}

function LogoutSheet({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const { t } = useTranslation('settings')
  const logout = useLogout()
  return (
    <BottomSheet open={open} onOpenChange={onOpenChange} title={t('logout.title')} description={t('logout.body')}>
      <div className="flex flex-col gap-2.5">
        <IconTile icon={LogOut} tone="red" size={56} className="self-center" />
        <Button variant="dangerSolid" block icon={LogOut} onClick={() => void logout()}>
          {t('logout.confirm')}
        </Button>
        <Button variant="secondary" block onClick={() => onOpenChange(false)}>
          {t('logout.stay')}
        </Button>
      </div>
    </BottomSheet>
  )
}

function ChangePassword({ rid }: { rid: string }) {
  const { t } = useTranslation(['settings', 'common', 'auth', 'validation'])
  const navigate = useNavigate()
  const change = useChangePassword()
  const [current, setCurrent] = useState('')
  const [currentError, setCurrentError] = useState<string | undefined>()
  const [fieldError, setFieldError] = useState<string | undefined>()
  const back = () => void navigate({ to: '/r/$rid/more/settings', params: { rid }, search: {}, replace: true })

  const submit = (next: string) => {
    if (!current) return setCurrentError(t('validation:passwordRequired'))
    setCurrentError(undefined)
    setFieldError(undefined)
    change.mutate(
      { current, next },
      {
        onSuccess: () => {
          useAuthFlowStore.getState().setChangedAt(new Date().toISOString())
          toast.success({ title: t('auth:firstPw.saved') })
          back()
        },
        onError: (e) => {
          if (isApiError(e) && e.code === 'INVALID_CREDENTIALS') setCurrentError(t('password.currentWrong'))
          else {
            const key = isApiError(e) ? passwordErrorKey(e.fields) : undefined
            if (key) setFieldError(t(key))
            else toast.error({ title: t('password.failed') })
          }
        },
      },
    )
  }

  return (
    <AppFrame>
      <TopBar title={t('password.title')} backLabel={t('title')} onBack={back} />
      <ScreenContent className="flex flex-col gap-5">
        <p className="text-secondary text-text-2 m-0">{t('password.sub')}</p>
        <PasswordField
          label={t('password.current')}
          icon={KeyRound}
          name="current-password"
          autoComplete="current-password"
          value={current}
          onChange={(e) => {
            setCurrent(e.target.value)
            setCurrentError(undefined)
          }}
          error={currentError}
        />
        <NewPasswordForm
          submitLabel={t('password.save')}
          submitIcon={Save}
          pending={change.isPending}
          fieldError={fieldError}
          showStrength
          onSubmit={submit}
          onEdit={() => setFieldError(undefined)}
        />
      </ScreenContent>
    </AppFrame>
  )
}

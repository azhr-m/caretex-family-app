import { useQueryClient } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { Bug } from 'lucide-react'
import { useLogout } from '@/app/session'
import { useResolvedTheme } from '@/app/theme'
import { Ltr } from '@/components/common/Ltr'
import { DEV_HINTS } from '@/mocks/devHints'
import { SegmentedControl } from '@/components/ui/segmented-control'
import { BottomSheet } from '@/components/ui/bottom-sheet'
import { Button } from '@/components/ui/button'
import { SCENARIOS, useDevStore, type Scenario } from '@/stores/dev'
import { useNetworkStore, type SimulatorMode } from '@/stores/network'
import { usePrefsStore, type Language, type ThemePreference } from '@/stores/prefs'
import { useSessionStore } from '@/stores/session'
import { cn } from '@/lib/utils'

// Dev-only tool: copy here is intentionally English and not translated.
const SIMULATOR: { value: SimulatorMode; label: string; hint: string }[] = [
  { value: 'normal', label: 'Normal', hint: '250–600 ms' },
  { value: 'slow', label: 'Slow 3G', hint: '2–4 s latency' },
  { value: 'stall', label: 'Very slow', hint: '10–12 s · shows slow notice' },
  { value: 'offline', label: 'Offline', hint: 'requests fail, queries pause' },
  { value: 'flaky', label: 'Random errors', hint: '20% → 503' },
  { value: 'expire', label: 'Force 401', hint: 'next request expires, refresh fails' },
  { value: 'forbidden', label: 'Force 403', hint: 'resident GETs denied' },
]

const SCENARIO_LABEL: Record<Scenario, string> = {
  normal: 'Normal (5 wrong passwords → locked)',
  firstLogin: 'First login (temporary password)',
  wrongPassword: 'Wrong password (2 attempts left)',
  locked: 'Account locked',
  blocked: 'Account blocked',
  singleResident: 'Single resident (skips picker)',
  emptyEverything: 'Empty everything',
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-2">
      <h3 className="text-label text-label m-0 font-extrabold tracking-[.06em] uppercase">{title}</h3>
      {children}
    </section>
  )
}

export function DevPanel() {
  const open = useDevStore((s) => s.panelOpen)
  const setOpen = useDevStore((s) => s.setPanelOpen)
  const scenario = useDevStore((s) => s.scenario)
  const setScenario = useDevStore((s) => s.setScenario)
  const simulator = useNetworkStore((s) => s.simulator)
  const setSimulator = useNetworkStore((s) => s.setSimulator)
  const language = usePrefsStore((s) => s.language)
  const setLanguage = usePrefsStore((s) => s.setLanguage)
  const theme = usePrefsStore((s) => s.theme)
  const setTheme = usePrefsStore((s) => s.setTheme)
  const resolved = useResolvedTheme()
  const session = useSessionStore()
  const qc = useQueryClient()

  const idleSeconds = useDevStore((s) => s.idleSeconds)
  const setIdleSeconds = useDevStore((s) => s.setIdleSeconds)
  const logout = useLogout()

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn(
          'rounded-pill text-label shadow-fab fixed start-2 bottom-[calc(var(--tabbar-h,0px)+88px)] z-[60] flex min-h-11 items-center gap-1.5 px-3 font-extrabold',
          simulator === 'normal' ? 'bg-toast-bg text-toast-fg' : 'bg-red-fg text-white',
        )}
      >
        <Bug aria-hidden size={16} />
        Dev{simulator !== 'normal' && ` · ${simulator}`}
      </button>

      <BottomSheet open={open} onOpenChange={setOpen} title="Dev panel">
        <div className="flex flex-col gap-5 pb-2">
          <Group title="Language">
            <SegmentedControl<Language>
              label="Language"
              value={language ?? 'en'}
              onChange={setLanguage}
              options={[
                { value: 'en', label: 'English' },
                { value: 'he', label: 'עברית' },
              ]}
            />
          </Group>

          <Group title={`Theme (resolved: ${resolved})`}>
            <SegmentedControl<ThemePreference>
              label="Theme"
              value={theme}
              onChange={setTheme}
              options={[
                { value: 'light', label: 'Light' },
                { value: 'dark', label: 'Dark' },
                { value: 'system', label: 'System' },
              ]}
            />
          </Group>

          <Group title="Network simulator">
            <div className="grid grid-cols-2 gap-2">
              {SIMULATOR.map((m) => (
                <button
                  key={m.value}
                  type="button"
                  aria-pressed={simulator === m.value}
                  onClick={() => setSimulator(m.value)}
                  className={cn(
                    'rounded-tile flex min-h-14 flex-col items-start justify-center border-2 px-3 py-1.5 text-start',
                    simulator === m.value ? 'border-primary bg-pill' : 'border-border bg-surface',
                  )}
                >
                  <span className="text-secondary font-extrabold">{m.label}</span>
                  <span className="text-micro text-text-2">{m.hint}</span>
                </button>
              ))}
            </div>
            <Button size="compact" variant="secondary" onClick={() => void qc.resetQueries()}>
              Reset query cache
            </Button>
          </Group>

          <Group title="Mock scenario">
            <select
              value={scenario}
              onChange={(e) => setScenario(e.target.value as Scenario)}
              className="rounded-input border-border bg-surface min-h-12 border-[1.5px] px-3"
            >
              {SCENARIOS.map((s) => (
                <option key={s} value={s}>
                  {SCENARIO_LABEL[s]}
                </option>
              ))}
            </select>
          </Group>

          <Group title="Session">
            <p className="text-meta text-text-2 m-0">
              {session.accessToken ? 'Signed in' : 'Signed out'}
              {session.locked && ' · LOCKED'}
              {session.activeResidentId && ` · resident ${session.activeResidentId}`}
            </p>
            <p className="text-meta text-text-2 m-0">
              Sign in: <Ltr>{DEV_HINTS.identifier}</Ltr> · <Ltr>{DEV_HINTS.password}</Ltr> · OTP{' '}
              <Ltr>{DEV_HINTS.otp}</Ltr>
            </p>
            <SegmentedControl<'default' | '30'>
              label="Idle lock"
              value={idleSeconds ? '30' : 'default'}
              onChange={(v) => setIdleSeconds(v === '30' ? 30 : null)}
              options={[
                { value: 'default', label: 'Idle 10 min' },
                { value: '30', label: 'Idle 30 s' },
              ]}
            />
            <div className="flex flex-wrap gap-2">
              {session.accessToken && !session.locked && (
                <Button
                  size="compact"
                  onClick={() => {
                    session.lock()
                    setOpen(false)
                  }}
                >
                  Lock now
                </Button>
              )}
              {session.accessToken && (
                <Button
                  size="compact"
                  variant="secondary"
                  onClick={() => {
                    setOpen(false)
                    void logout()
                  }}
                >
                  Sign out
                </Button>
              )}
            </div>
          </Group>

          <Group title="Pages">
            <div className="flex flex-wrap gap-2">
              <Button asChild size="compact" variant="secondary">
                <Link to="/dev/components" onClick={() => setOpen(false)}>
                  Components
                </Link>
              </Button>
              <Button asChild size="compact" variant="secondary">
                <Link to="/splash" onClick={() => setOpen(false)}>
                  Splash
                </Link>
              </Button>
              <Button asChild size="compact" variant="secondary">
                <Link to="/welcome/language" onClick={() => setOpen(false)}>
                  Language
                </Link>
              </Button>
            </div>
          </Group>
        </div>
      </BottomSheet>
    </>
  )
}

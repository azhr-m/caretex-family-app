import { useQuery } from '@tanstack/react-query'
import { createFileRoute, notFound } from '@tanstack/react-router'
import {
  Bell,
  Building2,
  CalendarDays,
  ChevronRight,
  ClipboardList,
  FileText,
  Inbox,
  Megaphone,
  Newspaper,
  Palette,
  PartyPopper,
  PenLine,
  Phone,
  Plus,
  RefreshCcwDot,
  Send,
  Stethoscope,
  UserRound,
  Wifi,
  WifiOff,
} from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { devDemoQuery } from '@/api/queries/dev'
import { AppFrame } from '@/components/app/AppFrame'
import { AppHeader, AppHeaderSkeleton } from '@/components/app/AppHeader'
import { TabBar } from '@/components/app/TabBar'
import { TopBar } from '@/components/app/TopBar'
import { Avatar } from '@/components/common/Avatar'
import { Card, InfoBox, NavyCard } from '@/components/common/Card'
import { DirIcon } from '@/components/common/DirIcon'
import { IconTile } from '@/components/common/IconTile'
import { ImagePlaceholder } from '@/components/common/ImagePlaceholder'
import { ListGroup, ListRow } from '@/components/common/ListRow'
import { Ltr } from '@/components/common/Ltr'
import { SectionHeader } from '@/components/common/SectionHeader'
import { StatusChip } from '@/components/common/StatusChip'
import { ProgressBar, Stepper } from '@/components/common/Stepper'
import { QueryBoundary } from '@/components/states/QueryBoundary'
import {
  EmptyState,
  ErrorState,
  PermissionState,
  ResultScreen,
  SectionError,
  SlowNotice,
} from '@/components/states/states'
import { Banner } from '@/components/ui/banner'
import { BottomSheet } from '@/components/ui/bottom-sheet'
import { Button } from '@/components/ui/button'
import { Fab } from '@/components/ui/fab'
import { PasswordField, TextArea, TextField } from '@/components/ui/fields'
import { FilterChips } from '@/components/ui/filter-chips'
import { SegmentedControl } from '@/components/ui/segmented-control'
import { ListSkeleton, Skeleton } from '@/components/ui/skeleton'
import { toast } from '@/components/ui/toast'
import { Toggle, ToggleRow } from '@/components/ui/toggle'
import { dateTime, formatPhone } from '@/lib/format'
import { STATUS, TONES, type Status } from '@/lib/status'
import { usePrefsStore } from '@/stores/prefs'

export const Route = createFileRoute('/dev/components')({
  beforeLoad: () => {
    if (!import.meta.env.DEV) throw notFound()
  },
  component: ComponentsPage,
})

// Dev-only gallery: sample copy here is intentionally not translated.
const LONG_EN =
  'A very long resident update title that keeps going to make sure that wrapping works correctly at 320 pixels wide'
const LONG_HE =
  'כותרת ארוכה מאוד של עדכון על הדייר שממשיכה עוד ועוד כדי לוודא שהגלישה עובדת נכון ברוחב 320 פיקסלים'

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <SectionHeader>{title}</SectionHeader>
      {children}
    </section>
  )
}

function DemoQuery() {
  const query = useQuery(devDemoQuery('demo'))
  return (
    <QueryBoundary
      query={query}
      skeleton={<ListSkeleton rows={3} />}
      isEmpty={(d) => d.items.length === 0}
      empty={<EmptyState icon={Inbox} title="You're all caught up" />}
    >
      {(data) => (
        <ListGroup>
          {data.items.map((item) => (
            <ListRow
              key={item.id}
              icon={FileText}
              tone={STATUS[item.status].tone}
              title={item.title}
              meta={<Ltr>{dateTime(item.updatedAt)}</Ltr>}
              end={<StatusChip status={item.status} size="sm" />}
              onClick={() => toast.success({ title: 'Opened', body: item.title })}
            />
          ))}
        </ListGroup>
      )}
    </QueryBoundary>
  )
}

function ComponentsPage() {
  const { i18n } = useTranslation()
  const lang = i18n.language
  const setLanguage = usePrefsStore((s) => s.setLanguage)
  const theme = usePrefsStore((s) => s.theme)
  const setTheme = usePrefsStore((s) => s.setTheme)

  const [seg, setSeg] = useState<'month' | 'week' | 'list'>('month')
  const [chip, setChip] = useState('all')
  const [toggle, setToggle] = useState(true)
  const [text, setText] = useState('')
  const [sheet, setSheet] = useState(false)
  const [fab, setFab] = useState(false)
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState(1)

  const statuses = Object.keys(STATUS) as Status[]

  return (
    <AppFrame>
      <TopBar title="Components" backLabel="Back" fallbackHref="/" />
      <main className="flex min-w-0 flex-col gap-8 px-4 pt-4 pb-[120px]">
        <Section title="Controls">
          <SegmentedControl
            label="Language"
            value={lang === 'he' ? 'he' : 'en'}
            onChange={setLanguage}
            options={[
              { value: 'en', label: 'English' },
              { value: 'he', label: 'עברית' },
            ]}
          />
          <SegmentedControl
            label="Theme"
            value={theme}
            onChange={setTheme}
            options={[
              { value: 'light', label: 'Light' },
              { value: 'dark', label: 'Dark' },
              { value: 'system', label: 'System' },
            ]}
          />
        </Section>

        <Section title="Demo query (network simulator)">
          <p className="text-meta text-text-2 m-0">
            Switch modes in the Dev panel, then “Reset query cache” to see skeleton → slow notice → error /
            offline / permission states.
          </p>
          <DemoQuery />
        </Section>

        <Section title="Status chips">
          <div className="flex flex-wrap gap-2">
            {statuses.map((s) => (
              <StatusChip key={s} status={s} />
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            <StatusChip status="new" size="sm" />
            <StatusChip status="signed" size="lg" />
          </div>
        </Section>

        <Section title="Icon tiles">
          <div className="flex flex-wrap items-end gap-2">
            {TONES.map((tone) => (
              <IconTile key={tone} icon={Stethoscope} tone={tone} />
            ))}
          </div>
          <div className="flex flex-wrap items-end gap-3">
            <IconTile icon={Bell} tone="blue" size={36} />
            <IconTile icon={Bell} tone="blue" size={42} />
            <IconTile icon={Bell} tone="blue" size={56} />
            <IconTile icon={Bell} tone="blue" size={96} bordered />
          </div>
        </Section>

        <Section title="Buttons">
          <Button icon={Send} block loading={loading} onClick={() => setLoading((v) => !v)}>
            Send inquiry (tap to toggle loading)
          </Button>
          <Button icon={PenLine} block disabled>
            Sign and send
          </Button>
          <Button variant="secondary" icon={Phone} block>
            Call the care center
          </Button>
          <Button variant="danger" block>
            Decline
          </Button>
          <Button variant="dangerSolid" block>
            Log out
          </Button>
          <div className="flex flex-wrap items-center gap-2">
            <Button size="compact" icon={Plus}>
              New
            </Button>
            <Button size="compact" variant="secondary">
              Clear
            </Button>
            <Button size="compact" variant="tonal">
              Undo
            </Button>
            <Button variant="link" size="link" iconEnd={ChevronRight}>
              Read the full update
            </Button>
          </div>
        </Section>

        <Section title="Cards">
          <Card className="flex flex-col gap-1">
            <span className="text-body font-extrabold">Card title</span>
            <span className="text-secondary text-text-2">{lang === 'he' ? LONG_HE : LONG_EN}</span>
          </Card>
          <NavyCard className="flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <Avatar initials="ML" tone="pink" size={60} />
              <div className="flex min-w-0 flex-col">
                <span className="text-title-sm font-extrabold">Miriam Levi</span>
                <span className="text-secondary opacity-80">Ward B · Room 12</span>
              </div>
            </div>
            <Button variant="onNavy" size="compact" icon={UserRound}>
              Resident profile
            </Button>
          </NavyCard>
          <InfoBox icon={ClipboardList}>
            This information is shared by the care center for your awareness.
          </InfoBox>
        </Section>

        <Section title="List rows">
          <SectionHeader icon={Bell} count={3}>
            Needs your attention
          </SectionHeader>
          <ListGroup>
            <ListRow
              icon={Megaphone}
              tone="blue"
              kind="Update"
              title="Morning activity in the garden"
              meta="Today · 09:41"
              onClick={() => {}}
            />
            <ListRow
              icon={Newspaper}
              tone="violet"
              kind="Newsletter"
              title={lang === 'he' ? LONG_HE : LONG_EN}
              meta="Yesterday"
              onClick={() => {}}
            />
            <ListRow
              icon={PartyPopper}
              tone="pink"
              title="Static row (no action)"
              meta={<Ltr>INQ-2041</Ltr>}
            />
          </ListGroup>
        </Section>

        <Section title="Fields">
          <TextField
            label="Phone number or username"
            icon={UserRound}
            placeholder="050-123-4567"
            ltr
            helper="We'll never share it."
          />
          <TextField
            label="With error"
            icon={Phone}
            defaultValue="12"
            ltr
            error="Enter a valid mobile number, for example 050-123-4567"
          />
          <PasswordField label="Password" placeholder="••••••••" />
          <TextArea
            label="Message"
            value={text}
            onChange={(e) => setText(e.target.value)}
            maxLength={1000}
            warnAt={900}
            helper="At least 10 characters"
          />
        </Section>

        <Section title="Segmented control & filter chips">
          <SegmentedControl
            label="View"
            value={seg}
            onChange={setSeg}
            options={[
              { value: 'month', label: 'Month', icon: CalendarDays },
              { value: 'week', label: 'Week' },
              { value: 'list', label: 'List' },
            ]}
          />
          <FilterChips
            label="Category"
            value={chip}
            onChange={setChip}
            options={[
              { value: 'all', label: 'All', count: 12 },
              { value: 'updates', label: 'Updates', icon: Megaphone, count: 4 },
              { value: 'news', label: 'Newsletters', icon: Newspaper },
              { value: 'activities', label: 'Activities', icon: Palette },
              { value: 'events', label: 'Events & invitations', icon: PartyPopper },
            ]}
          />
        </Section>

        <Section title="Stepper & progress">
          <Stepper
            current={step}
            steps={[{ label: 'Sent' }, { label: 'Received' }, { label: 'In progress' }, { label: 'Handled' }]}
          />
          <ProgressBar value={step + 1} max={4} label="Progress" />
          <div className="flex gap-2">
            <Button size="compact" variant="secondary" onClick={() => setStep((s) => Math.max(0, s - 1))}>
              Previous
            </Button>
            <Button size="compact" variant="secondary" onClick={() => setStep((s) => Math.min(3, s + 1))}>
              Next
            </Button>
          </div>
        </Section>

        <Section title="Toggles">
          <div className="flex gap-6">
            <Toggle checked={toggle} onCheckedChange={setToggle} />
            <Toggle checked={false} />
            <Toggle checked locked />
          </div>
          <ListGroup>
            <ToggleRow
              icon={Megaphone}
              tone="blue"
              label="Updates about Miriam"
              description="Photos, daily notes"
              checked={toggle}
              onCheckedChange={setToggle}
            />
            <ToggleRow
              icon={Bell}
              tone="slate"
              label="Security alerts"
              description="Always on"
              checked
              locked
              onCheckedChange={() => {}}
            />
          </ListGroup>
        </Section>

        <Section title="Utilities">
          <Card className="text-secondary flex flex-col gap-2">
            <span>
              Phone: <Ltr>{formatPhone('+97235550100')}</Ltr> · Ref: <Ltr>INQ-2041</Ltr> · <Ltr>CARETEX</Ltr>
            </span>
            <span className="flex items-center gap-2">
              Mirrors: <DirIcon icon={ChevronRight} size={20} /> · Never mirrors:{' '}
              <Bell aria-hidden size={20} />
            </span>
          </Card>
          <ImagePlaceholder caption="photo · garden activity" className="rounded-card h-40" />
          <ImagePlaceholder caption="Photo unavailable" broken className="rounded-card h-24" />
        </Section>

        <Section title="Banners">
          <Banner
            variant="offline"
            icon={WifiOff}
            title="No internet connection"
            body="Showing information saved at 09:30."
          />
          <Banner
            variant="changed"
            icon={RefreshCcwDot}
            title="This information has changed since you opened it"
            action={<Button size="compact">Refresh</Button>}
          />
          <Banner variant="online" icon={Wifi} title="You're back online" />
        </Section>

        <Section title="Skeletons">
          <Skeleton className="rounded-card h-24" />
          <ListSkeleton rows={2} />
        </Section>

        <Section title="States">
          <Card className="p-0">
            <EmptyState icon={Inbox} title="You're all caught up" body="Nothing new since your last visit." />
          </Card>
          <Card className="p-0">
            <ErrorState onRetry={() => {}} requestId="req_8f2a91c0" contactPhone="+97235550100" />
          </Card>
          <Card className="p-0">
            <ErrorState variant="offline" onRetry={() => {}} />
          </Card>
          <Card className="p-0">
            <PermissionState kind="denied" />
          </Card>
          <Card className="p-0">
            <PermissionState kind="notShared" />
          </Card>
          <SectionError onRetry={() => {}} />
          <SlowNotice onRetry={() => {}} />
          <Card className="p-0">
            <ResultScreen
              icon={Send}
              tone="green"
              status="completed"
              statusLabel="Sent"
              title="Your inquiry was sent"
              body="The nursing team will reply here. We'll notify you."
              actions={<Button block>Back to inquiries</Button>}
            />
          </Card>
        </Section>

        <Section title="Overlays">
          <Button variant="secondary" block onClick={() => setSheet(true)}>
            Open bottom sheet
          </Button>
          <Button
            variant="secondary"
            block
            onClick={() =>
              toast.success({ title: 'Saved', body: 'Your notification preferences were updated' })
            }
          >
            Success toast
          </Button>
          <Button
            variant="secondary"
            block
            onClick={() =>
              toast.error({
                title: "We couldn't send your request",
                action: { label: 'Try again', onClick: () => {} },
              })
            }
          >
            Error toast
          </Button>
          <Button variant="secondary" block onClick={() => setFab((v) => !v)}>
            Toggle FAB
          </Button>
        </Section>

        <Section title="App header, top bar, tab bar">
          <div className="border-border -mx-4 overflow-hidden border-y">
            <AppHeader
              resident={{ name: 'Miriam Levi', initials: 'ML', place: 'Ward B · Room 12', tone: 'pink' }}
              unread={5}
              onSwitch={() => setSheet(true)}
              onNotifications={() => {}}
            />
            <AppHeaderSkeleton />
            <TopBar
              title="Documents"
              backLabel="More"
              onBack={() => {}}
              end={
                <Button variant="link" size="link">
                  Mark all read
                </Button>
              }
            />
            <TabBar rid="demo" badges={{ resident: 2, staff: 2, calendar: 1, more: 3 }} />
          </div>
        </Section>
      </main>

      <BottomSheet
        open={sheet}
        onOpenChange={setSheet}
        title="Switch resident"
        description="Choose whose information you want to see."
      >
        <ListGroup>
          <ListRow
            icon={UserRound}
            tone="pink"
            title="Miriam Levi"
            meta="Ward B · Room 12"
            onClick={() => setSheet(false)}
          />
          <ListRow
            icon={Building2}
            tone="teal"
            title="Avraham Cohen"
            meta="Ward D · Room 4"
            onClick={() => setSheet(false)}
          />
        </ListGroup>
      </BottomSheet>

      {fab && <Fab icon={Plus} label="New inquiry" onClick={() => setFab(false)} />}
    </AppFrame>
  )
}

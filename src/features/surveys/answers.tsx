import {
  Angry,
  Calendar,
  Check,
  ChevronDown,
  ChevronUp,
  Circle,
  CircleDot,
  Frown,
  Laugh,
  Meh,
  Smile,
  Square,
  SquareCheck,
  Star,
  ThumbsDown,
  ThumbsUp,
  type LucideIcon,
} from 'lucide-react'
import { useId, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { Answer, Question } from '@/api/schemas/surveys'
import { Ltr } from '@/components/common/Ltr'
import { TextArea } from '@/components/ui/fields'
import { date as fmtDate, dayInstant } from '@/lib/format'
import { toneClasses } from '@/lib/status'
import { cn } from '@/lib/utils'

const FACES: Record<number, LucideIcon> = { 1: Angry, 2: Frown, 3: Meh, 4: Smile, 5: Laugh }

type Props<Q extends Question['type']> = {
  question: Extract<Question, { type: Q }>
  value: Answer | undefined
  onChange: (value: Answer) => void
  labelledBy: string
}

/** Answer UI for one question (`05-states-and-validation.md` §5.6). */
export function AnswerInput({
  question,
  value,
  onChange,
  labelledBy,
}: {
  question: Question
  value: Answer | undefined
  onChange: (v: Answer) => void
  labelledBy: string
}) {
  const p = { value, onChange, labelledBy }
  switch (question.type) {
    case 'single':
      return <Choice {...p} question={question} />
    case 'satisfaction':
      return <Choice {...p} question={question} />
    case 'multiple':
      return <Multiple {...p} question={question} />
    case 'yes_no':
      return <YesNo {...p} question={question} />
    case 'number':
      return <NumberGrid {...p} question={question} />
    case 'stars':
      return <Stars {...p} question={question} />
    case 'text':
      return <TextAnswer {...p} question={question} />
    case 'date':
      return <DateAnswer {...p} question={question} />
    case 'dropdown':
      return <Dropdown {...p} question={question} />
  }
}

function OptionCard({
  selected,
  onClick,
  icon: Icon,
  role,
  children,
  end,
}: {
  selected: boolean
  onClick: () => void
  icon: LucideIcon
  role: 'radio' | 'checkbox'
  children: React.ReactNode
  end?: React.ReactNode
}) {
  return (
    <button
      type="button"
      role={role}
      aria-checked={selected}
      onClick={onClick}
      className={cn(
        'text-body-sm flex min-h-[58px] w-full items-center gap-3 rounded-[16px] border-2 px-3.5 py-2.5 text-start',
        selected ? 'border-primary bg-pill font-extrabold' : 'border-border bg-surface font-semibold',
      )}
    >
      <Icon aria-hidden size={24} className={cn('shrink-0', selected ? 'text-primary' : 'text-text-2')} />
      <span className="min-w-0 flex-1 wrap-break-word">{children}</span>
      {end}
    </button>
  )
}

function Choice({ question, value, onChange, labelledBy }: Props<'single' | 'satisfaction'>) {
  return (
    <div role="radiogroup" aria-labelledby={labelledBy} className="flex flex-col gap-2.5">
      {question.options.map((o) => {
        const selected = value === o.id
        const Face = 'level' in o ? FACES[o.level as number] : undefined
        return (
          <OptionCard
            key={o.id}
            role="radio"
            selected={selected}
            icon={selected ? CircleDot : Circle}
            onClick={() => onChange(o.id)}
            end={
              Face && (
                <Face aria-hidden size={22} className={cn('shrink-0', selected ? toneClasses.green.fg : 'text-text-2')} />
              )
            }
          >
            {o.label}
          </OptionCard>
        )
      })}
    </div>
  )
}

function Multiple({ question, value, onChange, labelledBy }: Props<'multiple'>) {
  const selected = Array.isArray(value) ? value : []
  const toggle = (id: string) => {
    if (selected.includes(id)) onChange(selected.filter((x) => x !== id))
    else if (!question.max || selected.length < question.max) onChange([...selected, id])
  }
  return (
    <div role="group" aria-labelledby={labelledBy} className="flex flex-col gap-2.5">
      {question.options.map((o) => {
        const on = selected.includes(o.id)
        return (
          <OptionCard key={o.id} role="checkbox" selected={on} icon={on ? SquareCheck : Square} onClick={() => toggle(o.id)}>
            {o.label}
          </OptionCard>
        )
      })}
    </div>
  )
}

function YesNo({ value, onChange, labelledBy }: Props<'yes_no'>) {
  const { t } = useTranslation('surveys')
  const opts = [
    { v: true, label: t('question.yes'), icon: ThumbsUp },
    { v: false, label: t('question.no'), icon: ThumbsDown },
  ]
  return (
    <div role="radiogroup" aria-labelledby={labelledBy} className="grid grid-cols-2 gap-2.5">
      {opts.map((o) => {
        const selected = value === o.v
        return (
          <button
            key={String(o.v)}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(o.v)}
            className={cn(
              'flex h-[120px] flex-col items-center justify-center gap-1.5 rounded-[18px] border-2',
              selected ? 'border-primary bg-pill' : 'border-border bg-surface',
            )}
          >
            <o.icon aria-hidden size={34} className={selected ? 'text-primary' : 'text-text-2'} />
            <span className="text-title-xs font-extrabold">{o.label}</span>
            <span className="text-tag text-green-fg h-4 font-extrabold">{selected ? t('question.selected') : ''}</span>
          </button>
        )
      })}
    </div>
  )
}

function NumberGrid({ question, value, onChange, labelledBy }: Props<'number'>) {
  const nums = Array.from({ length: question.max - question.min + 1 }, (_, i) => question.min + i)
  return (
    <div className="flex flex-col gap-2">
      <div role="radiogroup" aria-labelledby={labelledBy} dir="ltr" className="grid grid-cols-6 gap-2">
        {nums.map((n) => {
          const selected = value === n
          return (
            <button
              key={n}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => onChange(n)}
              className={cn(
                'text-title-xs h-12 rounded-[12px] border-2 font-extrabold tabular-nums',
                selected ? 'border-primary bg-primary text-on-primary' : 'border-border bg-surface',
              )}
            >
              {n}
            </button>
          )
        })}
      </div>
      <div className="text-meta text-text-2 flex justify-between gap-3 font-bold">
        <span>
          <Ltr>{question.min}</Ltr> · {question.minLabel}
        </span>
        <span className="text-end">
          <Ltr>{question.max}</Ltr> · {question.maxLabel}
        </span>
      </div>
    </div>
  )
}

function Stars({ question, value, onChange, labelledBy }: Props<'stars'>) {
  const { t } = useTranslation('surveys')
  const n = typeof value === 'number' ? value : 0
  return (
    <div className="flex flex-col items-center gap-3">
      <div role="radiogroup" aria-labelledby={labelledBy} dir="ltr" className="flex justify-center gap-1.5">
        {Array.from({ length: question.max }, (_, i) => i + 1).map((s) => (
          <button
            key={s}
            type="button"
            role="radio"
            aria-checked={n === s}
            aria-label={t('question.starLabel', { n: s, max: question.max, label: question.labels[s - 1] ?? '' })}
            onClick={() => onChange(s)}
            className="flex min-h-11 min-w-11 flex-col items-center gap-0.5"
          >
            <Star
              aria-hidden
              size={40}
              className={s <= n ? toneClasses.amber.fg : 'text-border'}
              fill={s <= n ? 'currentColor' : 'none'}
            />
            <span className="text-tag text-text-2 font-bold">{s}</span>
          </button>
        ))}
      </div>
      {n > 0 && (
        <span
          className={cn(
            'rounded-pill text-meta inline-flex items-center gap-1.5 border px-3 py-1 font-extrabold',
            toneClasses.amber.bg,
            toneClasses.amber.fg,
            toneClasses.amber.bd,
          )}
        >
          <Star aria-hidden size={15} />
          {t('question.starLabel', { n, max: question.max, label: question.labels[n - 1] ?? '' })}
        </span>
      )}
    </div>
  )
}

function TextAnswer({ question, value, onChange, labelledBy }: Props<'text'>) {
  const { t } = useTranslation('surveys')
  return (
    <TextArea
      aria-labelledby={labelledBy}
      value={typeof value === 'string' ? value : ''}
      onChange={(e) => onChange(e.target.value)}
      maxLength={question.maxLength}
      minHeight={160}
      placeholder={question.placeholder ?? undefined}
      helper={t('question.textHelp')}
    />
  )
}

function DateAnswer({ question, value, onChange, labelledBy }: Props<'date'>) {
  const { t } = useTranslation('surveys')
  const id = useId()
  const none = !!value && typeof value === 'object' && 'none' in value
  const iso = value && typeof value === 'object' && 'date' in value ? value.date : ''
  return (
    <div className="flex flex-col gap-2.5">
      <label
        htmlFor={id}
        className={cn(
          'rounded-input bg-surface relative flex min-h-[54px] items-center gap-2.5 border-[1.5px] px-3.5',
          iso ? 'border-primary border-2' : 'border-border',
          none && 'opacity-50',
        )}
      >
        <Calendar aria-hidden size={20} className="text-text-2 shrink-0" />
        <span className="text-body min-w-0 flex-1 font-bold">
          {iso ? <Ltr>{fmtDate(dayInstant(iso))}</Ltr> : <span className="text-text-2 font-normal">{t('question.datePlaceholder')}</span>}
        </span>
        <span className="text-meta text-link font-extrabold">{t('question.change')}</span>
        <input
          id={id}
          type="date"
          aria-labelledby={labelledBy}
          disabled={none}
          value={iso}
          min={question.minDate ?? undefined}
          max={question.maxDate ?? undefined}
          onChange={(e) => onChange(e.target.value ? { date: e.target.value } : null)}
          className="absolute inset-0 cursor-pointer opacity-0"
        />
      </label>
      <span className="text-meta text-text-2">{t('question.dateFormat')}</span>
      {question.allowNone && question.noneLabel && (
        <OptionCard
          role="checkbox"
          selected={none}
          icon={none ? SquareCheck : Square}
          onClick={() => onChange(none ? null : { none: true })}
        >
          {question.noneLabel}
        </OptionCard>
      )}
    </div>
  )
}

function Dropdown({ question, value, onChange, labelledBy }: Props<'dropdown'>) {
  const { t } = useTranslation('surveys')
  const [open, setOpen] = useState(!value)
  const listId = useId()
  const current = question.options.find((o) => o.id === value)
  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        aria-labelledby={labelledBy}
        onClick={() => setOpen((o) => !o)}
        className={cn(
          'rounded-input bg-surface text-body flex min-h-[54px] items-center gap-2.5 border-[1.5px] px-3.5 text-start',
          current ? 'border-primary border-2 font-extrabold' : 'border-border',
        )}
      >
        <span className={cn('min-w-0 flex-1', !current && 'text-text-2')}>{current?.label ?? t('question.dropdownPlaceholder')}</span>
        {open ? <ChevronUp aria-hidden size={20} /> : <ChevronDown aria-hidden size={20} />}
      </button>
      {open && (
        <div id={listId} role="listbox" aria-labelledby={labelledBy} className="rounded-input border-border bg-surface flex flex-col border p-1.5">
          {question.options.map((o) => {
            const selected = o.id === value
            return (
              <button
                key={o.id}
                type="button"
                role="option"
                aria-selected={selected}
                onClick={() => {
                  onChange(o.id)
                  setOpen(false)
                }}
                className={cn(
                  'text-body-sm flex min-h-12 items-center gap-2 rounded-[10px] px-3 text-start',
                  selected ? 'bg-pill font-extrabold' : 'font-semibold',
                )}
              >
                <span className="min-w-0 flex-1">{o.label}</span>
                {selected && <Check aria-hidden size={18} className="text-primary shrink-0" />}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

/** Plain-text answer for the review list and summaries. */
export function answerText(q: Question, a: Answer | undefined, t: (k: string, o?: Record<string, unknown>) => string) {
  if (a === undefined || a === null || a === '' || (Array.isArray(a) && !a.length)) return null
  switch (q.type) {
    case 'single':
    case 'dropdown':
    case 'satisfaction':
      return q.options.find((o) => o.id === a)?.label ?? null
    case 'multiple':
      return Array.isArray(a) ? q.options.filter((o) => a.includes(o.id)).map((o) => o.label).join(', ') : null
    case 'yes_no':
      return a === true ? t('question.yes') : t('question.no')
    case 'number':
      return t('review.numberAnswer', { n: a, max: q.max })
    case 'stars':
      return t('review.starsAnswer', { n: a, max: q.max })
    case 'text':
      return typeof a === 'string' ? a : null
    case 'date':
      if (typeof a === 'object' && a && 'none' in a) return q.noneLabel
      return typeof a === 'object' && a && 'date' in a ? fmtDate(dayInstant(a.date)) : null
  }
}

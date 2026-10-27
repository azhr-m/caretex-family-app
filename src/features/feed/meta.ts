import { Megaphone, Newspaper, Palette, PartyPopper, type LucideIcon } from 'lucide-react'
import type { FeedFilterCategory } from '@/api/endpoints/more'
import type { FeedCategory, FeedItem } from '@/api/schemas/feed'
import type { Tone } from '@/lib/status'

export const KIND_META: Record<FeedCategory, { icon: LucideIcon; tone: Tone }> = {
  update: { icon: Megaphone, tone: 'blue' },
  newsletter: { icon: Newspaper, tone: 'violet' },
  activity: { icon: Palette, tone: 'amber' },
  event: { icon: PartyPopper, tone: 'pink' },
}

/** URL chip keys (design names) → API `category`. */
export const CHIP_TO_CATEGORY = {
  all: 'all',
  updates: 'updates',
  news: 'newsletters',
  activities: 'activities',
  events: 'events',
} as const satisfies Record<string, FeedFilterCategory>

export type FeedChip = keyof typeof CHIP_TO_CATEGORY

/** Events open their invitation; everything else opens the feed detail. */
export const feedTarget = (item: FeedItem, rid: string) =>
  item.category === 'event' && item.eventId
    ? ({ to: '/r/$rid/more/events/$eventId', params: { rid, eventId: item.eventId } } as const)
    : ({ to: '/r/$rid/more/feed/$itemId', params: { rid, itemId: item.id } } as const)

import { linkOptions } from '@tanstack/react-router'
import type { DeepLink } from '@/api/schemas/dashboard'

const SECTIONS = ['general', 'updates', 'medical', 'care-plan', 'day'] as const
type Section = (typeof SECTIONS)[number]

/** Route for a server deep link. Links scoped to another linked resident open under that resident. */
export function deepLinkTarget(link: DeepLink, currentRid: string) {
  const rid = link.residentId ?? currentRid
  switch (link.type) {
    case 'update':
      return linkOptions({ to: '/r/$rid/resident/updates/$updateId', params: { rid, updateId: link.id } })
    case 'inquiry':
      return linkOptions({ to: '/r/$rid/staff/$inquiryId', params: { rid, inquiryId: link.id } })
    case 'document':
      return linkOptions({ to: '/r/$rid/more/documents/$docId', params: { rid, docId: link.id } })
    case 'calendar_item':
      return linkOptions({ to: '/r/$rid/calendar/$itemId', params: { rid, itemId: link.id } })
    case 'service_request':
      return linkOptions({ to: '/r/$rid/more/services/$requestId', params: { rid, requestId: link.id } })
    case 'survey':
      return linkOptions({ to: '/r/$rid/more/surveys/$surveyId', params: { rid, surveyId: link.id } })
    case 'event':
      return linkOptions({ to: '/r/$rid/more/events/$eventId', params: { rid, eventId: link.id } })
    case 'feed_item':
      return linkOptions({ to: '/r/$rid/more/feed/$itemId', params: { rid, itemId: link.id } })
    case 'resident_section': {
      const section: Section = (SECTIONS as readonly string[]).includes(link.id) ? (link.id as Section) : 'general'
      return linkOptions({ to: `/r/$rid/resident/${section}`, params: { rid } })
    }
  }
}

export type DeepLinkTarget = ReturnType<typeof deepLinkTarget>

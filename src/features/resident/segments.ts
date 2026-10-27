import { ClipboardList, HeartPulse, Info, Newspaper, Sun, type LucideIcon } from 'lucide-react'
import type { PermissionKey, Permissions } from '@/api/schemas/resident'

export type SegmentKey = 'general' | 'updates' | 'medical' | 'care-plan' | 'day'

export const SEGMENTS: { key: SegmentKey; permission: PermissionKey; icon: LucideIcon; labelKey: string }[] = [
  { key: 'general', permission: 'general', icon: Info, labelKey: 'segments.general' },
  { key: 'updates', permission: 'updates', icon: Newspaper, labelKey: 'segments.updates' },
  { key: 'medical', permission: 'medical', icon: HeartPulse, labelKey: 'segments.medical' },
  { key: 'care-plan', permission: 'carePlan', icon: ClipboardList, labelKey: 'segments.carePlan' },
  { key: 'day', permission: 'schedule', icon: Sun, labelKey: 'segments.day' },
]

/** `/resident` opens the first segment the member may see; General when nothing is known yet. */
export function firstPermittedSegment(p: Permissions | undefined): SegmentKey {
  if (!p) return 'general'
  return (
    SEGMENTS.find((s) => p[s.permission] === 'allowed')?.key ??
    SEGMENTS.find((s) => p[s.permission] !== 'hidden')?.key ??
    'general'
  )
}

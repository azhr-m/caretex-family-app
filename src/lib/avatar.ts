import type { Tone } from './status'

const RESIDENT_TONES: Tone[] = ['pink', 'teal', 'violet', 'blue', 'amber', 'green']

/** Stable initials tone by the resident's position in the member's linked list (Miriam pink, Avraham teal). */
export const residentTone = (index: number): Tone => RESIDENT_TONES[index % RESIDENT_TONES.length]!

export const MEMBER_TONE: Tone = 'pink'

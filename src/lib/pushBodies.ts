// No imports: vite.config.ts bundles this list into the service worker, which shows only these bodies.
export type PushBodyKind = 'message' | 'document' | 'event' | 'update' | 'request'

export const PUSH_BODIES: Record<'en' | 'he', Record<PushBodyKind, string>> = {
  en: {
    message: 'You have a new message',
    document: 'You have a new document waiting',
    event: 'You have a new event',
    update: 'You have a new update',
    request: 'There is an update on your request',
  },
  he: {
    message: 'יש לכם הודעה חדשה',
    document: 'יש לכם מסמך חדש שממתין',
    event: 'יש לכם אירוע חדש',
    update: 'יש לכם עדכון חדש',
    request: 'יש עדכון בבקשה שלכם',
  },
}

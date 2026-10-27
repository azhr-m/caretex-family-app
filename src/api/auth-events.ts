export type AuthEvent = 'blocked' | 'passwordChangeRequired' | 'locked'

type Listener = (event: AuthEvent) => void
const listeners = new Set<Listener>()

/** Lets the API layer ask the app to navigate without importing the router. */
export const authEvents = {
  emit(event: AuthEvent) {
    listeners.forEach((l) => l(event))
  },
  subscribe(listener: Listener) {
    listeners.add(listener)
    return () => {
      listeners.delete(listener)
    }
  },
}

/** First error message (an i18n key) for a field, shown after blur or a submit attempt. */
export function fieldErrorKey(meta: { errors: unknown[]; isBlurred: boolean }, submitted: boolean) {
  if (!meta.isBlurred && !submitted) return undefined
  const e = meta.errors[0]
  if (!e) return undefined
  return typeof e === 'string' ? e : (e as { message?: string }).message
}

/** Focus and scroll to the first invalid control inside `root` after the error render. */
export function focusFirstInvalid(root: HTMLElement | null) {
  requestAnimationFrame(() => {
    const el = root?.querySelector<HTMLElement>('[aria-invalid="true"]')
    el?.focus()
    el?.scrollIntoView({ block: 'center', behavior: 'smooth' })
  })
}

import { cn } from './utils'

describe('cn', () => {
  it('keeps a text color alongside a custom font-size token', () => {
    expect(cn('text-on-primary', 'text-button-lg')).toBe('text-on-primary text-button-lg')
    expect(cn('text-tag text-label', 'text-text-2')).toBe('text-tag text-text-2')
  })

  it('still dedupes conflicting tokens of the same kind', () => {
    expect(cn('text-body', 'text-meta')).toBe('text-meta')
    expect(cn('text-text', 'text-link')).toBe('text-link')
  })
})

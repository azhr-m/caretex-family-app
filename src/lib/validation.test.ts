import { DEFAULT_PASSWORD_POLICY as P } from '@/api/queries/auth'
import {
  forgotPhoneSchema,
  identifierSchema,
  meetsPolicy,
  normalizeIdentifier,
  passwordRules,
  passwordStrength,
  toE164,
} from './validation'

const issue = (r: { success: boolean; error?: { issues: { message: string }[] } }) =>
  r.error?.issues[0]?.message

describe('identifier', () => {
  it('accepts Israeli mobiles and usernames', () => {
    expect(identifierSchema.safeParse('050-123-4127').success).toBe(true)
    expect(identifierSchema.safeParse('501234127').success).toBe(true)
    expect(identifierSchema.safeParse('dana.cohen').success).toBe(true)
  })

  it('gives the right message per failure', () => {
    expect(issue(identifierSchema.safeParse('  '))).toBe('validation:identifierRequired')
    expect(issue(identifierSchema.safeParse('03-555-0100'))).toBe('validation:identifierInvalid')
    expect(issue(identifierSchema.safeParse('a!'))).toBe('validation:usernameInvalid')
  })

  it('normalizes phones to E.164 and leaves usernames', () => {
    expect(normalizeIdentifier(' 050-123 4127 ')).toBe('+972501234127')
    expect(normalizeIdentifier('dana.cohen')).toBe('dana.cohen')
    expect(toE164('50-123-4127')).toBe('+972501234127')
    expect(forgotPhoneSchema.safeParse('50-123-4127').success).toBe(true)
    expect(forgotPhoneSchema.safeParse('40-123-4127').success).toBe(false)
  })
})

describe('password rules', () => {
  it('checks each rule and the match', () => {
    const r = passwordRules(P, 'Miriam2026', '')
    expect(Object.fromEntries(r.map((x) => [x.key, x.ok]))).toEqual({
      length: true,
      upper: true,
      digit: true,
      special: false,
      match: false,
    })
    expect(passwordRules(P, 'Dana!2026', 'Dana!2026').every((x) => x.ok)).toBe(true)
  })

  it('scores strength 0–4', () => {
    expect(passwordStrength(P, '')).toBe(0)
    expect(passwordStrength(P, 'abc')).toBe(1)
    expect(passwordStrength(P, 'Miriam2026')).toBe(3)
    expect(passwordStrength(P, 'Dana!2026')).toBe(4)
    expect(meetsPolicy(P, 'Dana!2026')).toBe(true)
    expect(meetsPolicy(P, 'Miriam2026')).toBe(false)
  })
})

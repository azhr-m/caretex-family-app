import { z } from 'zod'
import type { PasswordPolicy } from '@/api/schemas/auth'

// Messages are i18n keys ("ns:key"); components translate them.
const PHONEISH = /^[\d\s-]+$/
const IL_MOBILE = /^0?5\d{8}$/
const USERNAME = /^[a-zA-Z0-9._-]{3,50}$/

const digitsOnly = (v: string) => v.replace(/[\s-]/g, '')

/** Phone-like identifiers become E.164 (+9725…); usernames are returned trimmed. */
export function normalizeIdentifier(raw: string) {
  const v = raw.trim()
  if (!PHONEISH.test(v)) return v
  return `+972${digitsOnly(v).replace(/^0/, '')}`
}

export const identifierSchema = z
  .string()
  .trim()
  .min(1, 'validation:identifierRequired')
  .superRefine((v, ctx) => {
    if (!v) return
    if (PHONEISH.test(v)) {
      if (!IL_MOBILE.test(digitsOnly(v)))
        ctx.addIssue({ code: 'custom', message: 'validation:identifierInvalid' })
    } else if (!USERNAME.test(v)) {
      ctx.addIssue({ code: 'custom', message: 'validation:usernameInvalid' })
    }
  })

export const passwordRequiredSchema = z.string().min(1, 'validation:passwordRequired')

/** Forgot-password phone: 9 digits starting with 5 (a leading 0 is tolerated). */
export const forgotPhoneSchema = z
  .string()
  .trim()
  .min(1, 'validation:phoneInvalid')
  .refine((v) => IL_MOBILE.test(digitsOnly(v)), 'validation:phoneInvalid')

export const toE164 = (localMobile: string) => `+972${digitsOnly(localMobile).replace(/^0/, '')}`

export type PasswordRuleKey = 'length' | 'upper' | 'digit' | 'special' | 'match'

export function passwordRules(policy: PasswordPolicy, password: string, confirm: string) {
  const specials = [...policy.specialChars]
  const rules: { key: PasswordRuleKey; ok: boolean }[] = [
    { key: 'length', ok: password.length >= policy.minLength },
  ]
  if (policy.requireUppercase) rules.push({ key: 'upper', ok: /[A-Z]/.test(password) })
  if (policy.requireDigit) rules.push({ key: 'digit', ok: /\d/.test(password) })
  if (policy.requireSpecial) rules.push({ key: 'special', ok: specials.some((c) => password.includes(c)) })
  rules.push({ key: 'match', ok: confirm.length > 0 && password === confirm })
  return rules
}

export type Strength = 0 | 1 | 2 | 3 | 4

/** 0 = empty; otherwise the number of character rules met (length, upper, digit, special), at least 1. */
export function passwordStrength(policy: PasswordPolicy, password: string): Strength {
  if (!password) return 0
  const met = passwordRules(policy, password, '').filter((r) => r.key !== 'match' && r.ok).length
  return Math.max(1, Math.min(4, met)) as Strength
}

export function meetsPolicy(policy: PasswordPolicy, password: string) {
  return passwordRules(policy, password, password).every((r) => r.ok)
}

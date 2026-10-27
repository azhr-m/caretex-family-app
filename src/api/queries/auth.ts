import { queryOptions, useMutation } from '@tanstack/react-query'
import {
  getPasswordPolicy,
  login,
  reauth,
  requestPasswordReset,
  resendOtp,
  resetPassword,
  setFirstPassword,
  verifyOtp,
} from '../endpoints/auth'
import { keys } from '../keys'
import type { PasswordPolicy } from '../schemas/auth'

/** Contract example; shown until the server policy arrives so the rule list never jumps. */
export const DEFAULT_PASSWORD_POLICY: PasswordPolicy = {
  minLength: 8,
  requireUppercase: true,
  requireDigit: true,
  requireSpecial: true,
  specialChars: '!@#$%^&*()-_=+[]{};:,.?',
  disallowPrevious: 3,
}

export const passwordPolicyQuery = () =>
  queryOptions({
    queryKey: keys.passwordPolicy(),
    queryFn: ({ signal }) => getPasswordPolicy(signal),
    staleTime: 60 * 60_000,
    placeholderData: DEFAULT_PASSWORD_POLICY,
  })

export const useLoginMutation = () => useMutation({ mutationFn: login, networkMode: 'always' })
export const useReauthMutation = () => useMutation({ mutationFn: reauth, networkMode: 'always' })
export const useFirstPasswordMutation = () =>
  useMutation({ mutationFn: setFirstPassword, networkMode: 'always' })
export const useForgotMutation = () =>
  useMutation({ mutationFn: requestPasswordReset, networkMode: 'always' })
export const useResendOtpMutation = () => useMutation({ mutationFn: resendOtp, networkMode: 'always' })
export const useVerifyOtpMutation = () => useMutation({ mutationFn: verifyOtp, networkMode: 'always' })
export const useResetPasswordMutation = () =>
  useMutation({ mutationFn: resetPassword, networkMode: 'always' })

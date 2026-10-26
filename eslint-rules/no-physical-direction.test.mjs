import { RuleTester } from 'eslint'
import { expect, test } from 'vitest'
import tseslint from 'typescript-eslint'
import rule, { findPhysicalClasses } from './no-physical-direction.js'

const tester = new RuleTester({
  languageOptions: { parser: tseslint.parser, parserOptions: { ecmaFeatures: { jsx: true } } },
})

tester.run('no-physical-direction', rule, {
  valid: [
    { code: '<div className="ms-2 pe-4 start-0 text-start rounded-s-lg border-e" />' },
    { code: 'cn("rtl:-scale-x-100 inset-inline-end")' },
    { code: 'const icon = "chevron-left"' },
  ],
  invalid: [
    { code: '<div className="ml-2" />', errors: [{ messageId: 'physical' }] },
    {
      code: '<div className="hover:pr-4 text-right" />',
      errors: [{ messageId: 'physical' }, { messageId: 'physical' }],
    },
    { code: 'cn("p-2", { "-left-3": active })', errors: [{ messageId: 'physical' }] },
    { code: 'cva("rounded-l-xl")', errors: [{ messageId: 'physical' }] },
  ],
})

test('findPhysicalClasses strips variants and negatives', () => {
  expect(findPhysicalClasses('md:!-mr-2 me-2 border-l-2 left')).toEqual(['md:!-mr-2', 'border-l-2', 'left'])
})

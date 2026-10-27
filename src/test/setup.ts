import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'
import { loadLanguage } from '@/lib/i18n'

await Promise.all([loadLanguage('en'), loadLanguage('he')])

afterEach(() => cleanup())

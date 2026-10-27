import { clsx, type ClassValue } from 'clsx'
import { extendTailwindMerge } from 'tailwind-merge'

// Our font-size tokens (text-body, text-title-md…) must not be mistaken for text colors,
// otherwise `text-on-primary text-button-lg` loses the color.
const twMerge = extendTailwindMerge({
  extend: {
    theme: {
      text: [
        'display',
        'title-xl',
        'title-lg',
        'title-md',
        'title-sm',
        'title-xs',
        'button-lg',
        'body',
        'body-sm',
        'secondary',
        'meta',
        'tag',
        'micro',
      ],
    },
  },
})

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function uuid() {
  return crypto.randomUUID()
}

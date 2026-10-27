/**
 * The resident's first name for headings like "Miriam's day". Residents only have a full name in the
 * API, so this takes the first word.
 */
export const firstName = (fullName: string) => fullName.trim().split(/\s+/)[0] ?? fullName

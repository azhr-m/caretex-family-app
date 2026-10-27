import { Search, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { TextField } from './fields'

const DEBOUNCE_MS = 300

/**
 * Search box whose committed value lives in the URL: typing updates it 300 ms after the last key,
 * and a URL change from outside (e.g. "Clear search and filters") shows up in the box.
 */
export function SearchField({
  committed,
  onSearch,
  label,
  placeholder,
  clearLabel,
}: {
  committed: string
  onSearch: (q: string) => void
  label: string
  placeholder: string
  clearLabel?: string
}) {
  const [value, setValue] = useState(committed)
  const [seen, setSeen] = useState(committed)
  if (committed !== seen) {
    setSeen(committed)
    if (committed !== value.trim()) setValue(committed)
  }
  const onSearchRef = useRef(onSearch)
  useEffect(() => {
    onSearchRef.current = onSearch
  })
  useEffect(() => {
    if (value.trim() === committed) return
    const id = setTimeout(() => onSearchRef.current(value.trim()), DEBOUNCE_MS)
    return () => clearTimeout(id)
  }, [value, committed])

  return (
    <div role="search">
      <TextField
        type="search"
        icon={Search}
        aria-label={label}
        placeholder={placeholder}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        enterKeyHint="search"
        trailing={
          value && clearLabel ? (
            <button
              type="button"
              onClick={() => {
                setValue('')
                onSearch('')
              }}
              className="text-meta text-text-2 flex min-h-11 shrink-0 items-center gap-1 px-1 font-extrabold"
            >
              <X aria-hidden size={16} />
              {clearLabel}
            </button>
          ) : undefined
        }
      />
    </div>
  )
}

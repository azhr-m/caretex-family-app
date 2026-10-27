import type { Photo } from '@/api/schemas/common'
import { API_BASE } from '@/api/client'

/** Hue from the photo id, so each mock photo is a distinct generated picture. */
const hueOf = (id: string) => [...id].reduce((h, c) => (h * 31 + c.charCodeAt(0)) % 360, 7)

export function photo(id: string, caption: string | null): Photo {
  return {
    id,
    url: `${API_BASE}/media/photos/${id}`,
    thumbnailUrl: `${API_BASE}/media/photos/${id}?size=thumb`,
    width: 1200,
    height: 900,
    caption,
  }
}

/** A soft illustrated scene (sky, hills, sun) as the "photo". Thumbnails are the same scene, smaller. */
export function photoSvg(id: string, thumb: boolean) {
  const hue = hueOf(id)
  const w = thumb ? 240 : 1200
  const h = thumb ? 180 : 900
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 1200 900">
<defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
<stop offset="0" stop-color="hsl(${hue},70%,78%)"/><stop offset="1" stop-color="hsl(${(hue + 40) % 360},60%,62%)"/>
</linearGradient></defs>
<rect width="1200" height="900" fill="url(#g)"/>
<circle cx="900" cy="230" r="110" fill="hsl(${(hue + 180) % 360},90%,85%)" opacity=".9"/>
<path d="M0 640 Q300 470 600 610 T1200 560 V900 H0Z" fill="hsl(${(hue + 90) % 360},35%,45%)" opacity=".85"/>
<path d="M0 760 Q350 620 700 740 T1200 700 V900 H0Z" fill="hsl(${(hue + 120) % 360},40%,32%)"/>
</svg>`
}

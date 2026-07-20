// Pull a prospect's visual identity out of their raw homepage HTML so the
// personalized mockup (and its email snapshot) renders in THEIR colors with
// THEIR logo. Deterministic parsing, no model calls — brand facts are in the
// markup, not a matter of opinion. Every field is best-effort nullable; the
// mockup falls back to Fieldstone blue when a site gives us nothing.

export interface BrandBundle {
  primary_color: string | null   // strongest saturated color found (hex, #rrggbb)
  palette: string[]              // up to 5 distinct saturated colors, most-used first
  logo_url: string | null        // absolute URL of the best logo candidate
  source: string | null          // where primary_color came from (debuggability)
}

const HEX_RE = /#([0-9a-fA-F]{6}|[0-9a-fA-F]{3})\b/g

function normalizeHex(raw: string): string {
  let h = raw.replace('#', '').toLowerCase()
  if (h.length === 3) h = h.split('').map(c => c + c).join('')
  return `#${h}`
}

function rgbOf(hex: string): [number, number, number] {
  const h = hex.slice(1)
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)]
}

// A "brand-worthy" color: saturated enough to be a choice, not chrome grey,
// and not so close to white/black that it's really just text or background.
function isBrandColor(hex: string): boolean {
  const [r, g, b] = rgbOf(hex)
  const max = Math.max(r, g, b), min = Math.min(r, g, b)
  const lum = (max + min) / 2
  return max - min > 32 && lum > 24 && lum < 232
}

function resolveUrl(candidate: string, base: string): string | null {
  try { return new URL(candidate, base).href } catch { return null }
}

export function extractBrand(rawHtml: string, siteUrl: string): BrandBundle {
  const out: BrandBundle = { primary_color: null, palette: [], logo_url: null, source: null }
  if (!rawHtml) return out

  // ── Colors ────────────────────────────────────────────────────────────
  // 1. theme-color meta is an explicit brand declaration — it wins outright.
  const themeMeta = rawHtml.match(/<meta[^>]+name=["']theme-color["'][^>]+content=["'](#[0-9a-fA-F]{3,6})["']/i)
    ?? rawHtml.match(/<meta[^>]+content=["'](#[0-9a-fA-F]{3,6})["'][^>]+name=["']theme-color["']/i)
  if (themeMeta) {
    const hex = normalizeHex(themeMeta[1])
    if (isBrandColor(hex)) { out.primary_color = hex; out.source = 'theme-color' }
  }

  // 2. Frequency-count every hex in <style> blocks + inline style attributes.
  const styleBlocks = [...rawHtml.matchAll(/<style[\s\S]*?<\/style>/gi)].map(m => m[0]).join('\n')
  const inlineStyles = [...rawHtml.matchAll(/style=["']([^"']*)["']/gi)].map(m => m[1]).join('\n')
  const counts = new Map<string, number>()
  for (const m of (styleBlocks + '\n' + inlineStyles).matchAll(HEX_RE)) {
    const hex = normalizeHex(m[0])
    if (isBrandColor(hex)) counts.set(hex, (counts.get(hex) ?? 0) + 1)
  }
  const ranked = [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([hex]) => hex)
  // Dedup near-identical shades (distance in RGB space) so the palette is 5
  // genuinely different colors, not five blues one notch apart.
  for (const hex of ranked) {
    const [r, g, b] = rgbOf(hex)
    const dupe = out.palette.some(p => {
      const [pr, pg, pb] = rgbOf(p)
      return Math.abs(r - pr) + Math.abs(g - pg) + Math.abs(b - pb) < 60
    })
    if (!dupe) out.palette.push(hex)
    if (out.palette.length >= 5) break
  }
  if (!out.primary_color && out.palette.length) {
    out.primary_color = out.palette[0]
    out.source = 'stylesheet-frequency'
  } else if (out.primary_color && !out.palette.includes(out.primary_color)) {
    out.palette.unshift(out.primary_color)
  }

  // ── Logo ──────────────────────────────────────────────────────────────
  // Ranked candidates: an <img> that self-identifies as a logo beats
  // og:image (usually a hero shot) beats apple-touch-icon (small but square).
  const imgTags = [...rawHtml.matchAll(/<img\b[^>]*>/gi)].map(m => m[0])
  const logoImg = imgTags.find(t => /logo/i.test(t) && /src=["'][^"']+["']/.test(t))
  const srcOf = (tag: string) => tag.match(/src=["']([^"']+)["']/i)?.[1] ?? null

  const candidates: [string | null, string][] = [
    [logoImg ? srcOf(logoImg) : null, 'img-logo'],
    [rawHtml.match(/<meta[^>]+property=["']og:logo["'][^>]+content=["']([^"']+)["']/i)?.[1] ?? null, 'og-logo'],
    [rawHtml.match(/<link[^>]+rel=["']apple-touch-icon[^"']*["'][^>]+href=["']([^"']+)["']/i)?.[1] ?? null, 'apple-touch-icon'],
    [rawHtml.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i)?.[1] ?? null, 'og-image'],
  ]
  for (const [src, _label] of candidates) {
    if (!src || src.startsWith('data:')) continue
    const abs = resolveUrl(src, siteUrl)
    if (abs) { out.logo_url = abs; break }
  }

  return out
}

/**
 * Resolve a company logo URL for a board token.
 * Called once per (ats, board_token) when the DB has no logo_url yet.
 */

const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'

function asString(v: unknown): string | null {
  if (v == null) return null
  if (typeof v === 'string') return v.trim() || null
  if (typeof v === 'number' || typeof v === 'boolean') return String(v)
  return null
}

function pickLogoField(obj: unknown): string | null {
  if (!obj || typeof obj !== 'object') return null
  const o = obj as Record<string, unknown>
  const keys = [
    'logo_url',
    'logoUrl',
    'logoURL',
    'logo',
    'squareLogoUrl',
    'square_logo_url',
    'companyLogoUrl',
    'company_logo_url',
    'cssLogoUrl',
    'imageUrl',
    'image_url',
    'avatarUrl',
    'avatar_url',
    'iconUrl',
    'icon_url'
  ]
  for (const k of keys) {
    const v = asString(o[k])
    if (v && looksLikeImageUrl(v)) return v
  }
  return null
}

function looksLikeImageUrl(url: string): boolean {
  const u = url.trim()
  if (!u) return false
  if (u.startsWith('data:image/')) return u.length > 64
  if (!/^https?:\/\//i.test(u) && !u.startsWith('//')) return false
  // Skip obvious non-logos / tracking pixels
  if (/1x1|pixel\.gif|spacer\.|blank\./i.test(u)) return false
  return true
}

function absolutize(url: string, base?: string): string | null {
  const raw = url.trim()
  if (!raw) return null
  try {
    if (raw.startsWith('//')) return `https:${raw}`
    if (/^https?:\/\//i.test(raw)) return raw
    if (base) return new URL(raw, base).href
  } catch {
    return null
  }
  return null
}

function extractMetaImage(html: string, baseUrl: string): string | null {
  const patterns: RegExp[] = [
    /<meta[^>]+property=["']og:image:secure_url["'][^>]+content=["']([^"']+)["']/i,
    /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image:secure_url["']/i,
    /<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i,
    /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i,
    /<meta[^>]+name=["']twitter:image(?::src)?["'][^>]+content=["']([^"']+)["']/i,
    /<meta[^>]+content=["']([^"']+)["'][^>]+name=["']twitter:image(?::src)?["']/i,
    /<link[^>]+rel=["']image_src["'][^>]+href=["']([^"']+)["']/i,
    /<link[^>]+href=["']([^"']+)["'][^>]+rel=["']image_src["']/i,
    /<link[^>]+rel=["']apple-touch-icon(?:-precomposed)?["'][^>]+href=["']([^"']+)["']/i,
    /<link[^>]+href=["']([^"']+)["'][^>]+rel=["']apple-touch-icon(?:-precomposed)?["']/i
  ]
  for (const re of patterns) {
    const m = html.match(re)
    if (!m?.[1]) continue
    const abs = absolutize(m[1], baseUrl)
    if (abs && looksLikeImageUrl(abs)) return abs
  }

  // Ashby / embedded JSON theme logo
  const jsonLogo = html.match(
    /"logo(?:Url)?"\s*:\s*"(https?:\\\/\\\/[^"]+|https?:\/\/[^"]+)"/i
  )
  if (jsonLogo?.[1]) {
    const decoded = jsonLogo[1].replace(/\\\//g, '/')
    const abs = absolutize(decoded, baseUrl)
    if (abs && looksLikeImageUrl(abs)) return abs
  }

  // Lever header logo
  const leverImg = html.match(
    /<img[^>]+(?:class|id)=["'][^"']*(?:main-header-logo|posting-logo|company-logo)[^"']*["'][^>]+src=["']([^"']+)["']/i
  )
  if (leverImg?.[1]) {
    const abs = absolutize(leverImg[1], baseUrl)
    if (abs && looksLikeImageUrl(abs)) return abs
  }

  return null
}

async function fetchText(
  url: string,
  init?: RequestInit
): Promise<{ ok: boolean; status: number; text: string; finalUrl: string }> {
  try {
    const res = await fetch(url, {
      headers: { Accept: '*/*', 'User-Agent': UA },
      redirect: 'follow',
      signal: AbortSignal.timeout(15000),
      ...init
    })
    const text = await res.text()
    return { ok: res.ok, status: res.status, text, finalUrl: res.url || url }
  } catch {
    return { ok: false, status: 0, text: '', finalUrl: url }
  }
}

async function logoFromCareerHtml(pageUrl: string): Promise<string | null> {
  const { ok, text, finalUrl } = await fetchText(pageUrl, {
    headers: {
      Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'User-Agent': UA,
      'Accept-Language': 'en-US,en;q=0.9'
    }
  })
  if (!ok || !text) return null
  return extractMetaImage(text, finalUrl || pageUrl)
}

/** Last-resort favicon for a hostname (still cached to disk by the caller). */
async function faviconForDomain(domain: string): Promise<string | null> {
  const host = domain.trim().toLowerCase().replace(/^https?:\/\//, '').split('/')[0]
  if (!host) return null
  const urls = [
    `https://www.google.com/s2/favicons?domain=${encodeURIComponent(host)}&sz=128`,
    `https://icons.duckduckgo.com/ip3/${encodeURIComponent(host)}.ico`
  ]
  for (const url of urls) {
    try {
      const res = await fetch(url, {
        headers: { Accept: 'image/*,*/*', 'User-Agent': UA },
        redirect: 'follow',
        signal: AbortSignal.timeout(12000)
      })
      if (res.ok) {
        const buf = Buffer.from(await res.arrayBuffer())
        if (buf.length > 64) return url
      }
    } catch {
      /* try next */
    }
  }
  return null
}

async function fetchBambooLogo(token: string): Promise<string | null> {
  const url = `https://${encodeURIComponent(token)}.bamboohr.com/careers/company-info`
  const { ok, text } = await fetchText(url, {
    headers: { Accept: 'application/json', 'User-Agent': UA }
  })
  if (!ok || !text) return null
  try {
    const data = JSON.parse(text) as Record<string, unknown>
    const result = (data.result ?? data) as Record<string, unknown>
    const fromResult = pickLogoField(result)
    if (fromResult) return absolutize(fromResult)
    // Nested branding / company objects
    for (const key of ['branding', 'company', 'theme', 'css']) {
      const nested = pickLogoField(result[key])
      if (nested) return absolutize(nested)
    }
  } catch {
    /* ignore */
  }
  return null
}

async function fetchBreezyLogo(token: string): Promise<string | null> {
  const url = `https://${encodeURIComponent(token)}.breezy.hr/json`
  const { ok, text } = await fetchText(url, {
    headers: { Accept: 'application/json', 'User-Agent': UA }
  })
  if (!ok || !text) return null
  try {
    const data = JSON.parse(text) as unknown
    const list = Array.isArray(data) ? data : []
    for (const raw of list) {
      if (!raw || typeof raw !== 'object') continue
      const company = (raw as Record<string, unknown>).company
      const logo = pickLogoField(company)
      if (logo) return absolutize(logo)
    }
  } catch {
    /* ignore */
  }
  return logoFromCareerHtml(`https://${encodeURIComponent(token)}.breezy.hr`)
}

/**
 * Extract a logo URL from a jobs-list JSON payload when the ATS embeds it
 * (currently Breezy). Returns null when not present.
 */
export function extractLogoFromListPayload(ats: string, data: unknown): string | null {
  if (ats === 'breezy_hr') {
    const list = Array.isArray(data) ? data : []
    for (const raw of list) {
      if (!raw || typeof raw !== 'object') continue
      const company = (raw as Record<string, unknown>).company
      const logo = pickLogoField(company)
      if (logo) return absolutize(logo)
    }
  }
  return null
}

/**
 * Resolve company logo URL for an ATS board token.
 * Prefer free list-payload URL when provided; otherwise ATS-specific fetch.
 */
export async function resolveBoardLogoUrl(
  ats: string,
  boardToken: string,
  fromListPayload?: string | null
): Promise<string | null> {
  const token = boardToken.trim().toLowerCase()
  if (!token) return null

  if (fromListPayload && looksLikeImageUrl(fromListPayload)) {
    return absolutize(fromListPayload)
  }

  switch (ats) {
    case 'bamboohr': {
      const logo =
        (await fetchBambooLogo(token)) ||
        (await logoFromCareerHtml(`https://${encodeURIComponent(token)}.bamboohr.com/careers`))
      if (logo) return logo
      return faviconForDomain(`${token}.bamboohr.com`)
    }
    case 'breezy_hr': {
      const logo = await fetchBreezyLogo(token)
      if (logo) return logo
      return faviconForDomain(`${token}.breezy.hr`)
    }
    case 'greenhouse': {
      const pages = [
        `https://job-boards.greenhouse.io/${encodeURIComponent(token)}`,
        `https://boards.greenhouse.io/${encodeURIComponent(token)}`
      ]
      for (const page of pages) {
        const logo = await logoFromCareerHtml(page)
        if (logo) return logo
      }
      return faviconForDomain('greenhouse.io')
    }
    case 'lever': {
      const logo = await logoFromCareerHtml(`https://jobs.lever.co/${encodeURIComponent(token)}`)
      if (logo) return logo
      return faviconForDomain('lever.co')
    }
    case 'ashby': {
      const logo = await logoFromCareerHtml(`https://jobs.ashbyhq.com/${encodeURIComponent(token)}`)
      if (logo) return logo
      return faviconForDomain('ashbyhq.com')
    }
    case 'smartrecruiters': {
      const pages = [
        `https://careers.smartrecruiters.com/${encodeURIComponent(token)}`,
        `https://jobs.smartrecruiters.com/${encodeURIComponent(token)}`
      ]
      for (const page of pages) {
        const logo = await logoFromCareerHtml(page)
        if (logo) return logo
      }
      return faviconForDomain('smartrecruiters.com')
    }
    default:
      return null
  }
}

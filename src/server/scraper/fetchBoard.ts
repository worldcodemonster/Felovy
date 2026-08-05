import { XMLParser } from 'fast-xml-parser'
import type { RemoteStatus, UnifiedJob } from '@/lib/board-search-types'
import { extractLogoFromListPayload } from './fetchLogo'

export interface PlatformConfig {
  slug: string
  label: string
  list_url_template: string | null
  headers_json: string
  pagination_json: string | null
  jobs_path: string | null
  response_format: string | null
  description_from_list: number
  integration: string | null
}

function asString(v: unknown): string | null {
  if (v == null) return null
  if (typeof v === 'string') return v
  if (typeof v === 'number' || typeof v === 'boolean') return String(v)
  return null
}

function asJson(v: unknown): string | null {
  if (v == null) return null
  try {
    return JSON.stringify(v)
  } catch {
    return null
  }
}

function htmlToText(html: string | null): string | null {
  if (!html) return null
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ')
    .trim() || null
}

function detectRemote(text: string | null | undefined): RemoteStatus {
  if (!text) return null
  const t = text.toLowerCase()
  if (/\bremote\b/.test(t) && !/\bhybrid\b/.test(t)) return 'remote'
  if (/\bhybrid\b/.test(t)) return 'hybrid'
  if (/\bonsite\b|\bon-site\b|\bin[- ]office\b/.test(t)) return 'onsite'
  return null
}

function getByPath(obj: unknown, path: string): unknown {
  if (!path || path === '$' || path === '$[]') return obj
  const parts = path.replace(/^\$\.?/, '').split('.').filter(Boolean)
  let cur: unknown = obj
  for (const part of parts) {
    if (cur == null || typeof cur !== 'object') return undefined
    cur = (cur as Record<string, unknown>)[part]
  }
  return cur
}

function ensureArray(v: unknown): unknown[] {
  if (Array.isArray(v)) return v
  if (v == null) return []
  return [v]
}

function buildUrl(template: string, boardToken: string, offset = 0, page = 1): string {
  return template
    .replaceAll('{board_token}', boardToken)
    .replaceAll('{offset}', String(offset))
    .replaceAll('{page}', String(page))
}

function buildHeaders(headersJson: string, boardToken: string): Record<string, string> {
  const raw = JSON.parse(headersJson || '{}') as Record<string, string>
  const out: Record<string, string> = {}
  for (const [k, v] of Object.entries(raw)) {
    out[k] = String(v).replaceAll('{board_token}', boardToken)
  }
  if (!out['User-Agent']) out['User-Agent'] = 'Felovy/1.0'
  return out
}

async function fetchText(
  url: string,
  headers: Record<string, string>
): Promise<{ ok: boolean; status: number; text: string }> {
  const res = await fetch(url, { headers, redirect: 'follow' })
  const text = await res.text()
  return { ok: res.ok, status: res.status, text }
}

export interface BoardProbeResult {
  ok: boolean
  status: number
  error?: string
  url?: string
  method?: string
  ms?: number
  bytes?: number
  redirect?: string | null
}

export type ProbeLogFn = (entry: {
  phase: 'request' | 'response'
  ats: string
  token: string
  method: string
  url: string
  status?: number
  ok?: boolean
  ms?: number
  bytes?: number
  redirect?: string | null
  error?: string | null
}) => void

/**
 * SmartRecruiters' public postings API returns HTTP 200 + empty JSON for ANY
 * company slug (including completely fake ones). Validity must be checked via
 * the careers site: real companies return 200; unknown slugs 302 to the hub.
 */
async function probeSmartRecruiters(
  token: string,
  ats: string,
  onLog?: ProbeLogFn
): Promise<BoardProbeResult> {
  const method = 'GET'
  const url = `https://careers.smartrecruiters.com/${encodeURIComponent(token)}`
  onLog?.({ phase: 'request', ats, token, method, url })
  const started = Date.now()
  try {
    const res = await fetch(url, {
      headers: {
        Accept: 'text/html,application/xhtml+xml',
        'User-Agent': 'Felovy/1.0'
      },
      redirect: 'manual',
      signal: AbortSignal.timeout(20000)
    })
    const status = res.status
    const redirect = res.headers.get('location')
    const ms = Date.now() - started
    let bytes = 0
    let result: BoardProbeResult

    if (status === 200) {
      const text = await res.text()
      bytes = Buffer.byteLength(text)
      result = { ok: true, status, url, method, ms, bytes, redirect: null }
    } else if ([301, 302, 303, 307, 308].includes(status)) {
      const loc = (redirect || '').trim()
      if (
        /^https?:\/\/(www\.)?jobs\.smartrecruiters\.com\/?$/i.test(loc) ||
        /^https?:\/\/(www\.)?jobs\.smartrecruiters\.com\/?\?/i.test(loc)
      ) {
        result = {
          ok: false,
          status,
          error: 'company not found',
          url,
          method,
          ms,
          bytes: 0,
          redirect: loc
        }
      } else if (loc.toLowerCase().includes(token.toLowerCase())) {
        result = { ok: true, status, url, method, ms, bytes: 0, redirect: loc }
      } else {
        result = {
          ok: false,
          status,
          error: `unexpected redirect: ${loc || '(none)'}`,
          url,
          method,
          ms,
          bytes: 0,
          redirect: loc || null
        }
      }
    } else if (status === 404 || status === 410) {
      result = {
        ok: false,
        status,
        error: `HTTP ${status}`,
        url,
        method,
        ms,
        bytes: 0,
        redirect: null
      }
    } else {
      result = {
        ok: false,
        status,
        error: `HTTP ${status}`,
        url,
        method,
        ms,
        bytes: 0,
        redirect: redirect
      }
    }

    onLog?.({
      phase: 'response',
      ats,
      token,
      method,
      url,
      status: result.status,
      ok: result.ok,
      ms: result.ms,
      bytes: result.bytes,
      redirect: result.redirect ?? null,
      error: result.error ?? null
    })
    return result
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    const ms = Date.now() - started
    onLog?.({
      phase: 'response',
      ats,
      token,
      method,
      url,
      status: 0,
      ok: false,
      ms,
      bytes: 0,
      redirect: null,
      error: msg
    })
    return { ok: false, status: 0, error: msg, url, method, ms, bytes: 0, redirect: null }
  }
}

/**
 * Lightweight board-token check: one list request, no job upsert.
 * Empty job lists with HTTP 200 count as valid (token exists) — except
 * SmartRecruiters, which requires a careers-site probe (see above).
 */
export async function probeBoardToken(
  platform: PlatformConfig,
  boardToken: string,
  onLog?: ProbeLogFn
): Promise<BoardProbeResult> {
  const token = boardToken.trim().toLowerCase()
  if (!token) return { ok: false, status: 0, error: 'empty token' }
  if (!platform.list_url_template) {
    return { ok: false, status: 0, error: 'platform not scrapeable' }
  }

  if (platform.slug === 'smartrecruiters') {
    return probeSmartRecruiters(token, platform.slug, onLog)
  }

  const method = 'GET'
  let url = buildUrl(platform.list_url_template, token, 0, 1)
  url = url.replace(/([?&])content=true\b/gi, '$1content=false')
  url = url.replace(/([?&])limit=\d+/gi, '$1limit=1')
  const headers = buildHeaders(platform.headers_json, token)
  onLog?.({ phase: 'request', ats: platform.slug, token, method, url })
  const started = Date.now()

  try {
    const res = await fetch(url, {
      headers,
      redirect: 'follow',
      signal: AbortSignal.timeout(20000)
    })
    const status = res.status
    const text = await res.text()
    const bytes = Buffer.byteLength(text)
    const ms = Date.now() - started
    const trimmed = text.trimStart()
    let result: BoardProbeResult

    if (status === 404 || status === 410 || status === 401 || status === 403) {
      result = { ok: false, status, error: `HTTP ${status}`, url, method, ms, bytes }
    } else if (!res.ok) {
      result = { ok: false, status, error: `HTTP ${status}`, url, method, ms, bytes }
    } else if (!trimmed) {
      result = { ok: false, status, error: 'empty response', url, method, ms, bytes }
    } else if (trimmed.startsWith('<') || /<!DOCTYPE/i.test(trimmed) || /<html/i.test(trimmed)) {
      result = { ok: false, status, error: 'HTML response', url, method, ms, bytes }
    } else {
      try {
        JSON.parse(text)
        result = { ok: true, status, url, method, ms, bytes }
      } catch {
        result = { ok: false, status, error: 'non-JSON response', url, method, ms, bytes }
      }
    }

    onLog?.({
      phase: 'response',
      ats: platform.slug,
      token,
      method,
      url,
      status: result.status,
      ok: result.ok,
      ms: result.ms,
      bytes: result.bytes,
      redirect: null,
      error: result.error ?? null
    })
    return result
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    const ms = Date.now() - started
    onLog?.({
      phase: 'response',
      ats: platform.slug,
      token,
      method,
      url,
      status: 0,
      ok: false,
      ms,
      bytes: 0,
      redirect: null,
      error: msg
    })
    return { ok: false, status: 0, error: msg, url, method, ms, bytes: 0 }
  }
}

function baseJob(ats: string, boardToken: string, jobId: string): UnifiedJob {
  return {
    job_id: jobId,
    board_token: boardToken,
    ats,
    title: null,
    company_name: null,
    location_name: null,
    absolute_url: null,
    first_published: null,
    updated_at: null,
    content_html: null,
    content_text: null,
    departments_json: null,
    offices_json: null,
    metadata_json: null,
    remote_status: null,
    language: null,
    employment_type: null,
    country_code: null
  }
}

function normalizeGreenhouse(ats: string, boardToken: string, data: unknown): UnifiedJob[] {
  const jobs = ensureArray(getByPath(data, 'jobs'))
  return jobs.map((raw) => {
    const j = raw as Record<string, unknown>
    const loc = j.location as Record<string, unknown> | undefined
    const content = asString(j.content)
    const job = baseJob(ats, boardToken, asString(j.id) || cryptoRandom())
    job.title = asString(j.title)
    job.company_name = asString(j.company_name) || boardToken
    job.location_name = asString(loc?.name)
    job.absolute_url = asString(j.absolute_url)
    job.first_published = asString(j.first_published)
    job.updated_at = asString(j.updated_at)
    job.content_html = content
    job.content_text = htmlToText(content)
    job.departments_json = asJson(j.departments)
    job.offices_json = asJson(j.offices)
    job.metadata_json = asJson(j.metadata)
    job.language = asString(j.language)
    job.remote_status = detectRemote(job.location_name)
    return job
  })
}

function normalizeLever(ats: string, boardToken: string, data: unknown): UnifiedJob[] {
  const jobs = ensureArray(data)
  return jobs.map((raw) => {
    const j = raw as Record<string, unknown>
    const cats = (j.categories || {}) as Record<string, unknown>
    const lists = (j.lists || []) as Array<{ text?: string }>
    const desc = lists.map((l) => l.text || '').join('\n') || asString(j.descriptionPlain) || asString(j.description)
    const job = baseJob(ats, boardToken, asString(j.id) || cryptoRandom())
    job.title = asString(j.text)
    job.company_name = boardToken
    job.location_name = asString(cats.location) || asString(j.workplaceType)
    job.absolute_url = asString(j.hostedUrl) || asString(j.applyUrl)
    job.first_published = j.createdAt ? new Date(Number(j.createdAt)).toISOString() : null
    job.updated_at = job.first_published
    job.content_html = asString(j.description)
    job.content_text = htmlToText(desc)
    job.departments_json = asJson(cats.department ? [cats.department] : null)
    job.employment_type = asString(cats.commitment)
    job.remote_status = detectRemote(asString(j.workplaceType) || job.location_name)
    return job
  })
}

function normalizeAshby(ats: string, boardToken: string, data: unknown): UnifiedJob[] {
  const jobs = ensureArray(getByPath(data, 'jobs'))
  return jobs.map((raw) => {
    const j = raw as Record<string, unknown>
    const loc = j.location as string | undefined
    const secondary = j.secondaryLocations as Array<{ location?: string }> | undefined
    const locations = [loc, ...(secondary?.map((s) => s.location) || [])].filter(Boolean).join('; ')
    const html = asString(j.descriptionHtml) || asString(j.descriptionPlain)
    const job = baseJob(ats, boardToken, asString(j.id) || asString(j.jobUrl) || cryptoRandom())
    job.title = asString(j.title)
    job.company_name = boardToken
    job.location_name = locations || null
    job.absolute_url = asString(j.jobUrl)
    job.first_published = asString(j.publishedAt)
    job.updated_at = asString(j.updatedAt) || job.first_published
    job.content_html = asString(j.descriptionHtml)
    job.content_text = htmlToText(html)
    job.departments_json = asJson(j.department ? [j.department] : null)
    job.employment_type = asString(j.employmentType)
    job.remote_status =
      j.isRemote === true ? 'remote' : detectRemote(locations)
    return job
  })
}

function normalizeWorkable(ats: string, boardToken: string, data: unknown): UnifiedJob[] {
  const jobs = ensureArray(getByPath(data, 'jobs'))
  return jobs.map((raw) => {
    const j = raw as Record<string, unknown>
    const city = asString(j.city)
    const country = asString(j.country)
    const loc = [city, country].filter(Boolean).join(', ')
    const html = asString(j.description)
    const job = baseJob(ats, boardToken, asString(j.shortcode) || asString(j.id) || cryptoRandom())
    job.title = asString(j.title)
    job.company_name = boardToken
    job.location_name = loc || asString(j.location)
    job.absolute_url = asString(j.url)
    job.first_published = asString(j.created_at) || asString(j.published_on)
    job.content_html = html
    job.content_text = htmlToText(html)
    job.departments_json = asJson(j.department ? [j.department] : null)
    job.employment_type = asString(j.employment_type)
    job.country_code = country
    job.remote_status = j.remote === true ? 'remote' : detectRemote(loc)
    return job
  })
}

function normalizeBamboo(ats: string, boardToken: string, data: unknown): UnifiedJob[] {
  const jobs = ensureArray(getByPath(data, 'result'))
  return jobs.map((raw) => {
    const j = raw as Record<string, unknown>
    const atsLoc = j.atsLocation as Record<string, unknown> | undefined
    const loc = j.location as Record<string, unknown> | undefined
    const locName =
      asString(atsLoc?.name) ||
      [asString(atsLoc?.city), asString(atsLoc?.state), asString(atsLoc?.country)]
        .filter(Boolean)
        .join(', ') ||
      [asString(loc?.city), asString(loc?.state), asString(loc?.country)].filter(Boolean).join(', ') ||
      null
    const id = asString(j.id) || cryptoRandom()
    const job = baseJob(ats, boardToken, id)
    job.title = asString(j.jobOpeningName) || asString(j.jobTitle)
    job.company_name = boardToken
    job.location_name = locName
    // List API usually omits jobOpeningShareUrl — construct public careers URL.
    job.absolute_url =
      asString(j.jobOpeningShareUrl) ||
      asString(j.shareUrl) ||
      `https://${boardToken}.bamboohr.com/careers/${id}`
    job.first_published = asString(j.datePosted)
    job.updated_at = job.first_published
    job.content_html = asString(j.description)
    job.content_text = htmlToText(job.content_html)
    job.departments_json = asJson(j.departmentLabel ? [j.departmentLabel] : null)
    job.employment_type = asString(j.employmentStatusLabel)
    job.country_code = asString(atsLoc?.country) || asString(loc?.country)
    job.remote_status =
      j.isRemote === true || j.locationType === '1' || j.locationType === 1
        ? 'remote'
        : detectRemote(locName)
    return job
  })
}

function normalizeSmartRecruiters(
  ats: string,
  boardToken: string,
  data: unknown
): UnifiedJob[] {
  const jobs = ensureArray(getByPath(data, 'content'))
  return jobs.map((raw) => {
    const j = raw as Record<string, unknown>
    const company = j.company as Record<string, unknown> | undefined
    const loc = j.location as Record<string, unknown> | undefined
    const dept = j.department as Record<string, unknown> | undefined
    const emp = j.typeOfEmployment as Record<string, unknown> | undefined
    const lang = j.language as Record<string, unknown> | undefined
    const id = asString(j.id) || asString(j.uuid) || cryptoRandom()
    const job = baseJob(ats, boardToken, id)
    job.title = asString(j.name)
    job.company_name = asString(company?.name) || boardToken
    job.location_name =
      asString(loc?.city) ||
      [asString(loc?.city), asString(loc?.region), asString(loc?.country)].filter(Boolean).join(', ')
    job.absolute_url = `https://jobs.smartrecruiters.com/${boardToken}/${id}`
    job.first_published = asString(j.releasedDate)
    job.updated_at = job.first_published
    job.departments_json = asJson(dept?.label ? [dept.label] : null)
    job.language = asString(lang?.code)
    job.employment_type = asString(emp?.label)
    job.country_code = asString(loc?.country)
    job.remote_status =
      loc?.remote === true ? 'remote' : loc?.remote === 'hybrid' ? 'hybrid' : detectRemote(job.location_name)
    return job
  })
}

function normalizeBreezy(ats: string, boardToken: string, data: unknown): UnifiedJob[] {
  const jobs = ensureArray(data)
  return jobs.map((raw) => {
    const j = raw as Record<string, unknown>
    const loc = j.location as Record<string, unknown> | string | undefined
    const locName =
      typeof loc === 'string'
        ? loc
        : asString((loc as Record<string, unknown>)?.name) ||
          [
            asString((loc as Record<string, unknown>)?.city),
            asString((loc as Record<string, unknown>)?.country?.['name' as never])
          ]
            .filter(Boolean)
            .join(', ')
    const id = asString(j.friendly_id) || asString(j._id) || asString(j.id) || cryptoRandom()
    const job = baseJob(ats, boardToken, id)
    const company = j.company as Record<string, unknown> | undefined
    job.title = asString(j.name)
    job.company_name = asString(company?.name) || boardToken
    job.location_name = locName || null
    job.absolute_url = `https://${boardToken}.breezy.hr/p/${id}`
    job.departments_json = asJson(j.department ? [j.department] : null)
    job.employment_type = asString(j.type)
    job.remote_status = detectRemote(locName)
    return job
  })
}

function normalizeGenericJson(
  ats: string,
  boardToken: string,
  data: unknown,
  jobsPath: string | null
): UnifiedJob[] {
  let list: unknown[]
  if (!jobsPath || jobsPath === '$[]') {
    list = ensureArray(data)
  } else {
    list = ensureArray(getByPath(data, jobsPath))
  }

  return list
    .map((raw) => {
      if (raw == null || typeof raw !== 'object') return null
      const j = raw as Record<string, unknown>
      const id =
        asString(j.id) ||
        asString(j.uuid) ||
        asString(j.slug) ||
        asString(j.shortcode) ||
        asString(j.friendly_id) ||
        asString(j.job_id) ||
        asString(j.url) ||
        cryptoRandom()
      const title =
        asString(j.title) ||
        asString(j.name) ||
        asString(j.text) ||
        asString(j.jobOpeningName) ||
        asString(j.position)
      const locObj = j.location as Record<string, unknown> | string | undefined
      const location =
        typeof locObj === 'string'
          ? locObj
          : asString(locObj?.name) ||
            asString(j.location_name) ||
            [asString(j.city), asString(j.country)].filter(Boolean).join(', ') ||
            null
      const html =
        asString(j.content) ||
        asString(j.descriptionHtml) ||
        asString(j.description) ||
        asString(j.body)
      const url =
        asString(j.absolute_url) ||
        asString(j.url) ||
        asString(j.hostedUrl) ||
        asString(j.jobUrl) ||
        asString(j.apply_url)
      const job = baseJob(ats, boardToken, id)
      job.title = title
      job.company_name = asString(j.company_name) || asString((j.company as Record<string, unknown>)?.name) || boardToken
      job.location_name = location
      job.absolute_url = url
      job.first_published =
        asString(j.first_published) ||
        asString(j.published_at) ||
        asString(j.created_at) ||
        asString(j.releasedDate)
      job.updated_at = asString(j.updated_at) || asString(j.updatedAt) || job.first_published
      job.content_html = html
      job.content_text = htmlToText(html) || asString(j.descriptionPlain)
      job.departments_json = asJson(j.departments || j.department)
      job.employment_type = asString(j.employment_type) || asString(j.employmentType) || asString(j.type)
      job.language = asString(j.language)
      job.country_code = asString(j.country_code) || asString(j.country)
      job.remote_status =
        j.isRemote === true || j.remote === true ? 'remote' : detectRemote(location)
      return job
    })
    .filter((j): j is UnifiedJob => Boolean(j && j.job_id && j.title))
}

function normalizePersonioXml(ats: string, boardToken: string, xml: string): UnifiedJob[] {
  const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: '@_' })
  const doc = parser.parse(xml)
  const positions = ensureArray(
    getByPath(doc, 'workzag-jobs.position') ||
      getByPath(doc, 'jobs.job') ||
      getByPath(doc, 'position')
  )
  return positions.map((raw) => {
    const j = raw as Record<string, unknown>
    const office = j.office as Record<string, unknown> | string | undefined
    const loc =
      typeof office === 'string'
        ? office
        : [asString((office as Record<string, unknown>)?.city), asString((office as Record<string, unknown>)?.country)]
            .filter(Boolean)
            .join(', ')
    const descs = ensureArray(
      getByPath(j, 'jobDescriptions.jobDescription') || getByPath(j, 'jobDescription')
    )
    const html = descs
      .map((d) => {
        const o = d as Record<string, unknown>
        return asString(o.value) || asString(o['#text']) || ''
      })
      .filter(Boolean)
      .join('\n')
    const id = asString(j.id) || cryptoRandom()
    const job = baseJob(ats, boardToken, id)
    job.title = asString(j.name)
    job.company_name = boardToken
    job.location_name = loc || null
    job.absolute_url = `https://${boardToken}.jobs.personio.de/job/${id}`
    if (ats === 'personio_com') {
      job.absolute_url = `https://${boardToken}.jobs.personio.com/job/${id}`
    }
    job.content_html = html || null
    job.content_text = htmlToText(html)
    job.departments_json = asJson(
      getByPath(j, 'department.name') ? [getByPath(j, 'department.name')] : null
    )
    job.employment_type = asString(j.employmentType)
    job.remote_status = detectRemote(loc)
    return job
  })
}

function normalizeRss(ats: string, boardToken: string, xml: string): UnifiedJob[] {
  const parser = new XMLParser({ ignoreAttributes: false })
  const doc = parser.parse(xml)
  const items = ensureArray(getByPath(doc, 'rss.channel.item') || getByPath(doc, 'feed.entry'))
  return items.map((raw) => {
    const j = raw as Record<string, unknown>
    const title = asString(j.title)
    const link = asString(j.link) || asString((j.link as Record<string, unknown>)?.['@_href'])
    const desc = asString(j.description) || asString(j.summary) || asString(j.content)
    const id = asString(j.guid) || link || title || cryptoRandom()
    const job = baseJob(ats, boardToken, id)
    job.title = title
    job.company_name = boardToken
    job.absolute_url = link
    job.content_html = desc
    job.content_text = htmlToText(desc)
    job.first_published = asString(j.pubDate) || asString(j.published)
    return job
  })
}

function cryptoRandom(): string {
  return `gen_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`
}

export interface ScrapeBoardResult {
  jobs: UnifiedJob[]
  /** Logo URL discovered in the jobs-list payload (e.g. Breezy), if any. */
  logoUrl: string | null
}

export async function scrapeBoard(
  platform: PlatformConfig,
  boardToken: string
): Promise<ScrapeBoardResult> {
  if (!platform.list_url_template) {
    throw new Error(`Platform ${platform.slug} has no list_url_template (not scrapeable via HTTP list)`)
  }

  const headers = buildHeaders(platform.headers_json, boardToken)
  const pagination = platform.pagination_json
    ? (JSON.parse(platform.pagination_json) as { type?: string; limit?: number })
    : null

  const all: UnifiedJob[] = []
  let logoUrl: string | null = null
  let offset = 0
  let page = 1
  const maxPages = 50

  for (let i = 0; i < maxPages; i++) {
    const url = buildUrl(platform.list_url_template, boardToken, offset, page)
    const { ok, status, text } = await fetchText(url, headers)
    if (!ok) {
      throw new Error(`HTTP ${status} for ${url}`)
    }

    const integ = (platform.integration || '').toLowerCase()
    const format = (platform.response_format || '').toLowerCase()
    let batch: UnifiedJob[] = []

    if (integ.includes('xml') || format === 'xml' || text.trimStart().startsWith('<')) {
      if (integ.includes('rss') || text.includes('<rss') || text.includes('<feed')) {
        batch = normalizeRss(platform.slug, boardToken, text)
      } else {
        batch = normalizePersonioXml(platform.slug, boardToken, text)
      }
    } else {
      let data: unknown
      try {
        data = JSON.parse(text)
      } catch {
        throw new Error(`Non-JSON response from ${url}`)
      }

      if (!logoUrl) {
        logoUrl = extractLogoFromListPayload(platform.slug, data)
      }

      switch (platform.slug) {
        case 'greenhouse':
          batch = normalizeGreenhouse(platform.slug, boardToken, data)
          break
        case 'lever':
          batch = normalizeLever(platform.slug, boardToken, data)
          break
        case 'ashby':
          batch = normalizeAshby(platform.slug, boardToken, data)
          break
        case 'workable':
          batch = normalizeWorkable(platform.slug, boardToken, data)
          break
        case 'bamboohr':
          batch = normalizeBamboo(platform.slug, boardToken, data)
          break
        case 'smartrecruiters':
          batch = normalizeSmartRecruiters(platform.slug, boardToken, data)
          break
        case 'breezy_hr':
          batch = normalizeBreezy(platform.slug, boardToken, data)
          break
        default:
          batch = normalizeGenericJson(platform.slug, boardToken, data, platform.jobs_path)
      }
    }

    all.push(...batch)

    if (!pagination || pagination.type !== 'offset_limit') break
    const limit = pagination.limit || 100
    if (batch.length < limit) break
    offset += limit
    page += 1
  }

  // Deduplicate by job_id
  const map = new Map<string, UnifiedJob>()
  for (const j of all) {
    if (j.job_id) map.set(j.job_id, j)
  }
  return { jobs: Array.from(map.values()), logoUrl }
}

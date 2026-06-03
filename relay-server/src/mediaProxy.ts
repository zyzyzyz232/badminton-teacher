export function mediaUrlCandidates(raw: string): string[] {
  const out: string[] = []
  try {
    const parsed = new URL(raw)
    const path = parsed.pathname
    const rel = path.replace(/^\//, '')

    out.push(raw)

    if (path.includes('/plan-materials/')) {
      if (!path.includes('/admin-api') && !path.includes('/app-api')) {
        out.push(`${parsed.origin}/app-api/${rel}${parsed.search}`)
        out.push(`${parsed.origin}/admin-api/${rel}${parsed.search}`)
      }
      out.push(`${parsed.origin}/admin-api/infra/file/1/get/${rel}${parsed.search}`)
    }
  } catch {
    out.push(raw)
  }
  return [...new Set(out)]
}

export function bearerTokenValue(token: string): string {
  return token.trim().replace(/^Bearer\s+/i, '')
}

export function authHeadersForMedia(token: string, tenantId = '1'): Record<string, string> {
  const bare = bearerTokenValue(token)
  if (!bare) return { 'Tenant-Id': tenantId }
  return {
    Authorization: `Bearer ${bare}`,
    'Tenant-Id': tenantId,
  }
}

export type MediaFetchAttempt = {
  url: string
  headers: Record<string, string>
}

/** 后台 CommonResult 即使 HTTP 200 也可能不是媒体流 */
export function isMediaContentType(contentType: string | null): boolean {
  if (!contentType) return false
  const c = contentType.toLowerCase()
  if (c.includes('application/json')) return false
  if (c.includes('text/html') || c.includes('text/plain')) return false
  if (c.startsWith('video/') || c.startsWith('image/')) return true
  if (c.includes('octet-stream')) return true
  return false
}

export async function describeUpstreamFailure(res: Response): Promise<string> {
  const ct = res.headers.get('content-type') || ''
  if (ct.includes('json')) {
    try {
      const text = await res.clone().text()
      const j = JSON.parse(text) as { code?: number; msg?: string }
      if (j && typeof j.code === 'number') {
        return `code=${j.code} msg=${j.msg || '(无)'}`
      }
      return text.slice(0, 160)
    } catch {
      return `HTTP ${res.status} (JSON 解析失败)`
    }
  }
  return `HTTP ${res.status} Content-Type=${ct || '(无)'}`
}

export function buildMediaFetchAttempts(target: string, token: string, tenantId = '1'): MediaFetchAttempt[] {
  const bare = bearerTokenValue(token)
  const attempts: MediaFetchAttempt[] = []
  const seen = new Set<string>()

  const push = (url: string, headers: Record<string, string>) => {
    const key = `${url}\0${JSON.stringify(headers)}`
    if (seen.has(key)) return
    seen.add(key)
    attempts.push({ url, headers })
  }

  for (const base of mediaUrlCandidates(target)) {
    push(base, authHeadersForMedia(bare, tenantId))

    try {
      const u = new URL(base)
      const withAccess = new URL(u.toString())
      withAccess.searchParams.set('access_token', bare)
      push(withAccess.toString(), { 'Tenant-Id': tenantId })

      const withToken = new URL(u.toString())
      withToken.searchParams.set('token', bare)
      push(withToken.toString(), { 'Tenant-Id': tenantId })
    } catch {
      /* ignore */
    }
  }

  return attempts
}

export async function fetchMediaWithFallback(
  target: string,
  token: string,
  tenantId = '1',
  range?: string,
): Promise<{ response: Response; tried: string[]; lastError: string }> {
  const tried: string[] = []
  const attempts = buildMediaFetchAttempts(target, token, tenantId)
  let last: Response | null = null
  let lastError = '无可用地址'

  for (const { url, headers } of attempts) {
    tried.push(url)
    const h = { ...headers }
    if (range) h.Range = range
    const res = await fetch(url, { headers: h })
    const ct = res.headers.get('content-type')

    if ((res.ok || res.status === 206) && isMediaContentType(ct)) {
      return { response: res, tried, lastError: '' }
    }

    last = res
    lastError = await describeUpstreamFailure(res)

    if (!ct?.includes('json') && res.status !== 401 && res.status !== 403 && res.status !== 404) {
      return { response: res, tried, lastError }
    }
  }

  return { response: last!, tried, lastError }
}

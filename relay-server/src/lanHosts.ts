import { networkInterfaces } from 'node:os'

/** 本机可用于局域网访问的 IPv4（排除 127.0.0.1） */
export function getLanIPv4Addresses(): string[] {
  const addrs: string[] = []
  for (const iface of Object.values(networkInterfaces())) {
    for (const a of iface ?? []) {
      if (a.family !== 'IPv4' || a.internal) continue
      addrs.push(a.address)
    }
  }
  return [...new Set(addrs)]
}

export function buildRelayWsUrls(port: number): string[] {
  const urls = [`ws://127.0.0.1:${port}`]
  for (const host of getLanIPv4Addresses()) {
    const u = `ws://${host}:${port}`
    if (!urls.includes(u)) urls.push(u)
  }
  return urls
}

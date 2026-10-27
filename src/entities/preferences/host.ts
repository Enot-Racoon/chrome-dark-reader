import Config from '@/shared/config'
import type { IHostSettings } from './types'

const DENIED_LABELS = new Set(['__proto__', 'constructor', 'prototype'])
const HOST_CHARS = /^[a-z0-9*._:-]+$/
const MAX_HOST_LENGTH = 253

/**
 * Accepts what users type ('Google.com', 'https://ex.com/x', '*.ex.com') and what the
 * runtime produces (URL.host, location.host). Returns null for anything that must not
 * become a storage key: synced host keys arrive from other devices.
 */
export const normalizeHost = (input: string | null | undefined): string | null => {
  if (typeof input !== 'string') return null

  const trimmed = input.trim().toLowerCase()
  if (!trimmed) return null

  const authority = trimmed.replace(/^[a-z][a-z0-9.+-]*:\/\//, '').split(/[/?#]/)[0]
  if (!authority || !HOST_CHARS.test(authority)) return null

  const wildcard = authority.startsWith('*.')
  if (authority.includes('*') && !wildcard) return null

  const domain = (wildcard ? authority.slice(2) : authority).replace(/\.+$/, '')
  const labels = domain.split('.')

  if (
    !domain ||
    domain.startsWith('.') ||
    labels.some(label => !label) ||
    domain.length > MAX_HOST_LENGTH
  ) {
    return null
  }
  if (labels.some(label => DENIED_LABELS.has(label))) return null

  return wildcard ? `*.${domain}` : domain
}

export const getHostFromUrl = (url: string | null | undefined): string | null => {
  if (!url) return null
  try {
    return normalizeHost(new URL(url).host)
  } catch {
    return null
  }
}

export const encodeHostKey = (host: string): string =>
  `${Config.SYNC_HOST_PREFIX}${host.replace(/%/g, '%25').replace(/\*/g, '%2A')}`

/** Main host item has chunk === null, an oversized-CSS part has its 1-based index. */
export const parseHostKey = (key: string): { host: string; chunk: number | null } | null => {
  if (!key.startsWith(Config.SYNC_HOST_PREFIX)) return null

  const encoded = key.slice(Config.SYNC_HOST_PREFIX.length)
  const chunkSeparator = encoded.lastIndexOf(Config.SYNC_CSS_CHUNK_INFIX)

  if (chunkSeparator >= 0) {
    const index = Number(encoded.slice(chunkSeparator + Config.SYNC_CSS_CHUNK_INFIX.length))
    if (!Number.isInteger(index) || index < 2) return null
    return { host: decode(encoded.slice(0, chunkSeparator)), chunk: index }
  }

  return { host: decode(encoded), chunk: null }
}

const decode = (encoded: string): string => encoded.replace(/%2A/g, '*').replace(/%25/g, '%')

export const cssChunkKey = (host: string, index: number): string =>
  `${encodeHostKey(host)}${Config.SYNC_CSS_CHUNK_INFIX}${index}`

const readOwn = (hosts: Record<string, IHostSettings>, key: string): IHostSettings | undefined =>
  Object.prototype.hasOwnProperty.call(hosts, key) ? hosts[key] : undefined

/** Exact host wins, otherwise the longest matching wildcard. */
export const matchHostSettings = (
  hosts: Record<string, IHostSettings>,
  host: string | null | undefined
): IHostSettings | null => {
  if (!host) return null

  const exact = readOwn(hosts, host)
  if (exact) return exact

  const labels = host.split('.')
  for (let index = 1; index < labels.length; index++) {
    const wildcard = readOwn(hosts, `*.${labels.slice(index).join('.')}`)
    if (wildcard) return wildcard
  }

  return null
}

import { normalizeHost } from './host'
import type { IHostSettings, IPreferences } from './types'

/** Shape written per host into chrome.storage.sync. The host itself is the key. */
export interface IStoredHostEntry {
  enabled: boolean
  styles: string
  /** Number of storage items the styles are split over, only when styles do not fit one. */
  parts?: number
  updatedAt?: number
}

export const normalizeHostEntry = (host: string, raw: unknown): IHostSettings | null => {
  if (!host || typeof raw !== 'object' || raw === null) return null

  const entry = raw as Partial<IStoredHostEntry> & { host?: unknown }

  return {
    host,
    enabled: entry.enabled === true,
    styles: typeof entry.styles === 'string' ? entry.styles : '',
  }
}

/** Tolerates the legacy blob, a partial object and junk coming from another device. */
export const normalizePreferences = (raw: unknown): IPreferences => {
  const hosts: Record<string, IHostSettings> = {}
  const source = (raw as { hosts?: Record<string, unknown> } | null | undefined)?.hosts

  if (source && typeof source === 'object') {
    for (const key of Object.keys(source)) {
      const host = normalizeHost(key)
      if (!host) continue

      const settings = normalizeHostEntry(host, source[key])
      if (settings) hosts[host] = settings
    }
  }

  return { hosts }
}

export const toStoredEntry = (
  settings: IHostSettings,
  styles: string,
  parts: number | undefined,
  updatedAt: number
): IStoredHostEntry => {
  const entry: IStoredHostEntry = { enabled: settings.enabled, styles, updatedAt }
  if (parts && parts > 1) entry.parts = parts
  return entry
}

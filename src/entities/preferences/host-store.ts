import Config from '@/shared/config'
import { cssChunkKey, encodeHostKey, parseHostKey } from './host'
import { normalizeHostEntry, toStoredEntry } from './normalize'
import type { IStoredHostEntry } from './normalize'
import { itemBytes, utf8Bytes } from '@/shared/lib/storage/quota'
import type { IStorageConnector } from '@/shared/lib/storage/types'
import type { IHostSettings, IPreferences } from './types'

export type HostStore = IStorageConnector<unknown>

const EMPTY_ENTRY: IStoredHostEntry = { enabled: false, styles: '' }

export interface IHostSnapshot {
  readonly preferences: IPreferences
  /** Every dr:host:<host>:css:<n> key currently in the area, grouped by host. */
  readonly chunkKeys: Record<string, string[]>
}

const perItemLimit = (store: HostStore): number => {
  const raw = store.quotas().QUOTA_BYTES_PER_ITEM
  const value = typeof raw === 'number' && raw > 0 ? raw : Config.DEFAULT_QUOTA_BYTES_PER_ITEM
  return value - Config.QUOTA_MARGIN_BYTES
}

/** Reads every dr:host:* item and reassembles styles split over several items. */
export const readSnapshot = async (store: HostStore): Promise<IHostSnapshot> => {
  const all = await store.getAll()
  const mains: Record<string, IStoredHostEntry> = {}
  const chunkKeys: Record<string, string[]> = {}
  const chunks: Record<string, Record<number, string>> = {}

  for (const key of Object.keys(all)) {
    const parsed = parseHostKey(key)
    if (!parsed) continue

    if (parsed.chunk === null) {
      const value = all[key]
      mains[parsed.host] =
        value && typeof value === 'object' ? (value as IStoredHostEntry) : EMPTY_ENTRY
    } else {
      const byHost = chunks[parsed.host] ?? {}
      byHost[parsed.chunk] = typeof all[key] === 'string' ? (all[key] as string) : ''
      chunks[parsed.host] = byHost

      const keys = chunkKeys[parsed.host] ?? []
      keys.push(key)
      chunkKeys[parsed.host] = keys
    }
  }

  const hosts: Record<string, IHostSettings> = {}

  for (const host of Object.keys(mains)) {
    const entry = mains[host]
    const settings = normalizeHostEntry(host, {
      ...entry,
      styles: assembleStyles(entry, chunks[host]),
    })
    if (settings) hosts[host] = settings
  }

  return { preferences: { hosts }, chunkKeys }
}

const assembleStyles = (
  entry: IStoredHostEntry,
  chunks: Record<number, string> | undefined
): string => {
  const first = typeof entry.styles === 'string' ? entry.styles : ''
  if (!chunks || !entry.parts || entry.parts < 2) return first

  let styles = first
  for (let index = 2; index <= entry.parts; index++) styles += chunks[index] ?? ''
  return styles
}

export type WriteHostResult = { status: 'ok' } | { status: 'failed'; reason: unknown }

/**
 * Writes exactly one host, splitting styles that do not fit QUOTA_BYTES_PER_ITEM over
 * extra items. A rejected write affects this host only, so the caller can park it in
 * the local pending set instead of losing it.
 */
export const writeHost = async (
  store: HostStore,
  host: string,
  settings: IHostSettings,
  options: { updatedAt: number; previousChunkKeys?: string[] }
): Promise<WriteHostResult> => {
  const key = encodeHostKey(host)
  const limit = perItemLimit(store)
  const items: Record<string, unknown> = {}

  const whole = toStoredEntry(settings, settings.styles, undefined, options.updatedAt)

  if (itemBytes(key, whole) <= limit) {
    items[key] = whole
  } else {
    // A slice must fit both the host item (which also carries enabled, updatedAt and
    // parts) and a bare chunk item, measured after JSON escaping.
    const hostOverhead = itemBytes(key, toStoredEntry(settings, '', 2, options.updatedAt))
    // sized with the widest index a chunk key can realistically get
    const chunkOverhead = itemBytes(cssChunkKey(host, 9999), '') + QUOTES_BYTES
    const budget = Math.max(limit - Math.max(hostOverhead, chunkOverhead), MIN_SLICE_BYTES)

    const slices = splitByBytes(settings.styles, budget)
    const entry = toStoredEntry(settings, slices[0] ?? '', slices.length, options.updatedAt)

    if (itemBytes(key, entry) > limit) return { status: 'failed', reason: 'per_item' }

    items[key] = entry
    slices.slice(1).forEach((slice, offset) => {
      items[cssChunkKey(host, offset + 2)] = slice
    })
  }

  const stale = (options.previousChunkKeys ?? []).filter(chunkKey => !(chunkKey in items))

  try {
    if (stale.length) await store.remove(stale)
    await store.setMany(items)
    return { status: 'ok' }
  } catch (error) {
    return { status: 'failed', reason: error }
  }
}

export const removeHost = async (
  store: HostStore,
  host: string,
  previousChunkKeys: string[] = []
): Promise<boolean> => {
  try {
    await store.remove([encodeHostKey(host), ...previousChunkKeys])
    return true
  } catch {
    return false
  }
}

const QUOTES_BYTES = 2
const MIN_SLICE_BYTES = 64

/** Slices measured by the bytes they occupy once JSON-escaped, so the parts reassemble exactly. */
const splitByBytes = (value: string, budget: number): string[] => {
  const slices: string[] = []
  let start = 0

  while (start < value.length) {
    let end = start

    while (end < value.length && escapedBytes(value.slice(start, end + 1)) <= budget) end++

    if (end === start) end = start + 1 // never produce an empty slice
    slices.push(value.slice(start, end))
    start = end
  }

  if (!slices.length) slices.push('')
  return slices
}

const escapedBytes = (value: string): number => utf8Bytes(JSON.stringify(value)) - QUOTES_BYTES

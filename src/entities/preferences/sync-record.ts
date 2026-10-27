import Config from '@/shared/config'
import equal from 'fast-deep-equal'
import { parseHostKey } from './host'
import { normalizeHostEntry, normalizePreferences } from './normalize'
import { readSnapshot, removeHost, writeHost } from './host-store'
import { classifyStorageError } from '@/shared/lib/storage/quota'
import { migrateOnce } from '@/services/migration'
import type { HostStore } from './host-store'
import type { IHostSettings, IPreferences } from './types'
import type {
  IStorageMappedEvent,
  IStorageMappedListener,
  IStorageRecord,
} from '@/shared/lib/storage/types'

const EMPTY_PREFERENCES: IPreferences = { hosts: {} }

const TOGGLE_FLUSH_MS = 300
const STYLES_FLUSH_MS = 1500
const REMOTE_RELOAD_MS = 200

export type SyncState = 'ok' | 'degraded' | 'paused'

export interface ISyncStatus {
  /**
   * ok: accepted by chrome.storage.sync. paused: a quota refused the write.
   * degraded: sync could not be read, so this device kept its own local mirror.
   * None of them proves that other devices received anything.
   */
  state: SyncState
  message: string
  pending: string[]
}

type Cancel = () => void

export interface ISyncRecordDeps {
  readonly sync: HostStore
  readonly local: HostStore
  readonly now?: () => number
  readonly schedule?: (fn: () => void, ms: number) => Cancel
}

/**
 * Settings persistence for chrome.storage.sync.
 *
 * Guarantees the single-blob record did not have:
 * - one hydration only (migration, then sync read), every read and write goes through it;
 * - a write never runs before hydration, so a click landing during start-up cannot
 *   flush defaults over the saved configuration;
 * - writes are per host diffs, never a whole-config replace;
 * - values coming from other devices update the local snapshot first, so the store
 *   echoing them back produces no storage operation at all.
 */
export class SyncedPreferencesRecord implements IStorageRecord<IPreferences> {
  private snapshot: IPreferences = EMPTY_PREFERENCES
  private chunkKeys: Record<string, string[]> = {}
  private pendingWrites: Record<string, IHostSettings | null> = {}
  private dirty = new Map<string, IHostSettings | null>()
  private hydratePromise: Promise<IPreferences> | null = null
  private flushCancel: Cancel | null = null
  private flushMs = 0
  private reloadCancel: Cancel | null = null
  private listeners = new Set<IStorageMappedListener<IPreferences>>()
  private statusListeners = new Set<(status: ISyncStatus) => void>()
  private unsubscribeSync: Cancel | null = null
  private statusValue: ISyncStatus = { state: 'ok', message: 'Saved', pending: [] }
  private syncReadable = true

  private readonly sync: HostStore
  private readonly local: HostStore
  private readonly now: () => number
  private readonly schedule: (fn: () => void, ms: number) => Cancel

  constructor(deps: ISyncRecordDeps) {
    this.sync = deps.sync
    this.local = deps.local
    this.now = deps.now ?? (() => Date.now())
    this.schedule =
      deps.schedule ??
      ((fn, ms) => {
        const id = setTimeout(fn, ms)
        return () => clearTimeout(id)
      })
  }

  get currentValue(): IPreferences {
    return this.snapshot
  }

  get ready(): Promise<IPreferences> {
    if (!this.hydratePromise) this.hydratePromise = this.hydrate()
    return this.hydratePromise
  }

  get status(): ISyncStatus {
    return this.statusValue
  }

  readonly get = async (): Promise<IPreferences> => await this.ready

  readonly set = async (value: IPreferences): Promise<IPreferences> => {
    await this.ready

    const changes = collectChanges(this.snapshot, value)
    if (changes.size === 0) return this.snapshot

    const stylesChanged = hasStyleChanges(this.snapshot, changes)

    this.snapshot = value
    this.dirty = mergeDirty(this.dirty, changes)
    for (const [host, entry] of changes) this.pendingWrites[host] = entry

    await this.writeMirror()
    // The queue is durable: a service worker killed before the flush retries on next start.
    await this.writePending()
    this.armFlush(stylesChanged ? STYLES_FLUSH_MS : TOGGLE_FLUSH_MS)

    return value
  }

  readonly addChangeListener = (listener: IStorageMappedListener<IPreferences>): void => {
    this.listeners.add(listener)
  }

  readonly removeChangeListener = (listener: IStorageMappedListener<IPreferences>): void => {
    this.listeners.delete(listener)
  }

  readonly onStatusChange = (listener: (status: ISyncStatus) => void): Cancel => {
    this.statusListeners.add(listener)
    return () => this.statusListeners.delete(listener)
  }

  /** Drops the storage subscription and any pending timers. */
  readonly dispose = (): void => {
    if (this.unsubscribeSync) {
      this.unsubscribeSync()
      this.unsubscribeSync = null
    }
    if (this.flushCancel) this.flushCancel()
    if (this.reloadCancel) this.reloadCancel()
    this.flushCancel = null
    this.reloadCancel = null
    this.listeners.clear()
    this.statusListeners.clear()
  }

  /** Drains the dirty queue into chrome.storage.sync. */
  readonly flush = async (): Promise<void> => {
    if (this.flushCancel) {
      this.flushCancel()
      this.flushCancel = null
    }

    const queue = Array.from(this.dirty.entries())
    this.dirty = new Map()

    if (queue.length === 0) return

    if (!this.syncReadable) {
      for (const [host, entry] of queue) this.pendingWrites[host] = entry
      this.report(
        'Sync unavailable, kept on this device',
        queue.map(([host]) => host)
      )
      await this.writeMirror()
      await this.writePending()
      return
    }

    const failed: string[] = []

    for (const [host, entry] of queue) {
      if (entry === null) {
        if (await removeHost(this.sync, host, this.chunkKeys[host] ?? [])) {
          delete this.chunkKeys[host]
          delete this.pendingWrites[host]
        } else {
          this.pendingWrites[host] = null
          failed.push(host)
        }
        continue
      }

      const result = await writeHost(this.sync, host, entry, {
        updatedAt: this.now(),
        previousChunkKeys: this.chunkKeys[host] ?? [],
      })

      if (result.status === 'ok') delete this.pendingWrites[host]
      else {
        this.pendingWrites[host] = entry
        failed.push(host)
        this.report(classifyStorageError(result.reason).message, failed)
      }
    }

    await this.writeMirror()
    await this.writePending()

    if (!failed.length) this.report('Saved', Object.keys(this.pendingWrites))
  }

  private armFlush = (delay: number): void => {
    const next = this.flushMs ? Math.min(delay, this.flushMs) : delay

    if (this.flushCancel) this.flushCancel()

    this.flushMs = next
    this.flushCancel = this.schedule(() => {
      this.flushCancel = null
      this.flushMs = 0
      void this.flush()
    }, next)
  }

  private hydrate = async (): Promise<IPreferences> => {
    try {
      await migrateOnce({
        sync: this.sync,
        local: this.local,
        now: this.now,
      })
    } catch (error) {
      this.report(describe(error), [])
    }

    try {
      const stored = await readSnapshot(this.sync)
      this.chunkKeys = stored.chunkKeys
      this.syncReadable = true
      this.pendingWrites = readPending(await this.local.get(Config.LOCAL_PENDING_KEY))

      if (Object.keys(this.pendingWrites).length) await this.retryPending(stored.preferences)
      else this.snapshot = stored.preferences
    } catch (error) {
      // sync is unreadable: keep serving this device from its own mirror and stop
      // writing remote keys, so a stale local value can never overwrite newer sync data.
      this.syncReadable = false
      this.snapshot = normalizePreferences(await this.local.get(Config.LOCAL_MIRROR_KEY))
      this.report(`Sync unavailable: ${describe(error)}`, Object.keys(this.pendingWrites))
    }

    this.subscribeRemote()
    await this.writeMirror()
    await this.writePending()

    return this.snapshot
  }

  /** Hosts a quota refused earlier, retried once per hydration. */
  private retryPending = async (remote: IPreferences): Promise<void> => {
    const hosts = { ...remote.hosts }
    const stillPending: Record<string, IHostSettings | null> = {}
    const failed: string[] = []

    for (const [host, entry] of Object.entries(this.pendingWrites)) {
      if (entry === null) {
        if (await removeHost(this.sync, host, this.chunkKeys[host] ?? [])) {
          delete hosts[host]
        } else {
          stillPending[host] = null
          failed.push(host)
        }
        continue
      }

      if (equal(hosts[host], entry)) continue

      const result = await writeHost(this.sync, host, entry, {
        updatedAt: this.now(),
        previousChunkKeys: this.chunkKeys[host] ?? [],
      })

      if (result.status === 'ok') hosts[host] = entry
      else {
        stillPending[host] = entry
        failed.push(host)
      }
    }

    this.pendingWrites = stillPending
    this.snapshot = { hosts }
    this.report(
      failed.length ? 'Sync quota refused, kept on this device' : 'Saved',
      Object.keys(stillPending)
    )
  }

  private subscribeRemote = (): void => {
    if (this.unsubscribeSync) return

    this.unsubscribeSync = this.sync.onChange(changes => {
      if (!Object.keys(changes).some(key => parseHostKey(key))) return
      this.queueReload()
    })
  }

  private queueReload = (): void => {
    if (this.reloadCancel) return

    this.reloadCancel = this.schedule(() => {
      this.reloadCancel = null
      void this.reloadFromSync()
    }, REMOTE_RELOAD_MS)
  }

  private reloadFromSync = async (): Promise<void> => {
    let stored
    try {
      stored = await readSnapshot(this.sync)
    } catch {
      return
    }

    // A host we could not push is newer here than on the server: reloading must not
    // undo it, or a refused write would silently revert the interface.
    const hosts = { ...stored.preferences.hosts }

    for (const [host, entry] of Object.entries(this.pendingWrites)) {
      if (entry === null) delete hosts[host]
      else hosts[host] = entry
    }

    const next: IPreferences = { hosts }
    if (equal(next, this.snapshot)) return // our own write arriving back through onChanged

    const previous = this.snapshot
    this.snapshot = next
    this.chunkKeys = stored.chunkKeys

    await this.writeMirror()
    this.emit({
      key: Config.SYNC_HOST_PREFIX,
      newValue: next,
      oldValue: previous,
    })
  }

  private emit = (event: IStorageMappedEvent<IPreferences>): void => {
    for (const listener of Array.from(this.listeners)) listener(event)
  }

  private writeMirror = async (): Promise<void> => {
    try {
      await this.local.set(Config.LOCAL_MIRROR_KEY, this.snapshot)
    } catch {
      // the mirror is a convenience copy; nothing depends on it succeeding
    }
  }

  private writePending = async (): Promise<void> => {
    try {
      await this.local.set(Config.LOCAL_PENDING_KEY, this.pendingWrites)
    } catch {
      // same as above
    }
  }

  private report = (message: string, pending: string[]): void => {
    const state: SyncState = this.syncReadable ? (pending.length ? 'paused' : 'ok') : 'degraded'

    this.statusValue = { state, message, pending }
    for (const listener of Array.from(this.statusListeners)) listener(this.statusValue)
  }
}

const collectChanges = (
  previous: IPreferences,
  next: IPreferences
): Map<string, IHostSettings | null> => {
  const changes = new Map<string, IHostSettings | null>()

  for (const [host, entry] of Object.entries(next.hosts)) {
    if (!equal(previous.hosts[host], entry)) changes.set(host, entry)
  }

  for (const host of Object.keys(previous.hosts)) {
    if (!(host in next.hosts)) changes.set(host, null)
  }

  return changes
}

const mergeDirty = (
  current: Map<string, IHostSettings | null>,
  changes: Map<string, IHostSettings | null>
): Map<string, IHostSettings | null> => {
  const merged = new Map(current)
  for (const [host, entry] of changes) merged.set(host, entry)
  return merged
}

const readPending = (raw: unknown): Record<string, IHostSettings | null> => {
  if (!raw || typeof raw !== 'object') return {}

  const result: Record<string, IHostSettings | null> = {}

  for (const [host, entry] of Object.entries(raw as Record<string, unknown>)) {
    result[host] = entry === null ? null : normalizeHostEntry(host, entry)
  }

  return result
}

/** A toggle only flips enabled; anything else waits for the longer write window. */
const hasStyleChanges = (
  previous: IPreferences,
  changes: Map<string, IHostSettings | null>
): boolean => {
  for (const [host, entry] of changes) {
    const before = previous.hosts[host]
    if (!before || !entry || before.styles !== entry.styles) return true
  }

  return false
}

const describe = (error: unknown): string =>
  error instanceof Error ? error.message : String(error)

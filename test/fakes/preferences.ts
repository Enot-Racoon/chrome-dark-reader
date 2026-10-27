import { ChromeStorageConnector } from '@/shared/lib/storage'
import { SyncedPreferencesRecord } from '@/entities/preferences/sync-record'
import Config from '@/shared/config'
import { encodeHostKey } from '@/entities/preferences/host'
import { schedule } from './clock'
import { fakeChrome, fakeTab } from './chrome'
import type { IHostSettings } from '@/entities/preferences/types'

export { fakeChrome, fakeTab }
export { advance, resetClock, tick } from './clock'

export const connect = (area: 'sync' | 'local') => new ChromeStorageConnector<unknown>(area)

export const createRecord = (now: () => number = () => Date.now()) =>
  new SyncedPreferencesRecord({
    sync: connect('sync'),
    local: connect('local'),
    now,
    schedule,
  })

export const seedLegacy = async (hosts: Record<string, IHostSettings>) => {
  await fakeChrome.storage.local.set({ [Config.STORAGE_KEY]: { hosts } })
}

export const seedSyncHost = async (host: string, value: object) => {
  await fakeChrome.storage.sync.set({ [encodeHostKey(host)]: value })
}

export const host = (name: string, enabled = false, styles = ''): IHostSettings => ({
  host: name,
  enabled,
  styles,
})

export const readSync = (name: string): unknown => fakeChrome.storage.sync.data[encodeHostKey(name)]

export const syncHostKeys = (): string[] =>
  Object.keys(fakeChrome.storage.sync.data).filter(key => key.startsWith(Config.SYNC_HOST_PREFIX))

export const syncWrites = () =>
  fakeChrome.storage.sync.writes.flatMap(write => (write.removed ? [] : write.keys))

/** Host item writes only: migration also touches dr:meta. */
export const hostWrites = () => syncWrites().filter(key => key.startsWith(Config.SYNC_HOST_PREFIX))

export const localWrites = () =>
  fakeChrome.storage.local.writes.flatMap(write => (write.removed ? [] : write.keys))

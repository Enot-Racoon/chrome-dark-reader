import { beforeEach, describe, expect, it } from 'vitest'
import Config from '@/shared/config'
import { encodeHostKey } from '@/entities/preferences/host'
import { advance, resetClock, tick } from './fakes/clock'
import {
  createRecord,
  fakeChrome,
  hostWrites,
  readSync,
  seedSyncHost,
  syncHostKeys,
} from './fakes/preferences'
import type { IHostSettings } from '@/entities/preferences/types'
import type { ISyncStatus } from '@/entities/preferences/sync-record'

const FLUSH_ALL = 5000
const REMOTE_FLUSH = 5000

const settings = (host: string, enabled: boolean, styles = ''): IHostSettings => ({
  host,
  enabled,
  styles,
})

const preferences = (...hosts: Array<[string, boolean]>) => ({
  hosts: Object.fromEntries(hosts.map(([host, enabled]) => [host, settings(host, enabled)])),
})

const statusStates = (record: ReturnType<typeof createRecord>): ISyncStatus['state'][] => {
  const states: ISyncStatus['state'][] = []
  record.onStatusChange(status => states.push(status.state))
  return states
}

beforeEach(() => {
  fakeChrome.reset()
  resetClock()
})

describe('SyncedPreferencesRecord hydration', () => {
  it('reads sync once for two concurrent consumers', async () => {
    const record = createRecord()
    await seedSyncHost('a.com', { enabled: true, styles: 'a css' })

    const [first, second] = await Promise.all([record.get(), record.get()])

    expect(Object.keys(first.hosts)).toEqual(['a.com'])
    expect(second).toBe(first)

    const reads = fakeChrome.storage.sync.reads.length
    await record.get()
    expect(fakeChrome.storage.sync.reads).toHaveLength(reads)
  })

  it('writes nothing until hydration finished', async () => {
    await seedSyncHost('a.com', { enabled: false, styles: 'a css' })
    fakeChrome.storage.sync.writes.length = 0

    const record = createRecord()
    const release = fakeChrome.storage.sync.holdNextRead()

    const pending = record.set(preferences(['a.com', true]))
    await tick()

    expect(fakeChrome.storage.sync.writes).toEqual([])
    expect(fakeChrome.storage.local.writes).toEqual([])

    release()
    await pending
    await advance(FLUSH_ALL)

    expect(readSync('a.com')).toMatchObject({ enabled: true })
  })

  it('rewrites only the changed host, leaving the others untouched', async () => {
    await seedSyncHost('a.com', { enabled: false, styles: 'a css', updatedAt: 1 })
    await seedSyncHost('b.com', { enabled: true, styles: 'b css', updatedAt: 1 })

    const record = createRecord()
    await record.ready
    fakeChrome.storage.sync.writes.length = 0

    const saved = record.currentValue.hosts['a.com']
    await record.set({
      hosts: { ...record.currentValue.hosts, 'a.com': { ...saved, enabled: true } },
    })
    await advance(FLUSH_ALL)

    expect(hostWrites()).toEqual([encodeHostKey('a.com')])
    expect(fakeChrome.storage.sync.data[encodeHostKey('b.com')]).toMatchObject({
      enabled: true,
      styles: 'b css',
      updatedAt: 1,
    })
    expect(fakeChrome.storage.sync.data[Config.SYNC_META_KEY]).toBeDefined()
  })

  it('serves the local mirror and stops writing when sync is unreadable', async () => {
    await fakeChrome.storage.local.set({
      [Config.LOCAL_MIRROR_KEY]: { hosts: { 'a.com': settings('a.com', true) } },
    })
    fakeChrome.storage.sync.failNextReads('Cannot read from sync', 10)

    const record = createRecord()
    const states = statusStates(record)
    await record.ready

    expect(states).toContain('degraded')
    expect(record.currentValue.hosts['a.com'].enabled).toBe(true)

    await record.set(preferences(['a.com', false], ['b.com', true]))
    await advance(FLUSH_ALL)

    expect(fakeChrome.storage.sync.writes).toEqual([])
    expect(fakeChrome.storage.local.data[Config.LOCAL_MIRROR_KEY]).toEqual(
      preferences(['a.com', false], ['b.com', true])
    )
    expect(fakeChrome.storage.local.data[Config.LOCAL_PENDING_KEY]).toMatchObject({
      'a.com': { enabled: false },
      'b.com': { enabled: true },
    })
  })
})

describe('SyncedPreferencesRecord writes', () => {
  it('writes only the changed host', async () => {
    const record = createRecord()
    await record.set(preferences(['a.com', false], ['b.com', false]))
    await advance(FLUSH_ALL)

    fakeChrome.storage.sync.writes.length = 0
    await record.set(preferences(['a.com', true], ['b.com', false]))
    await advance(FLUSH_ALL)

    expect(readSync('a.com')).toMatchObject({ enabled: true })
    expect(readSync('b.com')).toMatchObject({ enabled: false })
    expect(hostWrites()).toEqual([encodeHostKey('a.com')])
  })

  it('coalesces a burst of toggles into one write', async () => {
    const record = createRecord()
    await record.ready
    fakeChrome.storage.sync.writes.length = 0

    await record.set(preferences(['a.com', true]))
    await advance(100)
    await record.set(preferences(['a.com', false]))
    await advance(100)
    await record.set(preferences(['a.com', true]))
    await advance(FLUSH_ALL)

    expect(readSync('a.com')).toMatchObject({ enabled: true })
    expect(hostWrites()).toEqual([encodeHostKey('a.com')])
  })

  it('removes the key of a deleted host', async () => {
    const record = createRecord()
    await record.set(preferences(['a.com', true], ['b.com', true]))
    await advance(FLUSH_ALL)
    expect(syncHostKeys()).toHaveLength(2)

    await record.set(preferences(['a.com', true]))
    await advance(FLUSH_ALL)

    expect(syncHostKeys()).toEqual([encodeHostKey('a.com')])
  })

  it('splits oversized styles and reassembles them on the next start', async () => {
    const styles = 'x'.repeat(20000)
    const record = createRecord()

    await record.set({ hosts: { 'a.com': settings('a.com', true, styles) } })
    await advance(FLUSH_ALL)

    const chunks = Object.keys(fakeChrome.storage.sync.data).filter(key =>
      key.includes(Config.SYNC_CSS_CHUNK_INFIX)
    )

    expect(chunks.length).toBeGreaterThan(0)
    expect(readSync('a.com')).toMatchObject({ enabled: true, parts: chunks.length + 1 })

    const reopened = createRecord()
    await reopened.ready
    expect(reopened.currentValue.hosts['a.com'].styles).toBe(styles)

    // a rewrite with small styles drops the stale chunks
    await reopened.set({ hosts: { 'a.com': settings('a.com', true, 'tiny') } })
    await advance(FLUSH_ALL)

    expect(
      Object.keys(fakeChrome.storage.sync.data).filter(key =>
        key.includes(Config.SYNC_CSS_CHUNK_INFIX)
      )
    ).toEqual([])
    expect(readSync('a.com')).toMatchObject({ styles: 'tiny' })
    expect(readSync('a.com')).not.toHaveProperty('parts')
  })

  it('parks a refused host in the pending queue and retries it on the next start', async () => {
    const record = createRecord()
    const states = statusStates(record)

    await record.set(preferences(['a.com', false]))
    await advance(FLUSH_ALL)

    fakeChrome.storage.sync.failNextWrites('QUOTA_BYTES quota exceeded')
    await record.set(preferences(['a.com', true]))
    await advance(FLUSH_ALL)

    expect(states).toContain('paused')
    expect(readSync('a.com')).toMatchObject({ enabled: false })
    expect(record.currentValue.hosts['a.com'].enabled).toBe(true)
    expect(fakeChrome.storage.local.data[Config.LOCAL_PENDING_KEY]).toMatchObject({
      'a.com': { enabled: true },
    })
    expect(fakeChrome.storage.local.data[Config.LOCAL_MIRROR_KEY]).toEqual(
      preferences(['a.com', true])
    )

    const reopened = createRecord()
    await reopened.ready
    await advance(FLUSH_ALL)

    expect(readSync('a.com')).toMatchObject({ enabled: true })
    expect(fakeChrome.storage.local.data[Config.LOCAL_PENDING_KEY]).toEqual({})
  })
})

describe('SyncedPreferencesRecord remote changes', () => {
  it('applies a remote change without writing it back', async () => {
    const record = createRecord()
    await record.set(preferences(['a.com', false]))
    await advance(FLUSH_ALL)

    fakeChrome.storage.sync.writes.length = 0
    fakeChrome.storage.local.writes.length = 0

    const applied: unknown[] = []
    record.addChangeListener(event => applied.push(event.newValue))

    await seedSyncHost('a.com', { enabled: true, styles: '', updatedAt: 2 })
    await advance(REMOTE_FLUSH)

    expect(record.currentValue.hosts['a.com'].enabled).toBe(true)
    expect(applied).toHaveLength(1)
    // the only sync write is the seed this test performed itself
    expect(hostWrites()).toEqual([encodeHostKey('a.com')])

    // the echo of that reload must not schedule further work
    await advance(REMOTE_FLUSH)
    expect(fakeChrome.storage.local.writes).toHaveLength(1) // the mirror only
  })

  it('surfaces a host deleted on another device', async () => {
    const record = createRecord()
    await record.set(preferences(['a.com', true], ['b.com', true]))
    await advance(FLUSH_ALL)

    const applied: Array<string[]> = []
    record.addChangeListener(event => applied.push(Object.keys(event.newValue.hosts)))

    await fakeChrome.storage.sync.remove(encodeHostKey('b.com'))
    await advance(REMOTE_FLUSH)

    expect(Object.keys(record.currentValue.hosts)).toEqual(['a.com'])
    expect(applied).toEqual([['a.com']])
  })

  it('ignores changes to keys that are not ours', async () => {
    const record = createRecord()
    await record.ready
    await advance(FLUSH_ALL)

    fakeChrome.storage.local.writes.length = 0

    await fakeChrome.storage.sync.set({ 'some-other-key': 1 })
    await advance(REMOTE_FLUSH)

    expect(fakeChrome.storage.local.writes).toEqual([])
  })
})

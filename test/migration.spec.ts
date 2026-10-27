import { beforeEach, describe, expect, it } from 'vitest'
import Config from '@/shared/config'
import { migrateOnce } from '@/services/migration'
import { encodeHostKey } from '@/entities/preferences/host'
import { fakeChrome } from './fakes/chrome'
import { connect, host, seedLegacy, seedSyncHost, syncHostKeys } from './fakes/preferences'

const run = (now = () => 1000) =>
  migrateOnce({ sync: connect('sync'), local: connect('local'), now })

beforeEach(() => fakeChrome.reset())

describe('migrateOnce', () => {
  it('uploads legacy hosts, then removes the legacy blob', async () => {
    await seedLegacy({ 'one.com': host('one.com', true, 'a {}'), 'two.com': host('two.com') })

    const outcome = await run()

    expect(outcome.status).toBe('migrated')
    expect(outcome.uploaded).toBe(2)
    expect(syncHostKeys().sort()).toEqual(
      [encodeHostKey('one.com'), encodeHostKey('two.com')].sort()
    )
    expect(fakeChrome.storage.sync.data[Config.SYNC_META_KEY]).toEqual({
      schemaVersion: Config.SCHEMA_VERSION,
      migratedAt: 1000,
    })
    expect(fakeChrome.storage.local.data[Config.STORAGE_KEY]).toBeUndefined()
    expect(fakeChrome.storage.local.data[Config.LOCAL_MIGRATION_KEY]).toMatchObject({
      state: 'complete',
      schemaVersion: Config.SCHEMA_VERSION,
    })
  })

  it('keeps the synchronized value on conflict and backs the local one up', async () => {
    await seedLegacy({ 'both.com': host('both.com', false, 'local css') })
    await seedSyncHost('both.com', { enabled: true, styles: 'remote css' })

    const outcome = await run()

    expect(outcome.status).toBe('migrated')
    expect(outcome.conflicts).toEqual(['both.com'])
    expect(fakeChrome.storage.sync.data[encodeHostKey('both.com')]).toMatchObject({
      enabled: true,
      styles: 'remote css',
    })
    expect(fakeChrome.storage.local.data[Config.LOCAL_BACKUP_KEY]).toMatchObject({
      'both.com': { enabled: false, styles: 'local css' },
    })
  })

  it('does nothing when this device already migrated', async () => {
    await seedLegacy({ 'ghost.com': host('ghost.com') })
    await fakeChrome.storage.local.set({
      [Config.LOCAL_MIGRATION_KEY]: {
        state: 'complete',
        schemaVersion: Config.SCHEMA_VERSION,
        at: 1,
        uploaded: 0,
        conflicts: [],
      },
    })

    const outcome = await run()

    expect(outcome.status).toBe('already-migrated')
    expect(syncHostKeys()).toEqual([])
    // the marker is per-device, so the legacy blob is left alone rather than erased
    expect(fakeChrome.storage.local.data[Config.STORAGE_KEY]).toBeDefined()
  })

  it('refuses to write when another device uses a newer schema', async () => {
    await seedLegacy({ 'one.com': host('one.com') })
    await fakeChrome.storage.sync.set({ [Config.SYNC_META_KEY]: { schemaVersion: 99 } })

    const outcome = await run()

    expect(outcome.status).toBe('blocked-newer-schema')
    expect(outcome.schema).toBe(99)
    expect(syncHostKeys()).toEqual([])
  })

  it('leaves the marker unset on a quota refusal and converges on the next run', async () => {
    await seedLegacy({ 'bad.com': host('bad.com'), 'good.com': host('good.com') })

    fakeChrome.storage.sync.failNextWrites('QUOTA_BYTES_PER_ITEM quota exceeded', 1)
    const first = await run()

    expect(first.status).toBe('partial')
    expect(first.pending).toEqual(['bad.com'])
    expect(fakeChrome.storage.local.data[Config.LOCAL_MIGRATION_KEY]).toBeUndefined()
    expect(fakeChrome.storage.local.data[Config.STORAGE_KEY]).toBeDefined()
    expect(fakeChrome.storage.local.data[Config.LOCAL_PENDING_KEY]).toMatchObject({
      'bad.com': { host: 'bad.com' },
    })

    const second = await run()

    expect(second.status).toBe('migrated')
    expect(syncHostKeys()).toHaveLength(2)
    expect(fakeChrome.storage.local.data[Config.LOCAL_PENDING_KEY]).toEqual({})
  })

  it('starts clean on a device with neither legacy nor synced data', async () => {
    const outcome = await run()

    expect(outcome.status).toBe('migrated')
    expect(outcome.uploaded).toBe(0)
    expect(outcome.conflicts).toEqual([])
  })
})

import { beforeEach, describe, expect, it } from 'vitest'
import { createModel } from '@/entities/preferences/lib'
import { encodeHostKey } from '@/entities/preferences/host'
import { advance, resetClock, tick } from './fakes/clock'
import { createRecord, fakeChrome, fakeTab, hostWrites, seedSyncHost } from './fakes/preferences'
import type { IHostSettings } from '@/entities/preferences/types'

const entry = (host: string, enabled = false, styles = ''): IHostSettings => ({
  host,
  enabled,
  styles,
})

const start = async () => {
  const record = createRecord()
  const model = createModel(record)

  model.events.initialize()
  await tick()

  return { record, model }
}

beforeEach(() => {
  fakeChrome.reset()
  resetClock()
})

describe('preferences model', () => {
  it('loads the hydrated value without writing it back', async () => {
    await seedSyncHost('a.com', entry('a.com', true, 'a css'))
    const { model } = await start()

    expect(model.stores.preferences.getState()).toEqual({
      hosts: { 'a.com': entry('a.com', true, 'a css') },
    })
    expect(hostWrites()).toEqual([encodeHostKey('a.com')]) // only the seed above
  })

  it('answers the active tab with the wildcard that covers it', async () => {
    await seedSyncHost('*.example.com', entry('*.example.com', true, 'shared'))
    const { model } = await start()

    model.events.tabActivated(fakeTab(1, 'https://sub.example.com/x'))
    expect(model.stores.activeTabPreferences.getState()).toMatchObject({
      enabled: true,
      styles: 'shared',
    })

    model.events.tabActivated(fakeTab(2, 'https://unknown.dev/'))
    expect(model.stores.activeTabPreferences.getState()).toEqual(entry('unknown.dev', false, ''))
  })

  it('toggling a subhost creates an exact entry that overrides the wildcard', async () => {
    await seedSyncHost('*.example.com', entry('*.example.com', true, 'shared'))
    const { model } = await start()
    fakeChrome.storage.sync.writes.length = 0

    model.events.toggle('sub.example.com')
    await tick()
    await advance(5000)

    expect(model.stores.preferences.getState().hosts['sub.example.com']).toEqual(
      entry('sub.example.com', false, 'shared')
    )
    // only the new exact host is written, the wildcard item keeps its own bytes
    expect(hostWrites()).toEqual([encodeHostKey('sub.example.com')])
  })

  it('removing a host deletes its storage item', async () => {
    await seedSyncHost('a.com', entry('a.com', true, 'a css'))
    await seedSyncHost('b.com', entry('b.com', true, 'b css'))

    const record = createRecord()
    const model = createModel(record)

    model.events.initialize()
    await tick()

    model.events.removeHost('b.com')
    await tick()
    await advance(5000)

    expect(Object.keys(model.stores.preferences.getState().hosts)).toEqual(['a.com'])
    expect(fakeChrome.storage.sync.data[encodeHostKey('b.com')]).toBeUndefined()
    expect(fakeChrome.storage.sync.data[encodeHostKey('a.com')]).toBeDefined()
  })

  it('applies a remote change into the store without echoing a write', async () => {
    await seedSyncHost('a.com', entry('a.com', false, 'a css'))
    const { model } = await start()
    fakeChrome.storage.sync.writes.length = 0

    await seedSyncHost('a.com', { ...entry('a.com', true, 'a css'), updatedAt: 2 })
    await advance(5000)

    expect(model.stores.preferences.getState().hosts['a.com'].enabled).toBe(true)
    // the only sync write is the one this test performed as the other device
    expect(hostWrites()).toEqual([encodeHostKey('a.com')])
  })

  it('keeps the saved configuration when a toggle lands before hydration', async () => {
    await seedSyncHost('a.com', entry('a.com', false, 'a css'))
    await seedSyncHost('b.com', entry('b.com', true, 'b css'))

    const record = createRecord()
    const model = createModel(record)
    const before = hostWrites().length

    const release = fakeChrome.storage.sync.holdNextRead()
    model.events.initialize()
    model.events.toggle('a.com')
    await tick()

    expect(hostWrites()).toHaveLength(before)

    release()
    await advance(5000)

    expect(fakeChrome.storage.sync.data[encodeHostKey('a.com')]).toMatchObject({
      enabled: false,
      styles: 'a css',
    })
    expect(fakeChrome.storage.sync.data[encodeHostKey('b.com')]).toMatchObject({
      enabled: true,
      styles: 'b css',
    })
    expect(model.stores.preferences.getState().hosts['b.com']).toEqual(
      entry('b.com', true, 'b css')
    )
  })
})

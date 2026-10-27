import Config from '@/shared/config'
import type * as ChromeType from '@/shared/types/chrome'

export interface FakeStorageChange {
  newValue?: unknown
  oldValue?: unknown
}

type Listener = (changes: Record<string, FakeStorageChange>, areaName: string) => void

export interface FakeArea {
  readonly name: string
  readonly data: Record<string, unknown>
  /** One entry per write operation, listing the keys it touched. */
  readonly writes: Array<{ keys: string[]; removed: boolean }>
  readonly reads: Array<string | string[] | null>
  readonly QUOTA_BYTES: number
  readonly QUOTA_BYTES_PER_ITEM: number
  readonly MAX_ITEMS: number
  get(keys?: string | string[] | null): Promise<Record<string, unknown>>
  set(items: Record<string, unknown>): Promise<void>
  remove(keys: string | string[]): Promise<void>
  /** Blocks the next get() until the returned function is called. */
  holdNextRead(): () => void
  /** Makes the next write operations reject with this message. */
  failNextWrites(message: string, times?: number): void
  /** Makes the next read operations reject with this message. */
  failNextReads(message: string, times?: number): void
  /** Drops data and every queued failure, keeps the change listeners. */
  reset(): void
  listeners: Listener[]
}

export const utf8Bytes = (value: string): number => new TextEncoder().encode(value).length

/** A tabs.Tab as the runtime delivers it, with only the fields the model reads. */
export const fakeTab = (id: number, url: string): ChromeType.Tab => ({
  id,
  url,
  index: 0,
  windowId: 1,
  active: true,
  pinned: false,
  highlighted: true,
  incognito: false,
  selected: true,
  autoDiscardable: true,
  discarded: false,
  groupId: -1,
})

export const itemBytes = (key: string, value: unknown): number =>
  utf8Bytes(key) + utf8Bytes(JSON.stringify(value))

const SYNC_QUOTAS = {
  QUOTA_BYTES: Config.DEFAULT_QUOTA_BYTES,
  QUOTA_BYTES_PER_ITEM: Config.DEFAULT_QUOTA_BYTES_PER_ITEM,
  MAX_ITEMS: Config.DEFAULT_MAX_ITEMS,
}

const LOCAL_QUOTAS = {
  QUOTA_BYTES: 10485760,
  MAX_ITEMS: 0,
}

const createArea = (name: string): FakeArea => {
  const quotas = name === 'sync' ? SYNC_QUOTAS : { ...LOCAL_QUOTAS, QUOTA_BYTES_PER_ITEM: 0 }
  const data: Record<string, unknown> = {}
  const gates: Array<Promise<void>> = []
  const failures: string[] = []
  const readFailures: string[] = []
  const listeners: Listener[] = []

  const dispatch = (changes: Record<string, FakeStorageChange>) => {
    if (!Object.keys(changes).length) return
    for (const listener of listeners.slice()) listener(changes, name)
  }

  const assertWritable = (items: Record<string, unknown>) => {
    if (failures.length) throw new Error(String(failures.shift()))

    const next = { ...data, ...items }
    let total = 0

    for (const key of Object.keys(items)) {
      if (name === 'sync' && itemBytes(key, items[key]) > quotas.QUOTA_BYTES_PER_ITEM) {
        throw new Error('QUOTA_BYTES_PER_ITEM quota exceeded')
      }
    }

    for (const key of Object.keys(next)) total += itemBytes(key, next[key])

    if (total > quotas.QUOTA_BYTES) throw new Error('QUOTA_BYTES quota exceeded')

    if (name === 'sync' && Object.keys(next).length > quotas.MAX_ITEMS) {
      throw new Error('MAX_ITEMS quota exceeded')
    }
  }

  const area: FakeArea = {
    name,
    data,
    writes: [],
    reads: [],
    listeners,
    ...quotas,

    async get(keys) {
      area.reads.push(keys === undefined ? null : keys)

      if (readFailures.length) throw new Error(String(readFailures.shift()))

      const gate = gates.shift()
      if (gate) await gate

      if (keys === null || keys === undefined) return { ...data }

      const list = Array.isArray(keys) ? keys : [keys]
      const result: Record<string, unknown> = {}
      for (const key of list) if (key in data) result[key] = data[key]
      return result
    },

    async set(items) {
      assertWritable(items)
      area.writes.push({ keys: Object.keys(items), removed: false })

      const changes: Record<string, FakeStorageChange> = {}

      for (const key of Object.keys(items)) {
        changes[key] = { newValue: items[key], oldValue: data[key] }
        data[key] = items[key]
      }

      dispatch(changes)
    },

    async remove(keys) {
      const list = Array.isArray(keys) ? keys : [keys]
      assertWritable({})
      area.writes.push({ keys: list, removed: true })

      const changes: Record<string, FakeStorageChange> = {}

      for (const key of list) {
        if (!(key in data)) continue
        changes[key] = { oldValue: data[key] }
        delete data[key]
      }

      dispatch(changes)
    },

    holdNextRead() {
      let release!: () => void
      gates.push(new Promise<void>(resolve => (release = resolve)))
      return release
    },

    failNextWrites(message, times = 1) {
      for (let index = 0; index < times; index++) failures.push(message)
    },

    failNextReads(message, times = 1) {
      for (let index = 0; index < times; index++) readFailures.push(message)
    },

    reset() {
      for (const key of Object.keys(data)) delete data[key]
      area.writes.length = 0
      area.reads.length = 0
      gates.length = 0
      failures.length = 0
      readFailures.length = 0
    },
  }

  return area
}

const allEvents: Array<{ clear(): void }> = []

export function createEvent<Args extends unknown[]>() {
  const listeners: Array<(...args: Args) => void> = []

  const event = {
    addListener: (listener: (...args: Args) => void) => void listeners.push(listener),
    removeListener: (listener: (...args: Args) => void) => {
      const index = listeners.indexOf(listener)
      if (index >= 0) listeners.splice(index, 1)
    },
    emit: (...args: Args) => void listeners.slice().forEach(listener => listener(...args)),
    listenerCount: () => listeners.length,
    clear: () => void listeners.splice(0, listeners.length),
  }

  allEvents.push(event)
  return event
}

export type FakeEvent<Args extends unknown[]> = ReturnType<typeof createEvent<Args>> & {
  clear(): void
}

export interface FakeChrome {
  storage: {
    local: FakeArea
    sync: FakeArea
    onChanged: FakeEvent<[Record<string, FakeStorageChange>, string]>
  }
  tabs: {
    query(info: Record<string, unknown>): Promise<Array<{ id: number; url?: string }>>
    sendMessage(tabId: number, message: unknown): Promise<unknown>
    onActivated: FakeEvent<[{ tabId: number; windowId: number }]>
    onUpdated: FakeEvent<[number, { status?: string }, { id: number; url?: string }]>
  }
  scripting: { executeScript(details: unknown): Promise<void> }
  action: {
    onClicked: FakeEvent<[{ id: number; url?: string }]>
    setIcon(details: unknown): Promise<void>
    setBadgeText(details: unknown): Promise<void>
  }
  commands: { onCommand: FakeEvent<[string, { id: number; url?: string } | undefined]> }
  contextMenus: {
    create(props: Record<string, unknown>, callback?: () => void): void
    removeAll(callback?: () => void): Promise<void>
    onClicked: FakeEvent<[{ menuItemId: string }, { id: number; url?: string } | undefined]>
    created: Array<Record<string, unknown>>
    /** create() calls since the last reset, including the ones removeAll discarded. */
    createdTotal: number
    removeCount: number
    lastError: string | null
  }
  runtime: {
    id: string
    lastError: { message: string } | undefined
    sendMessage(message: unknown): Promise<unknown>
    onMessage: FakeEvent<[unknown, { id: string; url?: string }, (response: unknown) => void]>
    onInstalled: FakeEvent<[{ reason: string }]>
    onStartup: FakeEvent<[]>
  }
  activeTab: { id: number; url?: string } | null
  /** tabs.sendMessage calls the code under test performed. */
  sent: Array<{ tabId: number; message: unknown }>
  sendMessageError: Error | null
  /** Storage data, call logs and one-shot failures, without the listeners. */
  resetStorage(): void
  /** Everything resetStorage() does plus every registered listener. */
  reset(): void
}

export const createFakeChrome = (): FakeChrome => {
  const local = createArea('local')
  const sync = createArea('sync')
  const onChanged = createEvent<[Record<string, FakeStorageChange>, string]>()

  local.listeners.push((changes, areaName) => onChanged.emit(changes, areaName))
  sync.listeners.push((changes, areaName) => onChanged.emit(changes, areaName))

  const onMessage =
    createEvent<[unknown, { id: string; url?: string }, (response: unknown) => void]>()

  const fake: FakeChrome = {
    storage: { local, sync, onChanged },
    tabs: {
      async query() {
        return fake.activeTab ? [fake.activeTab] : []
      },
      async sendMessage(tabId: number, message: unknown) {
        fake.sent.push({ tabId, message })
        if (fake.sendMessageError) throw fake.sendMessageError
        return undefined
      },
      onActivated: createEvent<[{ tabId: number; windowId: number }]>(),
      onUpdated: createEvent<[number, { status?: string }, { id: number; url?: string }]>(),
    },
    scripting: { executeScript: async () => undefined },
    action: {
      onClicked: createEvent<[{ id: number; url?: string }]>(),
      setIcon: async () => undefined,
      setBadgeText: async () => undefined,
    },
    commands: { onCommand: createEvent<[string, { id: number; url?: string } | undefined]>() },
    contextMenus: {
      created: [],
      createdTotal: 0,
      removeCount: 0,
      lastError: null,
      create(props, callback) {
        fake.contextMenus.created.push(props)
        fake.contextMenus.createdTotal++

        const error = fake.contextMenus.lastError
        fake.runtime.lastError = error ? { message: error } : undefined
        if (callback) callback()
        fake.runtime.lastError = undefined
      },
      removeAll(callback?: () => void) {
        fake.contextMenus.removeCount++
        fake.contextMenus.created = []
        if (callback) callback()
        return Promise.resolve()
      },
      onClicked: createEvent<[{ menuItemId: string }, { id: number; url?: string } | undefined]>(),
    },
    runtime: {
      id: 'fake-extension-id',
      lastError: undefined,
      async sendMessage(message) {
        let response: unknown
        onMessage.emit(message, { id: fake.runtime.id }, (value: unknown) => {
          response = value
        })
        return response
      },
      onMessage,
      onInstalled: createEvent<[{ reason: string }]>(),
      onStartup: createEvent<[]>(),
    },

    activeTab: null,
    sent: [],
    sendMessageError: null,

    resetStorage() {
      local.reset()
      sync.reset()

      fake.activeTab = null
      fake.sent.length = 0
      fake.sendMessageError = null
      fake.contextMenus.created.length = 0
      fake.contextMenus.createdTotal = 0
      fake.contextMenus.removeCount = 0
      fake.contextMenus.lastError = null
      fake.runtime.lastError = undefined
    },

    reset() {
      fake.resetStorage()

      // connectors subscribe to onChanged; the areas keep their own fan-out listener
      for (const event of allEvents) event.clear()
    },
  }

  return fake
}

/**
 * One instance for the whole file: src/shared/lib/chrome/core.ts destructures the global
 * chrome object at module-eval time, so the object identity must never change.
 */
export const fakeChrome = createFakeChrome()

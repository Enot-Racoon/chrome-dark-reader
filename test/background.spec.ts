import { beforeAll, beforeEach, describe, expect, it } from 'vitest'
import Config from '@/shared/config'
import { encodeHostKey } from '@/entities/preferences/host'
import * as Preferences from '@/entities/preferences/model'
// importing the service worker runs main(): listeners, menus and hydration
import '@/background'
import { tick } from './fakes/clock'
import { fakeChrome, hostWrites } from './fakes/preferences'

/** The toggle path writes through a real-timer debounce, so force the flush. */
const settle = async () => {
  for (let index = 0; index < 5; index++) await tick()
  await Preferences.flushSync()
  await tick()
}

beforeAll(async () => {
  await Preferences.ready
  await tick()
})

// resetStorage, not reset: main() registered its listeners once at import time
beforeEach(() => fakeChrome.resetStorage())

describe('service worker wiring', () => {
  it('re-registers one menu item on install and on start-up', async () => {
    fakeChrome.runtime.onInstalled.emit({ reason: 'install' })
    await settle()

    expect(fakeChrome.contextMenus.created.map(item => item.id)).toEqual([Config.TOGGLE_MENU_ID])

    fakeChrome.runtime.onStartup.emit()
    await settle()

    expect(fakeChrome.contextMenus.created).toHaveLength(1)
    expect(fakeChrome.contextMenus.removeCount).toBe(2)
  })

  it('switches the theme through the keyboard shortcut', async () => {
    fakeChrome.commands.onCommand.emit(Config.TOGGLE_COMMAND, {
      id: 1,
      url: 'https://shortcut.dev/',
    })
    await settle()

    expect(Preferences.preferences.getState().hosts['shortcut.dev'].enabled).toBe(true)
    expect(hostWrites()).toContain(encodeHostKey('shortcut.dev'))
    expect(fakeChrome.sent.map(call => call.tabId)).toContain(1)
  })

  it('switches the same theme from the context menu', async () => {
    fakeChrome.contextMenus.onClicked.emit(
      { menuItemId: Config.TOGGLE_MENU_ID },
      { id: 2, url: 'https://menu.dev/' }
    )
    await settle()

    expect(Preferences.preferences.getState().hosts['menu.dev'].enabled).toBe(true)
  })

  it('ignores another command and another menu item', async () => {
    const before = JSON.stringify(Preferences.preferences.getState())

    fakeChrome.commands.onCommand.emit('some-other-command', {
      id: 3,
      url: 'https://other.dev/',
    })
    fakeChrome.contextMenus.onClicked.emit({ menuItemId: 'not-ours' }, { id: 3 })
    await settle()

    expect(JSON.stringify(Preferences.preferences.getState())).toBe(before)
    expect(Preferences.preferences.getState().hosts['other.dev']).toBeUndefined()
  })

  it('survives a shortcut pressed on an internal page', async () => {
    fakeChrome.activeTab = { id: 4, url: 'chrome://extensions/' }

    expect(() => fakeChrome.commands.onCommand.emit(Config.TOGGLE_COMMAND, undefined)).not.toThrow()

    await settle()
    expect(Preferences.preferences.getState().hosts['chrome']).toBeUndefined()
  })
})

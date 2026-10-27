import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { encodeHostKey } from '@/entities/preferences/host'
import { isThemeableUrl, toggleThemeForTab } from '@/services/theme-toggle'
import * as Preferences from '@/entities/preferences/model'
import { tick } from './fakes/clock'
import { fakeChrome, readSync } from './fakes/preferences'

const entry = (host: string, enabled: boolean, styles = '') => ({ host, enabled, styles })

beforeEach(() => fakeChrome.reset())

afterEach(async () => {
  // the record debounces with real timers here: drain them so nothing leaks into the next test
  await Preferences.flushSync()
  await tick()
})

describe('isThemeableUrl', () => {
  it('matches the schemes the content script is declared for', () => {
    expect(isThemeableUrl('https://example.com/a')).toBe(true)
    expect(isThemeableUrl('http://example.com')).toBe(true)
    expect(isThemeableUrl('file:///tmp/page.html')).toBe(true)

    expect(isThemeableUrl('chrome://extensions/')).toBe(false)
    expect(isThemeableUrl('chrome-extension://id/settings.html')).toBe(false)
    expect(isThemeableUrl('devtools://devtools/bundled/elements.html')).toBe(false)
    expect(isThemeableUrl('about:blank')).toBe(false)
    expect(isThemeableUrl('')).toBe(false)
    expect(isThemeableUrl(undefined)).toBe(false)
  })
})

describe('toggleThemeForTab', () => {
  it('returns an outcome instead of throwing when there is no tab', async () => {
    fakeChrome.activeTab = null

    expect(await toggleThemeForTab()).toEqual({ status: 'unsupported', reason: 'no-tab' })
    expect(await toggleThemeForTab(null)).toEqual({ status: 'unsupported', reason: 'no-tab' })
  })

  it('refuses the pages the content script never runs on', async () => {
    fakeChrome.activeTab = { id: 1, url: 'chrome://settings/' }

    expect(await toggleThemeForTab()).toEqual({ status: 'unsupported', reason: 'blocked-scheme' })
    expect(Preferences.preferences.getState().hosts).toEqual({})
  })

  it('switches the active tab through the shared path and persists it', async () => {
    const outcome = await toggleThemeForTab({ id: 7, url: 'https://example.com/search' })

    expect(outcome).toEqual({ status: 'toggled', host: 'example.com', enabled: true })
    expect(Preferences.preferences.getState().hosts['example.com'].enabled).toBe(true)

    await Preferences.flushSync()
    expect(readSync('example.com')).toMatchObject({ enabled: true })
    expect(Object.keys(fakeChrome.storage.sync.data)).toContain(encodeHostKey('example.com'))
  })

  it('inherits a wildcard entry and lets the exact host override it', async () => {
    Preferences.update({ hosts: { '*.example.com': entry('*.example.com', true) } })
    await tick()

    const outcome = await toggleThemeForTab({ id: 7, url: 'http://sub.example.com/' })

    expect(outcome).toEqual({ status: 'toggled', host: 'sub.example.com', enabled: false })

    await Preferences.flushSync()
    expect(readSync('sub.example.com')).toMatchObject({ enabled: false })
    expect(readSync('*.example.com')).toMatchObject({ enabled: true })
  })

  it('keeps the preference when the page does not answer', async () => {
    fakeChrome.sendMessageError = new Error('Could not establish connection')

    const outcome = await toggleThemeForTab({ id: 9, url: 'https://quiet.dev/' })

    expect(outcome).toEqual({ status: 'toggled', host: 'quiet.dev', enabled: true })

    await Preferences.flushSync()
    expect(readSync('quiet.dev')).toMatchObject({ enabled: true })
  })

  it('sends the resulting settings to the tab it switched', async () => {
    await toggleThemeForTab({ id: 42, url: 'https://heard.dev/' })

    expect(fakeChrome.sent).toEqual([
      {
        tabId: 42,
        message: {
          type: 'hostPreferencesChanged',
          payload: { host: 'heard.dev', enabled: true, styles: '' },
        },
      },
    ])
  })
})

import { beforeEach, describe, expect, it, vi } from 'vitest'
import Config from '@/shared/config'
import { ensureContextMenus } from '@/shared/lib/chrome'
import { fakeChrome } from './fakes/preferences'

beforeEach(() => fakeChrome.reset())

describe('ensureContextMenus', () => {
  it('re-registers the same single item on every service worker start', async () => {
    await ensureContextMenus()
    await ensureContextMenus()
    await ensureContextMenus()

    expect(fakeChrome.contextMenus.removeCount).toBe(3)
    expect(fakeChrome.contextMenus.createdTotal).toBe(3)
    expect(fakeChrome.contextMenus.created).toHaveLength(1)
    expect(fakeChrome.contextMenus.created[0]).toMatchObject({ id: Config.TOGGLE_MENU_ID })
  })

  it('shares one registration between concurrent callers', async () => {
    await Promise.all([ensureContextMenus(), ensureContextMenus(), ensureContextMenus()])

    expect(fakeChrome.contextMenus.removeCount).toBe(1)
    expect(fakeChrome.contextMenus.createdTotal).toBe(1)
    expect(fakeChrome.contextMenus.created).toHaveLength(1)
  })

  it('reports a rejected creation instead of throwing', async () => {
    fakeChrome.contextMenus.lastError = 'Cannot create item with duplicate id'
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined)

    await expect(ensureContextMenus()).resolves.toBeUndefined()
    expect(warn).toHaveBeenCalled()

    warn.mockRestore()
    fakeChrome.contextMenus.lastError = null
  })
})

import Config from '@/shared/config'
import * as Chrome from './core'

const MENU_CONTEXTS: chrome.contextMenus.ContextType[] = [
  'page',
  'selection',
  'link',
  'image',
  'editable',
]

let creating: Promise<void> | null = null

const register = async (): Promise<void> => {
  const menus = Chrome.contextMenus
  if (!menus) return

  // Removing first keeps repeated service worker starts idempotent.
  await new Promise<void>(resolve => menus.removeAll(resolve))
  menus.create(
    {
      id: Config.TOGGLE_MENU_ID,
      title: 'Toggle dark mode for this site',
      contexts: MENU_CONTEXTS,
    },
    () => {
      const lastError = Chrome.runtime.lastError
      if (lastError) console.warn('[dark-reader] context menu:', lastError.message)
    }
  )
}

/**
 * Idempotent menu registration. Chrome drops extension menu items when the browser
 * restarts, so this is called from runtime.onInstalled, runtime.onStartup and at
 * service worker start.
 */
export const ensureContextMenus = async (): Promise<void> => {
  if (!Chrome.contextMenus) return

  // concurrent callers share one registration instead of racing over the same id
  creating ??= register()

  try {
    await creating
  } catch (error) {
    console.warn('[dark-reader] context menu was not created', error)
  } finally {
    creating = null
  }
}

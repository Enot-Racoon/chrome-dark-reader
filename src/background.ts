import * as Chrome from '@/shared/lib/chrome'
import Config from '@/shared/config'
import Messenger from '@/services/messenger'
import * as Preferences from '@/entities/preferences/model'
import { toggleThemeForTab } from '@/services/theme-toggle'
import { getHostFromUrl, matchHostSettings, normalizeHost } from '@/entities/preferences/host'
import type { IHostSettings } from '@/entities/preferences/types'

const ICON_MAP = {
  enabled: 'enabled.png',
  disabled: 'disabled.png',
}

const iconSwitcher = Chrome.createIconSwitcher(ICON_MAP)

const isSame = (left: IHostSettings | null, right: IHostSettings | null): boolean =>
  left === right ||
  (!!left &&
    !!right &&
    left.host === right.host &&
    left.enabled === right.enabled &&
    left.styles === right.styles)

const onTabActivate = () => {
  void Chrome.getActiveTab().then(tab => {
    tab && Preferences.tabActivated(tab)
  })
}

const injectCriticalStyle = (tabId: number) => {
  Chrome.scripting
    .executeScript({
      target: { tabId },
      func: () => {
        const html = document.documentElement
        if (html) {
          html.style.backgroundColor = '#f2fafa'
          html.style.filter = 'invert(0.95) hue-rotate(180deg)'
        }
      },
      injectImmediately: true,
    })
    .catch(() => {
      /* Ignore errors for internal pages */
    })
}

const onTabUpdate = (
  tabId: number,
  changeInfo: Chrome.Type.Tab.ChangeTabInfo,
  tab: Chrome.Type.Tab
) => {
  if (changeInfo.status === Chrome.Type.Tab.TabStatusEnum.loading && tab.url) {
    // Waiting for hydration here is what keeps the flash-prevention style honest:
    // an answer from defaults would leave enabled pages unstyled on a cold start.
    void Preferences.ready.then(() => {
      const host = getHostFromUrl(tab.url)
      const settings = matchHostSettings(Preferences.preferences.getState().hosts, host)

      if (settings?.enabled) injectCriticalStyle(tabId)
    })
  }

  if (changeInfo.status === Chrome.Type.Tab.TabStatusEnum.complete) {
    Preferences.tabActivated(tab)
  }
}

const watchStoreChanges = () => {
  let last: IHostSettings | null = null

  Preferences.data.activeTabPreferences.updates.watch(activeTabPreferences => {
    if (isSame(last, activeTabPreferences)) return
    last = activeTabPreferences

    iconSwitcher(activeTabPreferences?.enabled ? 'enabled' : 'disabled')

    const activeTab = Preferences.activeTab.getState()

    if (activeTab?.id && activeTabPreferences?.host) {
      void Messenger.hostPreferencesChanged
        .dispatchToTab(activeTab.id, activeTabPreferences)
        .catch(() => console.warn('Tab preferences was updated'))
    }

    return activeTabPreferences
  })
}

const listenForeground = () => {
  Messenger.foregroundStart.setListener(async (host: string) => {
    await Preferences.ready

    const normalized = normalizeHost(host) ?? host
    return (
      matchHostSettings(Preferences.preferences.getState().hosts, normalized) ??
      Preferences.createDefaultHostSettings(normalized)
    )
  })
}

const onCommand = (command: string, tab?: Chrome.Type.Tab) => {
  if (command !== Config.TOGGLE_COMMAND) return
  void toggleThemeForTab(tab)
}

const onMenuItemClicked = (info: chrome.contextMenus.OnClickData, tab?: Chrome.Type.Tab) => {
  if (info.menuItemId !== Config.TOGGLE_MENU_ID) return
  void toggleThemeForTab(tab)
}

const main = () => {
  // Listen Browser Actions
  Chrome.action.onClicked.addListener(tab => void toggleThemeForTab(tab))
  Chrome.tabs.onActivated.addListener(onTabActivate)
  Chrome.tabs.onUpdated.addListener(onTabUpdate)

  // Keyboard shortcut and context menu reuse the same toggle path
  if (Chrome.commands) Chrome.commands.onCommand.addListener(onCommand)
  if (Chrome.contextMenus) Chrome.contextMenus.onClicked.addListener(onMenuItemClicked)

  // Menus are dropped when the browser restarts, so register on both lifecycle events
  Chrome.runtime.onInstalled.addListener(() => void Chrome.ensureContextMenus())
  Chrome.runtime.onStartup.addListener(() => void Chrome.ensureContextMenus())

  // Listen foreground scripts
  listenForeground()

  // Init model. Nothing may read or write preferences before it is hydrated.
  Preferences.initialize()
  void Preferences.ready
    .then(() => {
      watchStoreChanges()
      onTabActivate()
    })
    .catch(error => console.warn('[dark-reader] preferences load failed', error))

  void Chrome.ensureContextMenus()
}

main()

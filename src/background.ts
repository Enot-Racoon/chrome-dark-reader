import * as Chrome from '@/shared/lib/chrome'
import Messenger from '@/services/messenger'
import * as Preferences from '@/entities/preferences/model'

const ICON_MAP = {
  enabled: 'enabled.png',
  disabled: 'disabled.png',
}

const iconSwitcher = Chrome.createIconSwitcher(ICON_MAP)

const onAppIconClick = (tab: Chrome.Type.Tab) => {
  Preferences.iconClicked(tab)
}

const onTabActivate = () => {
  Chrome.getActiveTab().then(tab => {
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
    const host = new URL(tab.url).host
    const settings = Preferences.data.preferences
      .map(({ hosts }) => hosts[host] ?? Preferences.createDefaultHostSettings(host))
      .getState()

    if (settings?.enabled) {
      injectCriticalStyle(tabId)
    }
  }

  if (changeInfo.status === Chrome.Type.Tab.TabStatusEnum.complete) {
    Preferences.tabActivated(tab)
  }
}

const watchStoreChanges = () => {
  Preferences.data.activeTabPreferences.watch(activeTabPreferences => {
    iconSwitcher(activeTabPreferences?.enabled ? 'enabled' : 'disabled')

    const activeTab = Preferences.activeTab.getState()

    if (activeTab?.id && activeTabPreferences) {
      Messenger.hostPreferencesChanged
        .dispatchToTab(activeTab.id, activeTabPreferences)
        .catch(() => console.warn('Tab preferences was updated'))
    }

    return activeTabPreferences
  })
}

const listenForeground = () => {
  Messenger.foregroundStart.setListener((host: string) => {
    return Preferences.preferences
      .map(({ hosts }) => hosts[host] ?? Preferences.createDefaultHostSettings(host))
      .getState()
  })
}

const main = () => {
  // Listen Browser Actions
  Chrome.action.onClicked.addListener(onAppIconClick)
  Chrome.tabs.onActivated.addListener(onTabActivate)
  Chrome.tabs.onUpdated.addListener(onTabUpdate)

  // Watch Store
  watchStoreChanges()
  listenForeground()

  // Init model
  Preferences.initialize()
}

main()

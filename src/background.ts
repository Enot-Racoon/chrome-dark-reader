/* eslint-disable @typescript-eslint/no-unused-vars */

import Preferences from 'entities/preferences'
import Messenger from 'services/messenger'
import Chrome from 'shared/lib/chrome'
import Utils from 'shared/lib/common'

// const Logger = Utils.createLogger('background.ts')

const ICON_MAP = {
  enabled: 'enabled.png',
  disabled: 'disabled.png',
}

const iconSwitcher = Chrome.createIconSwitcher(ICON_MAP)

const onAppIconClick = (tab: Chrome.Type.Tab) => {
  void Preferences.iconClicked(tab)
}

const onTabActivate = (activateInfo: Chrome.Type.Tab.ActiveTabInfo) => {
  void Chrome.getActiveTab().then(tab => {
    void (tab && Preferences.tabActivated(tab))
  })
}

const injectCriticalStyle = (tabId: number) => {
  void Chrome.scripting
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

    const activeTab = Preferences.data.activeTab.getState()

    if (activeTab?.id && activeTabPreferences) {
      void Messenger.hostPreferencesChanged
        .dispatchToTab(activeTab.id, activeTabPreferences)
        .catch(Utils.warn('Tab preferences was updated'))
    }

    return activeTabPreferences
  })
}

const listenForeground = () => {
  Messenger.foregroundStart.setListener(host => {
    return Preferences.data.preferences
      .map(({ hosts }) => hosts[host] ?? Preferences.createDefaultHostSettings(host))
      .getState()
  })
}

const bootstrap = () => {
  // Listen Browser Actions
  Chrome.action.onClicked.addListener(onAppIconClick)
  Chrome.tabs.onActivated.addListener(onTabActivate)
  Chrome.tabs.onUpdated.addListener(onTabUpdate)

  // Watch Store
  watchStoreChanges()
  listenForeground()

  // Init model
  setTimeout(Preferences.initialize)
}

bootstrap()

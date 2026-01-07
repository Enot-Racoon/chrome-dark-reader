/* eslint-disable @typescript-eslint/no-unused-vars */

import Preferences from 'entities/preferences'
import Messenger from 'services/messenger'
import Chrome from 'shared/lib/chrome'
import Utils from 'shared/lib/common'

// const Logger = Utils.createLogger('background.ts')

abstract class BackgroundController {
  private static isStarted = false

  private static readonly IconMap = {
    enabled: 'enabled.png',
    disabled: 'disabled.png',
  }

  private static readonly iconSwitcher = Chrome.createIconSwitcher(this.IconMap)

  private constructor() {
    //
  }

  static readonly start = () => {
    if (this.isStarted) {
      throw new Error('BackgroundController already started')
    }
    this.isStarted = this.init()
  }

  private static readonly init = (): boolean => {
    this.listenBrowserActions()
    this.watchStoreChanges()
    this.listenForeground()

    // Init model
    setTimeout(Preferences.initialize)

    return true
  }

  private static readonly listenBrowserActions = () => {
    // on app icon click
    Chrome.action.onClicked.addListener(this.onAppIconClick)

    // on change active tab
    Chrome.tabs.onActivated.addListener(this.onTabActivate)

    // on change url
    Chrome.tabs.onUpdated.addListener(this.onTabUpdate)
  }

  private static readonly onAppIconClick = (tab: Chrome.Type.Tab) => {
    // Logger.log('onAppIconClick')(tab)
    void Preferences.iconClicked(tab)
  }

  private static readonly onTabActivate = (activateInfo: Chrome.Type.Tab.ActiveTabInfo) => {
    // Update active tab in store on browser tab activated
    void Chrome.getActiveTab().then(tab => {
      // Logger.log('onTabActivate')({ activateInfo, tab })

      void (tab && Preferences.tabActivated(tab))
    })
  }

  private static readonly onTabUpdate = (
    tabId: number,
    changeInfo: Chrome.Type.Tab.ChangeTabInfo,
    tab: Chrome.Type.Tab
  ) => {
    // Inject critical CSS as soon as the tab starts loading to prevent white flash
    if (changeInfo.status === Chrome.Type.Tab.TabStatusEnum.loading && tab.url) {
      const host = new URL(tab.url).host
      const settings = Preferences.data.preferences
        .map(({ hosts }) => hosts[host] ?? Preferences.createDefaultHostSettings(host))
        .getState()

      if (settings?.enabled) {
        this.injectCriticalStyle(tabId)
      }
    }

    // Update active tab in store on browser tab reload complete
    if (changeInfo.status === Chrome.Type.Tab.TabStatusEnum.complete) {
      Preferences.tabActivated(tab)
    }
  }

  private static readonly injectCriticalStyle = (tabId: number) => {
    // This style is minimal but enough to hide the initial white background
    const css = `
      html { 
        background-color: #f2fafa !important; 
        filter: invert(0.95) hue-rotate(180deg) !important;
      }
    `
    void Chrome.scripting
      .insertCSS({
        target: { tabId },
        css,
        origin: 'USER',
      })
      .catch(() => {
        /* Ignore errors for internal pages where scripting is not allowed */
      })
  }

  private static readonly watchStoreChanges = () => {
    Preferences.data.activeTabPreferences.watch(activeTabPreferences => {
      this.iconSwitcher(activeTabPreferences?.enabled ? 'enabled' : 'disabled')

      const activeTab = Preferences.data.activeTab.getState()

      if (activeTab?.id && activeTabPreferences) {
        void Messenger.hostPreferencesChanged
          .dispatchToTab(activeTab.id, activeTabPreferences)
          .catch(Utils.warn('Tab preferences was updated'))
      }

      return activeTabPreferences
    })
  }

  private static readonly listenForeground = () => {
    Messenger.foregroundStart.setListener(host => {
      return Preferences.data.preferences
        .map(({ hosts }) => hosts[host] ?? Preferences.createDefaultHostSettings(host))
        .getState()
    })
  }
}

BackgroundController.start()

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
    // Update active tab in store ob browser tab reload
    if (changeInfo.status === Chrome.Type.Tab.TabStatusEnum.complete) {
      // Logger.log('onTabUpdate complete')({ tabId, changeInfo, tab })

      Preferences.tabActivated(tab)
    }
  }

  private static readonly watchStoreChanges = () => {
    Preferences.data.activeTabPreferences.watch(activeTabPreferences => {
      // Logger.log('TYT!!!!')({ activeTabPreferences })
      // Change icon on change active tab in store
      this.iconSwitcher(activeTabPreferences?.enabled ? 'enabled' : 'disabled')

      const activeTab = Preferences.data.activeTab.getState()

      if (activeTab?.id && activeTabPreferences) {
        // Logger.log('hostPreferencesChanged')({ activeTab, activeTabPreferences })

        void Messenger.hostPreferencesChanged
          .dispatchToTab(activeTab.id, activeTabPreferences)
          .catch(Utils.warn('Tab preferences was updated'))
      }

      return activeTabPreferences
    })
  }

  private static readonly listenForeground = () => {
    Messenger.foregroundStart.setListener(host => {
      // Send tab preferences on foreground script start
      // Logger.log('Send tab preferences on foreground script start')({ host })

      return Preferences.data.preferences
        .map(({ hosts }) => hosts[host] ?? Preferences.createDefaultHostSettings(host))
        .getState()
    })
  }

  private static makeScreenshot(tab: Chrome.Type.Tab): Promise<string> {
    // Logger.log('makeScreenshot')({ tab })

    return Chrome.getTabScreenshot(tab.windowId, { format: 'png' })
  }
}

BackgroundController.start()

// Preferences.data.preferences.watch(Logger.log('Preferences.data.preferences'))
// Preferences.data.activeTab.watch(Logger.log('Preferences.data.activeTab'))
// Preferences.data.activeTabPreferences.watch(Logger.log('Preferences.data.activeTabPreferences'))
// Preferences.data.activeTabPreferences
// .map(pref => pref?.enabled)
// .watch(Logger.log('Preferences.data.activeTabPreferences 3222323'))

// class X extends BackgroundController {}

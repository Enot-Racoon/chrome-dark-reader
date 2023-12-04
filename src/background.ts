/* eslint-disable @typescript-eslint/no-unused-vars */

import Preferences from 'entities/preferences'
import Messenger from 'services/messenger'
import Chrome from 'shared/lib/chrome'
import Utils from 'shared/lib/common'

abstract class BackgroundController {
  private static isStarted = false

  private static readonly IconMap = {
    enabled: 'enabled.png',
    disabled: 'disabled.png',
  }

  private static readonly iconSwitcher = Chrome.createIconSwitcher(this.IconMap)

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
    // Change icon on click app icon
    Utils.log('onAppIconClick')(tab)
    void Preferences.iconClicked(tab)
  }

  private static readonly onTabActivate = (activateInfo: Chrome.Type.Tab.ActiveTabInfo) => {
    // Update active tab in store on browser tab activated
    void Chrome.getActiveTab().then(tab => {
      Utils.log('onTabActivate')({ activateInfo, tab })

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
      Utils.log('onTabUpdate complete')({ tabId, changeInfo, tab })

      Preferences.tabActivated(tab)
    }
  }

  private static readonly watchStoreChanges = () => {
    Preferences.data.activeTabPreferences.watch(activeTabPreferences => {
      // Change icon on change active tab in store
      this.iconSwitcher(activeTabPreferences?.enabled ? 'enabled' : 'disabled')

      const activeTab = Preferences.data.activeTab.getState()

      if (activeTab?.id && activeTabPreferences) {
        Utils.log('hostPreferencesChanged')({ activeTab, activeTabPreferences })

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
      Utils.log('Send tab preferences on foreground script start')({ host })

      return Preferences.data.preferences.map(({ hosts }) => hosts[host]).getState()
    })
  }

  // private static enableSendPreferencesToForegroundOnStoreUpdate() {
  //   // Send tab preferences on update preferences in browser storage
  //   Preferences.data.activeTabPreferences.updates.watch(async activeTabPreferences => {
  //     Utils.log('Preferences.data.activeTabPreferences.updates')(activeTabPreferences)
  //
  //     const activeTab = Preferences.data.activeTab.getState()
  //     if (activeTabPreferences && activeTab?.id) {
  //       const screenshot = await this.makeScreenshot(activeTab)
  //       const hostPreferences = Object.assign({}, activeTabPreferences, {
  //         screenshot,
  //       })
  //
  //       // Send tab preferences to foreground
  //       Messenger.hostPreferencesChanged
  //         .dispatchToTab(activeTab.id, hostPreferences)
  //         .catch(Utils.warn('Tab preferences was updated'))
  //     }
  //   })
  //
  //   // Preferences.data.preferences.updates.watch(async preferences => {
  //   // const tab = await Chrome.getActiveTab()
  //   //
  //   // if (tab?.id) {
  //   //   this.onTabPreferencesUpdate(tab)
  //   //
  //   //   const screenshot = await this.makeScreenshot(tab)
  //   //
  //   //   return Messenger.hostPreferencesChanged.dispatchToTab(
  //   //     tab.id,
  //   //     Object.assign({})
  //   //   )
  //   // }
  //   //
  //   // void Chrome.getAllTabs().then(allTabs => {
  //   //   Object.values(preferences.hosts).forEach(hostPreferences => {
  //   //     const tab = Chrome.getTabByHost(allTabs, hostPreferences.host)
  //   //     if (tab?.id) {
  //   //       this.onTabPreferencesUpdate(tab)
  //   //
  //   //       const { id: tabId } = tab
  //   //       void this.makeScreenshot(tab).then(screenshot => {
  //   //         Messenger.hostPreferencesChanged
  //   //           // Send tab preferences to foreground
  //   //           .dispatchToTab(
  //   //             tabId,
  //   //             Object.assign({}, hostPreferences, { screenshot })
  //   //           )
  //   //           .catch(Utils.warn('Tab preferences was updated'))
  //   //       })
  //   //     }
  //   //   })
  //   // })
  //   // })
  //
  //   return this
  // }
  //

  private static makeScreenshot(tab: Chrome.Type.Tab): Promise<string> {
    Utils.log('makeScreenshot')({ tab })

    return Chrome.getTabScreenshot(tab.windowId, { format: 'png' })
  }
}

BackgroundController.start()

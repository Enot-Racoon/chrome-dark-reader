// import * as activeTabModel from 'entities/activeTab'
// import * as appModel from 'entities/app'
// import * as tabSettingsModel from 'entities/settings/tab'
// import * as iconApi from 'shared/lib/chrome/icon'
// import { listenRequestGetCurrentTab } from 'shared/lib/chrome/tab/messenger'
// import { log } from 'shared/lib/common'
//
// setTimeout(appModel.events.initialize)
//
// listenRequestGetCurrentTab()
//
// tabSettingsModel.stores.enabled.watch(iconApi.toggleIcon)
// chrome.tabs.onActivated.addListener(activeTabModel.events.onActivated)
// activeTabModel.events.onActivated.watch(log('onActivated.watch'))
//
// import Preferences from 'entities/preferences'
// import Utils from 'shared/lib/common'
//
// setTimeout(Preferences.initialize)
//
// chrome.action.onClicked.addListener(Utils.log('Background action.onClicked'))
// chrome.tabs.onActivated.addListener(Preferences.tabActivated)
//
// Preferences.data.preferences.updates.watch(
//   // styleInjector.toggleAdditionalStyles(tab.enabled, tab.rules)
//   Utils.log('Background: Preferences ' + location.host)
// )
// Preferences.data.activeTab.updates.watch(
//   Utils.log('Background: Tab Activated ' + location.host)
// )

//

import Messages from 'processes/messages'

// Messages.addListener('getActiveTab', async (params, sender) => {
//   // todo
//
//   console.log('Background getActiveTab', { params, sender })
//
//   return Promise.resolve(null)
// })

Messages.addListener('ping', (params, sender) => {
  console.log('Background ping', { params, sender })
  return Promise.resolve('pong')
})

// import * as appModel from 'entities/app'
// import * as tabSettingsModel from 'entities/settings/tab'
// import * as styleInjector from 'shared/lib/style'
//
// setTimeout(appModel.events.initialize)
//
// tabSettingsModel.stores.settings.watch(tab => {
//   styleInjector.toggleAdditionalStyles(tab.enabled, tab.rules)
// })
//

import * as appModel from 'entities/app'
import * as tabSettingsModel from 'entities/settings/tab'
import { toggleAdditionalStyles } from 'shared/lib/style'
//
// import Preferences from 'entities/preferences'
import Utils from 'shared/lib/common'

setTimeout(appModel.events.initialize)

tabSettingsModel.stores.enabled.watch(toggleAdditionalStyles)

import Messages from 'processes/messages'

setTimeout(() => {
  const ping = async (timestamp: number) => {
    const response = await Messages.dispatch('ping', { timestamp })
    console.log('Foreground', 'ping', { response })
  }
  void ping(Date.now())
}, 2000)

// setTimeout(Preferences.initialize)
//
// Preferences.data.preferences.updates.watch(
//   // styleInjector.toggleAdditionalStyles(tab.enabled, tab.rules)
//   Utils.log(`Foreground: Preferences ${location.host}`)
// )
//
// Preferences.data.activeTab.updates.watch(
//   Utils.log(`Foreground: Tab Activated ${location.host}`)
// )

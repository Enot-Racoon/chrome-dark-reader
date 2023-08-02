import Preferences from 'entities/preferences'
import ChromeLib from 'shared/lib/chrome'
import Messenger from 'processes/messenger'
import Utils from './shared/lib/common'

// Change icon on click
chrome.action.onClicked.addListener(Preferences.iconClicked)

// Change icon on change active tab
Preferences.data.activeTabPreferences
  .map(tab => (tab?.enabled ? 'true' : 'false'))
  .watch(
    ChromeLib.createIconSwitcher({
      true: 'enabled.png',
      false: 'disabled.png',
    })
  )

// Change active tab on change browser tab
chrome.tabs.onActivated.addListener(() => {
  void ChromeLib.getActiveTab().then(
    tab => void (tab && Preferences.tabActivated(tab))
  )
})

// Update active tab on update change location
chrome.tabs.onUpdated.addListener(
  (_, { status }, tab) =>
    void (status === 'complete' && Preferences.tabActivated(tab))
)

// Send tab preferences on foreground script start
Messenger.foregroundStart.setListener(host => {
  return Preferences.data.preferences.map(({ hosts }) => hosts[host]).getState()
})

// Send tab preferences on update preferences in browser storage
Preferences.data.preferences.updates.watch(preferences => {
  void ChromeLib.getAllTabs().then(tabs => {
    if (preferences) {
      Object.values(preferences.hosts).forEach(hostPreferences => {
        const tab = ChromeLib.getTabByHost(tabs, hostPreferences.host)
        if (tab?.id)
          void Messenger.dispatchTab(
            tab.id,
            'hostPreferencesChanged',
            hostPreferences
          ).catch(Utils.log('Tab preferences updated'))
      })
    }
  })
})

// Init model
setTimeout(Preferences.initialize)

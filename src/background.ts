import Preferences from 'entities/preferences'
import ChromeLib from 'shared/lib/chrome'

chrome.action.onClicked.addListener(Preferences.iconClicked)
chrome.tabs.onActivated.addListener(() => {
  void ChromeLib.getActiveTab().then(
    tab => void (tab && Preferences.tabActivated(tab))
  )
})

Preferences.data.activeTabPreferences
  .map(tab => (tab?.enabled ? 'true' : 'false'))
  .watch(
    ChromeLib.createIconSwitcher({
      true: 'enabled.png',
      false: 'disabled.png',
    })
  )

setTimeout(Preferences.initialize)

import Messenger from 'services/messenger'
import StyleInjector from 'shared/lib/style'
import Utils from 'shared/lib/common'

// Send message on foreground script start
Utils.log('Send message on foreground script start')({ host: location.host })
void Messenger.foregroundStart
  .dispatchBackend(location.host)
  .then(Utils.logPromise('Messenger.foregroundStart'))
  .then(StyleInjector.toggleTabStyle)

// Update tab style on update tab preferences in browser storage
Messenger.hostPreferencesChanged.setListener(hostPreferences => {
  Utils.log('Messenger.hostPreferencesChanged')(hostPreferences)
  StyleInjector.toggleTabStyle(hostPreferences)
})

/*
 todo:
 * Get screenshot
 * Get average color
 * * Render screenshot to not big canvas
 * * Calculate average color
 * Determine average color is bright, if true then switch Dark mode
 */

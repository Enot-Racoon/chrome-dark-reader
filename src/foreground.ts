import Messenger from 'services/messenger'
import * as StyleInjector from 'shared/lib/style'

// Send message on foreground script start
void Messenger.foregroundStart
  .dispatchBackend(location.host)
  // .then(Utils.logPromise('Messenger.foregroundStart'))
  .then(StyleInjector.toggleTabStyle)

// Update tab style on update tab preferences in browser storage
Messenger.hostPreferencesChanged.setListener(hostPreferences => {
  // Utils.log('Messenger.hostPreferencesChanged')(hostPreferences)
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

import StyleInjector from 'shared/lib/style'
import Messenger from 'processes/messenger'

// Update tab style on update tab preferences in browser storage
Messenger.hostPreferencesChanged.setListener(StyleInjector.toggleTabStyle)

// Send message on foreground script start
void Messenger.foregroundStart
  .dispatchRuntime(location.host)
  .then(StyleInjector.toggleTabStyle)

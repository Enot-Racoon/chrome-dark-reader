import Messenger from '@/services/messenger'
import * as StyleInjector from '@/shared/lib/style'
import type { IHostSettings } from '@/entities/preferences/types'

// Send message on foreground script start
void Messenger.foregroundStart.dispatchBackend(location.host).then(StyleInjector.toggleTabStyle)

// Update tab style on update tab preferences in browser storage
Messenger.hostPreferencesChanged.setListener((hostPreferences: IHostSettings) => {
  void StyleInjector.toggleTabStyle(hostPreferences)
})

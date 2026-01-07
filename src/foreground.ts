import Messenger from '@/services/messenger'
import * as StyleInjector from '@/shared/lib/style'
import type { IHostSettings } from '@/entities/preferences/types'

// Send message on foreground script start
Messenger.foregroundStart.dispatchBackend(location.host).then(StyleInjector.toggleTabStyle)

// Update tab style on update tab preferences in browser storage
Messenger.hostPreferencesChanged.setListener((hostPreferences: IHostSettings) => {
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

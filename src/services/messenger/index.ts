import { Messenger } from '../../shared/lib/chrome/message'
import type { IHostSettings } from 'entities/preferences'

export type MessageMap = {
  foregroundStart: [host: string, preferences: IHostSettings]
  hostPreferencesChanged: [preferences: IHostSettings, res: void]
}

const messenger = new Messenger<MessageMap>()

export default {
  foregroundStart: messenger.createTypedMessage('foregroundStart'),
  hostPreferencesChanged: messenger.createTypedMessage('hostPreferencesChanged'),
}

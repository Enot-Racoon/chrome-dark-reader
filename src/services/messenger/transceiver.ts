import MessageLib from 'shared/lib/chrome/message'
import type Preferences from 'entities/preferences'

type MessageMap = {
  hostPreferencesChanged: [Preferences.IHostSettings, void]
}

export const transceiver = new MessageLib.MessageTransceiver<MessageMap>()

export const hostPreferencesChanged = new MessageLib.TypedMessage(
  'hostPreferencesChanged',
  transceiver
)

export default Object.assign(transceiver, { hostPreferencesChanged })

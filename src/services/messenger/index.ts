import MessageLib from 'shared/lib/chrome/message'
import type Preferences from 'entities/preferences'

export type IHostSettingsWithScreenshot = Preferences.IHostSettings & {
  screenshot?: string | null
}

export type MessageMap = {
  foregroundStart: [host: string, preferences: Preferences.IHostSettings]
  hostPreferencesChanged: [preferences: IHostSettingsWithScreenshot, res: void]
}

const transceiverFabric = new MessageLib.TransceiverFabric<MessageMap>()

export default Object.assign(transceiverFabric.transceiver, {
  foregroundStart: transceiverFabric.createDispatcher('foregroundStart'),
  hostPreferencesChanged: transceiverFabric.createDispatcher('hostPreferencesChanged'),
})

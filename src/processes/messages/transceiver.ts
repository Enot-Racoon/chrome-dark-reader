import MessageLib from 'shared/lib/chrome/message'
import type Type from 'shared/types/chrome'

type WithTime = { timestamp: number }

type MessageMap = {
  getActiveTab: [WithTime, Type.ChromeTab | null]
  ping: [WithTime, string]
}

export const transceiver = new MessageLib.MessageTransceiver<MessageMap>()

export default transceiver

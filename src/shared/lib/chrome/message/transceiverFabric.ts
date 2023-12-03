import MessageTransceiver from './messageTransceiver'
import TypedMessage from './typedMessage'

import type { MessageListener, BaseListenerMap } from './types'

export class TransceiverFabric<ListenerMap extends BaseListenerMap> {
  private readonly _transceiver: MessageTransceiver<ListenerMap>

  constructor() {
    this._transceiver = new MessageTransceiver()
  }

  get transceiver(): MessageTransceiver<ListenerMap> {
    return this._transceiver
  }

  readonly createDispatcher = <Type extends keyof ListenerMap>(
    type: Type,
    listener?: MessageListener<ListenerMap[Type]>,
    startListen = true
  ): TypedMessage<ListenerMap, Type> =>
    new TypedMessage(type, this._transceiver, listener, startListen)
}

export default TransceiverFabric

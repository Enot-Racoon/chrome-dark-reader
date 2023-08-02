import type ChromeTypes from 'shared/lib/chrome'
import ChromeLib from 'shared/lib/chrome'

export class TransceiverFabric<
  ListenerMap extends ChromeTypes.BaseListenerMap
> {
  private readonly _transceiver: ChromeLib.MessageTransceiver<ListenerMap>

  constructor() {
    this._transceiver = new ChromeLib.MessageTransceiver()
  }

  get transceiver(): ChromeLib.MessageTransceiver<ListenerMap> {
    return this._transceiver
  }

  readonly createDispatcher = <Type extends keyof ListenerMap>(
    type: Type,
    listener?: ChromeLib.MessageListener<ListenerMap[Type]>,
    startListen = true
  ): ChromeLib.TypedMessage<ListenerMap, Type> =>
    new ChromeLib.TypedMessage(type, this._transceiver, listener, startListen)
}

export default TransceiverFabric

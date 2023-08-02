import MessageTransceiver from './messageTransceiver'
import type Types from './types'

export class TypedMessage<
  ListenerMap extends Types.BaseListenerMap,
  Type extends keyof ListenerMap
> {
  constructor(
    private readonly type: Type,
    private readonly transceiver: MessageTransceiver<ListenerMap>,
    private listener?: Types.MessageListener<ListenerMap[Type]>,
    startListen = true
  ) {
    if (listener && startListen) this.listen()
  }

  readonly setListener = (
    listener: Types.MessageListener<ListenerMap[Type]>,
    startListen = true
  ): this => {
    if (this.listener) this.stopListen()
    this.listener = listener
    if (startListen) this.listen()
    return this
  }

  readonly listen = (): void => {
    if (this.listener) {
      this.transceiver.addListener(this.type, this.listener)
    }
  }

  readonly stopListen = (): void => this.transceiver.removeListener(this.type)

  readonly dispatchTab = (
    tabId: number,
    payload: Types.MessagePayload<ListenerMap[Type]>
  ): Promise<Types.MessageResponse<ListenerMap[Type]>> => {
    return this.transceiver.dispatchTab(tabId, this.type, payload)
  }

  readonly dispatchAllTabs = (
    tabIds: number[],
    payload: Types.MessagePayload<ListenerMap[Type]>
  ): Promise<Array<Types.MessageResponse<ListenerMap[Type]> | null>> => {
    return this.transceiver.dispatchAllTabs(tabIds, this.type, payload)
  }

  readonly dispatchRuntime = (
    payload: Types.MessagePayload<ListenerMap[Type]>
  ): Promise<Types.MessageResponse<ListenerMap[Type]>> => {
    return this.transceiver.dispatchRuntime(this.type, payload)
  }
}

export default TypedMessage

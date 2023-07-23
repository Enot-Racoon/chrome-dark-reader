import MessageTransceiver from './messageTransceiver'
import type Types from './types'

export class TypedMessage<
  ListenerMap extends Types.BaseListenerMap,
  Type extends keyof ListenerMap
> {
  constructor(
    private readonly transceiver: MessageTransceiver<ListenerMap>,
    private readonly type: Type,
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

  readonly tabDispatch = (
    tabId: number,
    payload: Types.MessagePayload<ListenerMap[Type]>
  ): Promise<Types.MessageResponse<ListenerMap[Type]>> => {
    return this.transceiver.tabDispatch(tabId, this.type, payload)
  }

  readonly tabsDispatch = (
    tabIds: number[],
    payload: Types.MessagePayload<ListenerMap[Type]>
  ): Promise<Array<Types.MessageResponse<ListenerMap[Type]> | null>> => {
    return this.transceiver.tabsDispatch(tabIds, this.type, payload)
  }

  readonly runtimeDispatch = (
    payload: Types.MessagePayload<ListenerMap[Type]>
  ): Promise<Types.MessageResponse<ListenerMap[Type]>> => {
    return this.transceiver.runtimeDispatch(this.type, payload)
  }
}

export default TypedMessage

import * as Chrome from '../core'
import type * as ChromeType from 'shared/types/chrome'
import type * as Types from './types'

export class TypedMessage<
  ListenerMap extends Types.BaseListenerMap,
  Type extends keyof ListenerMap
> {
  constructor(
    private readonly type: Type,
    private readonly listenerMap: Map<keyof ListenerMap, Types.MessageListener<any>>
  ) {}

  readonly setListener = (listener: Types.MessageListener<ListenerMap[Type]>): void => {
    this.listenerMap.set(this.type, listener)
  }

  readonly stopListen = (): void => void this.listenerMap.delete(this.type)

  readonly dispatchToTab = async (
    tabId: number,
    payload: Types.MessagePayload<ListenerMap[Type]>
  ): Promise<Types.MessageResponse<ListenerMap[Type]>> => {
    return Chrome.tabs.sendMessage(tabId, { type: this.type, payload })
  }

  readonly dispatchBackend = async (
    payload: Types.MessagePayload<ListenerMap[Type]>
  ): Promise<Types.MessageResponse<ListenerMap[Type]>> => {
    return Chrome.runtime.sendMessage({ type: this.type, payload })
  }
}

export class Messenger<ListenerMap extends Types.BaseListenerMap> {
  private readonly listenerMap = new Map<keyof ListenerMap, Types.MessageListener<any>>()

  constructor() {
    Chrome.runtime.onMessage.addListener(
      (
        message: { type: keyof ListenerMap; payload: any },
        sender: ChromeType.Message,
        sendResponse: (response: any) => void
      ) => {
        const listener = this.listenerMap.get(message.type)
        if (listener) {
          void Promise.resolve(listener(message.payload, sender)).then(sendResponse)
        }
        return true
      }
    )
  }

  readonly createTypedMessage = <Type extends keyof ListenerMap>(type: Type) =>
    new TypedMessage<ListenerMap, Type>(type, this.listenerMap)
}

export * from './types'

import Chrome from '../core'

import type Types from './types'

export interface InnerMessage<Type extends Index, Payload> {
  type: Type
  payload: Payload
}

export class MessageTransceiver<ListenerMap extends Types.BaseListenerMap> {
  private readonly listenerMap: Map<
    keyof ListenerMap,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    Types.MessageListener<any>
  >

  constructor() {
    this.listenerMap = new Map()
    Chrome.runtime.onMessage.addListener(this.handleMessage)
  }

  readonly addListener = <Type extends keyof ListenerMap>(
    type: Type,
    listener: Types.MessageListener<ListenerMap[Type]>
  ): void => void this.listenerMap.set(type, listener)

  readonly removeListener = <Type extends keyof ListenerMap>(type: Type): void =>
    void this.listenerMap.delete(type)

  readonly dispatchTab = async <Type extends keyof ListenerMap>(
    tabId: number,
    type: Type,
    payload: Types.MessagePayload<ListenerMap[Type]>
  ): Promise<Types.MessageResponse<ListenerMap[Type]>> => {
    return Chrome.tabs.sendMessage(tabId, { type, payload })
  }

  readonly dispatchAllTabs = async <Type extends keyof ListenerMap>(
    tabIds: number[],
    type: Type,
    payload: Types.MessagePayload<ListenerMap[Type]>
  ): Promise<Array<Types.MessageResponse<ListenerMap[Type]> | null>> => {
    return Promise.allSettled(tabIds.map(tabId => this.dispatchTab(tabId, type, payload))).then(
      results =>
        results.map(result => {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-return
          return result.status === 'fulfilled' ? result.value : null
        })
    )
  }

  readonly dispatchRuntime = async <Type extends keyof ListenerMap>(
    type: Type,
    payload: Types.MessagePayload<ListenerMap[Type]>
  ): Promise<Types.MessageResponse<ListenerMap[Type]>> => {
    return Chrome.runtime.sendMessage({ type, payload })
  }

  private readonly handleMessage = (
    message: InnerMessage<keyof ListenerMap, unknown>,
    sender: Chrome.Type.Message,
    sendResponse: (response: unknown) => void
  ): true => {
    const listener = this.listenerMap.get(message.type)
    if (listener) {
      void Promise.resolve(listener(message.payload, sender)).then(sendResponse)
    }
    return true
  }
}

export default MessageTransceiver

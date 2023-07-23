/* eslint-disable @typescript-eslint/no-explicit-any */
import tabs = chrome.tabs
import runtime = chrome.runtime
import MessageSender = runtime.MessageSender

import type Types from './types'

export interface InnerMessage<Type extends Index, Payload> {
  type: Type
  payload: Payload
}

export class MessageTransceiver<ListenerMap extends Types.BaseListenerMap> {
  private readonly listenerMap: Map<
    keyof ListenerMap,
    Types.MessageListener<any>
  >

  constructor() {
    this.listenerMap = new Map()
    runtime.onMessage.addListener(this.handleMessage)
  }

  readonly addListener = <Type extends keyof ListenerMap>(
    type: Type,
    listener: Types.MessageListener<ListenerMap[Type]>
  ): void => void this.listenerMap.set(type, listener)

  readonly removeListener = <Type extends keyof ListenerMap>(
    type: Type
  ): void => void this.listenerMap.delete(type)

  readonly tabDispatch = async <Type extends keyof ListenerMap>(
    tabId: number,
    type: Type,
    payload: Types.MessagePayload<ListenerMap[Type]>
  ): Promise<Types.MessageResponse<ListenerMap[Type]>> => {
    return tabs.sendMessage(tabId, { type, payload })
  }

  readonly tabsDispatch = async <Type extends keyof ListenerMap>(
    tabIds: number[],
    type: Type,
    payload: Types.MessagePayload<ListenerMap[Type]>
  ): Promise<Array<Types.MessageResponse<ListenerMap[Type]> | null>> => {
    return Promise.allSettled(
      tabIds.map(tabId => this.tabDispatch(tabId, type, payload))
    ).then(results =>
      results.map(result => {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-return
        return result.status === 'fulfilled' ? result.value : null
      })
    )
  }

  readonly runtimeDispatch = async <Type extends keyof ListenerMap>(
    type: Type,
    payload: Types.MessagePayload<ListenerMap[Type]>
  ): Promise<Types.MessageResponse<ListenerMap[Type]>> => {
    return runtime.sendMessage({ type, payload })
  }

  private readonly handleMessage = (
    message: InnerMessage<keyof ListenerMap, unknown>,
    sender: MessageSender,
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

/* eslint-disable @typescript-eslint/no-explicit-any */
import runtime = chrome.runtime
import MessageSender = runtime.MessageSender

export type MessageSignature<Payload, Response> = [Payload, Response]

export type MessagePayload<Signature extends MessageSignature<any, any>> =
  Signature extends MessageSignature<infer Payload, any> ? Payload : never

export type MessageResponse<Signature extends MessageSignature<any, any>> =
  Signature extends MessageSignature<any, infer Response> ? Response : never

export type MessageListener<Signature extends MessageSignature<any, any>> = (
  params: MessagePayload<Signature>,
  sender: MessageSender
) => Promise<MessageResponse<Signature>>

type Index = string | number | symbol

export interface InnerMessage<Type extends Index, Payload> {
  type: Type
  payload: Payload
}

export class MessageTransceiver<
  ListenerMap extends { [k: Index]: MessageSignature<any, any> }
> {
  private readonly listenerMap: Map<
    keyof ListenerMap,
    Set<MessageListener<any>>
  >

  constructor() {
    this.listenerMap = new Map()

    runtime.onMessage.addListener((request, sender, sendResponse) => {
      void (async () => {
        sendResponse(123)
      })()
    })
    // runtime.onMessage.addListener(this.handleMessage)
  }

  readonly addListener = <Type extends keyof ListenerMap>(
    type: Type,
    listener: MessageListener<ListenerMap[Type]>
  ): void => {
    if (!this.listenerMap.has(type)) {
      this.listenerMap.set(type, new Set())
    }
    this.listenerMap.get(type)?.add(listener)
  }

  readonly removeListener = <Type extends keyof ListenerMap>(
    type: Type,
    listener: MessageListener<ListenerMap[Type]>
  ): void => {
    this.listenerMap.get(type)?.delete(listener)
  }

  readonly dispatch = async <Type extends keyof ListenerMap>(
    type: Type,
    payload: MessagePayload<ListenerMap[Type]>
  ): Promise<MessageResponse<ListenerMap[Type]>> => {
    return runtime.sendMessage({ type, payload })
  }

  private readonly handleMessage = (
    message: InnerMessage<keyof ListenerMap, any>,
    sender: MessageSender, // todo:
    sendResponse: (response: any) => void
  ): void => {
    /*
    messageManager.addListener((request, sender, sendResponse) => {
      void (async () => {
        sendResponse(await ActiveTabApi.getActiveTab());
      })();
    });
     */

    setTimeout(() => sendResponse(2334), 1000)

    return
    sendResponse(['123', '456', '789'])
    return
    if (this.listenerMap.has(message.type)) {
      this.listenerMap.get(message.type)?.forEach(listener => {
        void listener(message.payload, sender)
          .then(response => {
            console.log('handleMessage, listener result', message, response)
            sendResponse('123')
            return response
          })
          .then(sendResponse)
      })
    }
  }
}

export default MessageTransceiver

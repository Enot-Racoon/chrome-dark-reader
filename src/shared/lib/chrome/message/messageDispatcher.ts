import runtime = chrome.runtime
import MessageSender = runtime.MessageSender

export type IMessageEventListener<Req, Res> = (
  Payload: Req,
  sender: MessageSender,
  sendResponse: (response: Res) => void
) => void

export type IMessageEventListenerAsync<Req, Res> = (
  Payload: Req,
  sender: MessageSender,
  sendResponse: (response: Res) => void
) => void | Promise<void>

export interface IMessageDispatcher<Req, Res> {
  readonly listen: () => void
  readonly dispatch: (message: Req) => Promise<Res>
  readonly stopListen: () => void
}

export class MessageDispatcher<Req, Res>
  implements IMessageDispatcher<Req, Res>
{
  private readonly listener: IMessageEventListener<Req, Res>

  constructor(listener: IMessageEventListenerAsync<Req, Res>, listen = false) {
    this.listener = (Payload, sender, sendResponse) =>
      void listener(Payload, sender, sendResponse)
    if (listen) this.listen()
  }

  listen = (): void => runtime.onMessage.addListener(this.listener)

  dispatch = (message: Req): Promise<Res> => runtime.sendMessage(message)

  stopListen = (): void => runtime.onMessage.removeListener(this.listener)
}

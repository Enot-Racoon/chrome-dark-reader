import runtime = chrome.runtime
import MessageSender = runtime.MessageSender

// todo: remove comment
// export class MessageManager<Req, Res> {
//   readonly addListener = (listener: IMessageEventListener<Req, Res>) =>
//     runtime.onMessage.addListener(
//       (request: Req, sender, sendResponse) =>
//         void listener(request, sender, sendResponse)
//     )
//
//   readonly sendMessage = (message: Req): Promise<Res> =>
//     runtime.sendMessage(message)
// }

type IMessageEventListener<Req, Res> = (
  request: Req,
  sender: MessageSender,
  sendResponse: (response: Res) => void
) => void

type IMessageEventListenerAsync<Req, Res> = (
  request: Req,
  sender: MessageSender,
  sendResponse: (response: Res) => void
) => void | Promise<void>

interface IMessageReSender<Req, Res> {
  readonly listen: () => void
  readonly dispatch: (message: Req) => Promise<Res>
  readonly stopListen: () => void
}

// todo: to remove
export class MessageReSender<Req, Res> implements IMessageReSender<Req, Res> {
  private readonly listener: IMessageEventListener<Req, Res>

  constructor(listener: IMessageEventListenerAsync<Req, Res>, listen = false) {
    this.listener = (request, sender, sendResponse) =>
      void listener(request, sender, sendResponse)
    if (listen) this.listen()
  }

  listen = (): void => runtime.onMessage.addListener(this.listener)

  dispatch = (message: Req): Promise<Res> => runtime.sendMessage(message)

  stopListen = (): void => runtime.onMessage.removeListener(this.listener)
}

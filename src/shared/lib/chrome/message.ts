import runtime = chrome.runtime;
import MessageSender = runtime.MessageSender;

export type IMessageEventListener<Req, Res> = (
  request: Req,
  sender: MessageSender,
  sendResponse: (response: Res) => void
) => void;

export class MessageManager<Req, Res> {
  readonly addListener = (listener: IMessageEventListener<Req, Res>) =>
    runtime.onMessage.addListener(listener);

  readonly sendMessage = (message: Req): Promise<Res> =>
    runtime.sendMessage(message);
}

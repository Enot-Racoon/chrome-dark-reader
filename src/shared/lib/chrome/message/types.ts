/* eslint-disable @typescript-eslint/no-explicit-any */
import type Chrome from 'shared/types/chrome'

export * as default from './types'

export type MessageSignature<Payload, Response> = [Payload, Response]

export type MessagePayload<Signature extends MessageSignature<any, any>> =
  Signature extends MessageSignature<infer Payload, any> ? Payload : never

export type MessageResponse<Signature extends MessageSignature<any, any>> =
  Signature extends MessageSignature<any, infer Response> ? Response : never

export type MessageListenerResponse<Signature extends MessageSignature<any, any>> =
  | void
  | MessageResponse<Signature>
  | Promise<MessageResponse<Signature>>

export type BaseListenerMap = {
  [k: Index]: MessageSignature<any, any>
}

export type MessageListener<Signature extends MessageSignature<any, any>> = (
  params: MessagePayload<Signature>,
  message: Chrome.Message
) => MessageListenerResponse<Signature>

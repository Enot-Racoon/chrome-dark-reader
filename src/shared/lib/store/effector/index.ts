export * as default from '.'

export { sample, combine, is } from 'effector'
export { createGate, useUnit as use, useGate } from 'effector-react'
export type { Gate } from 'effector-react'
export type { Unit } from 'effector'

export * from './create-use'
export * from './createEffect'
export * from './createEvent'
export * from './createStore'
export * from './forward'
export * from './restore'

export const returnPayload = <S, P>(_state: S, payload: P): P => payload

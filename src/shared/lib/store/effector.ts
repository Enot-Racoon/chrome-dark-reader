import * as effector from 'effector'
import * as effectorReact from 'effector-react'

export { sample, combine, is, createStore, createEvent, createEffect } from 'effector'
export { createGate, useUnit as use, useGate } from 'effector-react'
export type { Gate } from 'effector-react'
export type { Unit } from 'effector'

export default {
  ...effector,
  ...effectorReact,
  use: effectorReact.useUnit,
}

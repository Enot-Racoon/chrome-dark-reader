import { tabs } from './core'

export const getActiveTab = () =>
  tabs.query({ active: true, currentWindow: true }).then(tabs => tabs.at(0) ?? null)

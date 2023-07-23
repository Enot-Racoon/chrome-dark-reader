export * as default from './settings'

import type { ITabSettings } from './tab'

export interface ISettings {
  enabled: boolean
  readonly tabs: ITabSettings[]
}

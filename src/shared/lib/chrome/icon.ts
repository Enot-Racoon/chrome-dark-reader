import Config from '@/shared/config'

import Chrome from './core'

export const setIcon = (name: string) => {
  return Chrome.action.setIcon({ path: `${Config.ICON_DIR}/${name}` })
}

type BaseStateMap = {
  [k: Index]: string
}

export const createIconSwitcher = <StateMap extends BaseStateMap, State extends keyof StateMap>(
  stateMap: StateMap
) => {
  return (state: State): void => void setIcon(stateMap[state])
}

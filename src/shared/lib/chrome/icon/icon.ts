export const ICON_DIR = '/static/icons' // todo: move to config

export const setIcon = (name: string) => {
  return chrome.action.setIcon({ path: `${ICON_DIR}/${name}` })
}

type BaseStateMap = { [k: Index]: string }

export const createIconSwitcher = <
  StateMap extends BaseStateMap,
  State extends keyof StateMap
>(
  stateMap: StateMap
) => {
  return (state: State): void => void setIcon(stateMap[state])
}

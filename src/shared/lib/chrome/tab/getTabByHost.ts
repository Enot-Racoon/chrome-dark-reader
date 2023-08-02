import type ChromeTypes from 'shared/types/chrome'

export const getTabByHost = (
  tabs: ChromeTypes.ChromeTab[],
  host: string
): ChromeTypes.ChromeTab | null =>
  tabs.find(t => new URL(t.url ?? '').host === host) ?? null

export default getTabByHost

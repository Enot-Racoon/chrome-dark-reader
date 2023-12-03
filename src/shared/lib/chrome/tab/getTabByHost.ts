import type Chrome from 'shared/types/chrome'

export const getTabByHost = (tabs: Chrome.Tab[], host: string): Chrome.Tab | null =>
  tabs.find(t => t.url && new URL(t.url).host === host) ?? null

export default getTabByHost

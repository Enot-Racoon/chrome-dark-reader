// import { mapTab } from 'shared/lib/chrome'

import type { Tab } from 'shared/types/entities'

export const getCurrentTab = async (): Promise<Tab.ITab | null> => {
  return Promise.resolve(null)
  // todo
  // return mapTab(await ActiveTabApi.getActiveTab())
}

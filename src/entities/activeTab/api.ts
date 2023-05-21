import { mapTab } from "shared/lib/chrome";
import * as ActiveTabApi from "shared/lib/chrome/tab/api";

import type { Tab } from "shared/types/entities";

export const getCurrentTab = async (): Promise<Tab.ITab | null> => {
  return mapTab(await ActiveTabApi.getActiveTab());
};

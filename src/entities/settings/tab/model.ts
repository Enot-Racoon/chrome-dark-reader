import { error, log } from "shared/lib/common";
import * as settingsModel from "entities/settings";
import * as activeTabModel from "entities/activeTab";

import { createModel } from "./lib";

export const {
  gate,
  events,
  effects,
  stores,
  useGate,
  useEvents,
  useStores,
  use,
} = createModel({
  settings: settingsModel.stores.value,
  activeTab: activeTabModel.stores.activeTab,
});

events.initialized.watch(log("Tab was initialized"));
stores.initializeError.updates.watch(error);

stores.host.watch(log("stores.host"));
stores.enabled.watch(log("stores.enabled"));

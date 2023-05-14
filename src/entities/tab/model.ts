import * as settingsModel from "entities/settings";
import { error, log } from "shared/lib/common";

import { createModel } from "./lib";

export const { gate, events, effects, stores, useGate, useEvents, useStores } =
  createModel({ settings: settingsModel.stores.value });

// settingsModel.stores.value.updates.watch(log("settingsModel.stores.value"));
stores.host.updates.watch(log("stores.host"));
stores.enabled.updates.watch(log("stores.enabled"));
stores.tab.updates.watch(log("stores.tab"));

stores.initialized.updates.watch(log("Tab initialized was changed"));
stores.initializeError.updates.watch(error);

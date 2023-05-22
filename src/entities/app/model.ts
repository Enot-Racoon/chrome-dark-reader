import { error } from "shared/lib/common";

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
} = createModel();

// events.initialized.watch(log("App was initialized"));
stores.initializeError.updates.watch(error);

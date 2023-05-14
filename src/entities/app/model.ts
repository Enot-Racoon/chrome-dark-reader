import { error, log } from "shared/lib/common";

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

stores.initialized.updates.watch(log("App initialized was changed"));
stores.initializeError.updates.watch(error);

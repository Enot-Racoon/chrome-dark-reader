import * as settingsModel from "entities/settings";

import { createModel } from "./lib";

export const { gate, events, effects, stores, useGate, useEvents, useStores } =
  createModel({ settings: settingsModel.stores.value });

const log = (name: string) => console.log.bind(console, name);
const error = (error: unknown) => console.error(error);

settingsModel.stores.value.updates.watch(log("settingsModel.stores.value"));
stores.host.updates.watch(log("stores.host"));
stores.enabled.updates.watch(log("stores.enabled"));
stores.tab.updates.watch(log("stores.tab"));
stores.tabError.updates.watch(error);

gate.open();

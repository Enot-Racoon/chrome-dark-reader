import { forward } from "effector";

import { effects as settingsEffects } from "./model";
import { events as tabSettingsEvents } from "./tab";

forward({
  from: settingsEffects.initialize,
  to: tabSettingsEvents.initialize,
});

export * from "./model";

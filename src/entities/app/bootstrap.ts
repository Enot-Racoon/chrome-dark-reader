import { forward } from "effector";

import * as AppModel from "entities/app";
import * as SettingsModel from "entities/settings";
import * as TabSettings from "entities/tab";

forward({
  from: AppModel.effects.initialize.done,
  to: [SettingsModel.events.initialize, TabSettings.events.initialize],
});

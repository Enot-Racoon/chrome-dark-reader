import * as appModel from "entities/app";
import * as tabSettingsModel from "entities/settings/tab";
import { toggleAdditionalStyles } from "shared/lib/style";

setTimeout(appModel.events.initialize);

tabSettingsModel.stores.enabled.watch(toggleAdditionalStyles);

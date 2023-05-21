import * as appModel from "entities/app";

setTimeout(appModel.events.initialize);

// currentUrl != currentTab
// popup no have tab => TabApi.getCurrentTab

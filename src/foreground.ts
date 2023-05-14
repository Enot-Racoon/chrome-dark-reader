import * as appModel from "entities/app";

console.log("Foreground", window.location.host);

setTimeout(appModel.events.initialize);

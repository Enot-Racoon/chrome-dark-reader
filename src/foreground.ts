// setTimeout(() => alert("Hello world from content.js"), 3000);

import * as settingsModel from "entities/settings";

settingsModel.stores.value.watch(
  console.log.bind(console, "Foreground", "watch")
);

console.log(
  "Foreground",
  'settingsModel.stores.value.watch(console.log.bind(console, "Foreground"));'
);

export default undefined;

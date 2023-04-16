// This is the service worker script, which executes in its own context
// when the extension is installed or refreshed (or when you access its console).
// It would correspond to the background script in chrome extensions v2.

export default undefined;

console.log(
  "This prints to the console of the service worker (background script)"
);

// Importing and using functionality from external files is also possible.
// importScripts("service-worker-utils.js");

// If you want to import a file that is deeper in the file hierarchy of your
// extension, simply do `importScripts('path/to/file.js')`.
// The path should be relative to the file `manifest.json`.
// let active = false;
//
// function makeOrange(color: string): void {
//   document.body.style.backgroundColor = color;
// }
//
// chrome.action.onClicked.addListener((tab) => {
//   active = !active;
//   const color = active ? "orange" : "white";
//   chrome.scripting
//     .executeScript({
//       target: { tabId: tab.id ? tab.id : -1 },
//       func: makeOrange,
//       args: [color],
//     })
//     .then();
// });

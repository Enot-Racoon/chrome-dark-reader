export const getActiveTab = () =>
  chrome.tabs
    .query({ active: true, currentWindow: true })
    .then(tabs => tabs.at(0) ?? null)

export default getActiveTab

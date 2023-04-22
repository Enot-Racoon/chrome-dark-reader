import { ChromeStorageConnector } from "./chrome-storage";
import { LocalStorageConnector } from "./local-storage";

export const getStorageConnector = <T>() => {
  return chrome && chrome.storage
    ? new ChromeStorageConnector<T>()
    : new LocalStorageConnector<T>();
};

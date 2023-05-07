import qs from "qs";
import type { Tab } from "shared/types/entities";

export const getCurrentTab = async (): Promise<Tab.ITab> => {
  const [tab] = await chrome.tabs.query({
    active: true,
    currentWindow: true,
  });
  const urlStr = tab.url ?? "";
  const {
    hash,
    host,
    hostname,
    href,
    origin,
    password,
    pathname,
    port,
    protocol,
    search,
    username,
  } = new URL(urlStr);
  const url: Tab.ITabURL = {
    hash,
    host,
    hostname,
    href,
    origin,
    password,
    pathname,
    port,
    protocol,
    search,
    searchParams: qs.parse(search.slice(1)),
    username,
    toString: () => urlStr,
  };

  return Object.assign(tab, { url });
};

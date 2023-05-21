import type { ChromeTab } from "shared/types/entities/tab";

export const getActiveTab = async (): Promise<ChromeTab | null> => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  return tab;
};

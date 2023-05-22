import { MessageManager } from "shared/lib/chrome/message";
import type { ChromeTab } from "shared/types/entities/tab";

import * as ActiveTabApi from "./api";

const messageManager = new MessageManager<
  { timestamp: number },
  ChromeTab | null
>();

export const getCurrentTab = () => {
  return messageManager.sendMessage({ timestamp: Date.now() });
};

export const listenRequestGetCurrentTab = () => {
  messageManager.addListener((request, sender, sendResponse) => {
    void (async () => {
      sendResponse(await ActiveTabApi.getActiveTab());
    })();
  });
};

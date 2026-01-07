/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-namespace */

export interface StorageChange {
  newValue?: any
  oldValue?: any
}

export interface MessageSender {
  id?: string
  tab?: Tab
  nativeApplication?: string
  frameId?: number
  url?: string
  tlsChannelId?: string
  origin?: string
}

export interface Tab {
  status?: string
  index: number
  openerTabId?: number
  title?: string
  url?: string
  pendingUrl?: string
  pinned: boolean
  highlighted: boolean
  windowId: number
  active: boolean
  favIconUrl?: string
  id?: number
  incognito: boolean
  selected: boolean
  audible?: boolean
  discarded: boolean
  autoDiscardable: boolean
  mutedInfo?: {
    muted: boolean
    reason?: string
    extensionId?: string
  }
  width?: number
  height?: number
  sessionId?: string
  groupId: number
}

export namespace Tab {
  export interface ActiveTabInfo {
    tabId: number
    windowId: number
  }

  export enum TabStatusEnum {
    unloaded = 'unloaded',
    loading = 'loading',
    complete = 'complete',
  }

  export interface ChangeTabInfo {
    status?: TabStatusEnum | string
    pinned?: boolean
    url?: string
    audible?: boolean
    discarded?: boolean
    autoDiscardable?: boolean
    groupId?: number
    mutedInfo?: {
      muted: boolean
      reason?: string
      extensionId?: string
    }
    favIconUrl?: string
    title?: string
  }
}

export type { MessageSender as Message }

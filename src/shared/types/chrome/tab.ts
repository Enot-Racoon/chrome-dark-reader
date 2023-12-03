export interface Tab {
  status?: string | undefined
  index: number
  openerTabId?: number | undefined
  title?: string | undefined
  url?: string | undefined
  pendingUrl?: string | undefined
  pinned: boolean
  highlighted: boolean
  windowId: number
  active: boolean
  favIconUrl?: string | undefined
  id?: number | undefined
  incognito: boolean
  selected: boolean
  audible?: boolean | undefined
  discarded: boolean
  autoDiscardable: boolean
  mutedInfo?:
    | {
        muted: boolean
        reason?: string | undefined
        extensionId?: string | undefined
      }
    | undefined
  width?: number | undefined
  height?: number | undefined
  sessionId?: string | undefined
  groupId: number
}

// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace Tab {
  export interface ScreenshotOptionsPng {
    format: 'png'
  }

  export interface ScreenshotOptionsJPEG {
    format: 'jpeg'
    quality?: number
  }

  export type ScreenshotOptions = ScreenshotOptionsPng | ScreenshotOptionsJPEG

  export interface ActiveTabInfo {
    tabId: number
    windowId: number
  }

  export interface MuteTabInfo {
    /** Whether the tab is prevented from playing sound (but hasn't necessarily recently produced sound). Equivalent to whether the muted audio indicator is showing. */
    muted: boolean
    /**
     * Optional.
     * The reason the tab was muted or unmuted. Not set if the tab's mute state has never been changed.
     * "user": A user input action has set/overridden the muted state.
     * "capture": Tab capture started, forcing a muted state change.
     * "extension": An extension, identified by the extensionId field, set the muted state.
     */
    reason?: string | undefined
    /**
     * Optional.
     * The ID of the extension that changed the muted state. Not set if an extension was not the reason the muted state last changed.
     */
    extensionId?: string | undefined
  }

  export type TabStatusUnion = 'unloaded' | 'loading' | 'complete'

  export enum TabStatusEnum {
    unloaded = 'unloaded',
    loading = 'loading',
    complete = 'complete',
  }

  export interface ChangeTabInfo {
    /** Optional. The status of the tab. Can be either loading or complete */
    status?: TabStatusEnum | string | undefined
    /** The tab's new pinned state */
    pinned?: boolean | undefined
    /** Optional. The tab's URL if it has changed */
    url?: string | undefined
    /** The tab's new audible state */
    audible?: boolean | undefined
    /** The tab's new discarded state */
    discarded?: boolean | undefined
    /** The tab's new auto-discardable */
    autoDiscardable?: boolean | undefined
    /** The tab's new group */
    groupId?: number | undefined
    /** The tab's new muted state and the reason for the change */
    mutedInfo?: MuteTabInfo | undefined
    /** The tab's new favicon URL */
    favIconUrl?: string | undefined
    /** The tab's new title */
    title?: string | undefined
  }
}

export default Tab

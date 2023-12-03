import type Tab from 'shared/types/chrome/tab'

import { tabs } from '../core'

export const getTabScreenshot = (windowId?: number, options?: Tab.ScreenshotOptions) =>
  windowId
    ? options
      ? tabs.captureVisibleTab(windowId, options)
      : tabs.captureVisibleTab(windowId)
    : tabs.captureVisibleTab()

export default getTabScreenshot

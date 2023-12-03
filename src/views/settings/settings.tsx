import React from 'react'

import SettingsEdit from 'feature/settings/edit'
import ChromeLib from 'shared/lib/chrome'
import { Button } from 'shared/ui/components'

import styles from './settings.module.css'

const Settings = () => {
  const makeScreenshot = async () => {
    console.log('makeScreenshot')

    const screenshotUrl = await ChromeLib.getTabScreenshot()

    console.log({ screenshotUrl })

    return screenshotUrl
  }
  return (
    <div className={styles.container}>
      <h1>Chrome extension Dark Reader: Settings</h1>
      <SettingsEdit />
      <Button onClick={() => void makeScreenshot()}>Make Screenshot</Button>
    </div>
  )
}

export default Settings

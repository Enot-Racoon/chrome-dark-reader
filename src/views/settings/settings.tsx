import React from 'react'
import SettingsEdit from 'feature/settings/edit'

import styles from './settings.module.css'

const Settings = () => {
  return (
    <div className={styles.container}>
      <h1>Chrome extension Dark Reader: Settings</h1>
      <SettingsEdit />
    </div>
  )
}

export default Settings

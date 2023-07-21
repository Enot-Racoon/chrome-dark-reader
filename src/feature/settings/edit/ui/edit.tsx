import React from 'react'

import * as settingsModel from 'entities/settings'
import { Button, Code } from 'shared/ui/components'
import type { Settings } from 'shared/types/entities'

import styles from './edit.module.css'

export interface SettingsEditProps {
  checked?: unknown
}

const stringifySetting = (settings: Settings.ISettings): string => {
  return JSON.stringify(settings, null, 2)
}

const SettingsEdit: React.FC<SettingsEditProps> = () => {
  const { events, stores } = settingsModel.use()
  const { value, loading, updating } = stores
  const [settings, setSettings] = React.useState(stringifySetting(value))

  React.useEffect(() => {
    setSettings(stringifySetting(value))
  }, [value])

  const onSave = () => {
    events.set(JSON.parse(settings) as Settings.ISettings)
  }

  const onReset = () => {
    setSettings(JSON.stringify(value))
  }

  if (loading) {
    return <p>Loading...</p>
  }

  return (
    <div className={styles.container}>
      <Code
        width="90vw"
        height="70vh"
        value={settings}
        onChange={setSettings}
      />
      <div className={styles.controls}>
        <Button className={styles.save} disabled={updating} onClick={onSave}>
          Save
        </Button>
        <Button className={styles.cancel} disabled={updating} onClick={onReset}>
          Reset
        </Button>
      </div>
    </div>
  )
}

export default SettingsEdit

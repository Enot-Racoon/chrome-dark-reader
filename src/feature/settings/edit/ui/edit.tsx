import React from 'react'

import Preferences from 'entities/preferences'
import { Button, Code } from 'shared/ui/components'

import styles from './edit.module.css'

const stringifySetting = (settings: Preferences.IPreferences): string => {
  return JSON.stringify(settings, null, 2)
}

const SettingsEdit: React.FC = () => {
  const { events, stores } = Preferences.use()
  const { preferences, loading, updating } = stores
  const [settings, setSettings] = React.useState(stringifySetting(preferences))

  React.useEffect(() => {
    setSettings(stringifySetting(preferences))
  }, [preferences])

  const onSave = () => {
    events.update(JSON.parse(settings) as Preferences.IPreferences)
  }

  const onCancel = () => {
    setSettings(JSON.stringify(settings))
  }

  if (loading) {
    return <p>Loading...</p>
  }

  return (
    <div className={styles.container}>
      <Code
        height="calc(100vh - 116px)"
        value={settings}
        onChange={setSettings}
      />
      <div className={styles.controls}>
        <Button className={styles.save} disabled={updating} onClick={onSave}>
          Save
        </Button>
        <Button
          className={styles.cancel}
          disabled={updating}
          onClick={onCancel}
        >
          Cancel
        </Button>
      </div>
    </div>
  )
}

export default SettingsEdit

import { useState, useEffect, type FC } from 'react'

import { CodeEditor } from '@/shared/ui/codeEditor'
import { Button } from '@/shared/ui/button'
import * as Preferences from '@/entities/preferences/model'
import type { IPreferences } from '@/entities/preferences/types'

import styles from './setting-edit.module.css'

const stringifySetting = (settings: IPreferences): string => {
  return JSON.stringify(settings, null, 2)
}

const SettingsEdit: FC = () => {
  const { preferences, loading, updating, update } = Preferences.use()
  const [settings, setSettings] = useState(stringifySetting(preferences))

  useEffect(() => {
    setSettings(stringifySetting(preferences))
  }, [preferences])

  const onSave = () => {
    update(JSON.parse(settings) as IPreferences)
  }

  const onCancel = () => {
    setSettings(JSON.stringify(settings))
  }

  if (loading) {
    return <p>Loading...</p>
  }

  return (
    <div className={styles.container}>
      <CodeEditor height="calc(100vh - 116px)" value={settings} onChange={setSettings} />
      <div className={styles.controls}>
        <Button className={styles.save} disabled={updating} onClick={onSave}>
          Save
        </Button>
        <Button className={styles.cancel} disabled={updating} onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </div>
  )
}

export default SettingsEdit

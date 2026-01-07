import SettingsEdit from '@/feature/setting-edit'

import styles from './settings.module.css'

const Settings = () => {
  return (
    <div className={styles.container}>
      <h1>Chrome extension Dark Reader: Custom styles</h1>
      <SettingsEdit />
    </div>
  )
}

export default Settings

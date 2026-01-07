import { useState, useMemo, useEffect, type FC } from 'react'
import classNames from 'classnames'

import { Button } from '@/shared/ui/button'
import { CodeEditor } from '@/shared/ui/codeEditor'
import * as Preferences from '@/entities/preferences/model'
import type { IHostSettings } from '@/entities/preferences/types'

import styles from './setting-edit.module.css'

const SettingsEdit: FC = () => {
  const { preferences, loading, updating, update } = Preferences.use()
  const [selectedHost, setSelectedHost] = useState<string | null>(null)

  // Local state for the currently edited host settings
  const [localSettings, setLocalSettings] = useState<IHostSettings | null>(null)

  const hosts = useMemo(() => {
    return Object.keys(preferences.hosts).sort()
  }, [preferences.hosts])

  const onSelectHost = (host: string) => {
    setSelectedHost(host)
    setLocalSettings({ ...preferences.hosts[host] })
  }

  const onAddHost = () => {
    const host = window.prompt('Enter host (e.g. google.com or *.google.com):')
    if (host && !preferences.hosts[host]) {
      const newSettings = Preferences.createDefaultHostSettings(host)
      update({
        ...preferences,
        hosts: {
          ...preferences.hosts,
          [host]: newSettings,
        },
      })
      onSelectHost(host)
    }
  }

  const onDeleteHost = (host: string) => {
    if (window.confirm(`Delete settings for ${host}?`)) {
      const nextHosts = { ...preferences.hosts }
      delete nextHosts[host]
      update({ ...preferences, hosts: nextHosts })
      if (selectedHost === host) {
        setSelectedHost(null)
        setLocalSettings(null)
      }
    }
  }

  const [saveSuccess, setSaveSuccess] = useState(false)

  const onSave = () => {
    if (selectedHost && localSettings) {
      update({
        ...preferences,
        hosts: {
          ...preferences.hosts,
          [selectedHost]: localSettings,
        },
      })
      setSaveSuccess(true)
      setTimeout(() => setSaveSuccess(false), 2000)
    }
  }

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault()
        onSave()
      }
    }

    if (selectedHost) {
      window.addEventListener('keydown', handleKeyDown)
      return () => window.removeEventListener('keydown', handleKeyDown)
    }
  }, [selectedHost, localSettings, preferences])

  const onToggleEnabled = () => {
    if (localSettings) {
      setLocalSettings({ ...localSettings, enabled: !localSettings.enabled })
    }
  }

  const onStylesChange = (value: string) => {
    if (localSettings) {
      setLocalSettings({ ...localSettings, styles: value })
    }
  }

  if (loading) {
    return <div className={styles.emptyState}>Loading configuration...</div>
  }

  return (
    <div className={styles.layout}>
      {/* Sidebar: Host List */}
      <aside className={styles.sidebar}>
        <div className={styles.sidebarHeader}>
          <h3>Sites</h3>
          <Button variant="ghost" onClick={onAddHost} title="Add new site">
            +
          </Button>
        </div>
        <div className={styles.hostList}>
          {hosts.length === 0 && <div className={styles.emptyState}>No sites configured</div>}
          {hosts.map(host => (
            <div
              key={host}
              className={classNames(styles.hostItem, {
                [styles.activeItem]: selectedHost === host,
              })}
              onClick={() => onSelectHost(host)}
            >
              <span>{host}</span>
              <div
                className={classNames(styles.indicator, {
                  [styles.indicatorDisabled]: !preferences.hosts[host].enabled,
                })}
              />
            </div>
          ))}
        </div>
      </aside>

      {/* Editor: Selected Host Settings */}
      <main className={styles.editorContainer}>
        {selectedHost && localSettings ? (
          <>
            <header className={styles.editorHeader}>
              <div className={styles.editorTitle}>{selectedHost}</div>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <Button
                  variant={localSettings.enabled ? 'primary' : 'secondary'}
                  onClick={onToggleEnabled}
                >
                  {localSettings.enabled ? 'Enabled' : 'Disabled'}
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => onDeleteHost(selectedHost)}
                  title="Delete site"
                >
                  🗑️
                </Button>
              </div>
            </header>
            <div className={styles.editorContent}>
              <CodeEditor
                language="css"
                height="100%"
                value={localSettings.styles}
                onChange={onStylesChange}
              />
            </div>
            <footer className={styles.controls}>
              <Button disabled={updating} onClick={onSave}>
                {saveSuccess ? 'Saved! ✅' : 'Save Changes'}
              </Button>
              <Button variant="secondary" onClick={() => onSelectHost(selectedHost)}>
                Reset
              </Button>
            </footer>
          </>
        ) : (
          <div className={styles.emptyState}>Select a site to edit its custom styles</div>
        )}
      </main>
    </div>
  )
}

export default SettingsEdit

import { useState, useMemo, useEffect, type FC } from 'react'
import classNames from 'classnames'

import { Button } from '@/shared/ui/button'
import { CodeEditor } from '@/shared/ui/codeEditor'
import * as Preferences from '@/entities/preferences/model'
import { normalizeHost } from '@/entities/preferences/host'
import type { IHostSettings } from '@/entities/preferences/types'

import styles from './setting-edit.module.css'

const SettingsEdit: FC = () => {
  const { preferences, loading, updating, setEnabled, patchHost, removeHost } = Preferences.use()
  const [selectedHost, setSelectedHost] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

  // Local state for the currently edited host settings
  const [localSettings, setLocalSettings] = useState<IHostSettings | null>(null)

  const hosts = useMemo(() => {
    return Object.keys(preferences.hosts).sort()
  }, [preferences.hosts])

  const filteredHosts = useMemo(() => {
    if (!searchQuery.trim()) return hosts
    return hosts.filter(host => host.toLowerCase().includes(searchQuery.toLowerCase()))
  }, [hosts, searchQuery])

  const onSelectHost = (host: string) => {
    setSelectedHost(host)
    setLocalSettings({ ...preferences.hosts[host], host })
  }

  // Sync local state when global preferences change (e.g. after toggle enabled)
  useEffect(() => {
    if (selectedHost && preferences.hosts[selectedHost]) {
      setLocalSettings(prev => {
        if (!prev) return { ...preferences.hosts[selectedHost] }
        return {
          ...prev,
          enabled: preferences.hosts[selectedHost].enabled,
        }
      })
    }
  }, [preferences.hosts, selectedHost])

  const onAddHost = () => {
    const typed = window.prompt('Enter host (e.g. google.com or *.google.com for subdomains):')
    if (!typed) return

    const host = normalizeHost(typed)

    if (!host) {
      window.alert(`"${typed}" is not a valid hostname`)
      return
    }

    if (!preferences.hosts[host]) patchHost([host, Preferences.createDefaultHostSettings(host)])
    onSelectHost(host)
  }

  const onDeleteHost = (host: string) => {
    if (window.confirm(`Delete settings for ${host}?`)) {
      removeHost(host)
      if (selectedHost === host) {
        setSelectedHost(null)
        setLocalSettings(null)
      }
    }
  }

  const [saveSuccess, setSaveSuccess] = useState(false)

  const onSave = () => {
    if (selectedHost && localSettings) {
      patchHost([selectedHost, { ...localSettings, host: selectedHost }])
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
    if (selectedHost && localSettings) {
      const newEnabled = !preferences.hosts[selectedHost]?.enabled
      // Optimistic update for UI responsiveness
      setLocalSettings({ ...localSettings, enabled: newEnabled })

      setEnabled([selectedHost, newEnabled])
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
        <div style={{ padding: '0.5rem', borderBottom: '1px solid #ccc' }}>
          <input
            type="text"
            placeholder="Search hotsname..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className={styles.search}
          />
        </div>
        <div className={styles.hostList}>
          {hosts.length === 0 && <div className={styles.emptyState}>No sites configured</div>}
          {filteredHosts.length === 0 && searchQuery.trim() && (
            <div className={styles.emptyState}>
              No sites found matching &quot;{searchQuery}&quot;
            </div>
          )}
          {filteredHosts.map(host => (
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

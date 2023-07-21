import React from 'react'

import * as settingsModel from 'entities/settings'
import * as tabSettingsModel from 'entities/settings/tab'
import * as activeTabModel from 'entities/activeTab'
import { Button, Toggle } from 'shared/ui/components'

export interface ToggleActiveTabProps {
  simplify?: boolean
}

const ToggleActiveTab = ({ simplify }: ToggleActiveTabProps) => {
  activeTabModel.useGate()

  const settings = settingsModel.use()
  const tabSettings = tabSettingsModel.use()
  const { activeTab } = activeTabModel.useStores()

  const onChangeGlobal = React.useCallback(
    ({ target: { checked } }: React.ChangeEvent<HTMLInputElement>) => {
      settings.events.set({ ...settings.stores.value, enabled: checked })
    },
    [settings.stores.value]
  )

  const onChangeLocal = React.useCallback(() => {
    tabSettings.events.toggle()
  }, [])

  const isLoading = settings.stores.loading || !activeTab

  return (
    <>
      {isLoading ? (
        <>Loading ...</>
      ) : (
        <div className="flex flex-col items-center float-left gap-2">
          {!simplify && <div className="text-xl">{activeTab.url.host}</div>}

          {!simplify && (
            <Toggle
              disabled={settings.stores.updating}
              onChange={onChangeGlobal}
              checked={settings.stores.value.enabled}
              size="xs"
            />
          )}

          <Toggle
            disabled={settings.stores.updating}
            onChange={onChangeLocal}
            checked={tabSettings.stores.settings.enabled}
            size="xs"
          />

          {!simplify && (
            <Button onClick={settings.events.reset}>
              Reset settings to default
            </Button>
          )}
        </div>
      )}
    </>
  )
}

export default ToggleActiveTab

import React from "react";
import { Button, Toggle } from "react-daisyui";

import * as settingsModel from "entities/settings";
import * as tabModel from "entities/tab";

const TestStorage = () => {
  settingsModel.useGate();
  const settingsStores = settingsModel.useStores();
  const settingsEvents = settingsModel.useEvents();
  const tabStores = tabModel.useStores();
  const tabEvents = tabModel.useEvents();

  const onChangeGlobal = React.useCallback(
    ({ target: { checked } }: React.ChangeEvent<HTMLInputElement>) => {
      settingsEvents.set({ ...settingsStores.value, enabled: checked });
    },
    [settingsStores.value]
  );

  const onChangeLocal = React.useCallback(() => {
    tabEvents.toggle();
  }, []);

  return (
    <>
      <div className="text-xl">{tabStores.host}</div>
      {settingsStores.loading ? (
        <>Loading ...</>
      ) : (
        <div className="flex flex-col items-center float-left gap-2">
          <Toggle
            disabled={settingsStores.updating}
            onChange={onChangeGlobal}
            checked={settingsStores.value.enabled}
            size="xs"
          />
          <Toggle
            disabled={settingsStores.updating}
            onChange={onChangeLocal}
            checked={tabStores.settings.enabled}
            size="xs"
          />
          {/* <pre>{JSON.stringify(value, null, 2)}</pre> */}
          <Button onClick={settingsEvents.reset}>
            Reset settings to default
          </Button>
        </div>
      )}
    </>
  );
};

export default TestStorage;

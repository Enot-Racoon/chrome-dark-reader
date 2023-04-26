import React from "react";
import { Toggle } from "react-daisyui";

import * as settingsModel from "entities/settings";

const TestStorage = () => {
  settingsModel.useGate();
  const { value, loading, updating } = settingsModel.useStores();
  const { set } = settingsModel.useEvents();

  const onChange = React.useCallback(
    ({ target: { checked } }: React.ChangeEvent<HTMLInputElement>) => {
      set({ enabled: checked });
    },
    []
  );

  return (
    <>
      {loading ? (
        <>Loading ...</>
      ) : (
        <div className="flex flex-col items-center float-left gap-2">
          <Toggle
            disabled={updating}
            onChange={onChange}
            checked={value.enabled}
            size="xs"
          />
          <Toggle
            disabled={updating}
            onChange={onChange}
            checked={value.enabled}
            size="sm"
          />
          <Toggle
            disabled={updating}
            onChange={onChange}
            checked={value.enabled}
            size="md"
          />
          <Toggle
            disabled={updating}
            onChange={onChange}
            checked={value.enabled}
            size="lg"
          />
        </div>
      )}
    </>
  );
};

export default TestStorage;

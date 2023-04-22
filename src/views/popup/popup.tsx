import React from "react";
import { Toggle } from "react-daisyui";

import Demo from "shared/ui/components/Demo";
import * as settingsModel from "entities/settings";

import styles from "./popup.module.css";

const Popup = () => {
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
    <div className={styles.container}>
      <Demo>
        <h1>Chrome extension Dark Reader: Popup</h1>
        {loading ? (
          <>Loading ...</>
        ) : (
          <div className="flex flex-col items-center float-left gap-2">
            <Toggle
              disabled={updating}
              onChange={onChange}
              defaultChecked={value.enabled}
              size="xs"
            />
            <Toggle
              disabled={updating}
              onChange={onChange}
              defaultChecked={value.enabled}
              size="sm"
            />
            <Toggle
              disabled={updating}
              onChange={onChange}
              defaultChecked={value.enabled}
              size="md"
            />
            <Toggle
              disabled={updating}
              onChange={onChange}
              defaultChecked={value.enabled}
              size="lg"
            />
          </div>
        )}
      </Demo>
    </div>
  );
};

export default Popup;

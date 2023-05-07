import React from "react";
import { Button } from "react-daisyui";

import * as settingsModel from "entities/settings";
import Code from "shared/ui/components/code";
import type { Settings } from "shared/types/entities";

import styles from "./edit.module.css";

export interface SettingsEditProps {
  checked?: unknown;
}

const SettingsEdit: React.FC<SettingsEditProps> = () => {
  const events = settingsModel.useEvents();
  const settingsStores = settingsModel.useStores();
  const { value, loading, updating } = settingsStores;
  const [settings, setSettings] = React.useState(
    JSON.stringify(value, null, 2)
  );

  React.useEffect(() => {
    setSettings(JSON.stringify(value, null, 2));
  }, [value]);

  // console.log({ settingsStores });

  const onSave = () => {
    events.set(JSON.parse(settings) as Settings.ISettings);
  };

  const onReset = () => {
    setSettings(JSON.stringify(value));
  };

  if (loading) {
    return <p>Loading...</p>;
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
  );
};

export default SettingsEdit;

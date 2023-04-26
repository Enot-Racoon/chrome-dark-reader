import React from "react";

import Demo from "shared/ui/components/Demo";
import TestStorage from "feature/test-storage";

import styles from "./settings.module.css";

const Settings = () => (
  <div className={styles.container}>
    <Demo>
      <h1>Chrome extension Dark Reader: Settings</h1>
      <TestStorage />
    </Demo>
  </div>
);

export default Settings;

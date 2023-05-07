import React from "react";

import TestStorage from "feature/test-storage";
import SettingsEdit from "feature/settings/edit";

import styles from "./settings.module.css";

const Settings = () => (
  <div className={styles.container}>
    <h1>Chrome extension Dark Reader: Settings</h1>
    <TestStorage />
    <SettingsEdit />
  </div>
);

export default Settings;

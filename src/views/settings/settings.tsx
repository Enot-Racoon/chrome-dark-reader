import React from "react";

import { DefaultLayout } from "shared/ui/layouts";
import SettingsEdit from "feature/settings/edit";

import styles from "./settings.module.css";

const Settings = () => (
  <DefaultLayout className={styles.container}>
    <h1>Chrome extension Dark Reader: Settings</h1>
    <SettingsEdit />
  </DefaultLayout>
);

export default Settings;

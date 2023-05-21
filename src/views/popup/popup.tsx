import React from "react";

import Demo from "shared/ui/components/Demo";
import { DefaultLayout } from "shared/ui/layouts";
import ToggleActiveTab from "feature/toggleActiveTab";

import styles from "./popup.module.css";

const Popup = () => (
  <DefaultLayout className={styles.container}>
    <Demo>
      <h1>Chrome extension Dark Reader: Popup</h1>
      <ToggleActiveTab />
    </Demo>
  </DefaultLayout>
);

export default Popup;

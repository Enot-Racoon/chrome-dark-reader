import React from "react";

import { DefaultLayout } from "shared/ui/layouts";
import ToggleActiveTab from "feature/toggleActiveTab";

import styles from "./popup.module.css";

const Popup = () => (
  <DefaultLayout className={styles.container}>
    <ToggleActiveTab simplify />
  </DefaultLayout>
);

export default Popup;

import React from "react";

import Demo from "shared/ui/components/Demo";
import TestStorage from "feature/test-storage";

import styles from "./popup.module.css";

const Popup = () => {
  return (
    <div className={styles.container}>
      <Demo>
        <h1>Chrome extension Dark Reader: Popup</h1>
        <TestStorage />
      </Demo>
    </div>
  );
};

export default Popup;

import React from 'react'

import ToggleActiveTab from 'feature/toggleActiveTab'

import styles from './popup.module.css'

const Popup = () => (
  <div className={styles.container}>
    <ToggleActiveTab simplify />
  </div>
)

export default Popup

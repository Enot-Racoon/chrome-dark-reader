import React from 'react'
import CodeMirror from '@uiw/react-codemirror'
import { json } from '@codemirror/lang-json'
import { ViewUpdate } from '@codemirror/view'
import { darcula } from '@uiw/codemirror-theme-darcula'

import styles from './code.module.css'

export interface CodeProps {
  value: string
  onChange?: (value: string, viewUpdate: ViewUpdate) => void
  width?: string
  height?: string
}

export const Code: React.FC<CodeProps> = ({
  value,
  onChange,
  width,
  height,
}) => (
  <CodeMirror
    className={styles.container}
    value={value}
    extensions={[json()]}
    onChange={onChange}
    theme={darcula}
    width={width}
    height={height}
  />
)

export default Code

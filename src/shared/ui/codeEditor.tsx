import type { FC } from 'react'
import CodeMirror from '@uiw/react-codemirror'
import { json } from '@codemirror/lang-json'
import { ViewUpdate } from '@codemirror/view'
import { darcula } from '@uiw/codemirror-theme-darcula'

export interface CodeEditorProps {
  value: string
  onChange?: (value: string, viewUpdate: ViewUpdate) => void
  width?: string
  height?: string
}

export const CodeEditor: FC<CodeEditorProps> = ({ value, onChange, width, height }) => (
  <CodeMirror
    value={value}
    extensions={[json()]}
    onChange={onChange}
    theme={darcula}
    width={width}
    height={height}
  />
)

export default CodeEditor

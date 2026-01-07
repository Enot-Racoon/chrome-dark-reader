import { useMemo, type FC } from 'react'
import CodeMirror from '@uiw/react-codemirror'
import { json } from '@codemirror/lang-json'
import { css } from '@codemirror/lang-css'
import { ViewUpdate } from '@codemirror/view'
import { darcula } from '@uiw/codemirror-theme-darcula'

export interface CodeEditorProps {
  value: string
  language?: 'json' | 'css'
  onChange?: (value: string, viewUpdate: ViewUpdate) => void
  width?: string
  height?: string
}

export const CodeEditor: FC<CodeEditorProps> = ({
  value,
  language = 'json',
  onChange,
  width,
  height,
}) => {
  const extensions = useMemo(() => {
    switch (language) {
      case 'css':
        return [css()]
      case 'json':
      default:
        return [json()]
    }
  }, [language])

  return (
    <CodeMirror
      value={value}
      extensions={extensions}
      onChange={onChange}
      theme={darcula}
      width={width}
      height={height}
    />
  )
}

export default CodeEditor

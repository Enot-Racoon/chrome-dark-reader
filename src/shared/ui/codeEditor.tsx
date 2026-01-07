import { useMemo, type FC } from 'react'
import CodeMirror from '@uiw/react-codemirror'
import { css } from '@codemirror/lang-css'
import { ViewUpdate } from '@codemirror/view'
import { darcula } from '@uiw/codemirror-theme-darcula'

export interface CodeEditorProps {
  value: string
  language?: 'css'
  onChange?: (value: string, viewUpdate: ViewUpdate) => void
  width?: string
  height?: string
}

export const CodeEditor: FC<CodeEditorProps> = ({
  value,
  language = 'css',
  onChange,
  width,
  height,
}) => {
  const extensions = useMemo(() => {
    switch (language) {
      case 'css':
        return [css()]
      default:
        return []
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

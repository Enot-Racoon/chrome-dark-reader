import { StrictMode, type ComponentType } from 'react'
import ReactDOM from 'react-dom/client'
import AppProvider from './provider'
import './base.css'

export default function renderApp(View: ComponentType) {
  const rootElement = window.document.createElement('div')
  rootElement.id = 'chrome-dark-reader'
  window.document.body.appendChild(rootElement)
  const root = ReactDOM.createRoot(rootElement)
  root.render(
    <StrictMode>
      <AppProvider>
        <View />
      </AppProvider>
    </StrictMode>
  )
}

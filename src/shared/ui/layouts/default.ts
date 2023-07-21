import React from 'react'

import Preferences from 'entities/preferences'
import * as appModel from 'entities/app'

export interface DefaultLayoutProps {
  className?: string
  children: ValOrArr<React.ReactNode>
}

export const DefaultLayout = React.forwardRef<
  React.FC<DefaultLayoutProps>,
  DefaultLayoutProps
>(function DefaultLayout({ children, className }, ref) {
  appModel.useGate()
  Preferences.useGate()

  return React.createElement('div', { ref, className }, children)
})

export default DefaultLayout

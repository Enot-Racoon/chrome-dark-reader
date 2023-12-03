import React from 'react'

import Preferences from 'entities/preferences'

export interface DefaultLayoutProps {
  className?: string
  children: ValOrArr<React.ReactNode>
}

export const DefaultLayout = React.forwardRef<React.FC<DefaultLayoutProps>, DefaultLayoutProps>(
  function DefaultLayout({ children, className }, ref) {
    Preferences.useGate()
    return React.createElement('div', { ref, className }, children)
  }
)

export default DefaultLayout

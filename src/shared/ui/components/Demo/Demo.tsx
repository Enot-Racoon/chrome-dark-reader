import React from 'react'

import logo from 'shared/ui/assets/logo.svg'

import './Demo.css'

const Demo: React.FC<React.PropsWithChildren> = ({
  children,
}: React.PropsWithChildren) => (
  <div className="Demo">
    <header className="Demo-header">
      <img src={logo} className="Demo-logo" alt="logo" />
      {children}
    </header>
  </div>
)

export default Demo

import { type FC, type ReactNode } from 'react'
import * as Preferences from '@/entities/preferences/model'

export interface AppProviderProps {
  children: ReactNode
}

export const AppProvider: FC<AppProviderProps> = ({ children }) => {
  Preferences.useGate()
  return <>{children}</>
}

export default AppProvider

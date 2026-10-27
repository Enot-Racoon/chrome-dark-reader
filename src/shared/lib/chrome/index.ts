import * as core from './core'
import * as icon from './icon'
import * as tab from './tab'
import * as menus from './menus'
import * as message from './message'
import * as Type from '@/shared/types/chrome'

export * from './core'
export * from './icon'
export * from './tab'
export * from './menus'
export * from './message'
export { Type }

export default { ...core, ...icon, ...tab, ...menus, ...message, Type }

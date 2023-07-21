import { effects as appEffects } from 'entities/app'
import { effects as settingsEffects } from 'entities/settings'

appEffects.initialize.use(settingsEffects.initialize)

export * from './model'

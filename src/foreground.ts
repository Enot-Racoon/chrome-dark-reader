import StyleInjector from 'shared/lib/style'
import Preferences from 'entities/preferences'

setTimeout(Preferences.initialize)

Preferences.data.tabPreferences.updates.watch(StyleInjector.toggleTabStyle)

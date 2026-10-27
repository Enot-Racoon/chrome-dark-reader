import * as Chrome from '@/shared/lib/chrome'
import Messenger from '@/services/messenger'
import * as Preferences from '@/entities/preferences/model'
import { getHostFromUrl } from '@/entities/preferences/host'

export type ToggleUnsupportedReason = 'no-tab' | 'blocked-scheme' | 'no-host'

export type ToggleOutcome =
  | { status: 'toggled'; host: string; enabled: boolean }
  | { status: 'unsupported'; reason: ToggleUnsupportedReason }

interface MaybeTab {
  id?: number | null
  url?: string | null
}

// Same schemes the content script is declared for in manifest.json
const THEMEABLE_PREFIXES = ['http://', 'https://', 'file://']

export const isThemeableUrl = (url?: string | null): boolean =>
  Boolean(url) && THEMEABLE_PREFIXES.some(prefix => (url as string).startsWith(prefix))

/**
 * The single theme switching path shared by the toolbar icon, the keyboard shortcut and
 * the context menu. It never throws: an unsupported page is a returned outcome, because
 * commands and menu clicks arrive on chrome://, Web Store and devtools screens too.
 */
export const toggleThemeForTab = async (tab?: MaybeTab | null): Promise<ToggleOutcome> => {
  const target = tab?.id ? tab : await Chrome.getActiveTab()

  if (!target?.id) return { status: 'unsupported', reason: 'no-tab' }
  if (!isThemeableUrl(target.url)) return { status: 'unsupported', reason: 'blocked-scheme' }

  const host = getHostFromUrl(target.url)
  if (!host) return { status: 'unsupported', reason: 'no-host' }

  // Reading or writing before this point is what used to erase saved settings.
  await Preferences.ready

  Preferences.toggle(host)

  const settings = Preferences.preferences.getState().hosts[host]
  if (!settings) return { status: 'unsupported', reason: 'no-host' }

  try {
    await Messenger.hostPreferencesChanged.dispatchToTab(target.id, settings)
  } catch {
    // The page has no content script (file URLs without the grant, cached frames).
    // The preference itself is stored, so the next navigation applies it.
  }

  return { status: 'toggled', host, enabled: settings.enabled }
}

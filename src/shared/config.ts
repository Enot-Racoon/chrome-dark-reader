// Storage key in chrome extensions store
// Legacy single-blob key kept only for the migration to chrome.storage.sync
export const STORAGE_KEY = '--@chrome-dark-reader'

// Relative path in public directory
export const ICON_DIR = '/static/icons'

// Bumped when the persisted layout changes. Sync-side value coordinates formats
// between devices, the local marker decides whether this device still has to migrate.
export const SCHEMA_VERSION = 1

export const SYNC_META_KEY = 'dr:meta'
export const SYNC_HOST_PREFIX = 'dr:host:'
export const SYNC_CSS_CHUNK_INFIX = ':css:'

export const LOCAL_MIGRATION_KEY = 'dr:migration'
export const LOCAL_BACKUP_KEY = 'dr:legacy-backup'
export const LOCAL_MIRROR_KEY = 'dr:mirror'
export const LOCAL_PENDING_KEY = 'dr:pending'

// chrome.commands name declared in manifest.json
export const TOGGLE_COMMAND = 'toggle-dark-mode'
// chrome.contextMenus item id
export const TOGGLE_MENU_ID = 'dr-toggle-theme'

// chrome.storage.sync limits, used as fallbacks when the runtime constants are absent
export const DEFAULT_QUOTA_BYTES_PER_ITEM = 8192
export const DEFAULT_QUOTA_BYTES = 102400
export const DEFAULT_MAX_ITEMS = 512
export const QUOTA_MARGIN_BYTES = 256

export default {
  STORAGE_KEY,
  ICON_DIR,
  TOGGLE_COMMAND,
  TOGGLE_MENU_ID,
  SCHEMA_VERSION,
  SYNC_META_KEY,
  SYNC_HOST_PREFIX,
  SYNC_CSS_CHUNK_INFIX,
  LOCAL_MIGRATION_KEY,
  LOCAL_BACKUP_KEY,
  LOCAL_MIRROR_KEY,
  LOCAL_PENDING_KEY,
  DEFAULT_QUOTA_BYTES_PER_ITEM,
  DEFAULT_QUOTA_BYTES,
  DEFAULT_MAX_ITEMS,
  QUOTA_MARGIN_BYTES,
}

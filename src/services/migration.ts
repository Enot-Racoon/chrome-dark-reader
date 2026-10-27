import Config from '@/shared/config'
import equal from 'fast-deep-equal'
import { readSnapshot, writeHost } from '@/entities/preferences/host-store'
import { normalizePreferences } from '@/entities/preferences/normalize'
import type { HostStore } from '@/entities/preferences/host-store'
import type { IHostSettings } from '@/entities/preferences/types'

export interface IMigrationMarker {
  state: 'complete'
  schemaVersion: number
  at: number
  uploaded: number
  conflicts: string[]
}

export interface ISyncMeta {
  schemaVersion: number
  migratedAt?: number
}

export type MigrationStatus = 'already-migrated' | 'blocked-newer-schema' | 'migrated' | 'partial'

export interface IMigrationOutcome {
  status: MigrationStatus
  uploaded: number
  conflicts: string[]
  pending: string[]
  schema?: number
}

export interface IMigrationDeps {
  readonly sync: HostStore
  readonly local: HostStore
  readonly now: () => number
}

const NOTHING_DONE: IMigrationOutcome = {
  status: 'already-migrated',
  uploaded: 0,
  conflicts: [],
  pending: [],
}

/**
 * Moves this device's legacy single-blob settings into the per-host sync layout.
 *
 * The completion marker lives in chrome.storage.local on purpose: migration is a
 * per-device action, and a marker in sync would make a second device skip uploading
 * its own local-only hosts forever. Runs in the service worker only, awaited by
 * record hydration, so nothing else touches storage first.
 *
 * Conflict policy: union of hosts, sync wins per host, and every local entry that
 * sync outvoted is kept on the device. Migration never deletes anything from sync.
 */
export const migrateOnce = async ({
  sync,
  local,
  now,
}: IMigrationDeps): Promise<IMigrationOutcome> => {
  const marker = (await local.get(Config.LOCAL_MIGRATION_KEY)) as IMigrationMarker | null

  if (marker?.state === 'complete' && marker.schemaVersion >= Config.SCHEMA_VERSION) {
    return NOTHING_DONE
  }

  const meta = (await sync.get(Config.SYNC_META_KEY)) as ISyncMeta | null
  const schema = meta?.schemaVersion

  if (typeof schema === 'number' && schema > Config.SCHEMA_VERSION) {
    return { ...NOTHING_DONE, status: 'blocked-newer-schema', schema }
  }

  const legacy = normalizePreferences(await local.get(Config.STORAGE_KEY))
  const remote = (await readSnapshot(sync)).preferences

  const conflicts: Record<string, IHostSettings> = {}
  const failed: Record<string, IHostSettings> = {}
  let uploaded = 0

  for (const host of Object.keys(legacy.hosts)) {
    const localEntry = legacy.hosts[host]
    const remoteEntry = remote.hosts[host]

    if (remoteEntry) {
      // An earlier interrupted run already uploaded it: re-running stays a no-op.
      if (!equal(remoteEntry, localEntry)) conflicts[host] = localEntry
      continue
    }

    const result = await writeHost(sync, host, localEntry, { updatedAt: now() })

    if (result.status === 'ok') uploaded++
    else failed[host] = localEntry
  }

  const pending = Object.keys(failed)

  await local.set(Config.LOCAL_BACKUP_KEY, conflicts)
  await local.set(Config.LOCAL_PENDING_KEY, failed)

  if (pending.length) {
    // No marker and the legacy blob stays: the next service worker wake-up retries.
    return { status: 'partial', uploaded, conflicts: Object.keys(conflicts), pending }
  }

  await local.remove(Config.STORAGE_KEY)
  await sync.set(Config.SYNC_META_KEY, {
    schemaVersion: Config.SCHEMA_VERSION,
    migratedAt: now(),
  } as ISyncMeta)
  await local.set(Config.LOCAL_MIGRATION_KEY, {
    state: 'complete',
    schemaVersion: Config.SCHEMA_VERSION,
    at: now(),
    uploaded,
    conflicts: Object.keys(conflicts),
  } as IMigrationMarker)

  return { status: 'migrated', uploaded, conflicts: Object.keys(conflicts), pending: [] }
}

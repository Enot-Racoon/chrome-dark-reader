import Config from '@/shared/config'

export type QuotaLimitKind =
  | 'per_item'
  | 'total'
  | 'items'
  | 'writes_per_hour'
  | 'writes_per_minute'
  | 'unknown'

export interface IStorageError {
  readonly kind: QuotaLimitKind
  readonly message: string
}

export interface ISyncQuotas {
  readonly perItem: number
  readonly total: number
  readonly maxItems: number
}

export const utf8Bytes = (value: string): number => {
  if (typeof TextEncoder !== 'undefined') return new TextEncoder().encode(value).length

  // Fallback for engines without TextEncoder: count code points up to 4 bytes each
  let bytes = 0
  for (let index = 0; index < value.length; index++) {
    const code = value.charCodeAt(index)
    if (code < 0x80) bytes += 1
    else if (code < 0x800) bytes += 2
    else if (code >= 0xd800 && code <= 0xdbff) {
      bytes += 4
      index++
    } else bytes += 3
  }
  return bytes
}

/** chrome.storage measures the key length plus the JSON stringification of the value. */
export const itemBytes = (key: string, value: unknown): number =>
  utf8Bytes(key) + utf8Bytes(JSON.stringify(value) ?? '')

export const readSyncQuotas = (quotas: Record<string, unknown> = {}): ISyncQuotas => ({
  perItem: positiveOr(quotas.QUOTA_BYTES_PER_ITEM, Config.DEFAULT_QUOTA_BYTES_PER_ITEM),
  total: positiveOr(quotas.QUOTA_BYTES, Config.DEFAULT_QUOTA_BYTES),
  maxItems: positiveOr(quotas.MAX_ITEMS, Config.DEFAULT_MAX_ITEMS),
})

const positiveOr = (value: unknown, fallback: number): number =>
  typeof value === 'number' && value > 0 ? value : fallback

const PATTERNS: [RegExp, QuotaLimitKind][] = [
  [/QUOTA_BYTES_PER_ITEM/i, 'per_item'],
  [/MAX_ITEMS/i, 'items'],
  [/MAX_WRITE_OPERATIONS_PER_HOUR/i, 'writes_per_hour'],
  [/WRITE_OPERATIONS_PER_MINUTE|SUSTAINED_WRITE/i, 'writes_per_minute'],
  [/QUOTA_BYTES/i, 'total'],
]

export const classifyStorageError = (error: unknown): IStorageError => {
  const message =
    error instanceof Error
      ? error.message
      : typeof error === 'string'
      ? error
      : String((error as { message?: unknown })?.message ?? error ?? '')

  const matched = PATTERNS.find(([pattern]) => pattern.test(message))

  return { kind: matched ? matched[1] : 'unknown', message }
}

export const isQuotaLimit = (error: IStorageError): boolean => error.kind !== 'unknown'

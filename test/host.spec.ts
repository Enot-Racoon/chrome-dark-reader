import { describe, expect, it } from 'vitest'
import {
  encodeHostKey,
  matchHostSettings,
  normalizeHost,
  parseHostKey,
} from '@/entities/preferences/host'
import type { IHostSettings } from '@/entities/preferences/types'

const entry = (host: string, enabled = false, styles = ''): IHostSettings => ({
  host,
  enabled,
  styles,
})

describe('normalizeHost', () => {
  it('accepts what the runtime and the user produce', () => {
    expect(normalizeHost('Example.COM')).toBe('example.com')
    expect(normalizeHost('  https://Ex.Com/a/b?x=1  ')).toBe('ex.com')
    expect(normalizeHost('*.Google.com')).toBe('*.google.com')
    expect(normalizeHost('example.com:8443')).toBe('example.com:8443')
    expect(normalizeHost('xn--80ak6aa92e.com')).toBe('xn--80ak6aa92e.com')
  })

  it('rejects anything that must not become a storage key', () => {
    expect(normalizeHost('')).toBeNull()
    expect(normalizeHost('   ')).toBeNull()
    expect(normalizeHost('exa mple.com')).toBeNull()
    expect(normalizeHost('example.com/path')).toBe('example.com')
    expect(normalizeHost('a*b.com')).toBeNull()
    expect(normalizeHost('*.')).toBeNull()
    expect(normalizeHost('.example.com')).toBeNull()
    expect(normalizeHost('__proto__')).toBeNull()
    expect(normalizeHost('constructor')).toBeNull()
    expect(normalizeHost('*.prototype')).toBeNull()
    expect(normalizeHost('a'.repeat(260) + '.com')).toBeNull()
  })
})

describe('host storage keys', () => {
  it('round-trips wildcard and percent characters without collisions', () => {
    for (const host of ['example.com', '*.example.com', 'a.b.c.d', 'xn--80ak6aa92e.com']) {
      expect(parseHostKey(encodeHostKey(host))).toEqual({ host, chunk: null })
    }

    expect(parseHostKey(`${encodeHostKey('example.com')}:css:3`)).toEqual({
      host: 'example.com',
      chunk: 3,
    })
    expect(encodeHostKey('*.example.com')).not.toBe(encodeHostKey('a.example.com'))
  })

  it('ignores keys that belong to somebody else', () => {
    expect(parseHostKey('dr:meta')).toBeNull()
    expect(parseHostKey('dr:host:example.com:css:1')).toBeNull()
    expect(parseHostKey('dr:host:example.com:css:x')).toBeNull()
  })
})

describe('matchHostSettings', () => {
  const hosts = {
    'example.com': entry('example.com', true),
    '*.news.com': entry('*.news.com', true, 'wild'),
    'a.news.com': entry('a.news.com', false, 'exact'),
  }

  it('prefers the exact entry over a wildcard', () => {
    expect(matchHostSettings(hosts, 'a.news.com')?.styles).toBe('exact')
  })

  it('falls back to the longest matching wildcard', () => {
    expect(matchHostSettings(hosts, 'b.news.com')?.host).toBe('*.news.com')
    expect(matchHostSettings(hosts, 'deep.b.news.com')?.host).toBe('*.news.com')
  })

  it('returns null when nothing matches', () => {
    expect(matchHostSettings(hosts, 'other.org')).toBeNull()
    expect(matchHostSettings(hosts, '')).toBeNull()
    expect(matchHostSettings(hosts, undefined)).toBeNull()
  })

  it('never resolves inherited object properties as hosts', () => {
    expect(matchHostSettings({}, 'constructor')).toBeNull()
    expect(matchHostSettings({}, '__proto__')).toBeNull()
  })
})

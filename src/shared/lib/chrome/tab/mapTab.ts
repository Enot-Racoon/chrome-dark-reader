import qs from 'qs'

import type { Tab } from 'shared/types/entities'
import type { ChromeTab } from 'shared/types/entities/tab'

export const mapTab = (tab?: ChromeTab | null): Tab.ITab | null => {
  if (!tab) {
    return null
  }

  const urlStr = tab.url ?? ''
  const urlObj = new URL(urlStr)

  return Object.assign(tab, {
    url: {
      hash: urlObj.hash,
      host: urlObj.host,
      hostname: urlObj.hostname,
      href: urlObj.href,
      origin: urlObj.origin,
      password: urlObj.password,
      pathname: urlObj.pathname,
      port: urlObj.port,
      protocol: urlObj.protocol,
      search: urlObj.search,
      searchParams: qs.parse(urlObj.search.slice(1)),
      username: urlObj.username,
      toString: () => urlStr,
    },
  })
}

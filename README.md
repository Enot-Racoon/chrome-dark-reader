# Chrome Dark Reader
Reading comfortably with inverted brightness but preserved hue

Per-site dark mode for Chrome (Manifest V3): one toggle per host, optional per-host custom
CSS, settings shared between your Chrome profiles through `chrome.storage.sync`.

## Development

```bash
bun install
bun run dev      # vite dev server with the CRX plugin, load build/ unpacked
bun run test     # vitest unit tests (fake chrome.storage with real byte accounting)
bun run typecheck
bun run lint
bun run build    # production bundle into build/
bun run package  # build + zip into extension.zip
```

## Switching the theme

Three paths, one implementation (`src/services/theme-toggle.ts`):

- the toolbar icon;
- the keyboard shortcut — `Alt+Shift+D` (`MacCtrl+Shift+D` on macOS);
- the context menu entry "Toggle dark mode for this site".

Remap the shortcut at `chrome://extensions/shortcuts`. The command is browser-scoped on
purpose: a `global` key would fire outside Chrome and switch the wrong tab. On pages the
extension cannot style (`chrome://`, Web Store, devtools) the toggle resolves with an
`unsupported` outcome and changes nothing.

Host keys support wildcards: `*.example.com` covers every subdomain, an exact entry always
wins, and the longest matching suffix wins among wildcards.

## Where the settings live

`chrome.storage.sync` holds one item per host plus CSS chunks, so a single oversized site
cannot push the whole configuration out of the 8 KB per-item quota:

```
sync  dr:meta                    -> { schemaVersion }
sync  dr:host:<host>             -> { enabled, styles, parts?, updatedAt }
sync  dr:host:<host>:css:<n>     -> remaining CSS slices, only when the styles do not fit
local dr:migration               -> per-device marker: this device's legacy blob was moved
local dr:legacy-backup           -> local entries that lost a conflict
local dr:mirror                  -> full snapshot for durability, never authoritative
local dr:pending                 -> hosts a quota refused, retried on the next start
```

The first start migrates the legacy `--@chrome-dark-reader` blob from
`chrome.storage.local`: the host sets are unioned, on a conflict **sync wins** and the
losing local entry is copied to `dr:legacy-backup`, and the legacy blob is deleted only
after the upload succeeded. Every read and write waits for that hydration, which is what
prevents a click during a service worker start-up from flushing defaults over saved hosts.

Chrome falls back to local behaviour when you are signed out or have sync turned off, so the
interface says `Saved` / `Saved on this device` and reports `Sync paused: <reason>` only
from an observed storage error — never "Synced".

## Manual verification checklist

Unit tests cover the storage record, migration, host matching and the wiring; these need a
real browser:

1. **Two devices.** Sign in to the same Google account with sync enabled. Toggle a host on
   device A, then check `chrome.storage.sync.get('dr:host:<host>')` in the service worker
   console on device B — the value follows within seconds. Deleting a host on one device
   deletes it on the other.
2. **Signed out.** Log out of Chrome (or disable sync). Settings keep working and saving;
   nothing claims they synchronized.
3. **Real limits.** 8192 bytes per item, 102400 total, 512 items, 1800 writes/hour. Paste
   >8 KB of CSS into one host: chunk items `dr:host:<host>:css:2…` appear, the CSS applies,
   and it is reassembled after a browser restart. Exceed the total quota: the host lands in
   `dr:pending` and is retried, the mirror keeps it, and the other hosts are untouched.
4. **Write budget.** Whether one `set()` counts as 1 or N operations for the hourly budget
   is not documented; watch `chrome.storage.sync` quota errors while toggling rapidly.
5. **Cold-start race.** `bun run dev`, reload the extension, click the toolbar icon within
   the first second on a configured site. No other host may disappear from
   `chrome.storage.sync` (before this change that exact sequence erased them).
6. **Migration.** Seed 3 legacy hosts into `chrome.storage.local` under
   `--@chrome-dark-reader`, then reload the extension: `dr:meta` plus one `dr:host:*` per
   host exist in sync, `dr:migration` exists in local, the legacy key is gone.
7. **Shortcut.** `Alt+Shift+D` switches the active tab, flips the icon and reaches the
   options page. On `chrome://settings/` it does nothing and logs no service worker error.
8. **Context menu.** The entry appears exactly once — check after three service worker
   restarts and after a full browser restart (Chrome drops extension menu items on restart;
   `runtime.onStartup` re-registers them).
9. **Update permissions.** `contextMenus` is a new grant: on update Chrome shows the
   expanded-permissions warning and may keep the extension disabled until acknowledged.
10. **International hosts.** Add an IDN host (e.g. `пример.рф`) and confirm it toggles and
    syncs.
11. **Build output.** After `bun run build`, diff `build/manifest.json` against
    `public/manifest.json` — the CRX Vite plugin rewrites script paths.
12. **Regression.** Light/dark still applies per site, per-host custom CSS still wins over
    the base layer, enabled sites show no new flash of white.

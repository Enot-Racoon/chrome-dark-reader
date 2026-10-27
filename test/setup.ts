import { vi } from 'vitest'
import { fakeChrome } from './fakes/chrome'

// src/shared/lib/chrome/core.ts destructures the global at module-eval time,
// so the stub has to exist before any source file is imported.
vi.stubGlobal('chrome', fakeChrome)

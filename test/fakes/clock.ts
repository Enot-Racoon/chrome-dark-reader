/**
 * Manual clock: storage writes are debounced, so tests decide when a flush happens
 * instead of waiting for real timers.
 */

export type Cancel = () => void

const timers = new Map<number, { at: number; fn: () => void }>()

let clock = 0
let sequence = 0

export const getClock = (): number => clock

export const schedule = (fn: () => void, ms: number): Cancel => {
  const id = ++sequence
  timers.set(id, { at: clock + ms, fn })
  return () => void timers.delete(id)
}

export const tick = (): Promise<void> => new Promise(resolve => setTimeout(resolve, 0))

/** Runs every timer that became due, including ones scheduled by those timers. */
export const advance = async (ms: number): Promise<void> => {
  clock += ms

  for (let guard = 0; guard < 100; guard++) {
    const due = Array.from(timers.entries())
      .filter(([, timer]) => timer.at <= clock)
      .sort((a, b) => a[1].at - b[1].at)

    if (!due.length) break

    for (const [id, timer] of due) {
      timers.delete(id)
      timer.fn()
    }

    await tick()
  }

  await tick()
}

export const resetClock = (): void => {
  timers.clear()
  clock = 0
}

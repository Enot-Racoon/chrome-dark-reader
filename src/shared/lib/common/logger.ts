/* eslint-disable @typescript-eslint/no-explicit-any */
export const log = (name: string) => console.log.bind(console, name)
export const warn = (name: string) => console.warn.bind(console, name)
export const error = (e: unknown) => console.error(e)

export const createLogger = (filename: string) => ({
  log: (name: string) => console.log.bind(console, filename, name),
  warn: (name: string) => console.warn.bind(console, filename, name),
})

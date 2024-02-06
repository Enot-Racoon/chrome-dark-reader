/* eslint-disable @typescript-eslint/no-explicit-any */
export const log = (name: string) => console.log.bind(console, name)
export const info = (name: string) => console.info.bind(console, name)
export const warn = (name: string) => console.warn.bind(console, name)
export const error = (error: unknown) => console.error(error)
export const logPromise =
  (name: string) =>
  <T>(data: T) => {
    console.log(name, data)
    return data
  }

export const logCallback =
  <Fn extends (...args: Args) => Ret, Args extends Array<any>, Ret>(name: string, cb: Fn) =>
  (...args: Parameters<Fn>): ReturnType<Fn> => {
    console.log(name, ...args)
    return cb(...args) as ReturnType<Fn>
  }

export const createLogger = (filename: string) => ({
  log: (name: string) => console.log.bind(console, filename, name),
  info: (name: string) => console.info.bind(console, filename, name),
  warn: (name: string) => console.warn.bind(console, filename, name),
})

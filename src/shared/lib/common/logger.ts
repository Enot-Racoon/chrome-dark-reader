export const log = (name: string) => console.log.bind(console, name)
export const info = (name: string) => console.info.bind(console, name)
export const error = (error: unknown) => console.error(error)

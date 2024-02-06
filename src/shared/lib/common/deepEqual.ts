export const deepEqual = <T extends object>(a: T, b: T, fields?: Array<keyof T>): boolean => {
  const keys = fields ?? (Object.keys(a) as Array<keyof T>)

  if (!fields && keys.length !== Object.keys(b).length) {
    return false
  }

  return keys.every(key => a[key] === b[key])
}

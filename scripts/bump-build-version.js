/* eslint-disable @typescript-eslint/no-var-requires,@typescript-eslint/unbound-method,@typescript-eslint/restrict-template-expressions,@typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-unsafe-member-access,@typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-argument,@typescript-eslint/no-unsafe-return */
const { writeFileSync } = require('fs')
const { resolve } = require('path')
const { green } = require('chalk')

const BUILD_DIR = 'build'

const getVersion = ({ version }) => `${version}`
const getBuildVersion = ({ version }) =>
  getVersion({ version }).split('.').pop()
const bumpVersion = version => {
  const [major, minor, patch, build] = version.split('.')

  return [major, minor, patch, (parseInt(build) || 0) + 1].join('.')
}

const loadConfig = path => require(`../${path}`)

const saveConfig = (path, data) =>
  writeFileSync(resolve('.', path), JSON.stringify(data, null, 2))

const packageJson = loadConfig('package.json')
const sourceManifestJson = loadConfig('public/manifest.json')
const distManifestJson = loadConfig(`${BUILD_DIR}/manifest.json`)

const currentVersion = getVersion(packageJson)
const buildVersion = getBuildVersion(sourceManifestJson)
const bumpedVersion = bumpVersion([currentVersion, buildVersion].join('.'))

console.info('Bump build version to:', green(bumpedVersion))

saveConfig('public/manifest.json', {
  ...sourceManifestJson,
  version: bumpedVersion,
})
saveConfig(`${BUILD_DIR}/manifest.json`, {
  ...distManifestJson,
  version: bumpedVersion,
})

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { crx } from '@crxjs/vite-plugin'
import manifest from './public/manifest.json'
import { resolve } from 'path'
import { readFileSync, writeFileSync } from 'fs'

// Custom version bump plugin for Chrome Extension
const versionBump = () => {
  return {
    name: 'version-bump',
    apply: 'build' as const, // Only run during build
    buildStart() {
      const pkgPath = resolve(__dirname, 'package.json')
      const manifestPath = resolve(__dirname, 'public/manifest.json')

      const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'))
      const manifestData = JSON.parse(readFileSync(manifestPath, 'utf-8'))

      // Get build number from manifest (4th digit)
      const versionParts = manifestData.version.split('.')
      const buildNumber = parseInt(versionParts[3] || '0')
      const newBuildNumber = buildNumber + 1

      // Combine package.json SemVer with new build number
      const newVersion = `${pkg.version}.${newBuildNumber}`

      manifestData.version = newVersion

      // Update both manifest and optionally package.json if desired
      // Here we only update manifest as per user request for extension logic
      writeFileSync(manifestPath, JSON.stringify(manifestData, null, 2))

      console.log(`\n\x1b[32m✓\x1b[0m Bumped extension version to: \x1b[1m${newVersion}\x1b[0m\n`)
    },
  }
}

export default defineConfig({
  plugins: [react(), crx({ manifest }), versionBump()],
  resolve: {
    alias: {
      app: resolve(__dirname, 'src/app'),
      entities: resolve(__dirname, 'src/entities'),
      feature: resolve(__dirname, 'src/feature'),
      services: resolve(__dirname, 'src/services'),
      shared: resolve(__dirname, 'src/shared'),
      views: resolve(__dirname, 'src/views'),
    },
  },
  server: {
    port: 3000,
    hmr: {
      port: 3000,
    },
  },
  build: {
    outDir: 'build',
    rollupOptions: {
      input: {
        settings: resolve(__dirname, 'settings.html'),
      },
    },
  },
})

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { crx } from '@crxjs/vite-plugin'
import { resolve } from 'path'
import { readFileSync, writeFileSync } from 'fs'

// Final export using function to handle dynamic manifest with version bump
export default defineConfig(({ command }) => {
  const pkgPath = resolve(__dirname, 'package.json')
  const manifestPath = resolve(__dirname, 'public/manifest.json')

  // Read manifest fresh every time
  const manifestData = JSON.parse(readFileSync(manifestPath, 'utf-8'))

  if (command === 'build') {
    const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'))

    // Get build number from manifest (4th digit)
    const versionParts = manifestData.version.split('.')
    const buildNumber = parseInt(versionParts[3] || '0')
    const newBuildNumber = buildNumber + 1

    // Combine package.json SemVer with new build number
    const newVersion = `${pkg.version}.${newBuildNumber}`
    manifestData.version = newVersion

    // Update the file so it's committed correctly
    writeFileSync(manifestPath, JSON.stringify(manifestData, null, 2))

    console.log(`\n\x1b[32m✓\x1b[0m Bumped extension version to: \x1b[1m${newVersion}\x1b[0m\n`)
  }

  return {
    plugins: [react(), crx({ manifest: manifestData })],
    resolve: {
      alias: {
        '@': resolve(__dirname, 'src'),
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
  }
})

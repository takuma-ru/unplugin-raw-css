import type { UnpluginFactory } from 'unplugin'
import type { Options } from './types'
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import process from 'node:process'
import { compileString } from 'sass-embedded'
import { createUnplugin } from 'unplugin'

export const unpluginFactory: UnpluginFactory<Options | undefined> = () => ({
  name: 'unplugin-raw-css',
  enforce: 'pre', // Ensure this plugin runs before other CSS processors
  resolveId(id, importer) {
    return null
  },
  load(id) {
    return null
  },
  vite: {
    handleHotUpdate(ctx) {
      return []
    },
  },
})

export const unplugin = /* #__PURE__ */ createUnplugin(unpluginFactory)

export default unplugin

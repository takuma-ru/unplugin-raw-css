import type { UnpluginFactory } from 'unplugin'
import type { Options } from './types'
import { resolve } from 'node:path'
import { createUnplugin } from 'unplugin'

export const unpluginFactory: UnpluginFactory<Options | undefined> = () => ({
  name: 'unplugin-raw-css',
  enforce: 'pre', // Ensure this plugin runs before other CSS processors
  resolveId(_id, _importer) {
    // 1. “.scss?raw” が含まれる箇所をピックアップ
    // 2. “.virtual-rawcss” という拡張子のファイルとして内部で変換
    return null
  },
  load(_id) {
    // 3. “.virtual-rawcss” のファイルの中身を取得
    // 4. sass-embedded を使用し、css文字列に変換
    // 5. css文字列 を js の文字列として export default する
    return null
  },
  vite: {
    handleHotUpdate(ctx) {
      if (ctx.file.match(/\.(scss|sass)$/)) {
        const affectedModules: any[] = []
        ctx.server.moduleGraph.fileToModulesMap.forEach((modules, _filePath) => {
          modules.forEach((module) => {
            if (module.id?.endsWith('.virtual-rawcss')) {
              const originalPath = module.id.replace('.virtual-rawcss', '')
              if (originalPath === ctx.file) {
                affectedModules.push(module)
              }
            }
          })
        })
        const normalizedFile = resolve(ctx.file)
        ctx.server.moduleGraph.fileToModulesMap.forEach((modules, _filePath) => {
          modules.forEach((module) => {
            if (module.id?.endsWith('.virtual-rawcss')) {
              const originalPath = resolve(module.id.replace('.virtual-rawcss', ''))
              if (originalPath === normalizedFile) {
                affectedModules.push(module)
              }
            }
          })
        })
        if (affectedModules.length > 0) {
          const uniqueModules = [...new Set(affectedModules)]
          uniqueModules.forEach((module) => {
            ctx.server.moduleGraph.invalidateModule(module)
          })
          return uniqueModules
        }
      }
      return []
    },
  },
})

export const unplugin = /* #__PURE__ */ createUnplugin(unpluginFactory)

export default unplugin

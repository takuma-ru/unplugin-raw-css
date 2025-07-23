import type { UnpluginFactory } from 'unplugin'
import type { Options } from './types'
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import process from 'node:process'
import { compileString } from 'sass-embedded'
import { createUnplugin } from 'unplugin'

export const unpluginFactory: UnpluginFactory<Options | undefined> = () => ({
  name: 'unplugin-raw-css',
  enforce: 'pre',
  resolveId(id, importer) {
    // 1. “.scss?raw” が含まれる箇所をピックアップ
    if (id.includes('?raw') && id.match(/\.(scss|sass)\?raw$/)) {
      const filePath = id.split('?')[0]

      if (importer && filePath.startsWith('./')) {
        const resolvedPath = resolve(dirname(importer), filePath)
        // 2. “.virtual-rawcss” という拡張子のファイルとして内部で変換
        return `${resolvedPath}.virtual-rawcss`
      }

      // 2. “.virtual-rawcss” という拡張子のファイルとして内部で変換
      return `${filePath}.virtual-rawcss`
    }
    return null
  },
  load(id) {
    if (!id.endsWith('.virtual-rawcss')) {
      return null
    }
    const filePath = id.replace('.virtual-rawcss', '')
    if (!filePath.match(/\.(scss|sass)$/)) {
      return null
    }
    try {
      this.addWatchFile(filePath)

      // 3. “.virtual-rawcss” のファイルの中身を取得
      const scssContent = readFileSync(filePath, 'utf-8')

      // 4. sass-embedded を使用し、css文字列に変換
      const result = compileString(scssContent, {
        loadPaths: [process.cwd(), dirname(filePath)],
        style: 'expanded',
      })

      // 5. css文字列 を js の文字列として export default する
      return `export default ${JSON.stringify(result.css)};`
    }
    catch (error) {
      this.error(`Failed to compile SCSS file ${filePath}: ${error}`)
    }
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

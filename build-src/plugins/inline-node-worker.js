import esbuild from 'esbuild'
import fs from 'fs'

const pluginName = 'plugin-export-workers'

/**
 *
 * @returns {esbuild.Plugin}
 */
export default function inlineWorkerPlugin (extraConfig) {
  return {
    name: pluginName,

    setup (build) {
      const { initialOptions: { outdir } } = build

      console.log(pluginName, import.meta.url)

      build.onLoad(
        { filter: /\.worker\.(js|ts)$/ },
        async ({ path: workerPath }) => {
          console.log(`[${pluginName}]`, 'onLoad workerPath:', workerPath)
          const contents = await buildWorker(workerPath, extraConfig)

          return {
            contents: (`
import { Worker } from 'worker_threads';

export default function ExportedWorker () {
  return new Worker('${contents.slice(0, -1)}', { eval: true });
}
            `),
          }
        },
      )
    },
  }
}
/**
 * 
 * @param {string} workerPath 
 * @param {string} outdir 
 * @param {*} extraConfig 
 * @returns 
 */
async function buildWorker (workerPath, extraConfig) {
  const build = await esbuild.build({
    entryPoints: [workerPath],
    bundle: true,
    target: 'esnext',
    format: 'cjs',
    platform: 'node',
    write: false,
    minify: true,
    ...extraConfig,
  })

  return new TextDecoder()
    .decode(build.outputFiles[0].contents)
}

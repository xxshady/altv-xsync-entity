import esbuild from 'esbuild'

const pluginName = 'plugin-export-workers'

/**
 *
 * @returns {esbuild.Plugin}
 */
export default function exportWorkersPlugin (extraConfig) {
  return {
    name: pluginName,

    setup (build) {
      const { initialOptions: { outdir } } = build

      if (!outdir) {
        throw new Error(`[${pluginName}] esbuild config must include outdir`)
      }

      console.log(pluginName, import.meta.url)

      build.onLoad(
        { filter: /\.worker\.(js|ts)$/ },
        ({ path: workerPath }) => {
          console.log(`[${pluginName}]`, 'onLoad workerPath:', workerPath)
          const workerFileName = buildWorker(workerPath, outdir, extraConfig)

          return {
            contents: `
import { Worker } from 'worker_threads';

export default function ExportedWorker () {
  return new Worker(new URL( './${workerFileName}', import.meta.url));
}
`,
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
function buildWorker (workerPath, outdir, extraConfig) {
  let workerFileName = workerPath.slice(workerPath.lastIndexOf('\\') + 1)
  workerFileName = workerFileName.slice(0, workerFileName.lastIndexOf('.')) + '.js'

  const outfile = `${outdir}/${workerFileName}`

  console.log(`[${pluginName}`, 'buildWorker', 'outfile:', outfile)

  esbuild.buildSync({
    entryPoints: [workerPath],
    bundle: true,
    outfile,
    target: 'esnext',
    format: 'esm',
    platform: 'node',
    ...extraConfig,
  })

  return workerFileName
}
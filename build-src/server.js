import process from 'process'
import { build } from 'esbuild'
import { 
  getSharedBuildOptions, 
  typesGenerator 
} from './shared-options'
import exportWorkersPlugin from './plugins/export-node-workers'

const sharedOptions = getSharedBuildOptions("server", process)

build({
  ...sharedOptions,

  format: 'esm',
  platform: 'node',

  entryPoints: ['./server/src/main.js'],
  outdir: './server/dist',

  external: [
    ...sharedOptions.external,
    'alt-server',
    'uuid',
  ],

  plugins: [
    exportWorkersPlugin()
  ]
}).then(typesGenerator("server"))
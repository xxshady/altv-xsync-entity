import process from 'process'
import { build } from 'esbuild'
import { 
  getSharedBuildOptions, 
  typesGenerator 
} from '../build-src/shared-options'
import exportWorkersPlugin from '../build-src/plugins/export-node-workers'

const sharedOptions = getSharedBuildOptions(process)

build({
  ...sharedOptions,

  format: 'esm',
  platform: 'node',

  entryPoints: ['./src/main.js'],
  outdir: './dist',

  external: [
    ...sharedOptions.external,
    'alt-server',
    'uuid',
  ],

  plugins: [
    exportWorkersPlugin({ define: sharedOptions.define })
  ]
}).then(typesGenerator())
import process from 'process'
import { build } from 'esbuild'
import { 
  getSharedBuildOptions, 
  typesGenerator 
} from '../build-src/shared-options'
import inlineWorkerPlugin from '../build-src/plugins/inline-node-worker'

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
    inlineWorkerPlugin({ define: sharedOptions.define })
  ]
}).then(typesGenerator())

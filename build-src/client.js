import process from 'process'
import { build } from 'esbuild'
import { 
  getSharedBuildOptions, 
  typesGenerator 
} from './shared-options'

const sharedOptions = getSharedBuildOptions("client", process)

build({
  ...sharedOptions,
  format: 'esm',

  entryPoints: ['./client/src/main.js'],
  outfile: './client/dist/main.js',

  external: [
    ...sharedOptions.external,
    'alt-client', 
  ]
}).then(typesGenerator("client")) 
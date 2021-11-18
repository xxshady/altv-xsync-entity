import process from 'process'
import { build } from 'esbuild'
import { getSharedBuildOptions } from './shared-options'

const sharedOptions = getSharedBuildOptions(process)

build({
  ...sharedOptions,
  format: 'esm',

  entryPoints: ['./client/src/main.js'],
  outfile: './client/dist/main.js',

  external: [
    ...sharedOptions.external,
    'alt-client', 
  ]
})
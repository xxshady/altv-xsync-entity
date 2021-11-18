import process from 'process'
import { build } from 'esbuild'
import { getSharedBuildOptions } from './shared-options';

const sharedOptions = getSharedBuildOptions(process)

build({
  ...sharedOptions,

  format: 'esm',
  platform: 'node',

  entryPoints: ['./server/src/main.js'],
  outfile: './server/dist/main.js',

  external: [
    ...sharedOptions.external,
    'alt-server',
    'uuid',
  ]
})
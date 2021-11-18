import process from 'process'
import { build } from 'esbuild'
import { getSharedBuildOptions } from './shared-options'

build({
  ...getSharedBuildOptions(process),

  format: 'esm',
  entryPoints: ['./shared/src/main.js'],
  outfile: './shared/dist/main.js',
})
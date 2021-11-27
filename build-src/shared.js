import process from 'process'
import { build } from 'esbuild'
import { 
  getSharedBuildOptions, 
  typesGenerator 
} from './shared-options'

build({
  ...getSharedBuildOptions("shared", process),

  format: 'esm',
  entryPoints: ['./shared/src/main.js'],
  outfile: './shared/dist/main.js',
}).then(typesGenerator("shared"))
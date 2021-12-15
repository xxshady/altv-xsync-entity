import process from 'process'
import { build } from 'esbuild'
import { 
  getSharedBuildOptions, 
  typesGenerator 
} from '../build-src/shared-options'

build({
  ...getSharedBuildOptions(process),

  format: 'esm',
  entryPoints: ['./src/main.js'],
  outfile: './dist/main.js',
}).then(typesGenerator())
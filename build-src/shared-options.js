import { exec } from "child_process"

export const getSharedBuildOptions = (side, { argv }) => {
  const [,, watchArg] = argv

  const watch = ((watchArg === '-w') 
    ? { 
      onRebuild: typesGenerator(side)
    }
    : false
  )

  return {
    watch,
    bundle: true,
    target: 'esnext',
    logLevel: 'info',
    external: ['alt-shared'],
  } 
}

export const typesGenerator = (side) => 
  (error, result) => {
    if (error) return
    
    console.log(`[generate-types:${side}]`)

    if (typesGenerator.child) {
      typesGenerator.child.kill()
    }

    const child = exec(`yarn run types:${side}`)
    typesGenerator.child = child

    child.stdout.pipe(process.stdout)
    child.stderr.pipe(process.stderr)

    child.stdout.on("data", (chunk) => {
      chunk = chunk + ""
      if (!chunk.startsWith('Done in')) return
      child.kill()
    })

    process.on("SIGINT", () => {
      child.kill()
    })
  }
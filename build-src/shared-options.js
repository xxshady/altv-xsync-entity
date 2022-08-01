import { exec } from "child_process"

export const getSharedBuildOptions = ({ argv }) => {
  const [,, watchArg] = argv

  const watch = ((watchArg === "-w") 
    ? { 
      onRebuild: typesGenerator()
    }
    : false
  )
  
  console.log('getSharedBuildOptions watch:', watch)

  return {
    watch,
    bundle: true,
    target: "esnext",
    logLevel: "info",
    external: ["alt-shared"],
    define: {
      ___DEV_MODE: !!watch,
    }
  } 
}

// TODO fix child.kill()
export const typesGenerator = () => 
  (error, result) => {
    if (error) return
    
    if (typesGenerator.child) {
      typesGenerator.child.kill()
    }

    const child = exec("yarn run types")
    typesGenerator.child = child

    child.stdout.pipe(process.stdout)
    child.stderr.pipe(process.stderr)

    child.stdout.on("data", (chunk) => {
      chunk = chunk + ""
      if (!chunk.startsWith("Done in")) return
      child.kill()
    })

    process.on("SIGINT", () => {
      child.kill()
    })
  }

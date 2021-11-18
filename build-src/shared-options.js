export const getSharedBuildOptions = ({ argv }) => {
  const [,, watchArg] = argv

  return {
    watch: watchArg === '-w',
    bundle: true,
    target: 'esnext',
    logLevel: 'info',
    external: ['alt-shared'],
  } 
}
declare module "*.worker.ts" {
  import { Worker as WorkerThread } from 'worker_threads'

  class Worker extends WorkerThread {
    constructor ()
  }

  export default Worker
}
import * as alt from "alt-client"
import { createLogger } from "altv-xlogger"
import { WSClient } from "./ws-client"

const log = createLogger("xsync-entity:test")

alt.onServer("xsyncEntity:test", async (authCode) => {
  log.log("received test event from server authCode:", authCode)

  const client = new WSClient("ws://127.0.0.1:7700", authCode, {
    events: {
      kek (...args: unknown[]) {
        log.log("[kek event]", "args:~gl~", JSON.stringify(args))
      },
    },
  })

  await client.waitConnect()

  client.send("kek", 1, 2, 3)

  // const waitResId = 0
  // for (let i = 0; i < 10; i++) {
  //   testSend()
  //   await waitRes()
  // }

  // function testSend () {
  //   const arr: number[] = []

  //   for (let i = 0; i < 10000; i++) {
  //     arr.push(255)
  //   }

  //   const buf = new Float64Array(arr)

  //   // @ts-ignore
  //   const res = client.send(buf)
  //   log.log("sent ms:", new Date().getMilliseconds())
  //   log.log("send res:", res)
  // }

  // function waitRes () {
  //   return new Promise<void>(resolve => {
  //     const off = client.setMessageHandler((data) => {
  //       off()
  //       log.log("[waitRes]", waitResId++)
  //       if (data === "ok") resolve()
  //     })
  //   })
  // }
})

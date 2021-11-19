import https from "https"

const options = {
  hostname: "ipinfo.io",
  path: "/ip",
  method: "GET",
}

export const getExternalIp = (): Promise<string> =>
  new Promise<string>((resolve, reject) => {
    const req = https.request(options, res => {
      if (res.statusCode !== 200) {
        reject(new Error("failed get ip"))
        return
      }

      res.on("data", (ipAddr: Buffer) => {
        try {
          resolve(ipAddr.toString())
        } catch (e) {
          reject(e)
        }
      })
    })

    req.on("error", reject)
    req.end()
  })
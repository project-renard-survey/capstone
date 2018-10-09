import * as Debug from "debug"
import { Duplex } from "stream"
import WebSocket from "./WebSocket"

const log = Debug("discovery-cloud:WebSocketStream")

export default class WebSocketStream extends Duplex {
  socket: WebSocket
  ready: Promise<this>

  constructor(url: string) {
    super()
    this.socket = new WebSocket(url)
    this.socket.binaryType = "arraybuffer"

    this.ready = new Promise(resolve => {
      this.socket.addEventListener("open", () => {
        resolve(this)
      })
    })

    this.socket.addEventListener("open", () => {
      this.emit("open", this)
    })

    this.socket.addEventListener("close", () => {
      this.destroy() // TODO is this right?
    })

    this.socket.addEventListener("error", err => {
      log("error", err)
      this.emit("error", err)
    })

    this.socket.addEventListener("message", event => {
      const data = Buffer.from(event.data)
      log("socket.message", data)

      if (!this.push(data)) {
        log("stream closed, cannot write")
        this.socket.close()
      }
    })
  }

  get isOpen() {
    return this.socket.readyState === WebSocket.OPEN
  }

  _write(data: Buffer, _: unknown, cb: () => void) {
    log("_write", data)

    this.socket.send(data)
    cb()
  }

  _read() {
    // Reading is done async
  }

  _destroy(err: Error | null, cb: (error: Error | null) => void) {
    log("_destroy", err)

    if (err) {
      // this.socket.emit("error", err)
      // this.socket.terminate()
      cb(null)
    }
  }

  _final(cb: (error?: Error | null | undefined) => void) {
    log("_final", cb)
    this.socket.close()
    cb()
  }
}
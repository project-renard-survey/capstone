import * as DOM from "./DOM"
import * as DragMetrics from "./DragMetrics"

export interface ResizerOptions {
  onStart?: OnStartHandler
  onDrag?: OnMoveHandler
  onStop?: OnStopHandler
  node: HTMLElement
  originalSize: Size
  preserveAspectRatio: boolean
}

export type OnStartHandler = () => void
export type OnMoveHandler = (newSize: Size) => void
export type OnStopHandler = (newSize: Size) => void

export class Resizer {
  private originalSize: Size
  private currentSize: Size
  private preserveAspectRatio: boolean
  private onStart?: OnStartHandler
  private onDrag?: OnMoveHandler
  private onStop?: OnStopHandler
  private measurements?: DragMetrics.Measurements
  private node: HTMLElement

  constructor(options: ResizerOptions) {
    this.onStart = options.onStart
    this.onDrag = options.onDrag
    this.onStop = options.onStop
    this.node = options.node
    this.originalSize = options.originalSize
    this.currentSize = options.originalSize
    this.preserveAspectRatio = options.preserveAspectRatio
  }

  start(e: Point) {
    const dragPoint = DOM.getOffsetFromParent(e, this.node)
    this.measurements = DragMetrics.init(dragPoint)
    this.onStart && this.onStart()
  }

  resize(e: Point) {
    if (!this.measurements) throw new Error("Must call start() before resize()")

    const dragPoint = DOM.getOffsetFromParent(e, this.node)
    this.measurements = DragMetrics.update(this.measurements, dragPoint)
    let newSize = {
      width: this.originalSize.width + this.measurements.delta.x,
      height: this.originalSize.height + this.measurements.delta.y,
    }

    if (this.preserveAspectRatio) {
      const scaleFactor = Math.max(
        newSize.width / this.originalSize.width,
        newSize.height / this.originalSize.height,
      )
      newSize = {
        width: this.originalSize.width * scaleFactor,
        height: this.originalSize.height * scaleFactor,
      }
    }

    this.currentSize = newSize
    this.onDrag && this.onDrag(newSize)
  }

  setSize(size: Size) {
    this.originalSize = size
  }

  stop() {
    if (!this.measurements) throw new Error("Must call start() before stop()")
    this.measurements = undefined
    this.originalSize = this.currentSize
    this.onStop && this.onStop(this.currentSize)
  }
}

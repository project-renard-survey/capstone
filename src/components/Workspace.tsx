import * as React from "react"
import * as Widget from "./Widget"
import * as Reify from "../data/Reify"
import * as DataImport from "./DataImport"
import GPSInput from "./GPSInput"
import { AnyDoc } from "automerge/frontend"
import Content, {
  DocumentActor,
  FullyFormedMessage,
  DocumentCreated,
  ReceiveDocuments,
} from "./Content"
import Clipboard from "./Clipboard"
import Peers from "./Peers"
import * as Link from "../data/Link"
import Pinchable from "./Pinchable"
import * as css from "./css/Workspace.css"

type NavEntry = { url: string; [extra: string]: any }

export interface Model {
  navStack: NavEntry[]
  rootUrl: string
  shelfUrl: string
}

type WidgetMessage = DocumentCreated | ReceiveDocuments
type InMessage = FullyFormedMessage<DocumentCreated | ReceiveDocuments>
type OutMessage = DocumentCreated | ReceiveDocuments

class WorkspaceActor extends DocumentActor<Model, InMessage, OutMessage> {
  async onMessage(message: InMessage) {
    switch (message.type) {
      case "ReceiveDocuments": {
        this.emit({
          to: this.doc.shelfUrl,
          type: "ReceiveDocuments",
          body: message.body,
        })
        break
      }
    }
  }
}

class Workspace extends React.Component<Widget.Props<Model, WidgetMessage>> {
  static reify(doc: AnyDoc): Model {
    return {
      navStack: Reify.array(doc.navStack),
      rootUrl: Reify.string(doc.rootUrl),
      shelfUrl: Reify.link(doc.shelfUrl),
    }
  }

  get currentUrl() {
    return this.peek()
  }

  push = (url: string, extraProps: {} = {}) => {
    this.props.change(doc => {
      doc.navStack.push({ url, ...extraProps })
    })
  }

  pop = () => {
    if (this.props.doc.navStack.length === 0) return false

    this.props.change(doc => {
      doc.navStack.pop()
    })
    return true
  }

  peek = () => {
    const { navStack, rootUrl } = this.props.doc
    return navStack[navStack.length - 1] || { url: rootUrl }
  }

  onCopy = (e: ClipboardEvent) => {
    // If an element other than body has focus (e.g. a text card input),
    // don't interfere with normal behavior.
    if (document.activeElement !== document.body) {
      return
    }

    // Otherwise, prevent default behavior and copy the currently active/fullscreen
    // document url to the clipboard.
    e.preventDefault()
    const current = this.peek()
    e.clipboardData.setData("text/plain", current.url)
    console.log(`Copied current url to the clipboard: ${current.url}`)
  }

  onPaste = (e: ClipboardEvent) => {
    this.importData(e.clipboardData)
  }

  onTapPeer = (identityUrl: string) => {
    this.props.emit({
      to: this.props.doc.shelfUrl,
      type: "ReceiveDocuments",
      body: { urls: [identityUrl] },
    })
  }

  importData = (dataTransfer: DataTransfer) => {
    const urlPromises = DataImport.importData(dataTransfer)
    Promise.all(urlPromises).then(urls => {
      this.props.emit({ type: "ReceiveDocuments", body: { urls } })
    })
  }

  render() {
    const { shelfUrl, navStack } = this.props.doc
    const { url: currentUrl, ...currentExtra } = this.peek()
    // oh yeah
    const previous =
      navStack.length === 0
        ? undefined
        : navStack.length === 1
          ? { url: this.props.doc.rootUrl }
          : navStack[navStack.length - 2]
    console.log("nav stack", navStack)
    console.log("previous", previous)
    return (
      <div className={css.Workspace}>
        <GPSInput />
        <Clipboard onCopy={this.onCopy} onPaste={this.onPaste} />
        {previous ? (
          <Content
            key={previous.url + "-previous"}
            mode={this.props.mode}
            url={previous.url}
            zIndex={-1}
          />
        ) : null}
        <Content
          key={currentUrl}
          mode={this.props.mode}
          url={currentUrl}
          {...currentExtra}
          onNavigate={this.push}
          onNavigateBack={this.pop}
        />
        <div className={css.Shelf}>
          <Content mode="fullscreen" noInk url={shelfUrl} />
        </div>
      </div>
    )
  }
}

export default Widget.create(
  "Workspace",
  Workspace,
  Workspace.reify,
  WorkspaceActor,
)

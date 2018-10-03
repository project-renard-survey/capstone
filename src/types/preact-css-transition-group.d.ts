declare module "preact-css-transition-group" {
  import * as Preact from "preact"

  interface Props {
    transitionName: string | { [name: string]: string }
    transitionEnter?: boolean
    transitionLeave?: boolean
    transitionEnterTimeout?: number
    transitionLeaveTimeout?: number
  }

  class CSSTransitionGroup extends preact.Component<Props> {
    render(): Preact.ComponentChild
  }

  export = CSSTransitionGroup
}
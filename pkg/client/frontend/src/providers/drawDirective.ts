export const DRAW_DIRECTIVE_ID = Symbol("__DRAW_DIRECTIVE_ID")

export type DrawDirective = XRFrameRequestCallback & {
    [DRAW_DIRECTIVE_ID]: string
}

const createDrawDirective = (identifier: string, call: XRFrameRequestCallback): DrawDirective => {
    ;(call as DrawDirective)[DRAW_DIRECTIVE_ID] = identifier
    return call as DrawDirective
}

export default createDrawDirective

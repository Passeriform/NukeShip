import { createPresence } from "@solid-primitives/presence"
import { combineStyle } from "@solid-primitives/props"
import { JSX, ParentComponent, Show, createEffect, createSignal, mergeProps, splitProps, untrack } from "solid-js"
import { twMerge } from "tailwind-merge"
import { PlacementPosition } from "@constants/types"

type PerspectivePanelProps = JSX.HTMLAttributes<HTMLElement> & {
    show: boolean
    position?: PlacementPosition
    seeThrough?: boolean
    transitionTiming?: number
}

const PerspectivePanel: ParentComponent<PerspectivePanelProps> = (_props) => {
    const _defaultedProps = mergeProps(
        { position: PlacementPosition.LEFT, seeThrough: false, transitionTiming: 400 },
        _props,
    )
    const [ownProps, forwardedProps] = splitProps(_defaultedProps, [
        "show",
        "position",
        "seeThrough",
        "transitionTiming",
    ])

    // eslint-disable-next-line solid/reactivity -- Initial read for debouncedPosition is done in non-reactive context, rest is compared in createEffect.
    const [debouncedPosition, setDebouncedPosition] = createSignal<PlacementPosition>(ownProps.position)

    const panePresence = createPresence(() => ownProps.show, { transitionDuration: () => ownProps.transitionTiming })

    createEffect(() => {
        if (untrack(debouncedPosition) !== ownProps.position) {
            if (panePresence.isAnimating() || panePresence.isVisible()) {
                setTimeout(() => setDebouncedPosition(ownProps.position), ownProps.transitionTiming)
            } else {
                setDebouncedPosition(ownProps.position)
            }
        }
    })

    return (
        <div class="pointer-events-none absolute flex h-full w-full items-center justify-center perspective-origin-center perspective-800">
            <Show when={panePresence.isMounted()}>
                <section
                    {...forwardedProps}
                    class={twMerge(
                        "absolute min-w-114 transform rounded-lg border border-dark-turquoise p-4 shadow-lg transition-all ease-out",
                        debouncedPosition() === PlacementPosition.LEFT
                            ? "left-1/8 rotate-y-30"
                            : "right-1/8 -rotate-y-30",
                        !ownProps.seeThrough && "backdrop-blur-lg",
                        panePresence.isVisible() ? "scale-y-100" : "scale-y-0",
                        forwardedProps.class,
                    )}
                    style={combineStyle(
                        { "transition-duration": `${ownProps.transitionTiming}ms` },
                        forwardedProps.style,
                    )}
                >
                    {forwardedProps.children}
                </section>
            </Show>
        </div>
    )
}

export default PerspectivePanel

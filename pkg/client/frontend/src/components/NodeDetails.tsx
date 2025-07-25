import { createPresence } from "@solid-primitives/presence"
import {
    Accessor,
    For,
    JSX,
    Show,
    VoidComponent,
    createEffect,
    createSignal,
    mergeProps,
    splitProps,
    untrack,
} from "solid-js"
import { twMerge } from "tailwind-merge"
import { CONTENT } from "@constants/content"
import { SaplingMetadata } from "@game/tree"
import { ContentBody } from "./ContentBody"
import InfoButton from "./InfoButton"

interface NodeDetailsProps extends JSX.HTMLAttributes<HTMLElement> {
    data: SaplingMetadata
    show: Accessor<boolean>
    transitionTiming?: number
    position?: "left" | "right"
    revealBehind?: (obstructingHover: boolean) => boolean
}

const NodeDetails: VoidComponent<NodeDetailsProps> = (_props) => {
    const [ownProps, forwardedProps] = splitProps(
        mergeProps({ position: "left", transitionTiming: 400, revealBehind: () => false }, _props),
        ["show", "transitionTiming", "position", "revealBehind", "data"],
    )

    const statData = () => [
        {
            content: CONTENT.POWER,
            value: "█  ".repeat(ownProps.data.power / 5),
        },
        {
            content: CONTENT.SHIELD,
            value: "█  ".repeat(ownProps.data.shield / 5),
        },
        {
            content: CONTENT.RECHARGE_RATE,
            value: "█  ".repeat(ownProps.data.rechargeRate / 5) + "/s",
        },
    ]

    const [hovering, setHovering] = createSignal(false)
    const [debouncedPosition, setDebouncedPosition] = createSignal(ownProps.position)

    const panePresence = createPresence(ownProps.show, { transitionDuration: ownProps.transitionTiming })

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
        <Show when={panePresence.isMounted()}>
            <section
                class={twMerge(
                    "absolute min-w-114 transform rounded-lg border border-dark-turquoise p-4 text-white shadow-lg transition-all ease-out transform-style-3d",
                    debouncedPosition() === "left" ? "left-1/8 rotate-y-30" : "right-1/8 -rotate-y-30",
                    !ownProps.revealBehind(hovering()) && "backdrop-blur-lg",
                    panePresence.isVisible() ? "scale-y-100" : "scale-y-0",
                    forwardedProps.class,
                )}
                style={{ "transition-duration": `${ownProps.transitionTiming}ms` }}
                onMouseEnter={() => setHovering(true)}
                onMouseLeave={() => setHovering(false)}
            >
                <article class="flex h-full flex-col gap-2">
                    <h2 class="font-title text-4xl font-bold">{ownProps.data.label}</h2>
                    <div class="my-2 flex flex-col gap-2">
                        <For each={statData()}>
                            {({ content, value }) => (
                                <div
                                    class={twMerge(
                                        "flex w-full items-center p-4",
                                        debouncedPosition() === "left" ? "flex-row" : "flex-row-reverse",
                                    )}
                                >
                                    <InfoButton
                                        class="w-16 cursor-default p-6"
                                        embellish={false}
                                        hintTitle={content.title}
                                        hintBody={<ContentBody content={content} />}
                                        hintClass="w-96"
                                        onMouseEnter={() => setHovering(false)}
                                        onMouseLeave={() => setHovering(true)}
                                    >
                                        {content.icon}
                                    </InfoButton>
                                    <span
                                        class={twMerge(
                                            "text-dark-turquoise",
                                            debouncedPosition() === "left" ? "ms-8" : "me-8",
                                        )}
                                    >
                                        {value}
                                    </span>
                                </div>
                            )}
                        </For>
                    </div>
                    <Show when={ownProps.data.sentinel}>
                        <InfoButton
                            class={twMerge(
                                "w-20 cursor-default p-6",
                                debouncedPosition() === "left" ? "ms-auto" : "me-auto",
                            )}
                            embellish={false}
                            hintTitle={CONTENT.SENTINEL.title}
                            hintBody={<ContentBody content={CONTENT.SENTINEL} />}
                            hintClass="w-96"
                            onMouseEnter={() => setHovering(false)}
                            onMouseLeave={() => setHovering(true)}
                        >
                            {CONTENT.SENTINEL.icon}
                        </InfoButton>
                    </Show>
                </article>
            </section>
        </Show>
    )
}

export default NodeDetails

import { createPresence } from "@solid-primitives/presence"
import { Accessor, For, Show, VoidComponent, createEffect, createSignal, mergeProps, untrack } from "solid-js"
import { twMerge } from "tailwind-merge"
import { CONTENT } from "@constants/content"
import { RawDataStream } from "@game/tree"
import { ContentBody } from "./ContentBody"
import InfoButton from "./InfoButton"

interface NodeDetailsProps extends Omit<RawDataStream, "children"> {
    show: Accessor<boolean>
    transitionTiming?: number
    position?: "left" | "right"
    revealBehind?: (obstructingHover: boolean) => boolean
}

const NodeDetails: VoidComponent<NodeDetailsProps> = (_props) => {
    const props = mergeProps({ position: "left", transitionTiming: 400, revealBehind: () => false }, _props)

    const statData = () => [
        {
            content: CONTENT.POWER,
            value: "█  ".repeat(props.power / 5),
        },
        {
            content: CONTENT.SHIELD,
            value: "█  ".repeat(props.shield / 5),
        },
        {
            content: CONTENT.RECHARGE_RATE,
            value: "█  ".repeat(props.rechargeRate / 5) + "/s",
        },
    ]

    const [hovering, setHovering] = createSignal(false)
    const [debouncedPosition, setDebouncedPosition] = createSignal(props.position)

    const panePresence = createPresence(props.show, { transitionDuration: props.transitionTiming })

    createEffect(() => {
        if (untrack(debouncedPosition) !== props.position) {
            if (panePresence.isAnimating() || panePresence.isVisible()) {
                setTimeout(() => setDebouncedPosition(props.position), props.transitionTiming)
            } else {
                setDebouncedPosition(props.position)
            }
        }
    })

    return (
        <Show when={panePresence.isMounted()}>
            <section
                class={twMerge(
                    "pointer-events-auto absolute min-w-1/4 transform rounded-lg border border-dark-turquoise p-4 text-white shadow-lg transition-all ease-out transform-style-3d",
                    debouncedPosition() === "left" ? "left-1/8 rotate-y-30" : "right-1/8 -rotate-y-30",
                    !props.revealBehind(hovering()) && "backdrop-blur-lg",
                    panePresence.isVisible() ? "scale-y-100" : "scale-y-0",
                )}
                style={{ "transition-duration": `${props.transitionTiming}ms` }}
                onMouseEnter={() => setHovering(true)}
                onMouseLeave={() => setHovering(false)}
            >
                <article class="flex h-full flex-col gap-2">
                    <h2 class="font-title text-4xl font-bold">{props.label}</h2>
                    <div class="my-2 flex flex-col gap-2">
                        <For each={statData()}>
                            {({ content, value }) => (
                                <div class="flex w-full items-center p-4">
                                    <InfoButton
                                        class="w-16 cursor-default p-6"
                                        embellish={false}
                                        hintTitle={content.title}
                                        hintBody={<ContentBody content={content} />}
                                    >
                                        {content.icon}
                                    </InfoButton>
                                    <span class="ms-8 text-dark-turquoise">{value}</span>
                                </div>
                            )}
                        </For>
                    </div>
                    <Show when={props.sentinel}>
                        <InfoButton
                            class="ms-auto w-20 cursor-default p-6"
                            embellish={false}
                            hintTitle={CONTENT.SENTINEL.title}
                            hintBody={<ContentBody content={CONTENT.SENTINEL} />}
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

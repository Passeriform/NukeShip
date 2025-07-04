import { createPresence } from "@solid-primitives/presence"
import { Accessor, For, Show, VoidComponent, createSignal, mergeProps } from "solid-js"
import { twMerge } from "tailwind-merge"
import { CONTENT } from "@constants/content"
import { RawDataStream } from "@game/tree"
import { ContentBody } from "./ContentBody"
import InfoButton from "./InfoButton"

interface DetailsPaneProps extends Omit<RawDataStream, "children"> {
    show: Accessor<boolean>
    position?: "left" | "right"
    revealBehind?: (obstructingHover: boolean) => boolean
}

const DetailsPane: VoidComponent<DetailsPaneProps> = (_props) => {
    const props = mergeProps({ position: "left", revealBehind: () => false }, _props)

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
    const panePresence = createPresence(props.show, { transitionDuration: 100 })

    return (
        <Show when={panePresence.isMounted()}>
            <section
                class={twMerge(
                    "pointer-events-auto absolute min-w-1/4 transform rounded-lg border border-dark-turquoise p-4 text-white shadow-lg transition-all duration-100 ease-out transform-style-3d",
                    props.position === "left" ? "left-1/8 rotate-y-30" : "right-1/8 -rotate-y-30",
                    props.revealBehind(hovering()) ? "" : "backdrop-blur-lg",
                    panePresence.isVisible() ? "scale-y-100" : "scale-y-0",
                )}
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
                                        text={content.icon}
                                        hintTitle={content.title}
                                        hintBody={<ContentBody content={content} />}
                                    />
                                    <span class="ms-8 text-dark-turquoise">{value}</span>
                                </div>
                            )}
                        </For>
                    </div>
                    <Show when={props.sentinel}>
                        <InfoButton
                            class="ms-auto w-20 cursor-default p-6"
                            embellish={false}
                            text={CONTENT.SENTINEL.icon}
                            hintTitle={CONTENT.SENTINEL.title}
                            hintBody={<ContentBody content={CONTENT.SENTINEL} />}
                        />
                    </Show>
                </article>
            </section>
        </Show>
    )
}

export default DetailsPane

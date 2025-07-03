import { For, Show, VoidComponent, mergeProps } from "solid-js"
import { twMerge } from "tailwind-merge"
import { CONTENT } from "@constants/content"
import { RawDataStream } from "@game/tree"
import { ContentBody } from "./ContentBody"
import InfoButton from "./InfoButton"

interface DetailsPaneProps extends Omit<RawDataStream, "children"> {
    position?: "left" | "right"
    show?: boolean
    dim?: boolean
}

const DetailsPane: VoidComponent<DetailsPaneProps> = (_props) => {
    const props = mergeProps({ position: "left", show: false, dim: false }, _props)

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

    const sharedButtonClasses = "pointer-events-auto cursor-default p-6"

    return (
        <div class="pointer-events-none absolute flex h-full w-full items-center justify-center perspective-origin-center perspective-800">
            <section
                class={twMerge(
                    "absolute min-w-1/4 transform rounded-lg p-4 text-white shadow-lg transition-all duration-100 ease-out transform-style-3d",
                    props.position === "left" ? "left-1/8 rotate-y-30" : "right-1/8 -rotate-y-30",
                    props.dim ? "bg-gray-800/45" : "bg-gray-800",
                    props.show ? "scale-y-full opacity-100" : "pointer-events-none scale-y-0 opacity-0",
                )}
            >
                <article class="flex h-full flex-col gap-2">
                    <h2 class="font-title text-4xl font-bold">{props.label}</h2>
                    <div class="my-2 flex flex-col gap-2">
                        <For each={statData()}>
                            {({ content, value }) => (
                                <div class="flex w-full items-center p-4">
                                    <InfoButton
                                        class={twMerge(sharedButtonClasses, "w-16")}
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
                            class={twMerge(sharedButtonClasses, "ms-auto w-20")}
                            embellish={false}
                            text={CONTENT.SENTINEL.icon}
                            hintTitle={CONTENT.SENTINEL.title}
                            hintBody={<ContentBody content={CONTENT.SENTINEL} />}
                        />
                    </Show>
                </article>
            </section>
        </div>
    )
}

export default DetailsPane

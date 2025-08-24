import { For, Show, VoidComponent } from "solid-js"
import Description from "@components/Description"
import InfoButton from "@components/InfoButton"
import { CONTENT } from "@constants/content"
import { SaplingMetadata } from "@game/tree"

type NodeDetailsPanelProps = {
    data: SaplingMetadata
}

const NodeDetailsPanel: VoidComponent<NodeDetailsPanelProps> = (props) => {
    const statData = () => [
        {
            content: CONTENT.NODE_ATTRIBUTES.POWER,
            value: "█  ".repeat(props.data.power / 5),
        },
        {
            content: CONTENT.NODE_ATTRIBUTES.SHIELD,
            value: "█  ".repeat(props.data.shield / 5),
        },
        {
            content: CONTENT.NODE_ATTRIBUTES.RECHARGE_RATE,
            value: "█  ".repeat(props.data.rechargeRate / 5) + "/s",
        },
    ]

    return (
        <article class="flex h-full flex-col gap-2">
            <h2 class="font-title text-4xl font-bold">{props.data.label}</h2>
            <section class="my-2 flex flex-col gap-2">
                <For each={statData()}>
                    {({ content, value }) => (
                        <div class="flex w-full flex-row items-center p-4">
                            <InfoButton
                                class="cursor-default px-6 py-3 tracking-normal"
                                embellish={false}
                                hintTitle={content.title}
                                hintBody={<Description content={content} />}
                                hintClass="w-96"
                            >
                                {content.icon}
                            </InfoButton>
                            <span class="ms-8 text-dark-turquoise">{value}</span>
                        </div>
                    )}
                </For>
            </section>
            {/* TODO: Move this inside section */}
            <Show when={props.data.sentinel}>
                <InfoButton
                    class="ms-auto cursor-default px-4 py-3 tracking-normal"
                    embellish={false}
                    hintTitle={CONTENT.NODE_ATTRIBUTES.SENTINEL.title}
                    hintBody={<Description content={CONTENT.NODE_ATTRIBUTES.SENTINEL} />}
                    hintClass="w-96"
                >
                    {CONTENT.NODE_ATTRIBUTES.SENTINEL.icon}
                </InfoButton>
            </Show>
        </article>
    )
}

export default NodeDetailsPanel

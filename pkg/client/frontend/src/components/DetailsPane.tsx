import { VoidComponent, mergeProps } from "solid-js"
import { twMerge } from "tailwind-merge"

interface DetailsPaneProps {
    position: "left" | "right"
    show: boolean
    title: string
    content: string
}

const DetailsPane: VoidComponent<DetailsPaneProps> = (_props) => {
    const props = mergeProps({ position: "left", show: false }, _props)

    return (
        <div class="pointer-events-none absolute flex h-full w-full items-center justify-center perspective-origin-center perspective-800">
            <div
                class={twMerge(
                    "absolute h-1/2 w-1/4 transform rounded-lg bg-gray-800 p-4 text-white shadow-lg transition-all duration-100 ease-out",
                    props.position === "left" ? "left-1/8 rotate-y-30" : "right-1/8 -rotate-y-30",
                    props.show ? "scale-y-full opacity-100" : "pointer-events-none scale-y-0 opacity-0",
                )}
            >
                <h2 class="mb-4 font-title text-4xl font-bold">{props.title}</h2>
                <p>{props.content}</p>
            </div>
        </div>
    )
}

export default DetailsPane

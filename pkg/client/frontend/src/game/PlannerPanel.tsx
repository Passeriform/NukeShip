import { For, VoidComponent, createSignal, onCleanup, onMount } from "solid-js"
import { twMerge } from "tailwind-merge"
import { CONTENT } from "@constants/content"
import usePlanner from "@game/usePlanner"

interface PlannerPanelProps {
    plans: ReturnType<typeof usePlanner>["plans"]
}

const renderPlan = (plan: ReturnType<typeof usePlanner>["plans"][number]) => {
    const colorClass =
        (plan.type === "PIPELINE" && "before:bg-vivid-cerise") || (plan.type === "DIRECT" && "before:bg-nile-blue")
    const description =
        (plan.type === "PIPELINE" && <>{plan.source}</>) ||
        (plan.type === "DIRECT" && (
            <>
                {plan.source}
                <span>➤</span>
                {plan.destination}
            </>
        ))

    return (
        <div class="flex flex-row gap-4 rounded-lg border border-dark-turquoise px-4 py-8 text-2xl shadow-lg backdrop-blur-md">
            <span
                class={twMerge(
                    "mr-4 before:absolute before:left-0 before:top-0 before:-z-10 before:block before:h-full before:w-full before:rounded-lg before:border-0 before:content-[''] before:clip-path-pleat",
                    colorClass,
                )}
            >
                {CONTENT.ATTACKS[plan.type].icon}
            </span>
            <p class="flex flex-row gap-4">{description}</p>
        </div>
    )
}

const PlannerPanel: VoidComponent<PlannerPanelProps> = (props) => {
    const [open, setOpen] = createSignal(false)

    const handleMouseMove = (e: MouseEvent) => {
        if (e.clientX < 40) {
            setOpen(true)
        } else if (e.clientX > 200) {
            setOpen(false)
        }
    }

    onMount(() => {
        window.addEventListener("mousemove", handleMouseMove)
    })

    onCleanup(() => {
        window.removeEventListener("mousemove", handleMouseMove)
    })

    return (
        <div class="absolute left-0 top-0 h-full w-96">
            <div
                class={twMerge(
                    "absolute top-1/2 flex h-24 w-6 items-center justify-center rounded-r-lg border-y border-r border-dark-turquoise shadow-lg backdrop-blur-md transition-all duration-200 ease-in-out",
                    open() ? "opacity-0" : "opacity-100",
                )}
            >
                ❯
            </div>
            <div
                class={twMerge(
                    "left-0 top-0 h-full w-full justify-center border-r border-dark-turquoise shadow-lg backdrop-blur-md transition-all duration-200 ease-in-out",
                    open() ? "translate-x-0" : "-translate-x-full",
                )}
            >
                <section class="flex flex-col gap-4 p-4">
                    <For each={props.plans}>{renderPlan}</For>
                </section>
            </div>
        </div>
    )
}

export default PlannerPanel

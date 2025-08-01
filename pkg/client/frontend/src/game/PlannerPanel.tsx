import { For, JSX, Match, Show, Switch, VoidComponent, createSignal, mergeProps, onCleanup, onMount } from "solid-js"
import { twMerge } from "tailwind-merge"
import TaggedButton from "@components/TaggedButton"
import { CONTENT } from "@constants/content"
import { AttackType, Plan } from "@constants/types"
import Tree from "./tree"

type PlannerPanelProps = {
    plans: Plan[]
    removePlan: (plan: Partial<Plan>) => void
    renderPlanItem?: (item: Tree) => JSX.Element
}

const PlannerPanel: VoidComponent<PlannerPanelProps> = (_props) => {
    const props = mergeProps({ renderPlanItem: (item: Tree) => item }, _props)

    const [open, setOpen] = createSignal(false)

    const handleMouseMove = (e: MouseEvent) => {
        if (e.clientX < 40) {
            setOpen(true)
        } else if (e.clientX > 400) {
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
        <Show when={props.plans.length}>
            <div class="absolute left-0 top-0 h-full">
                <span
                    class={twMerge(
                        "absolute left-0 top-1/2 flex h-24 w-6 items-center justify-center rounded-r-lg border-y border-r border-dark-turquoise shadow-lg backdrop-blur-md transition-all duration-200 ease-in-out",
                        open() ? "opacity-0" : "opacity-100",
                    )}
                >
                    ❯
                </span>
                <div
                    class={twMerge(
                        "absolute left-0 top-0 h-full w-96 justify-center border-r border-dark-turquoise shadow-lg backdrop-blur-md transition-all duration-200 ease-in-out",
                        open() ? "pointer-events-auto translate-x-0" : "pointer-events-none -translate-x-full",
                    )}
                >
                    <section class="flex flex-col gap-4 p-4">
                        <For each={props.plans}>
                            {(plan) => (
                                <TaggedButton
                                    accent={{
                                        text: CONTENT.ATTACKS[plan.type].icon,
                                        class:
                                            (plan.type === AttackType.TARGET && "bg-nile-blue") ||
                                            (plan.type === AttackType.BLENDED && "bg-vivid-cerise") ||
                                            "",
                                    }}
                                    hoverAccent={{ text: "🗑️", class: "bg-red-800" }}
                                    class="text-2xl"
                                    action={() => props.removePlan(plan)}
                                >
                                    <p class="flex grow flex-col items-center justify-center">
                                        <Switch>
                                            <Match when={plan.type === AttackType.TARGET && plan}>
                                                {(matched) => (
                                                    <>
                                                        {props.renderPlanItem(matched().source)}
                                                        <span class="rotate-90 transform">↣</span>
                                                        {props.renderPlanItem(matched().destination)}
                                                    </>
                                                )}
                                            </Match>
                                            <Match when={plan.type === AttackType.BLENDED && plan}>
                                                {(matched) => <>{props.renderPlanItem(matched().source)}</>}
                                            </Match>
                                        </Switch>
                                    </p>
                                </TaggedButton>
                            )}
                        </For>
                    </section>
                </div>
            </div>
        </Show>
    )
}

export default PlannerPanel

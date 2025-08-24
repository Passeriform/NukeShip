import { For, Match, Show, Switch, VoidComponent, createSignal, onCleanup, onMount } from "solid-js"
import { twMerge } from "tailwind-merge"
import TaggedButton from "@components/TaggedButton"
import { CONTENT } from "@constants/content"
import { AttackType } from "@constants/types"
import { usePlanner } from "@providers/Planner"
import { Sapling } from "./tree"

type TargetAttackPlan = {
    type: typeof AttackType.TARGET
    source: Sapling
    destination: Sapling
}

type BlendedAttackPlan = {
    type: typeof AttackType.BLENDED
    source: Sapling
}

export type Plan = TargetAttackPlan | BlendedAttackPlan

const PlannerPanel: VoidComponent = () => {
    const { plans, removePlan } = usePlanner<Plan>()

    const [open, setOpen] = createSignal(false)

    const getAccentClass = (plan: Plan) => {
        switch (plan.type) {
            case "TARGET":
                return "bg-nile-blue"
            case "BLENDED":
                return "bg-vivid-cerise"
        }
    }

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
        <Show when={plans().length}>
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
                        <For each={plans()}>
                            {(plan) => (
                                <TaggedButton
                                    accentText={CONTENT.ATTACKS[plan.type].icon}
                                    accentClass={getAccentClass(plan)}
                                    accentHoverText={CONTENT.MISC.REMOVE_PLAN.icon}
                                    accentHoverClass="bg-red-800"
                                    class="text-2xl"
                                    action={() => {
                                        removePlan(plan)
                                    }}
                                >
                                    <p class="flex grow flex-col items-center justify-center">
                                        <Switch>
                                            <Match when={plan.type === AttackType.TARGET && plan}>
                                                {(matched) => (
                                                    <>
                                                        {matched().source.userData.label}
                                                        <span class="rotate-90 transform">↣</span>
                                                        {/* TODO: Make this wait for the destination to load if not already present */}
                                                        {matched().destination.userData.label}
                                                    </>
                                                )}
                                            </Match>
                                            <Match when={plan.type === AttackType.BLENDED && plan}>
                                                {(matched) => <>{matched().source.userData.label}</>}
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

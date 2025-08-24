import { VoidComponent } from "solid-js"
import ActionButton from "@components/ActionButton"
import Description from "@components/Description"
import { CONTENT } from "@constants/content"
import { AttackType } from "@constants/types"
import { usePlanner } from "@providers/Planner"
import { Plan } from "./PlannerPanel"
import { Sapling } from "./tree"

type ActionToolbarProps = {
    source: Sapling
    destination: Sapling
}

const ActionToolbar: VoidComponent<ActionToolbarProps> = (props) => {
    const { addPlan } = usePlanner<Plan>()

    return (
        <section class="flex translate-y-8 items-center justify-center gap-8">
            <ActionButton
                class="px-8 py-2 text-4xl"
                hintTitle={CONTENT.ATTACKS.TARGET.title}
                hintBody={<Description content={CONTENT.ATTACKS.TARGET} />}
                hintClass="w-96"
                shortcuts={CONTENT.ATTACKS.TARGET.shortcuts}
                onClick={() => {
                    addPlan({
                        type: AttackType.TARGET,
                        source: props.source,
                        destination: props.destination,
                    })
                }}
            >
                {CONTENT.ATTACKS.TARGET.icon}
            </ActionButton>
            <ActionButton
                class="px-8 py-2 text-4xl"
                hintTitle={CONTENT.ATTACKS.BLENDED.title}
                hintBody={<Description content={CONTENT.ATTACKS.BLENDED} />}
                hintClass="w-96"
                shortcuts={CONTENT.ATTACKS.BLENDED.shortcuts}
                onClick={() => {
                    addPlan({
                        type: AttackType.BLENDED,
                        source: props.source,
                    })
                }}
            >
                {CONTENT.ATTACKS.BLENDED.icon}
            </ActionButton>
        </section>
    )
}

export default ActionToolbar

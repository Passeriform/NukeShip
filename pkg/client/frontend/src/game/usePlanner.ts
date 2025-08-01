import { mergeProps } from "solid-js"
import { createStore } from "solid-js/store"
import { Plan } from "@constants/types"

interface UsePlannerProps {
    maximum: number
}

const usePlanner = (_props: UsePlannerProps) => {
    const props = mergeProps({ maximum: 3 }, _props)

    const [plans, setPlans] = createStore<Plan[]>([])

    const addPlan = (plan: Plan) => {
        if (plans.length >= props.maximum) {
            console.warn("Maximum number of plans reached, cannot add more plans.")
            return
        }

        if (plans.some((current) => current.type === plan.type && current.source === plan.source)) {
            console.warn("Tried to add a duplicate plan, skipping.")
            return
        }

        setPlans(plans.length, plan)
    }

    const removePlan = (plan: Partial<Plan>) => {
        setPlans(
            plans.filter(
                (current) =>
                    (plan.type && current.type !== plan.type) || (plan.source && current.source !== plan.source),
            ),
        )
    }

    return { plans, addPlan, removePlan }
}

export default usePlanner

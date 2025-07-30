import { createStore } from "solid-js/store"
import { AttackType } from "@constants/types"

type PipelineAttackPlanMeta = {
    type: typeof AttackType.PIPELINE
    source: string
}

type DirectAttackPlanMeta = {
    type: typeof AttackType.DIRECT
    source: string
    destination: string
}

type PlanMeta = PipelineAttackPlanMeta | DirectAttackPlanMeta

type Plan = { id: string } & PlanMeta

const usePlanner = () => {
    const [plans, setPlans] = createStore<Plan[]>([])

    const addPlan = (plan: PlanMeta) => {
        setPlans(plans.length, { id: crypto.randomUUID(), ...plan })
    }

    const removePlan = (id: string) => {
        setPlans(plans.filter((plan) => plan.id !== id))
    }

    return { plans, addPlan, removePlan }
}

export default usePlanner

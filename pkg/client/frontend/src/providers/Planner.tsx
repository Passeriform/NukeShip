import { Accessor, Context, ParentProps, Setter, createContext, createSignal, equalFn, useContext } from "solid-js"

type PlannerContextValue<T extends Record<PropertyKey, unknown>> = {
    plans: Accessor<T[]>
    setPlans: Setter<T[]>
}

const PlannerContext = createContext<PlannerContextValue<Record<PropertyKey, unknown>>>()

const PlannerProvider = (props: ParentProps) => {
    const [plans, setPlans] = createSignal<Record<PropertyKey, unknown>[]>([])

    return <PlannerContext.Provider value={{ plans, setPlans }}>{props.children}</PlannerContext.Provider>
}

export const usePlanner = <T extends Record<PropertyKey, unknown>>() => {
    const context = useContext<PlannerContextValue<T> | undefined>(
        PlannerContext as Context<PlannerContextValue<T> | undefined>,
    )

    if (!context) {
        throw new Error("usePlanner must be used within a PlannerProvider")
    }

    const [maximum, setMaximum] = createSignal(10)

    const addPlan = (plan: T) => {
        if (context.plans().length >= maximum()) {
            console.warn("Maximum number of plans reached, cannot add more plans.")
            return
        }

        if (context.plans().some((current) => equalFn(current, plan))) {
            console.warn("Tried to add a duplicate plan, skipping.")
            return
        }

        context.setPlans(context.plans().concat(plan))
    }

    const removePlan = (plan: Partial<T>) => {
        context.setPlans(context.plans().filter((current) => !equalFn(current, plan)))
    }

    return { plans: context.plans, addPlan, removePlan, setMaximum }
}

export default PlannerProvider

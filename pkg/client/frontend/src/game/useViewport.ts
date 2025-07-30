import { createEffect, createSignal, on } from "solid-js"
import { FocusType, ViewType } from "@constants/types"

const useViewport = () => {
    const [birdsEye, setBirdsEye] = createSignal(false)
    const [view, setView] = createSignal<ViewType>(ViewType.PLAN)
    const [focus, setFocus] = createSignal<FocusType>(FocusType.SELF)

    createEffect(
        on([focus, birdsEye], () => {
            setView(ViewType.ELEVATION)
        }),
    )

    return { birdsEye, view, focus, actions: { setView, setFocus, setBirdsEye } }
}

export default useViewport

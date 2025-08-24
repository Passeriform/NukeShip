import TourControls, { MeshPose } from "@passeriform/three-tour-controls"
import { Accessor, createEffect, createMemo, createSignal, on, onCleanup, onMount } from "solid-js"
import { Mesh } from "three"
import { CONTROLS } from "@constants/statics"
import { ViewType } from "@constants/types"
import { useInteraction } from "@providers/Interaction"
import { useScene } from "@providers/Scene"
import { useViewport } from "@providers/Viewport"
import { getWorldQuaternion } from "@utility/pureTransform"

const TOUR_CONTROLS_RENDER_ID = "TOUR_CONTROLS"

type UseControlsProps<T extends Mesh> = {
    locations: Accessor<MeshPose<T>[]>
}

export const useControls = <T extends Mesh>(props: UseControlsProps<T>) => {
    const { camera, addDrawDirective } = useScene()
    const { viewport, setViewport } = useViewport()
    const { interaction, resetSelected } = useInteraction<T>()

    const tourControls = new TourControls<T>(camera, window.document.body)

    const [activeLocation, setActiveLocation] = createSignal<T[] | undefined>(undefined)
    const [transitioning, setTransitioning] = createSignal<boolean>(false)

    const selectionQuaternion = createMemo(() => {
        if (!interaction.selected.current) {
            return
        }

        const quaternion = getWorldQuaternion(interaction.selected.current)
        quaternion.slerp(CONTROLS.QUATERNION.ELEVATION.clone(), 0.5)
        return quaternion
    })

    const handleDeselection = (event: MouseEvent) => {
        if (event.buttons === 2) {
            tourControls.endDetour()
        }
    }

    createEffect(
        on([() => viewport.birdsEye, () => viewport.focus, () => viewport.view], () => {
            tourControls.endDetour()
        }),
    )

    createEffect(
        on([() => viewport.birdsEye, () => viewport.focus], () => {
            setViewport("view", ViewType.ELEVATION)
        }),
    )

    createEffect(() => {
        tourControls.setItinerary(props.locations())
    })

    createEffect(() => {
        if (!interaction.selected.current) {
            return
        }

        // TODO: Fix detour not triggering on repeated selections.

        tourControls.detour({
            meshes: [interaction.selected.current],
            quaternion: selectionQuaternion()!.clone(),
            distance: CONTROLS.VIEWING_DISTANCE.SELECTION,
        })
    })

    onMount(() => {
        addDrawDirective(TOUR_CONTROLS_RENDER_ID, (time) => {
            tourControls.update(time)
        })

        tourControls.detourExitCondition = "first"
        tourControls.detourExitStrategy = "same"

        tourControls.addEventListener("transitionChange", ({ transitioning }) => {
            setTransitioning(transitioning)
        })
        tourControls.addEventListener("navigate", ({ location }) => {
            setActiveLocation(location)
        })
        tourControls.addEventListener("detourEnd", () => {
            resetSelected()
        })

        window.addEventListener("mousedown", handleDeselection)
    })

    onCleanup(() => {
        window.removeEventListener("mousedown", handleDeselection)
        tourControls.dispose()
    })

    return { activeLocation, transitioning }
}

export default useControls

import { createEffect, createSignal, on, onCleanup, onMount } from "solid-js"
import { Camera, Mesh, Object3D, Raycaster, Vector2 } from "three"

type RaycastInteractionCallback<T> = (mesh: T | undefined, repeat: boolean, lastNode: T | undefined) => void

interface UseRaycasterOptions<T extends Mesh> {
    root: Object3D | undefined
    filter: (mesh: Object3D[]) => T[]
    onClick?: RaycastInteractionCallback<T>
    onHover?: RaycastInteractionCallback<T>
}

const useRaycaster = <T extends Mesh>(camera: Camera, options: UseRaycasterOptions<T>) => {
    const raycaster = new Raycaster()

    const [lastHovered, setLastHovered] = createSignal<T | undefined>(undefined)
    const [lastSelected, setLastSelected] = createSignal<T | undefined>(undefined)

    createEffect(
        on([lastSelected], () => {
            setLastHovered(undefined)
        }),
    )

    const testNextInteraction = (
        event: MouseEvent,
        repeatTest: (mesh: T | undefined) => boolean,
    ): [T | undefined, boolean] => {
        if (!options.root) {
            return [undefined, false]
        }

        raycaster.setFromCamera(
            new Vector2((event.clientX / window.innerWidth) * 2 - 1, -(event.clientY / window.innerHeight) * 2 + 1),
            camera,
        )

        const intersects = raycaster.intersectObjects([options.root], true)

        const [matched] = options
            .filter(intersects.map((intersection) => intersection.object))
            .map((obj) => obj as unknown as T)

        return [matched, repeatTest(matched)]
    }

    const onHover = (event: MouseEvent) => {
        const [mesh, repeat] = testNextInteraction(event, (mesh) => mesh === lastHovered())
        options.onHover?.(mesh, repeat, lastHovered())
        setLastHovered(() => mesh)
    }

    const onClick = (event: MouseEvent) => {
        const [mesh, repeat] = testNextInteraction(event, (mesh) => mesh === lastSelected())
        options.onClick?.(mesh, repeat, lastSelected())
        if (mesh) {
            setLastSelected(() => mesh)
        }
    }

    onMount(() => {
        window.addEventListener("mousemove", onHover)
        window.addEventListener("click", onClick)
    })

    onCleanup(() => {
        window.removeEventListener("mousemove", onHover)
        window.removeEventListener("click", onClick)
    })

    return {
        hovering: lastHovered,
        selected: lastSelected,
        setSelected: setLastSelected,
    }
}

export default useRaycaster

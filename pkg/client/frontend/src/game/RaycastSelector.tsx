import { VoidProps, onCleanup, onMount } from "solid-js"
import { Camera, Mesh, Object3D, Raycaster, Vector2 } from "three"

type RaycastInteractionCallback<T> = (mesh: T | undefined, repeat: boolean, lastNode: T | undefined) => void

interface RaycastSelectorProps<T extends Mesh> {
    camera: Camera
    filter: (mesh: Object3D[]) => T[]
    root: Object3D | undefined
    onClick?: RaycastInteractionCallback<T>
    onHover?: RaycastInteractionCallback<T>
}

const RaycastSelector = <T extends Mesh>(props: VoidProps<RaycastSelectorProps<T>>) => {
    const raycaster = new Raycaster()

    let lastHoveredNode: T | undefined
    let lastClickedNode: T | undefined

    const testNextInteraction = (
        event: MouseEvent,
        repeatTest: (mesh: T | undefined) => boolean,
    ): [T | undefined, boolean] => {
        if (!props.root) {
            return [undefined, false]
        }

        raycaster.setFromCamera(
            new Vector2((event.clientX / window.innerWidth) * 2 - 1, -(event.clientY / window.innerHeight) * 2 + 1),
            props.camera,
        )

        const intersects = raycaster.intersectObjects([props.root], true)

        const [matched] = props
            .filter(intersects.map((intersection) => intersection.object))
            .map((obj) => obj as unknown as T)

        return [matched, repeatTest(matched)]
    }

    const onHover = (event: MouseEvent) => {
        const [mesh, repeat] = testNextInteraction(event, (mesh) => mesh === lastHoveredNode)
        props.onHover?.(mesh, repeat, lastHoveredNode)
        lastHoveredNode = mesh
    }

    const onClick = (event: MouseEvent) => {
        const [mesh, repeat] = testNextInteraction(event, (mesh) => mesh === lastClickedNode)
        props.onClick?.(mesh, repeat, lastClickedNode)
        lastClickedNode = mesh
    }

    onMount(() => {
        window.addEventListener("mousemove", onHover)
        window.addEventListener("click", onClick)
    })

    onCleanup(() => {
        window.removeEventListener("mousemove", onHover)
        window.removeEventListener("click", onClick)
    })

    return <></>
}

export default RaycastSelector

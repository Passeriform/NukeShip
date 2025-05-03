import {
    Component,
    createEffect,
    createMemo,
    extend,
    mergeProps,
    on,
    onCleanup,
    splitProps,
    untrack,
    useFrame,
    useThree,
} from "solid-three"
import { Mesh, Object3D, PerspectiveCamera } from "three"
import {
    TargetControlsChangeEvent,
    TargetControlsDeselectEvent,
    TargetControls as TargetControlsImpl,
    TargetControlsSelectEvent,
} from "./TargetControlsImpl"
import { ControlsNode } from "./controls"

export type TargetControlsProps = ControlsNode<TargetControlsImpl, typeof TargetControlsImpl> & {
    interactables?: Object3D[]
    pushTargetRef?: (target: Mesh) => void
    onChange?: (e: TargetControlsChangeEvent) => void
    onSelect?: (e: TargetControlsSelectEvent) => void
    onDeselect?: (e: TargetControlsDeselectEvent) => void
}

// TODO: Add key events according to OrbitControls.
const TargetControls: Component<TargetControlsProps> = (_props) => {
    const [props, rest] = splitProps(mergeProps({ interactables: [] as Object3D[] }, _props) as any, [
        "ref",
        "interactables",
        "pushTargetRef",
        "camera",
        "makeDefault",
        "regress",
        "domElement",
        "onChange",
        "onSelect",
        "onDeselect",
    ])

    const store = useThree()
    const camera = () => props.camera || store().camera
    const domElement = () => (props.domElement || store().events.connected || store().gl.domElement) as HTMLElement
    const controls = createMemo(() => new TargetControlsImpl(camera() as unknown as PerspectiveCamera, domElement()))

    useFrame(() => {
        if (controls().enabled) {
            controls().update()
        }
    }, -1)

    createEffect(
        on(
            () => [domElement(), props.regress, controls(), store().invalidate],
            () => {
                controls().connect(domElement())
                onCleanup(() => void controls().dispose())
            },
        ),
    )

    createEffect(() => {
        controls().setInteractables(props.interactables)
    })

    createEffect(() => {
        props.pushTargetRef = controls().pushTarget
    })

    createEffect(() => {
        const callback = (e: TargetControlsChangeEvent) => {
            store().invalidate()
            if (props.regress) store().performance.regress()
            if (props.onChange) props.onChange(e)
        }

        const onSelectCb = (e: TargetControlsSelectEvent) => {
            if (props.onSelect) props.onSelect(e)
        }

        const onDeselectCb = (e: TargetControlsDeselectEvent) => {
            if (props.onDeselect) props.onDeselect(e)
        }

        controls().addEventListener("select", onSelectCb)
        controls().addEventListener("deselect", onDeselectCb)
        controls().addEventListener("change", callback)

        onCleanup(() => {
            controls().removeEventListener("select", onSelectCb)
            controls().removeEventListener("deselect", onDeselectCb)
            controls().removeEventListener("change", callback)
        })
    })

    createEffect(() => {
        if (props.makeDefault) {
            const old = untrack(() => store().controls)
            store().set({ controls: controls() as any })
            onCleanup(() => store().set({ controls: old }))
        }
    })

    return <primitive ref={props.ref} object={controls()} {...rest} />
}

// TODO: Roll out as a solid-three control called TargetControls.

export default TargetControls

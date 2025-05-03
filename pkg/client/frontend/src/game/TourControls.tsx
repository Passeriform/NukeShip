import TourControlsImpl, {
    BoundPose,
    TourControlsChangeEvent,
    TourControlsDrillEvent,
} from "@passeriform/three-tour-controls"
import { mergeProps } from "solid-js"
import {
    Component,
    createEffect,
    createMemo,
    on,
    onCleanup,
    splitProps,
    untrack,
    useFrame,
    useThree,
} from "solid-three"
import { PerspectiveCamera } from "three"
import { ControlsNode } from "./controls"

export type TourControlsProps = ControlsNode<TourControlsImpl, typeof TourControlsImpl> & {
    boundPoses: BoundPose[]
    onChange?: (e?: TourControlsChangeEvent) => void
    onDrill?: (e: TourControlsDrillEvent) => void
}

// TODO: Add key events according to OrbitControls.
const TourControls: Component<TourControlsProps> = (_props) => {
    const [props, rest] = splitProps(mergeProps({ boundPoses: [] as BoundPose[] }, _props), [
        "ref",
        "boundPoses",
        "camera",
        "makeDefault",
        "regress",
        "domElement",
        "onChange",
        "onDrill",
    ])

    const store = useThree()
    const camera = () => props.camera || store().camera
    const domElement = () => (props.domElement || store().events.connected || store().gl.domElement) as HTMLElement
    const controls = createMemo(() => new TourControlsImpl(camera() as unknown as PerspectiveCamera, [], domElement()))

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
        controls().setBoundPoses(props.boundPoses)
    })

    createEffect(() => {
        const callback = (e: TourControlsChangeEvent) => {
            store().invalidate()
            if (props.regress) store().performance.regress()
            if (props.onChange) props.onChange(e)
        }

        const onDrillCb = (e: TourControlsDrillEvent) => {
            if (props.onDrill) props.onDrill(e)
        }

        controls().addEventListener("drill", onDrillCb)
        controls().addEventListener("change", callback)

        onCleanup(() => {
            controls().removeEventListener("drill", onDrillCb)
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

    return <></>
}

// TODO: Only keep one of the controls active (arch/target) at a time to avoid history override and conflicts.

export default TourControls

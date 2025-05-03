import { Camera, EventHandlers, Node, Object3DNode, Overwrite, Vector3 } from "solid-three"
import { Controls, Event, Line3 } from "three"

export type Line3Props = Overwrite<
    Node<Line3, typeof Line3>,
    {
        position?: Vector3
        up?: Vector3
        scale?: Vector3
        rotation?: Euler
        matrix?: Matrix4
        quaternion?: Quaternion
        layers?: Layers
        dispose?: (() => void) | null
        geometry?: JSX.Element | BufferGeometry | null
        material?: JSX.Element | Material | null
    }
> &
    EventHandlers

declare module "solid-js" {
    namespace JSX {
        interface IntrinsicElements {
            line3: Line3Props
        }
    }
}

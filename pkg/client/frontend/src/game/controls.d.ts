import { Camera, Node, Overwrite, Vector3 } from "solid-three"
import { Controls, Event } from "three"
import TourControls, { TourControlsProps } from "./TourControls"

export type ControlsNode<T extends Controls<{}>, P> = Overwrite<
    Node<T, P>,
    {
        target?: Vector3
        camera?: Camera
        domElement?: HTMLElement
        regress?: boolean
        makeDefault?: boolean
        onChange?: (e?: Event) => void
    }
>

declare module "solid-three" {
    namespace JSX {
        interface IntrinsicElements {
            tourControls: TourControlsProps
        }
    }
}

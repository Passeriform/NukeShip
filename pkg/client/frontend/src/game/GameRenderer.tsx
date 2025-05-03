import { Group as TweenGroup } from "@tweenjs/tween.js"
import { Canvas, VoidComponent, onMount } from "solid-three"
import { getWebGL2ErrorMessage, isWebGL2Available } from "three-stdlib"
import { FocusType, ViewType } from "@constants/types"
import Game from "./Game"

export const CameraType = {
    PERSPECTIVE: "PERSPECTIVE",
    ORTHOGRAPHIC: "ORTHOGRAPHIC",
}

export type CameraType = (typeof CameraType)[keyof typeof CameraType]

interface GameRendererProps {
    cameraType: CameraType
    view: ViewType
    focus: FocusType
    onIncompatible: (renderableError: HTMLDivElement) => void
}

const GameRenderer: VoidComponent<GameRendererProps> = (props) => {
    const tweenGroup = new TweenGroup()

    onMount(() => {
        if (!isWebGL2Available()) {
            props.onIncompatible(getWebGL2ErrorMessage())
            return
        }

        document.addEventListener("contextmenu", (event) => event.preventDefault())
    })

    return (
        <Canvas orthographic={props.cameraType === CameraType.ORTHOGRAPHIC}>
            <Game focus={props.focus} view={props.view} tweenGroup={tweenGroup} />
        </Canvas>
    )
}

export default GameRenderer

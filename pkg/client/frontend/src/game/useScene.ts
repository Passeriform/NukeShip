import { onCleanup, onMount } from "solid-js"
import { Scene, WebGLRenderer } from "three"
import { getWebGL2ErrorMessage, isWebGL2Available } from "three-stdlib"

interface UseSceneProps {
    onError: (message: HTMLDivElement) => void
}

const useScene = (props: UseSceneProps) => {
    const scene = new Scene()
    const renderer = new WebGLRenderer({ antialias: true, alpha: true })

    const updateWindowSize = () => {
        renderer.setSize(window.innerWidth, window.innerHeight)
    }

    onMount(() => {
        if (!isWebGL2Available()) {
            props.onError(getWebGL2ErrorMessage())
            return
        }

        renderer.setPixelRatio(window.devicePixelRatio)

        window.addEventListener("resize", updateWindowSize)
    })

    onCleanup(() => {
        window.removeEventListener("resize", updateWindowSize)

        renderer.dispose()
        scene.clear()
    })

    return {
        scene,
        renderer,
    }
}

export default useScene

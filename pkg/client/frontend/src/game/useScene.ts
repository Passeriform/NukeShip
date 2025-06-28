import { onCleanup, onMount } from "solid-js"
import { Scene, WebGLRenderer } from "three"

const useScene = () => {
    const scene = new Scene()
    const renderer = new WebGLRenderer({ antialias: true, alpha: true })

    onMount(() => {
        renderer.setPixelRatio(window.devicePixelRatio)
        renderer.setSize(window.innerWidth, window.innerHeight)

        window.addEventListener("resize", () => {
            renderer.setSize(window.innerWidth, window.innerHeight)
        })
    })

    onCleanup(() => {
        renderer.dispose()
        scene.clear()
    })

    return {
        scene,
        renderer,
    }
}

export default useScene

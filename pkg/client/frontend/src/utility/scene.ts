import { Scene, WebGLRenderer } from "three"

export const createScene = () => {
    const scene = new Scene()
    const renderer = new WebGLRenderer({ antialias: true, alpha: true })

    const cleanup = () => {
        renderer.dispose()
        scene.clear()
    }

    return {
        scene,
        renderer,
        cleanup,
    }
}

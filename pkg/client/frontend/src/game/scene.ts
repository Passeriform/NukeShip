import * as three from "three"

export const createScene = () => {
    const scene = new three.Scene()
    const renderer = new three.WebGLRenderer({ antialias: true, alpha: true })

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

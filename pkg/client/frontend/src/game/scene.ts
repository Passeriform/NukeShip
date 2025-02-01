import * as three from "three"

export const createSceneResource = () => {
    const scene = new three.Scene()
    const renderer = new three.WebGLRenderer({ antialias: true, alpha: true })
    const ambientLight = new three.AmbientLight(0x193751, 2)
    const directionalLight = new three.DirectionalLight(0xffffff, 2)

    const cleanup = () => {
        directionalLight.dispose()
        ambientLight.dispose()
        renderer.dispose()
        scene.clear()
    }

    return {
        scene,
        renderer,
        ambientLight,
        directionalLight,
        cleanup,
    }
}

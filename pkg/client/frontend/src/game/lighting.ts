import * as three from "three"

export const createLighting = () => {
    const ambientLight = new three.AmbientLight(0x193751, 2)
    const directionalLight = new three.DirectionalLight(0xffffff, 2)

    const cleanup = () => {
        directionalLight.dispose()
        ambientLight.dispose()
    }

    return {
        ambientLight,
        directionalLight,
        cleanup,
    }
}

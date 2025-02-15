import { AmbientLight, DirectionalLight } from "three"

export const createLighting = () => {
    const ambientLight = new AmbientLight(0x193751, 2)
    const directionalLight = new DirectionalLight(0xffffff, 2)

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

import { onCleanup } from "solid-js"
import { AmbientLight, DirectionalLight } from "three"

const useLighting = () => {
    const ambientLight = new AmbientLight(0x193751, 2)
    const directionalLight = new DirectionalLight(0xffffff, 2)

    onCleanup(() => {
        directionalLight.dispose()
        ambientLight.dispose()
    })

    return {
        ambientLight,
        directionalLight,
    }
}

export default useLighting

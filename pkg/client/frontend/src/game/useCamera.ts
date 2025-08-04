import { mergeProps, onCleanup, onMount } from "solid-js"
import { PerspectiveCamera } from "three"

const DEFAULT_USE_CAMERA_PROPS = {
    fov: 70,
    far: 2000,
    near: 0.1,
}

interface UseCameraProps {
    fov?: number
    far?: number
    near?: number
}

const useCamera = (_props: UseCameraProps = DEFAULT_USE_CAMERA_PROPS) => {
    const props = mergeProps(DEFAULT_USE_CAMERA_PROPS, _props)

    const camera = new PerspectiveCamera(props.fov, window.innerWidth / window.innerHeight, props.near, props.far)

    const updateAspect = () => {
        camera.aspect = window.innerWidth / window.innerHeight
        camera.updateProjectionMatrix()
    }

    onMount(() => {
        window.addEventListener("resize", updateAspect)
    })

    onCleanup(() => {
        window.removeEventListener("resize", updateAspect)
    })

    return { camera }
}

export default useCamera

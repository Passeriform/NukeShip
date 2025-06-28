import { createSignal, mergeProps, onCleanup } from "solid-js"
import { OrthographicCamera, PerspectiveCamera } from "three"

const DEFAULT_USE_CAMERA_PROPS = {
    frustumSize: 10,
    fov: 70,
    far: 2000,
    near: 0.1,
}

interface UseCameraProps {
    frustumSize?: number
    fov?: number
    far?: number
    near?: number
}

const useCamera = (_props: UseCameraProps = DEFAULT_USE_CAMERA_PROPS) => {
    const props = mergeProps(DEFAULT_USE_CAMERA_PROPS, _props)

    const [isCameraPerspective, _setIsCameraPerspective] = createSignal(true)

    const camera = () => {
        const aspect = window.innerWidth / window.innerHeight

        if (isCameraPerspective()) {
            return new PerspectiveCamera(props.fov, aspect, props.near, props.far)
        } else {
            const left = (-props.frustumSize * aspect) / 2
            const right = (props.frustumSize * aspect) / 2
            const top = props.frustumSize / 2
            const bottom = -props.frustumSize / 2
            return new OrthographicCamera(left, right, top, bottom, props.near, props.far)
        }
    }

    onCleanup(() => {
        camera().clear()
    })

    return { camera: camera() }
}

export default useCamera

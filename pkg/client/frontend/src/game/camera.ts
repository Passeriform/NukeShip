import { Group } from "@tweenjs/tween.js"
import { OrthographicCamera, PerspectiveCamera } from "three"

export const CAMERA_TYPE = {
    ORTHOGRAPHIC: "ORTHOGRAPHIC",
    PERSPECTIVE: "PERSPECTIVE",
} as const

export type CAMERA_TYPE = (typeof CAMERA_TYPE)[keyof typeof CAMERA_TYPE]

const ORTHO_FRUSTUM_SIZE = 10

export const createCamera = (type: CAMERA_TYPE) => {
    const createOrthographicCamera = () => {
        const aspect = window.innerWidth / window.innerHeight
        const left = (-ORTHO_FRUSTUM_SIZE * aspect) / 2
        const right = (ORTHO_FRUSTUM_SIZE * aspect) / 2
        const top = ORTHO_FRUSTUM_SIZE / 2
        const bottom = -ORTHO_FRUSTUM_SIZE / 2
        return new OrthographicCamera(left, right, top, bottom, 3.9, 2000)
    }

    const createPerspectiveCamera = () => {
        const fov = 70
        const aspect = window.innerWidth / window.innerHeight
        return new PerspectiveCamera(fov, aspect, 3.9, 2000)
    }

    const isPerspective = (_: OrthographicCamera | PerspectiveCamera): _ is PerspectiveCamera =>
        type === CAMERA_TYPE.PERSPECTIVE

    const camera = type === CAMERA_TYPE.PERSPECTIVE ? createPerspectiveCamera() : createOrthographicCamera()
    const tweenGroup = new Group()

    const resize = () => {
        if (isPerspective(camera)) {
            camera.aspect = window.innerWidth / window.innerHeight
        } else {
            const aspect = window.innerWidth / window.innerHeight
            camera.left = (-ORTHO_FRUSTUM_SIZE * aspect) / 2
            camera.right = (ORTHO_FRUSTUM_SIZE * aspect) / 2
            camera.top = ORTHO_FRUSTUM_SIZE / 2
            camera.bottom = -ORTHO_FRUSTUM_SIZE / 2
        }
        camera.updateProjectionMatrix()
    }

    const cleanup = () => {
        tweenGroup.removeAll()
        camera.clear()
    }

    return {
        camera,
        resize,
        tweenGroup,
        cleanup,
    }
}

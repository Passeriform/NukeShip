import { Group as TweenGroup } from "@tweenjs/tween.js"
import { Box3, MathUtils, Object3D, OrthographicCamera, PerspectiveCamera, Quaternion, Vector3 } from "three"
import { tweenTransform } from "./tween"

export const CAMERA_TYPE = {
    ORTHOGRAPHIC: "ORTHOGRAPHIC",
    PERSPECTIVE: "PERSPECTIVE",
} as const

export type CAMERA_TYPE = (typeof CAMERA_TYPE)[keyof typeof CAMERA_TYPE]

const ORTHO_FRUSTUM_SIZE = 10
const FIT_OFFSET = 4

export const createCamera = (type: CAMERA_TYPE) => {
    const createOrthographicCamera = () => {
        const aspect = window.innerWidth / window.innerHeight
        const left = (-ORTHO_FRUSTUM_SIZE * aspect) / 2
        const right = (ORTHO_FRUSTUM_SIZE * aspect) / 2
        const top = ORTHO_FRUSTUM_SIZE / 2
        const bottom = -ORTHO_FRUSTUM_SIZE / 2
        return new OrthographicCamera(left, right, top, bottom, 0.1, 2000)
    }

    const createPerspectiveCamera = () => {
        const fov = 70
        const aspect = window.innerWidth / window.innerHeight
        return new PerspectiveCamera(fov, aspect, 0.1, 2000)
    }

    const isPerspective = (cam: OrthographicCamera | PerspectiveCamera): cam is PerspectiveCamera =>
        "isPerspectiveCamera" in cam && cam.isPerspectiveCamera

    const camera = type === CAMERA_TYPE.PERSPECTIVE ? createPerspectiveCamera() : createOrthographicCamera()
    const tweenGroup = new TweenGroup()

    const animate = (position: Vector3, rotation: Quaternion) => {
        tweenGroup.removeAll()
        tweenTransform(tweenGroup, camera, { position, rotation })
    }

    const fitToObjects = (...objects: Object3D[]) => {
        const fitBox = new Box3()

        objects.forEach((obj) => fitBox.expandByObject(obj))

        const center = new Vector3()
        const size = new Vector3()
        fitBox.getCenter(center)
        fitBox.getSize(size)

        if (isPerspective(camera)) {
            const heightToFit = size.x / size.y < camera.aspect ? size.y : size.x / camera.aspect
            const cameraZ = (heightToFit * 0.5) / Math.tan(camera.fov * MathUtils.DEG2RAD * 0.5) + FIT_OFFSET

            animate(new Vector3(center.x, center.y, center.z - cameraZ), new Quaternion(0, 1, 0, 0).normalize())
        }
    }

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
        animate,
        fitToObjects,
        resize,
        tweenGroup,
        cleanup,
    }
}

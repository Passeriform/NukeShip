import { Camera, OrthographicCamera, PerspectiveCamera, Quaternion } from "three"

const ORTHO_FRUSTUM_SIZE = 10
const PERSPECTIVE_FOV = 70
const NEAR = 0.1
const FAR = 2000

export const createPerspectiveCamera = (fov = PERSPECTIVE_FOV) => {
    const aspect = window.innerWidth / window.innerHeight
    return new PerspectiveCamera(fov, aspect, NEAR, FAR)
}

export const createOrthographicCamera = (frustumSize = ORTHO_FRUSTUM_SIZE) => {
    const aspect = window.innerWidth / window.innerHeight
    const left = (-frustumSize * aspect) / 2
    const right = (frustumSize * aspect) / 2
    const top = frustumSize / 2
    const bottom = -frustumSize / 2
    return new OrthographicCamera(left, right, top, bottom, NEAR, FAR)
}

export const isPerspectiveCamera = (cam: OrthographicCamera | PerspectiveCamera): cam is PerspectiveCamera => {
    return "isPerspectiveCamera" in cam && cam.isPerspectiveCamera
}

export const isOrthographicCamera = (cam: OrthographicCamera | PerspectiveCamera): cam is OrthographicCamera => {
    return "isOrthographicCamera" in cam && cam.isOrthographicCamera
}

export const lookAtFromQuaternion = (cam: Camera, q: Quaternion) =>
    q.clone().multiply(new Quaternion().setFromAxisAngle(cam.up, Math.PI)).normalize()

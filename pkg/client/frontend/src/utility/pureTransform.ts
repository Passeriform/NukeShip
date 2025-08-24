import { Object3D, Quaternion } from "three"

const _quaternion = new Quaternion()

export const getWorldQuaternion = (object: Object3D) => {
    object.getWorldQuaternion(_quaternion)

    return _quaternion.clone()
}

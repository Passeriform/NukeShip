import { Object3D, Quaternion, Vector3 } from "three"

const _position = new Vector3()
const _rotation = new Quaternion()

export const getWorldPose = (object: Object3D) => {
    object.getWorldPosition(_position)
    object.getWorldQuaternion(_rotation)

    return [_position.clone(), _rotation.clone()] as [Vector3, Quaternion]
}

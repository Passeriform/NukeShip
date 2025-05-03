import { Object3D, Quaternion, Vector3 } from "three"

export const getWorldPose = (object: Object3D) => {
    const position = new Vector3()
    const rotation = new Quaternion()

    object.getWorldPosition(position)
    object.getWorldQuaternion(rotation)

    return [position, rotation] as [Vector3, Quaternion]
}

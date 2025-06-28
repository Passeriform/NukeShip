import { Camera, Quaternion } from "three"

export const averageQuaternions = (...inputs: Quaternion[]) => {
    const rotation = inputs[0]!.clone()
    inputs.slice(1).forEach((input, idx) => {
        rotation.slerp(input, 1 / (idx + 1))
    })
    return rotation.normalize()
}

export const lookAtFromQuaternion = (cam: Camera, q: Quaternion) =>
    q.clone().multiply(new Quaternion().setFromAxisAngle(cam.up, Math.PI)).normalize()

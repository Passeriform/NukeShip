import { Quaternion } from "three"

export const averageQuaternions = (...inputs: Quaternion[]) => {
    const rotation = inputs[0].clone()
    inputs.slice(1).forEach((input, idx) => {
        rotation.slerp(input, 1 / (idx + 1))
    })
    return rotation.normalize()
}

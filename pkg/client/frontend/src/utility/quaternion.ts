import { Quaternion } from "three"

export const averageQuaternions = (...inputs: Quaternion[]) => {
    const quaternion = inputs[0]!.clone()
    inputs.slice(1).forEach((input, idx) => {
        quaternion.slerp(input, 1 / (idx + 1))
    })
    return quaternion.normalize()
}

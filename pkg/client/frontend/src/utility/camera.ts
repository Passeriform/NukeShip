import { Camera, Quaternion } from "three"

export const lookAtFromQuaternion = (cam: Camera, q: Quaternion) =>
    q.clone().multiply(new Quaternion().setFromAxisAngle(cam.up, Math.PI)).normalize()

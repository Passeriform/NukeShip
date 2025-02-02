import { Easing, Tween } from "@tweenjs/tween.js"
import { Object3D, Quaternion, Vector3 } from "three"

export const tweenObject = (
    object: Object3D,
    to: {
        position: Vector3
        rotation: Quaternion
    },
) => {
    const TWEEN_TIMING = 400

    const qFrom = object.quaternion.clone()
    const qTo = to.rotation.normalize()

    return new Tween({ position: object.position.clone(), time: 0 })
        .to({ position: to.position, time: 1 }, TWEEN_TIMING)
        .easing(Easing.Cubic.InOut)
        .onUpdate((updated) => {
            object.position.copy(updated.position)
            object.quaternion.slerpQuaternions(qFrom, qTo, updated.time)
        })
        .start()
}

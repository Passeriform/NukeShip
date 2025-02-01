import * as tween from "@tweenjs/tween.js"
import * as three from "three"

export const tweenObject = (
    object: three.Object3D,
    to: {
        position: three.Vector3
        rotation: three.Quaternion
    },
) => {
    const TWEEN_TIMING = 400

    const qFrom = object.quaternion.clone()
    const qTo = to.rotation.normalize()

    return new tween.Tween({ position: object.position.clone(), time: 0 })
        .to({ position: to.position, time: 1 }, TWEEN_TIMING)
        .easing(tween.Easing.Cubic.InOut)
        .onUpdate((updated) => {
            object.position.copy(updated.position)
            object.quaternion.slerpQuaternions(qFrom, qTo, updated.time)
        })
        .start()
}

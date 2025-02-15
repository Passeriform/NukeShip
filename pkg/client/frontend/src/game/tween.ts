import { Easing, Group, Tween } from "@tweenjs/tween.js"
import { Object3D } from "three"
import { TweenTransform } from "@constants/types"

export const tweenObject = (group: Group, object: Object3D, to: TweenTransform) => {
    if (!group) {
        return
    }

    group.removeAll()

    const TWEEN_TIMING = 400

    const qFrom = object.quaternion.clone()
    const qTo = to.rotation.normalize()

    group.add(
        new Tween({ position: object.position.clone(), time: 0 })
            .to({ position: to.position, time: 1 }, TWEEN_TIMING)
            .easing(Easing.Cubic.InOut)
            .onUpdate((updated) => {
                object.position.copy(updated.position)
                object.quaternion.slerpQuaternions(qFrom, qTo, updated.time)
            })
            .start(),
    )
}

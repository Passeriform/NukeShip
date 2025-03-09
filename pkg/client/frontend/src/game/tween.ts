import { Easing, Tween, Group as TweenGroup } from "@tweenjs/tween.js"
import { Line, Material, Mesh, Object3D } from "three"
import { TweenTransform } from "@constants/types"

export const tweenTransform = (group: TweenGroup, object: Object3D, to: TweenTransform) => {
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
            .onUpdate(({ position, time }) => {
                object.position.copy(position)
                object.quaternion.slerpQuaternions(qFrom, qTo, time)
            })
            .start(),
    )
}

export const tweenOpacity = (group: TweenGroup, object: Mesh | Line, to: number) => {
    if (!group) {
        return
    }

    const TWEEN_TIMING = 400

    group.add(
        new Tween({ opacity: (object.material as Material).opacity })
            .to({ opacity: to }, TWEEN_TIMING)
            .easing(Easing.Cubic.InOut)
            .onStart(() => {
                if (to !== 0) {
                    object.visible = true
                }
            })
            .onUpdate(({ opacity }) => {
                ;(object.material as Material).opacity = opacity
            })
            .onComplete(() => {
                if (to === 0) {
                    object.visible = false
                }
            })
            .start(),
    )
}
